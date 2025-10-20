#!/bin/bash

# 🎮 Script de Exemplos - Sistema de Compatibilidade Steam
# Execute este arquivo para testar todos os endpoints da API

API_URL="http://localhost:3001"

echo "======================================================================"
echo "🚀 Testando API de Compatibilidade Steam"
echo "======================================================================"
echo ""

# Verificar se servidor está rodando
echo "📡 1. Verificando servidor..."
health=$(curl -s "$API_URL/api/health")
if [ $? -eq 0 ]; then
  echo "✅ Servidor online: $health"
else
  echo "❌ Servidor offline! Inicie com: cd backend && npm start"
  exit 1
fi

echo ""
echo "----------------------------------------------------------------------"
echo ""

# Teste 1: Análise única - PC fraco vs jogo pesado
echo "🎮 2. Teste: PC fraco (GT 630) vs Battlefield 6 (RTX 2060)"
curl -s -X POST "$API_URL/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": "Intel Core i5-4460",
    "gpu": "GT 630",
    "ram": 12,
    "requirements": "Intel Core i5-8400, 16GB RAM, RTX 2060"
  }' | jq '.compatibility | {score, status, details: {cpuRatio, gpuRatio}}'

echo ""
echo "----------------------------------------------------------------------"
echo ""

# Teste 2: Análise única - PC bom vs jogo leve
echo "🎮 3. Teste: PC médio (RTX 3060) vs Minecraft"
curl -s -X POST "$API_URL/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": "AMD Ryzen 5 3600",
    "gpu": "RTX 3060",
    "ram": 16,
    "requirements": "Intel Core i3-3210, 4GB RAM, Intel HD 4000"
  }' | jq '.compatibility | {score, status}'

echo ""
echo "----------------------------------------------------------------------"
echo ""

# Teste 3: Análise múltipla
echo "🎮 4. Teste: Analisar 3 jogos diferentes"
curl -s -X POST "$API_URL/api/analyze-games" \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": "Intel Core i7-9700K",
    "gpu": "GTX 1660 Ti",
    "ram": 16,
    "games": [
      {"name": "Cyberpunk 2077", "requirements": "Intel Core i7-4790, 12GB RAM, GTX 1060"},
      {"name": "Counter-Strike 2", "requirements": "Intel Core i5 750, 8GB RAM"},
      {"name": "GTA V", "requirements": "Intel Core 2 Quad Q6600, 4GB RAM, GTX 660"}
    ]
  }' | jq '.results[] | {name, score, status}'

echo ""
echo "----------------------------------------------------------------------"
echo ""

# Teste 4: Buscar GPUs NVIDIA
echo "🔍 5. Buscar GPUs NVIDIA RTX (top 10)"
curl -s "$API_URL/api/hardware/search?q=rtx&type=gpu" \
  | jq '.matches[:10] | .[] | {name, benchmark}'

echo ""
echo "----------------------------------------------------------------------"
echo ""

# Teste 5: Buscar CPUs AMD Ryzen 5
echo "🔍 6. Buscar CPUs AMD Ryzen 5 (top 10)"
curl -s "$API_URL/api/hardware/search?q=ryzen%205&type=cpu" \
  | jq '.matches[:10] | .[] | {name, benchmark}'

echo ""
echo "----------------------------------------------------------------------"
echo ""

# Teste 6: PC High-End vs Jogo Pesado
echo "🎮 7. Teste: PC High-End (RTX 4090) vs Cyberpunk 2077"
curl -s -X POST "$API_URL/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "cpu": "Intel Core i9-13900K",
    "gpu": "RTX 4090",
    "ram": 32,
    "requirements": "Intel Core i7-6700, 12GB RAM, GTX 1060"
  }' | jq '.compatibility | {score, status}'

echo ""
echo "======================================================================"
echo "✅ Testes concluídos!"
echo "======================================================================"
echo ""
