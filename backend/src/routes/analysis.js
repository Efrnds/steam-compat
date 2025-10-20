import express from 'express';
import { SteamScraper } from '../services/steamScraper.js';
import { CompatibilityAnalyzer } from '../services/compatibilityAnalyzer.js';
import { ProtonDBService } from '../services/protonDBService.js';
import { loadBenchmarks } from '../utils.js';
import { broadcast } from '../server.js';
import redisCache from '../services/redisCache.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const scraper = new SteamScraper();
const protonDB = new ProtonDBService();
const maxBatch = parseInt(process.env.MAX_ANALYSIS_BATCH) || 100;

// Carregar benchmarks uma vez
let benchmarks = null;
function getBenchmarks() {
  if (!benchmarks) {
    benchmarks = loadBenchmarks();
  }
  return benchmarks;
}

/**
 * Validar e normalizar hardware
 */
function validateHardware(hardware) {
  if (!hardware) {
    throw new Error('Hardware não fornecido');
  }

  // Normalizar formato
  const normalized = {
    cpu: {
      model: hardware.cpu?.model || hardware.cpu || ''
    },
    gpu: {
      model: hardware.gpu?.model || hardware.gpu || ''
    },
    mem: {
      total: hardware.mem?.total || hardware.ram?.total || hardware.ram || 8
    }
  };

  // Validar
  if (!normalized.cpu.model) {
    throw new Error('CPU não especificada');
  }

  if (!normalized.gpu.model) {
    throw new Error('GPU não especificada');
  }

  if (normalized.mem.total < 1 || normalized.mem.total > 256) {
    throw new Error('RAM deve estar entre 1GB e 256GB');
  }

  return normalized;
}

// Analisar um único jogo
router.post('/single', async (req, res) => {
  try {
    const { hardware, appid } = req.body;

    if (!appid) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'appid é obrigatório'
      });
    }

    // Validar hardware
    let validatedHardware;
    try {
      validatedHardware = validateHardware(hardware);
    } catch (error) {
      return res.status(400).json({
        error: 'Hardware inválido',
        message: error.message
      });
    }

    // Verificar cache
    const cacheKey = `analysis-${appid}-${validatedHardware.cpu.model}-${validatedHardware.gpu.model}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, source: 'cache', game: cached });
    }

    // Buscar detalhes do jogo
    const game = await scraper.getGameDetails(appid);
    if (!game) {
      return res.status(404).json({
        error: 'Jogo não encontrado',
        message: `Jogo ${appid} não existe`
      });
    }

    // Analisar compatibilidade
    const analyzer = new CompatibilityAnalyzer(getBenchmarks());
    const analysis = analyzer.analyzeGame(game.requirements, validatedHardware);

    // Analisar compatibilidade Linux (opcional)
    let linuxCompat = null;
    try {
      linuxCompat = await protonDB.analyzeLinuxCompatibility(appid);
    } catch (error) {
      console.log('⚠️ ProtonDB não disponível para este jogo');
    }

    const result = {
      ...game,
      analysis,
      linux_compatibility: linuxCompat
    };

    // Cachear por 1 hora
    await redisCache.set(cacheKey, result, 3600);

    res.json({
      success: true,
      source: 'fresh',
      game: result
    });
  } catch (error) {
    console.error('❌ Erro ao analisar jogo:', error);
    res.status(500).json({
      error: 'Erro ao analisar jogo',
      message: error.message
    });
  }
});

// Analisar múltiplos jogos em batch
router.post('/batch', async (req, res) => {
  try {
    const { hardware, limit = 100, includeLinux = false } = req.body;

    // Validar hardware
    let validatedHardware;
    try {
      validatedHardware = validateHardware(hardware);
    } catch (error) {
      return res.status(400).json({
        error: 'Hardware inválido',
        message: error.message
      });
    }

    const maxLimit = parseInt(process.env.MAX_GAMES_PER_REQUEST) || 1000;
    if (limit < 1 || limit > maxLimit) {
      return res.status(400).json({
        error: 'Limite inválido',
        message: `Limite deve estar entre 1 e ${maxLimit}`
      });
    }

    console.log(`\n🎮 Iniciando análise de ${limit} jogos...`);
    console.log(`🖥️  Hardware: ${validatedHardware.cpu.model} / ${validatedHardware.gpu.model} / ${validatedHardware.mem.total}GB`);
    console.log(`🐧 Incluir ProtonDB: ${includeLinux ? 'Sim' : 'Não'}`);

    // Buscar top jogos
    const topGames = await scraper.getTopGames(limit);
    console.log(`✅ ${topGames.length} jogos encontrados`);

    // Analisar cada jogo
    const analyzer = new CompatibilityAnalyzer(getBenchmarks());
    const results = [];

    for (let i = 0; i < topGames.length; i++) {
      const gameBasic = topGames[i];

      try {
        // Buscar detalhes completos
        const gameDetails = await scraper.getGameDetails(gameBasic.appid);

        if (!gameDetails) {
          console.log(`⚠️  Jogo ${gameBasic.appid} não encontrado, pulando...`);
          continue;
        }

        // Analisar compatibilidade
        const analysis = analyzer.analyzeGame(gameDetails.requirements, validatedHardware);

        // Analisar Linux (se solicitado)
        let linuxCompat = null;
        if (includeLinux) {
          try {
            linuxCompat = await protonDB.analyzeLinuxCompatibility(gameBasic.appid);
          } catch (error) {
            // Ignora erro do ProtonDB
          }
        }

        results.push({
          ...gameDetails,
          analysis,
          linux_compatibility: linuxCompat
        });

        // Enviar progresso via WebSocket
        broadcast({
          type: 'progress',
          payload: {
            current: i + 1,
            total: topGames.length,
            currentGame: gameDetails.name
          }
        });

        console.log(`[${i + 1}/${topGames.length}] ${gameDetails.name}: ${analysis.score}% - ${analysis.rating.label}`);

      } catch (error) {
        console.error(`❌ Erro ao processar jogo ${gameBasic.appid}:`, error.message);
      }
    }

    console.log(`\n✅ Análise completa! ${results.length} jogos analisados`);

    // Estatísticas
    const stats = {
      total: results.length,
      excellent: results.filter(g => g.analysis.rating.level === 'excellent').length,
      good: results.filter(g => g.analysis.rating.level === 'good').length,
      fair: results.filter(g => g.analysis.rating.level === 'fair').length,
      poor: results.filter(g => g.analysis.rating.level === 'poor').length,
      unplayable: results.filter(g => g.analysis.rating.level === 'unplayable').length
    };

    // Estatísticas Linux (se incluído)
    let linuxStats = null;
    if (includeLinux) {
      linuxStats = protonDB.getCompatibilityStats(results);
    }

    console.log(`\n📊 Estatísticas:`);
    console.log(`   🔥 Roda perfeitamente: ${stats.excellent}`);
    console.log(`   ✅ Roda bem: ${stats.good}`);
    console.log(`   ⚠️  Com limitações: ${stats.fair}`);
    console.log(`   🐌 Com dificuldade: ${stats.poor}`);
    console.log(`   ❌ Não roda: ${stats.unplayable}\n`);

    if (linuxStats) {
      console.log(`🐧 Compatibilidade Linux:`);
      console.log(`   Nativo: ${linuxStats.native}`);
      console.log(`   Platinum: ${linuxStats.platinum}`);
      console.log(`   Gold: ${linuxStats.gold}`);
      console.log(`   Jogáveis: ${linuxStats.playablePercentage}%\n`);
    }

    res.json({
      success: true,
      count: results.length,
      results,
      stats,
      linux_stats: linuxStats
    });

  } catch (error) {
    console.error('❌ Erro na análise em batch:', error);
    res.status(500).json({
      error: 'Erro na análise',
      message: error.message
    });
  }
});

// Analisar jogos específicos por appids
router.post('/custom', async (req, res) => {
  try {
    const { hardware, appids, includeLinux = false } = req.body;

    if (!appids || !Array.isArray(appids)) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'Array de appids é obrigatório'
      });
    }

    // Validar hardware
    let validatedHardware;
    try {
      validatedHardware = validateHardware(hardware);
    } catch (error) {
      return res.status(400).json({
        error: 'Hardware inválido',
        message: error.message
      });
    }

    if (appids.length > maxBatch) {
      return res.status(400).json({
        error: 'Muitos jogos',
        message: `Máximo de ${maxBatch} jogos por vez`
      });
    }

    const analyzer = new CompatibilityAnalyzer(getBenchmarks());
    const results = [];

    for (const appid of appids) {
      const game = await scraper.getGameDetails(appid);
      if (!game) continue;

      const analysis = analyzer.analyzeGame(game.requirements, validatedHardware);

      let linuxCompat = null;
      if (includeLinux) {
        try {
          linuxCompat = await protonDB.analyzeLinuxCompatibility(appid);
        } catch (error) {
          // Ignora
        }
      }

      results.push({
        ...game,
        analysis,
        linux_compatibility: linuxCompat
      });
    }

    res.json({
      success: true,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('❌ Erro na análise customizada:', error);
    res.status(500).json({
      error: 'Erro na análise',
      message: error.message
    });
  }
});

export default router;