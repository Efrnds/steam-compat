import { createClient } from 'redis';

class RedisCache {
  constructor() {
    this.client = null;
    this.connected = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
  }

  /**
   * Conectar ao Redis
   */
  async connect() {
    if (this.connected) return;

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              console.log('❌ Redis: Máximo de tentativas atingido');
              return new Error('Máximo de tentativas de reconexão atingido');
            }
            console.log(`🔄 Redis: Tentativa de reconexão ${retries}/${this.maxRetries}`);
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Error:', err.message);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('🔌 Redis: Conectando...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis: Pronto!');
        this.connected = true;
        this.retryAttempts = 0;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis: Reconectando...');
        this.retryAttempts++;
      });

      this.client.on('end', () => {
        console.log('⚠️ Redis: Conexão encerrada');
        this.connected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Erro ao conectar Redis:', error.message);
      console.log('⚠️ Sistema continuará sem cache Redis');
      this.connected = false;
    }
  }

  /**
   * Verificar se está conectado
   */
  isConnected() {
    return this.connected && this.client?.isReady;
  }

  /**
   * Get com fallback
   */
  async get(key) {
    if (!this.isConnected()) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`❌ Redis GET error (${key}):`, error.message);
      return null;
    }
  }

  /**
   * Set com fallback
   */
  async set(key, value, ttl = 3600) {
    if (!this.isConnected()) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`❌ Redis SET error (${key}):`, error.message);
      return false;
    }
  }

  /**
   * Delete
   */
  async del(key) {
    if (!this.isConnected()) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Redis DEL error (${key}):`, error.message);
      return false;
    }
  }

  /**
   * Incrementar contador
   */
  async incr(key) {
    if (!this.isConnected()) return null;

    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`❌ Redis INCR error (${key}):`, error.message);
      return null;
    }
  }

  /**
   * Expirar chave
   */
  async expire(key, seconds) {
    if (!this.isConnected()) return false;

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error(`❌ Redis EXPIRE error (${key}):`, error.message);
      return false;
    }
  }

  /**
   * Verificar se chave existe
   */
  async exists(key) {
    if (!this.isConnected()) return false;

    try {
      return (await this.client.exists(key)) === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS error (${key}):`, error.message);
      return false;
    }
  }

  /**
   * Limpar cache por padrão
   */
  async flush(pattern = '*') {
    if (!this.isConnected()) return 0;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      console.error(`❌ Redis FLUSH error (${pattern}):`, error.message);
      return 0;
    }
  }

  /**
   * Obter todas as chaves
   */
  async keys(pattern = '*') {
    if (!this.isConnected()) return [];

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`❌ Redis KEYS error (${pattern}):`, error.message);
      return [];
    }
  }

  /**
   * Cache multi-layer (Redis + Memory)
   */
  async getOrSet(key, fetchFn, ttl = 3600) {
    // Tentar cache Redis primeiro
    const cached = await this.get(key);
    if (cached) {
      return { data: cached, source: 'redis' };
    }

    // Se não encontrou, executar função
    try {
      const data = await fetchFn();
      await this.set(key, data, ttl);
      return { data, source: 'fresh' };
    } catch (error) {
      console.error(`❌ Error in getOrSet (${key}):`, error.message);
      throw error;
    }
  }

  /**
   * Invalidar cache de jogo
   */
  async invalidateGame(appid) {
    const patterns = [
      `game-${appid}`,
      `game-details-${appid}`,
      `proton-${appid}`,
      `deck-${appid}`,
      `analysis-${appid}-*`
    ];

    let count = 0;
    for (const pattern of patterns) {
      const deleted = await this.flush(pattern);
      count += deleted;
    }

    return count;
  }

  /**
   * Estatísticas do cache
   */
  async getStats() {
    if (!this.isConnected()) {
      return { connected: false };
    }

    try {
      const info = await this.client.info('stats');
      const keyspace = await this.client.info('keyspace');
      const memory = await this.client.info('memory');

      return {
        connected: true,
        stats: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace),
        memory: this.parseRedisInfo(memory)
      };
    } catch (error) {
      console.error('❌ Erro ao obter stats Redis:', error.message);
      return { connected: true, error: error.message };
    }
  }

  /**
   * Parser de INFO do Redis
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Desconectar
   */
  async disconnect() {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
      console.log('👋 Redis: Desconectado');
    }
  }
}

// Singleton
const redisCache = new RedisCache();
export default redisCache;