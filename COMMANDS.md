# 🎮 Comandos Rápidos - Sistema Steam Compat

## 🚀 Iniciar Sistema

```bash
# Backend (API)
cd backend
npm install      # primeira vez
npm start        # servidor em http://localhost:3001

# Frontend (React)
cd frontend
npm install      # primeira vez
npm run dev      # interface em http://localhost:5173
```

## 🧪 Testar Sistema

```bash
cd backend

# Teste rápido (5 casos)
npm run test

# Teste API (requer servidor rodando)
npm run test-api

# Teste com bash script
./test-examples.sh
```

## 📦 Gerar Lista de Jogos

```bash
cd backend

# PC padrão (i5-4460, GT 630, 12GB) - 2000 jogos
npm run generate

# Especificar hardware - 2000 jogos
npm run generate "AMD Ryzen 5 3600" "RTX 3060" 16

# Especificar hardware e limite - 500 jogos
npm run generate "Intel i7-9700K" "GTX 1660 Ti" 16 500

# PC high-end - 100 jogos (teste)
npm run generate "Intel i9-13900K" "RTX 4090" 32 100
```

## 🌐 Testar API com CURL

### Análise Única
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

### Análise Múltipla
```bash
curl -X POST http://localhost:3001/api/analyze-games \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": "AMD Ryzen 5 3600",
    "gpu": "RTX 3060",
    "ram": 16,
    "games": [
      {"name": "Cyberpunk 2077", "requirements": "i7-4790, 12GB, GTX 1060"},
      {"name": "GTA V", "requirements": "Core 2 Quad Q6600, 4GB, GTX 660"}
    ]
  }'
```

### Buscar Hardware
```bash
# GPUs NVIDIA
curl "http://localhost:3001/api/hardware/search?q=rtx&type=gpu"

# CPUs AMD Ryzen 5
curl "http://localhost:3001/api/hardware/search?q=ryzen%205&type=cpu"

# CPUs Intel i7
curl "http://localhost:3001/api/hardware/search?q=i7&type=cpu"

# GPUs AMD RX
curl "http://localhost:3001/api/hardware/search?q=rx&type=gpu"
```

### Health Check
```bash
curl http://localhost:3001/api/health
```

## 📊 Ver Resultados com jq

```bash
# Score e status apenas
curl -s -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"cpu":"i5-9400F","gpu":"GTX 1660","ram":16,"requirements":"i5-8400, 16GB, RTX 2060"}' \
  | jq '.compatibility | {score, status}'

# Detalhes completos
curl -s -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"cpu":"Ryzen 5 3600","gpu":"RTX 3060","ram":16,"requirements":"i7-6700, 12GB, GTX 1060"}' \
  | jq '.compatibility'

# Top 5 GPUs RTX
curl -s "http://localhost:3001/api/hardware/search?q=rtx&type=gpu" \
  | jq '.matches[:5]'
```

## 🔧 Desenvolvimento

```bash
# Hot reload (nodemon)
cd backend
npm run dev

# Ver logs do servidor
tail -f /var/log/steam-compat.log

# Limpar cache npm
rm -rf node_modules package-lock.json
npm install
```

## 🐛 Debug / Troubleshooting

```bash
# Verificar porta 3001
lsof -i :3001

# Matar processo na porta 3001
kill -9 $(lsof -t -i:3001)

# Testar conexão
nc -zv localhost 3001

# Ver logs npm
cat ~/.npm/_logs/*.log | tail -50
```

## 📦 Deploy

```bash
# Com PM2
npm install -g pm2
cd backend
pm2 start src/index.js --name steam-compat
pm2 logs steam-compat
pm2 restart steam-compat
pm2 stop steam-compat

# Com Docker
docker build -t steam-compat .
docker run -d -p 3001:3001 steam-compat
docker logs -f steam-compat
```

## 🎯 Casos de Uso Comuns

### 1. Testar Meu PC Rapidamente
```bash
cd backend
npm start &
sleep 2
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": "SEU_CPU_AQUI",
    "gpu": "SUA_GPU_AQUI",
    "ram": SUA_RAM,
    "requirements": "REQUISITOS_DO_JOGO"
  }' | jq
```

### 2. Gerar Lista Para Meu PC
```bash
cd backend
npm run generate "Seu CPU" "Sua GPU" RAM
cp games_compatibility.json ../frontend/public/
cd ../frontend && npm run dev
```

### 3. Comparar 2 PCs
```bash
# PC 1
curl -s -X POST http://localhost:3001/api/analyze \
  -d '{"cpu":"i5-4460","gpu":"GT 630","ram":12,"requirements":"i5-8400, 16GB, RTX 2060"}' \
  -H "Content-Type: application/json" | jq -r '.compatibility.score'

# PC 2
curl -s -X POST http://localhost:3001/api/analyze \
  -d '{"cpu":"Ryzen 5 3600","gpu":"RTX 3060","ram":16,"requirements":"i5-8400, 16GB, RTX 2060"}' \
  -H "Content-Type: application/json" | jq -r '.compatibility.score'
```

### 4. Encontrar Hardware Similar
```bash
# Quero saber GPUs parecidas com RTX 3060
curl -s "http://localhost:3001/api/hardware/search?q=rtx%203060&type=gpu" \
  | jq '.matches[] | select(.benchmark > 80 and .benchmark < 100)'
```

## 📚 Exemplos Práticos

### PC Fraco (i5-4460, GT 630, 12GB)
```bash
npm run generate "Intel Core i5-4460" "GT 630" 12 100
# Resultado esperado: ~90% não roda
```

### PC Médio (Ryzen 5 3600, GTX 1660 Ti, 16GB)
```bash
npm run generate "AMD Ryzen 5 3600" "GTX 1660 Ti" 16 100
# Resultado esperado: ~50% roda bem
```

### PC High-End (i9-13900K, RTX 4090, 32GB)
```bash
npm run generate "Intel Core i9-13900K" "RTX 4090" 32 100
# Resultado esperado: ~95% roda liso
```

## 🎨 Formatação de Output

### Pretty Print com jq
```bash
curl ... | jq '.'
```

### Apenas Score
```bash
curl ... | jq -r '.compatibility.score'
```

### Tabela com column
```bash
curl ... | jq -r '.results[] | [.name, .score, .status] | @tsv' | column -t
```

## ⚡ Aliases Úteis (Bash/Zsh)

Adicione ao `~/.bashrc` ou `~/.zshrc`:

```bash
alias steam-start='cd ~/Documentos/steam-compat/backend && npm start'
alias steam-test='cd ~/Documentos/steam-compat/backend && npm run test'
alias steam-gen='cd ~/Documentos/steam-compat/backend && npm run generate'
alias steam-api='curl -X POST http://localhost:3001/api/analyze -H "Content-Type: application/json"'
```

Uso:
```bash
steam-start &
steam-test
steam-gen "Ryzen 5 3600" "RTX 3060" 16
```
