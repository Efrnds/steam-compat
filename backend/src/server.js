import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import hardwareRouter from './routes/hardware.js';
import gamesRouter from './routes/games.js';
import analysisRouter from './routes/analysis.js';
import { initDatabase } from './database/init.js';
import redisCache from './services/redisCache.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar serviços
async function initServices() {
  console.log('\n🚀 Inicializando serviços...\n');

  // Banco de dados SQLite
  await initDatabase();

  // Redis (opcional, continua sem ele se falhar)
  try {
    await redisCache.connect();
  } catch (error) {
    console.log('⚠️ Redis não disponível, continuando sem cache...');
  }

  console.log('\n✅ Serviços inicializados!\n');
}

await initServices();

// WebSocket para progresso em tempo real
wss.on('connection', (ws) => {
  console.log('📡 Cliente WebSocket conectado');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Mensagem recebida:', data);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  });

  ws.on('close', () => {
    console.log('📡 Cliente WebSocket desconectado');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket erro:', error);
  });
});

// Broadcast para todos os clientes
export function broadcast(data) {
  const message = JSON.stringify(data);
  let sent = 0;

  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
      sent++;
    }
  });

  if (sent > 0) {
    console.log(`📡 Broadcast enviado para ${sent} cliente(s)`);
  }
}

// Rotas
app.use('/api/hardware', hardwareRouter);
app.use('/api/games', gamesRouter);
app.use('/api/analysis', analysisRouter);

// Health check
app.get('/api/health', async (req, res) => {
  const redisStats = await redisCache.getStats();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisStats.connected,
      websocket: wss.clients.size,
      database: 'connected'
    }
  });
});

// Cache stats
app.get('/api/cache/stats', async (req, res) => {
  const stats = await redisCache.getStats();
  res.json({ success: true, stats });
});

// Limpar cache
app.delete('/api/cache', async (req, res) => {
  const { pattern = '*' } = req.query;
  const count = await redisCache.flush(pattern);
  res.json({
    success: true,
    message: `${count} chaves removidas`,
    pattern
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Encerrando servidor...');

  await redisCache.disconnect();
  wss.close();
  server.close();

  console.log('✅ Servidor encerrado com sucesso');
  process.exit(0);
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔌 WebSocket disponível em ws://localhost:${PORT}`);
  console.log(`\n📋 Endpoints disponíveis:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/hardware/detect - Detectar hardware`);
  console.log(`   GET  /api/games/top?limit=100 - Top jogos`);
  console.log(`   POST /api/analysis/batch - Análise em lote`);
  console.log(`   GET  /api/cache/stats - Estatísticas do cache`);
  console.log(`   DELETE /api/cache - Limpar cache`);
  console.log(`${'='.repeat(70)}\n`);
});