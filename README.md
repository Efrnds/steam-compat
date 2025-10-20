# 🎮 Sistema de Compatibilidade Steam

Sistema **completo e dinâmico** que analisa se jogos da Steam rodam no seu PC comparando os requisitos com benchmarks de hardware reais.

## ✨ Características

- ✅ **API REST completa** - Use com qualquer CPU/GPU/RAM
- ✅ **Banco de ~2000 componentes** - CPUs e GPUs catalogadas
- ✅ **Algoritmo inteligente** - Detecção automática de hardware nos requisitos
- ✅ **Sistema de pesos balanceado** - GPU 60%, CPU 30%, RAM 10%
- ✅ **Validação de qualidade** - Penaliza matches ruins automaticamente
- ✅ **Interface React** - Frontend moderno com Tailwind CSS
- ✅ **Gerador de lista** - Crie JSONs com análise de 2000 jogos

## 🚀 Início Rápido

```bash
# Backend (API)
cd backend
npm install
npm start  # Servidor em http://localhost:3001

# Frontend (React)
cd frontend
npm install
npm run dev  # Interface em http://localhost:5173

# Gerar lista de jogos
cd backend
npm run generate "Seu CPU" "Sua GPU" RAM
```

## 📡 API Básica

```bash
# Analisar um jogo
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": "Intel Core i5-9400F",
    "gpu": "GTX 1660",
    "ram": 16,
    "requirements": "i5-8400, 16GB, RTX 2060"
  }'

# Buscar hardware
curl "http://localhost:3001/api/hardware/search?q=rtx&type=gpu"
```

**Ver mais:** [USAGE.md](USAGE.md) | [backend/README.md](backend/README.md)

## 🚀 Melhorias Implementadas

### Problemas Corrigidos

1. **Hardware não encontrado nos CSVs**: Agora o sistema penaliza adequadamente quando não consegue identificar CPU/GPU nos requisitos
2. **Jogos pesados marcados como compatíveis**: Ajustados os pesos e thresholds para ser mais rigoroso
3. **Detecção de hardware melhorada**: Regex expandidas para capturar mais variações de nomes

### Mudanças Técnicas

#### 1. Sistema de Pesos Rebalanceado
- **GPU: 60%** (era 45%) - GPU é o componente mais crítico para jogos modernos
- **CPU: 30%** (era 40%)
- **RAM: 10%** (era 15%)

#### 2. Validação de Qualidade do Match
O sistema agora verifica a qualidade da similaridade de string:
- **Match < 0.4**: Penalização pesada (70-80%)
- **Match < 0.6**: Penalização moderada (40-50%)
- **Match ruim em GPU**: Penalização ainda maior (GPU é crítica)

#### 3. Thresholds Mais Rigorosos
- **80%+**: Roda liso (Ultra) - era 85%
- **65%+**: Roda suave (Médio) - era 70%
- **45%+**: Roda com gargalo - era 55%
- **< 45%**: Provavelmente não roda

#### 4. Penalizações por Hardware Fraco
- **CPU ratio < 0.5**: Penalização de 60%
- **GPU ratio < 0.5**: Penalização de 70%
- **GPU ratio < 0.3**: Penalização adicional de 50%
- **RAM < 80%**: Penalização de 40%

#### 5. Detecção de Hardware Expandida

**CPU**: Agora detecta:
- Intel: i3/i5/i7/i9 (várias gerações)
- AMD: Ryzen 3/5/7/9, FX, Phenom
- Variações com letras (K, F, X, etc)

**GPU**: Agora detecta:
- NVIDIA: RTX, GTX, GeForce
- AMD: RX, Radeon (HD, RX, R5/R7/R9), Vega
- Intel: UHD, HD, Iris, Arc
- Variações: Ti, Super, XT, GRE

## 📊 Exemplos de Resultados

Com PC: **Intel Core i5-4460 / GT 630 / 12GB RAM**

| Jogo | Requisitos | Score Antigo | Score Novo | Status |
|------|-----------|--------------|------------|---------|
| Battlefield 6 | RTX 2060 | 22% | **14%** | ❌ Não roda |
| Hogwarts Legacy | GTX 960 | 34% | **23%** | ❌ Não roda |
| Red Dead 2 | GTX 770 | 43% | **31%** | ❌ Não roda |
| Dota 2 | GeForce 8600 | 87% | **79%** | ✅ Roda suave |
| Counter-Strike 2 | (sem GPU específica) | 55% | **19%** | ⚠️ Pessimista |

## 🛠️ Como Usar

### 1. Iniciar o Servidor API
```bash
cd backend
npm install
npm start       # produção
npm run dev     # desenvolvimento com hot-reload
```

O servidor estará disponível em `http://localhost:3001`

### 2. Testar a API
```bash
# Terminal 1: Iniciar servidor
npm start

# Terminal 2: Testar endpoints
npm run test-api
```

### 3. Usar a API

#### Analisar um jogo
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

#### Analisar múltiplos jogos
```bash
curl -X POST http://localhost:3001/api/analyze-games \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": "AMD Ryzen 5 3600",
    "gpu": "RTX 3060",
    "ram": 16,
    "games": [
      {"name": "Cyberpunk 2077", "requirements": "i7-4790, 12GB, GTX 1060"},
      {"name": "Minecraft", "requirements": "i3-3210, 4GB, Intel HD 4000"}
    ]
  }'
```

#### Buscar hardware disponível
```bash
# Buscar GPUs
curl "http://localhost:3001/api/hardware/search?q=rtx&type=gpu"

# Buscar CPUs
curl "http://localhost:3001/api/hardware/search?q=ryzen%205&type=cpu"
```

### 4. Gerar JSON de Jogos (Opcional)

Para gerar um arquivo `games_compatibility.json` com 2000 jogos:

```bash
# Usar hardware padrão (i5-4460, GT 630, 12GB)
npm run generate

# Ou especificar seu hardware:
npm run generate "AMD Ryzen 7 5800X" "RTX 3080" 32

# Ou com limite de jogos:
npm run generate "Intel Core i7-9700K" "GTX 1660 Ti" 16 500
```

## 📝 Estrutura dos Arquivos

```
backend/
├── src/
│   ├── index.js              # Servidor Express API
│   ├── analyze.js            # Lógica de compatibilidade
│   ├── utils.js              # Funções auxiliares
│   ├── scrapeSteam.js        # Web scraping Steam
│   ├── generate-games-json.js # Gerar JSON com jogos
│   ├── test.js               # Testes de análise
│   └── test-api.js           # Testes da API
├── data/
│   ├── CPU_UserBenchmarks.csv
│   └── GPU_UserBenchmarks.csv
└── games_compatibility.json  # Gerado pelo script
```

## 🌐 Endpoints da API

### POST `/api/analyze`
Analisa a compatibilidade de um jogo específico.

**Request:**
```json
{
  "cpu": "Intel Core i5-9400F",
  "gpu": "GTX 1660",
  "ram": 16,
  "requirements": "Intel Core i5-8400, 16GB RAM, RTX 2060"
}
```

**Response:**
```json
{
  "user": {
    "cpu": "Intel Core i5-9400F",
    "gpu": "GTX 1660",
    "ram": 16
  },
  "compatibility": {
    "score": 45,
    "status": "⚠️ Roda com gargalo",
    "color": "orange",
    "details": {
      "cpuName": "intel core i5-8400",
      "gpuName": "rtx 2060",
      "ramReq": 16,
      "cpuRatio": 1.12,
      "gpuRatio": 0.42
    }
  }
}
```

### POST `/api/analyze-games`
Analisa múltiplos jogos de uma vez.

**Request:**
```json
{
  "cpu": "AMD Ryzen 5 3600",
  "gpu": "RTX 3060",
  "ram": 16,
  "games": [
    { "name": "Game 1", "requirements": "..." },
    { "name": "Game 2", "requirements": "..." }
  ]
}
```

### GET `/api/hardware/search?q=rtx&type=gpu`
Busca hardware disponível no banco de dados.

**Query Parameters:**
- `q`: Termo de busca
- `type`: `cpu` ou `gpu`

**Response:**
```json
{
  "query": "rtx",
  "type": "gpu",
  "matches": [
    { "name": "nvidia rtx 4090", "benchmark": 155 },
    { "name": "nvidia rtx 4080", "benchmark": 122 }
  ]
}
```

### GET `/api/hardware`
Lista hardware disponível (sample de 100 itens).

### GET `/api/health`
Verifica status do servidor.

## 🎯 Próximas Melhorias Sugeridas

1. **Fallback para hardware desconhecido**: Usar análise de texto (ex: "2.8 GHz" → estimar performance)
2. **Requisitos Recomendados**: Analisar também os requisitos recomendados, não só mínimos
3. **Benchmark API real**: Usar API do UserBenchmark para dados sempre atualizados
4. **Machine Learning**: Treinar modelo com dados reais de performance
5. **Configurações do usuário**: Permitir ajustar o "otimismo" do sistema

## 📚 Tecnologias

- Node.js + Express
- Cheerio (web scraping)
- CSV Parse (parsing de benchmarks)
- String Similarity (matching de hardware)
- React + Vite + Tailwind (frontend)
