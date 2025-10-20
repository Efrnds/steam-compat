import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config();

const cache = new NodeCache({ 
  stdTTL: parseInt(process.env.CACHE_TTL_GAMES) || 3600 
});

export class SteamScraper {
  constructor() {
    this.baseURL = 'https://store.steampowered.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'application/json, text/plain, */*'
    };
    this.maxGamesPerRequest = parseInt(process.env.MAX_GAMES_PER_REQUEST) || 1000;
    this.requestDelay = 1500; // 1.5 segundos entre requisições
    this.lastRequestTime = 0;
  }

  /**
   * Aguardar delay entre requisições
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestDelay) {
      const waitTime = this.requestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fazer requisição com retry
   */
  async requestWithRetry(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.waitForRateLimit();
        
        const response = await axios.get(url, {
          headers: this.headers,
          timeout: 10000
        });
        
        return response;
      } catch (error) {
        if (error.response?.status === 429) {
          // Rate limited - aguardar mais tempo
          const waitTime = attempt * 3000; // 3s, 6s, 9s
          console.log(`⏳ Rate limited. Aguardando ${waitTime/1000}s... (tentativa ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Outros erros - aguardar um pouco e tentar novamente
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('Máximo de tentativas excedido');
  }

  async getTopGames(limit = 100) {
    limit = Math.min(limit, this.maxGamesPerRequest);
    
    const cached = cache.get(`top-${limit}`);
    if (cached) return cached;

    const perPage = 50;
    const pages = Math.ceil(limit / perPage);
    const games = [];

    for (let page = 1; page <= pages; page++) {
      try {
        const url = `${this.baseURL}/search/?filter=topsellers&page=${page}`;
        const response = await this.requestWithRetry(url);
        const $ = cheerio.load(response.data);

        $('a.search_result_row').each((_, el) => {
          const appid = $(el).attr('data-ds-appid');
          const name = $(el).find('.title').text().trim();
          const price = $(el).find('.discount_final_price').text().trim();
          
          if (appid) {
            games.push({ appid, name, price });
          }
        });
      } catch (error) {
        console.error(`❌ Erro na página ${page}:`, error.message);
      }
    }

    const result = games.slice(0, limit);
    cache.set(`top-${limit}`, result);
    return result;
  }

  async getGameDetails(appid) {
    const cached = cache.get(`game-${appid}`);
    if (cached) return cached;

    try {
      const url = `${this.baseURL}/api/appdetails?appids=${appid}&l=english`;
      const response = await this.requestWithRetry(url);
      
      if (!response.data[appid]?.success) return null;

      const game = response.data[appid].data;
      const details = {
        appid,
        name: game.name,
        type: game.type,
        short_description: game.short_description,
        header_image: game.header_image,
        developers: game.developers || [],
        publishers: game.publishers || [],
        price: game.price_overview?.final_formatted || 'Grátis',
        genres: game.genres?.map(g => g.description) || [],
        release_date: game.release_date?.date || '',
        requirements: this.parseRequirements(game.pc_requirements)
      };

      cache.set(`game-${appid}`, details);
      return details;
    } catch (error) {
      console.error(`❌ Erro ao buscar jogo ${appid}:`, error.message);
      return null;
    }
  }

  parseRequirements(requirements) {
    if (!requirements || !requirements.minimum) {
      return { minimum: null, recommended: null };
    }

    const clean = (html) => {
      if (!html) return null;
      return html
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    return {
      minimum: clean(requirements.minimum),
      recommended: clean(requirements.recommended)
    };
  }

  async searchGames(query, limit = 20) {
    try {
      const url = `${this.baseURL}/search/?term=${encodeURIComponent(query)}`;
      const response = await this.requestWithRetry(url);
      const $ = cheerio.load(response.data);
      const games = [];

      $('a.search_result_row').slice(0, limit).each((_, el) => {
        const appid = $(el).attr('data-ds-appid');
        const name = $(el).find('.title').text().trim();
        if (appid) games.push({ appid, name });
      });

      return games;
    } catch (error) {
      console.error('❌ Erro ao buscar jogos:', error.message);
      return [];
    }
  }

  async getGamesByGenre(genre, limit = 50) {
    try {
      const url = `${this.baseURL}/search/?tags=${encodeURIComponent(genre)}`;
      const response = await this.requestWithRetry(url);
      const $ = cheerio.load(response.data);
      const games = [];

      $('a.search_result_row').slice(0, limit).each((_, el) => {
        const appid = $(el).attr('data-ds-appid');
        const name = $(el).find('.title').text().trim();
        if (appid) games.push({ appid, name });
      });

      return games;
    } catch (error) {
      console.error('❌ Erro ao buscar por gênero:', error.message);
      return [];
    }
  }
}