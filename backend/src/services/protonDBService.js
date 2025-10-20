import axios from 'axios';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config();

const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL_PROTONDB) || 86400
});

export class ProtonDBService {
  constructor() {
    this.baseURL = 'https://www.protondb.com/api/v1';
    this.headers = {
      'User-Agent': 'Steam-Compat-Analyzer/2.0'
    };
    this.cacheTTL = parseInt(process.env.CACHE_TTL_PROTONDB) || 86400;
  }

  /**
   * Obter informações de compatibilidade Linux do ProtonDB
   */
  async getGameCompatibility(appid) {
    const cacheKey = `proton-${appid}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseURL}/reports/summaries/${appid}.json`, {
        headers: this.headers,
        timeout: 5000
      });

      const data = response.data;
      const result = {
        appid,
        tier: data.tier || 'unknown', // platinum, gold, silver, bronze, borked
        confidence: data.confidence || 'unknown',
        score: data.score || 0,
        total_reports: data.total || 0,
        trending_tier: data.trendingTier || null,
        proton_version: data.bestReportedTier || null,
        linux_native: false,
        deck_verified: false
      };

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      if (error.response?.status === 404) {
        return { appid, tier: 'unknown', message: 'Sem dados no ProtonDB' };
      }
      console.error(`❌ Erro ao buscar ProtonDB para ${appid}:`, error.message);
      return null;
    }
  }

  /**
   * Verificar se jogo tem versão nativa Linux
   */
  async hasLinuxNative(appid) {
    try {
      const response = await axios.get(
        `https://store.steampowered.com/api/appdetails?appids=${appid}`,
        { timeout: 5000 }
      );

      const game = response.data[appid];
      if (!game?.success) return false;

      return game.data.platforms?.linux || false;
    } catch (error) {
      console.error(`❌ Erro ao verificar Linux nativo para ${appid}`);
      return false;
    }
  }

  /**
   * Verificar compatibilidade Steam Deck
   */
  async getDeckVerification(appid) {
    const cacheKey = `deck-${appid}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `https://www.protondb.com/api/v1/reports/summaries/${appid}.json`,
        { headers: this.headers, timeout: 5000 }
      );

      const deckStatus = response.data.deckStatus || 'unknown';
      const result = {
        status: deckStatus, // verified, playable, unsupported, unknown
        label: this.getDeckLabel(deckStatus)
      };

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      return { status: 'unknown', label: 'Não verificado' };
    }
  }

  /**
   * Análise completa de compatibilidade Linux
   */
  async analyzeLinuxCompatibility(appid) {
    console.log(`🐧 Analisando compatibilidade Linux para ${appid}...`);

    const [protonData, isNative, deckData] = await Promise.all([
      this.getGameCompatibility(appid),
      this.hasLinuxNative(appid),
      this.getDeckVerification(appid)
    ]);

    const tierScore = this.getTierScore(protonData?.tier);
    const nativeBonus = isNative ? 20 : 0;

    return {
      appid,
      linux_native: isNative,
      proton: protonData,
      steam_deck: deckData,
      compatibility_score: Math.min(tierScore + nativeBonus, 100),
      recommendation: this.getLinuxRecommendation(protonData?.tier, isNative),
      details: {
        can_run: tierScore >= 60 || isNative,
        performance_level: this.getPerformanceLevel(tierScore),
        requires_tweaks: tierScore < 80 && !isNative
      }
    };
  }

  /**
   * Converter tier ProtonDB para score
   */
  getTierScore(tier) {
    const scores = {
      platinum: 100,
      gold: 85,
      silver: 70,
      bronze: 50,
      borked: 20,
      unknown: 40
    };
    return scores[tier] || 40;
  }

  /**
   * Obter label do Steam Deck
   */
  getDeckLabel(status) {
    const labels = {
      verified: '✅ Verificado',
      playable: '🎮 Jogável',
      unsupported: '❌ Não suportado',
      unknown: '❓ Não testado'
    };
    return labels[status] || '❓ Desconhecido';
  }

  /**
   * Obter recomendação de compatibilidade Linux
   */
  getLinuxRecommendation(tier, isNative) {
    if (isNative) {
      return '🐧 Versão nativa para Linux! Jogue sem problemas.';
    }

    const recommendations = {
      platinum: '🏆 Funciona perfeitamente via Proton! Sem problemas conhecidos.',
      gold: '✨ Funciona muito bem via Proton com pequenos ajustes.',
      silver: '⚙️ Funciona via Proton, mas requer configurações.',
      bronze: '⚠️ Funciona parcialmente via Proton. Problemas esperados.',
      borked: '❌ Não funciona adequadamente via Proton.',
      unknown: '❓ Sem dados suficientes de compatibilidade.'
    };

    return recommendations[tier] || recommendations.unknown;
  }

  /**
   * Obter nível de performance esperado
   */
  getPerformanceLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'bad';
  }

  /**
   * Buscar jogos mais bem avaliados no ProtonDB
   */
  async getTopRatedGames(limit = 50) {
    try {
      const response = await axios.get(`${this.baseURL}/reports/trending.json`, {
        headers: this.headers,
        timeout: 10000
      });

      return response.data.slice(0, limit);
    } catch (error) {
      console.error('❌ Erro ao buscar top rated games:', error.message);
      return [];
    }
  }

  /**
   * Estatísticas gerais de compatibilidade
   */
  getCompatibilityStats(games) {
    const stats = {
      total: games.length,
      native: games.filter(g => g.linux_compatibility?.linux_native).length,
      platinum: games.filter(g => g.linux_compatibility?.proton?.tier === 'platinum').length,
      gold: games.filter(g => g.linux_compatibility?.proton?.tier === 'gold').length,
      silver: games.filter(g => g.linux_compatibility?.proton?.tier === 'silver').length,
      bronze: games.filter(g => g.linux_compatibility?.proton?.tier === 'bronze').length,
      borked: games.filter(g => g.linux_compatibility?.proton?.tier === 'borked').length,
      unknown: games.filter(g => !g.linux_compatibility || g.linux_compatibility?.proton?.tier === 'unknown').length
    };

    const playable = stats.native + stats.platinum + stats.gold + stats.silver;
    const playablePercentage = Math.round((playable / stats.total) * 100);

    return {
      ...stats,
      playable,
      playablePercentage,
      deck_verified: games.filter(g => g.linux_compatibility?.steam_deck?.status === 'verified').length
    };
  }
}