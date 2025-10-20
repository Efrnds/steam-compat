# 🎮 Guia Rápido de Uso

## Iniciar o Sistema

### 1. Iniciar o Servidor (Terminal 1)
```bash
cd backend
npm install  # Primeira vez apenas
npm start
```

O servidor ficará rodando em `http://localhost:3001`

### 2. Testar com CURL (Terminal 2)

#### Analisar compatibilidade de um jogo
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
      {"name": "Cyberpunk 2077", "requirements": "Intel Core i7-4790, 12GB RAM, GTX 1060"},
      {"name": "Minecraft", "requirements": "Intel Core i3-3210, 4GB RAM, Intel HD 4000"}
    ]
  }'
```

#### Buscar hardware disponível
```bash
# Buscar GPUs NVIDIA RTX
curl "http://localhost:3001/api/hardware/search?q=rtx&type=gpu"

# Buscar CPUs AMD Ryzen 5
curl "http://localhost:3001/api/hardware/search?q=ryzen%205&type=cpu"

# Buscar CPUs Intel i7
curl "http://localhost:3001/api/hardware/search?q=i7&type=cpu"
```

#### Verificar servidor
```bash
curl http://localhost:3001/api/health
```

---

## Gerar Lista de Jogos

Para criar um arquivo `games_compatibility.json` com análise de 2000 jogos:

```bash
# Usando hardware padrão (i5-4460, GT 630, 12GB)
npm run generate

# Especificando SEU hardware
npm run generate "Intel Core i7-9700K" "RTX 2060" 16

# Com limite personalizado (ex: 500 jogos)
npm run generate "AMD Ryzen 5 3600" "GTX 1660 Ti" 16 500
```

Depois copie o arquivo para o frontend:
```bash
cp games_compatibility.json ../frontend/public/
```

---

## Exemplos de Hardware Válido

### CPUs Intel
- Intel Core i3-10100
- Intel Core i5-9400F
- Intel Core i5-11400
- Intel Core i7-9700K
- Intel Core i9-10900K

### CPUs AMD
- AMD Ryzen 3 3100
- AMD Ryzen 5 2600
- AMD Ryzen 5 3600
- AMD Ryzen 7 3700X
- AMD Ryzen 9 5900X

### GPUs NVIDIA
- GT 630
- GTX 1050 Ti
- GTX 1060
- GTX 1660
- GTX 1660 Ti
- RTX 2060
- RTX 3060
- RTX 3070
- RTX 4080

### GPUs AMD
- RX 570
- RX 580
- RX 5600 XT
- RX 6600
- RX 6700 XT
- RX 7900 XTX

**Dica:** Use o endpoint `/api/hardware/search` para verificar se seu hardware está no banco de dados!

---

## Integração com JavaScript/Frontend

### Fetch API (Vanilla JS)
```javascript
async function analyzeGame(cpu, gpu, ram, requirements) {
  const response = await fetch('http://localhost:3001/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpu, gpu, ram, requirements })
  });
  
  const data = await response.json();
  return data.compatibility;
}

// Usar
const result = await analyzeGame(
  "Intel Core i5-9400F",
  "GTX 1660",
  16,
  "Intel Core i5-8400, 16GB RAM, RTX 2060"
);

console.log(`Score: ${result.score}%`);
console.log(`Status: ${result.status}`);
```

### Axios (Node.js ou React)
```javascript
import axios from 'axios';

async function analyzeGames(cpu, gpu, ram, games) {
  const { data } = await axios.post('http://localhost:3001/api/analyze-games', {
    cpu, gpu, ram, games
  });
  
  return data.results;
}

// Usar
const results = await analyzeGames(
  "AMD Ryzen 5 3600",
  "RTX 3060",
  16,
  [
    { name: "Cyberpunk 2077", requirements: "i7-4790, 12GB, GTX 1060" },
    { name: "GTA V", requirements: "i5-3470, 8GB, GTX 660" }
  ]
);

results.forEach(game => {
  console.log(`${game.name}: ${game.score}% - ${game.status}`);
});
```

### React Hook Exemplo
```javascript
import { useState } from 'react';

function useGameCompatibility() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async (cpu, gpu, ram, requirements) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpu, gpu, ram, requirements })
      });
      const data = await res.json();
      setResult(data.compatibility);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, result };
}

// Usar no componente
function GameChecker() {
  const { analyze, loading, result } = useGameCompatibility();

  const handleCheck = () => {
    analyze("Intel Core i5-9400F", "GTX 1660", 16, "i5-8400, 16GB, RTX 2060");
  };

  return (
    <div>
      <button onClick={handleCheck} disabled={loading}>
        {loading ? 'Analisando...' : 'Verificar Compatibilidade'}
      </button>
      
      {result && (
        <div className={`result ${result.color}`}>
          <p>Score: {result.score}%</p>
          <p>{result.status}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Troubleshooting

### Servidor não inicia
```bash
# Verificar se a porta 3001 está em uso
lsof -i :3001

# Matar processo se necessário
kill -9 <PID>

# Ou usar porta diferente
PORT=4000 npm start
```

### Hardware não encontrado
Use o endpoint de busca para verificar nomes válidos:
```bash
curl "http://localhost:3001/api/hardware/search?q=seu_hardware&type=gpu"
```

### Erro de CORS
Se estiver rodando frontend em porta diferente, o CORS já está habilitado no servidor.

---

## Performance

- **Cache de Benchmarks**: O servidor carrega os CSVs uma vez na inicialização
- **Análise Única**: ~5-10ms
- **Análise Múltipla (100 jogos)**: ~500ms
- **Geração JSON (2000 jogos)**: ~20-30 minutos (depende da Steam)
