import express from 'express';
import { ProtonDBService } from '../services/protonDBService.js';
import redisCache from '../services/redisCache.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const protonDB = new ProtonDBService();
const cacheTTL = parseInt(process.env.CACHE_TTL_PROTONDB) || 86400;

// Obter compatibilidade Linux de um jogo
router.get('/:appid', async (req, res) => {
  try {
    const { appid } = req.params;

    // Verificar cache Redis
    const cacheKey = `linux-compat-${appid}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, source: 'cache', ...cached });
    }

    // Buscar do ProtonDB
    const compatibility = await protonDB.analyzeLinuxCompatibility(appid);

    if (!compatibility) {
      return res.status(404).json({
        error: 'Dados não encontrados',
        message: `Sem dados de compatibilidade para ${appid}`
      });
    }

    // Cachear
    await redisCache.set(cacheKey, compatibility, cacheTTL);

    res.json({ success: true, source: 'protondb', ...compatibility });
  } catch (error) {
    console.error('❌ Erro ao buscar compatibilidade:', error);
    res.status(500).json({
      error: 'Erro ao buscar dados',
      message: error.message
    });
  }
});

// Análise em batch com ProtonDB
router.post('/batch', async (req, res) => {
  try {
    const { appids } = req.body;
    const maxBatch = parseInt(process.env.MAX_ANALYSIS_BATCH) || 100;

    if (!appids || !Array.isArray(appids)) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'appids deve ser um array'
      });
    }

    if (appids.length > maxBatch) {
      return res.status(400).json({
        error: 'Muitos jogos',
        message: `Máximo de ${maxBatch} jogos por vez`
      });
    }

    const results = [];

    for (const appid of appids) {
      const compatibility = await protonDB.analyzeLinuxCompatibility(appid);
      if (compatibility) {
        results.push(compatibility);
      }
    }

    // Gerar estatísticas
    const stats = protonDB.getCompatibilityStats(results.map(r => ({ linux_compatibility: r })));

    res.json({
      success: true,
      count: results.length,
      results,
      stats
    });
  } catch (error) {
    console.error('❌ Erro na análise batch:', error);
    res.status(500).json({
      error: 'Erro na análise',
      message: error.message
    });
  }
});

// Top jogos mais compatíveis
router.get('/trending/top', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const cacheKey = `proton-trending-${limit}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, source: 'cache', games: cached });
    }

    const games = await protonDB.getTopRatedGames(parseInt(limit));

    await redisCache.set(cacheKey, games, 3600); // 1 hora

    res.json({ success: true, source: 'protondb', games });
  } catch (error) {
    console.error('❌ Erro ao buscar trending:', error);
    res.status(500).json({
      error: 'Erro ao buscar jogos',
      message: error.message
    });
  }
});

export default router;