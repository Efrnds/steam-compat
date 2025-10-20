import express from 'express';
import { SteamScraper } from '../services/steamScraper.js';
import NodeCache from 'node-cache';

const router = express.Router();
const scraper = new SteamScraper();
const cache = new NodeCache({ stdTTL: 1800 }); // 30 minutos

// Buscar top jogos
router.get('/top', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const parsedLimit = Math.min(parseInt(limit), 1000);

    const cacheKey = `top-${parsedLimit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, source: 'cache', games: cached });
    }

    const games = await scraper.getTopGames(parsedLimit);
    cache.set(cacheKey, games);

    res.json({ success: true, source: 'steam', games });
  } catch (error) {
    console.error('❌ Erro ao buscar top jogos:', error);
    res.status(500).json({ error: 'Erro ao buscar jogos', message: error.message });
  }
});

// Buscar detalhes de um jogo
router.get('/:appid', async (req, res) => {
  try {
    const { appid } = req.params;

    const cached = cache.get(`game-${appid}`);
    if (cached) {
      return res.json({ success: true, source: 'cache', game: cached });
    }

    const game = await scraper.getGameDetails(appid);
    if (!game) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    cache.set(`game-${appid}`, game);
    res.json({ success: true, source: 'steam', game });
  } catch (error) {
    console.error('❌ Erro ao buscar jogo:', error);
    res.status(500).json({ error: 'Erro ao buscar jogo', message: error.message });
  }
});

// Buscar jogos por query
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    const games = await scraper.searchGames(query, parseInt(limit));
    res.json({ success: true, query, count: games.length, games });
  } catch (error) {
    console.error('❌ Erro na busca:', error);
    res.status(500).json({ error: 'Erro na busca', message: error.message });
  }
});

// Buscar jogos por gênero
router.get('/genre/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 50 } = req.query;

    const games = await scraper.getGamesByGenre(genre, parseInt(limit));
    res.json({ success: true, genre, count: games.length, games });
  } catch (error) {
    console.error('❌ Erro ao buscar por gênero:', error);
    res.status(500).json({ error: 'Erro ao buscar jogos', message: error.message });
  }
});

// Limpar cache
router.delete('/cache', (req, res) => {
  cache.flushAll();
  res.json({ success: true, message: 'Cache limpo' });
});

export default router;