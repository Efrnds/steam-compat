# 🎮 Backend - Sistema de Compatibilidade Steam

API REST que analisa se jogos da Steam rodam no seu PC comparando requisitos com benchmarks reais de hardware.

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Ou com hot-reload
npm run dev
```

Servidor roda em: **http://localhost:3001**

## 📦 Scripts Disponíveis

```bash
npm start          # Inicia servidor de produção
npm run dev        # Inicia com nodemon (hot-reload)
npm run generate   # Gera JSON com 2000 jogos
npm run test       # Testa análise de compatibilidade
npm run test-api   # Testa endpoints da API
```

## 🌐 Endpoints

### `POST /api/analyze`
Analisa compatibilidade de um jogo.

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": "Intel Core i5-9400F",
    "gpu": "GTX 1660",
    "ram": 16,
    "requirements": "Intel Core i5-8400, 16GB RAM, RTX 2060"
  }'
```

### `POST /api/analyze-games`
Analisa múltiplos jogos de uma vez.

### `GET /api/hardware/search?q=rtx&type=gpu`
Busca hardware no banco de dados.

### `GET /api/hardware`
Lista hardware disponível (sample).

### `GET /api/health`
Health check do servidor.

## 🔧 Como Funciona

### 1. Sistema de Pesos
- **GPU: 60%** - Componente mais crítico para jogos
- **CPU: 30%** - Importante mas menos que GPU
- **RAM: 10%** - Geralmente suficiente em PCs modernos

### 2. Benchmarks
Usa dados reais do UserBenchmark:
- **~1000 CPUs** mapeadas com scores de performance
- **~1000 GPUs** mapeadas com scores de performance

### 3. Análise de Compatibilidade

**Passo 1: Extração de Hardware**
```
"Intel Core i5-8400, 16GB RAM, RTX 2060"
     ↓
CPU: i5-8400
GPU: RTX 2060  
RAM: 16GB
```

**Passo 2: Busca nos Benchmarks**
```
Usuário: i5-4460 (score: 67) vs Requisito: i5-8400 (score: 88)
Ratio: 67/88 = 0.76 → CPU está 24% abaixo
```

**Passo 3: Validação de Qualidade**
```
Se similaridade < 0.4 → Penalização pesada (70-80%)
Se similaridade < 0.6 → Penalização moderada (40-50%)
```

**Passo 4: Score Final**
```
Score = (CPU × 30%) + (GPU × 60%) + (RAM × 10%)

≥80% → 🔥 Roda liso (Ultra)
≥65% → ✅ Roda suave (Médio)
≥45% → ⚠️ Roda com gargalo
<45% → ❌ Provavelmente não roda
```

## 📊 Exemplos de Resultados

### PC: i5-4460 / GT 630 / 12GB

| Jogo | GPU Requerida | Score | Status |
|------|---------------|-------|--------|
| Battlefield 6 | RTX 2060 | 14% | ❌ Não roda |
| Hogwarts Legacy | GTX 960 | 23% | ❌ Não roda |
| Red Dead 2 | GTX 770 | 31% | ❌ Não roda |
| Counter-Strike 2 | (genérico) | 19% | ❌ Não roda |
| Dota 2 | GeForce 8600 | 79% | ✅ Roda suave |

### PC: Ryzen 5 3600 / RTX 3060 / 16GB

| Jogo | GPU Requerida | Score | Status |
|------|---------------|-------|--------|
| Cyberpunk 2077 | GTX 1060 | 92% | 🔥 Roda liso |
| GTA V | GTX 660 | 98% | 🔥 Roda liso |
| Minecraft | Intel HD 4000 | 100% | 🔥 Roda liso |

## 🗂️ Estrutura de Arquivos

```
backend/
├── src/
│   ├── index.js              # Servidor Express
│   ├── analyze.js            # Lógica de análise
│   ├── utils.js              # Helpers (findClosest, etc)
│   ├── scrapeSteam.js        # Web scraping
│   ├── generate-games-json.js # Script gerador
│   ├── test.js               # Testes unitários
│   └── test-api.js           # Testes de API
├── data/
│   ├── CPU_UserBenchmarks.csv  # ~1000 CPUs
│   └── GPU_UserBenchmarks.csv  # ~1000 GPUs
├── games_compatibility.json   # Gerado pelo script
├── package.json
└── test-examples.sh          # Script bash de exemplos
```

## 🛠️ Desenvolvimento

### Adicionar Novo Endpoint

```javascript
// Em src/index.js
app.get("/api/meu-endpoint", (req, res) => {
  try {
    // Sua lógica aqui
    res.json({ resultado: "ok" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Modificar Análise

Edite `src/analyze.js`:

```javascript
export function analyzeCompatibility(reqs, user, db) {
  // Ajustar pesos
  const weights = { cpu: 0.30, gpu: 0.60, ram: 0.10 };
  
  // Ajustar thresholds
  if (finalScore >= 80) {
    status = "🔥 Roda liso";
  }
  // ...
}
```

### Adicionar Novos Benchmarks

1. Baixe CSV atualizado do UserBenchmark
2. Coloque em `data/`
3. O sistema carrega automaticamente

## 🔍 Debugging

### Ver requests no servidor
```javascript
// Em src/index.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Logs detalhados
```javascript
// Em src/analyze.js
console.log("CPU:", cpuResult);
console.log("GPU:", gpuResult);
console.log("Score final:", finalScore);
```

## 🚀 Deploy

### Localhost
```bash
npm start
```

### Produção (com PM2)
```bash
npm install -g pm2
pm2 start src/index.js --name steam-compat
pm2 logs steam-compat
pm2 restart steam-compat
```

### Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t steam-compat .
docker run -p 3001:3001 steam-compat
```

## 📚 Dependências

- **express** - Servidor HTTP
- **cors** - CORS middleware
- **axios** - HTTP client
- **cheerio** - Web scraping
- **csv-parse** - Parser de CSV
- **fs-extra** - File system helpers
- **string-similarity** - Fuzzy matching

## 🤝 Contribuindo

1. Melhorar regex de detecção de hardware
2. Adicionar mais benchmarks
3. Implementar cache Redis
4. Adicionar testes automatizados
5. Melhorar algoritmo de scoring

## 📄 Licença

MIT
