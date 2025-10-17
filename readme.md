# Steam Compatibility Analyzer

Este projeto realiza **análise de compatibilidade de jogos Steam** com o seu PC, comparando requisitos mínimos com benchmarks de CPU, GPU e RAM. Possui **backend** para coletar e processar dados, e **frontend** para visualização interativa.

---

## 📁 Estrutura do Projeto

steam-compat/
<br/>
├─ backend/
<br/>
│ ├─ src/
<br/>
│ │ ├─ index.js # Entrada do backend, executa scraping e gera JSON
<br/>
│ │ ├─ scrapeSteam.js # Funções para coletar jogos e requisitos da Steam
<br/>
│ │ ├─ analyze.js # Função para analisar compatibilidade do PC
<br/>
│ │ └─ utils.js # Funções auxiliares: benchmarks, normalização, busca aproximada
<br/>
│ └─ data/
<br/>
│ ├─ CPU_UserBenchmarks.csv
<br/>
│ └─ GPU_UserBenchmarks.csv
<br/>
├─ frontend/
<br/>
│ ├─ src/
<br/>
│ │ ├─ App.jsx # Componente principal
<br/>
│ │ └─ components/
<br/>
│ │ └─ GameCard.jsx # Card individual de cada jogo
<br/>
└─ README.md


---

## ⚙️ Backend

### Requisitos

- Node.js >= 24
- npm ou yarn

### Instalação

```bash
cd backend
npm install

Executando

node src/index.js

O backend irá:

    Coletar os top sellers da Steam (atualmente limitado a 2000 jogos).

    Extrair os requisitos mínimos de cada jogo.

    Comparar com o hardware do usuário (CPU, GPU, RAM) usando benchmarks.

    Gerar um arquivo JSON: games_compatibility.json contendo:

{
  "appid": 123456,
  "name": "Nome do jogo",
  "reqs": "Requisitos mínimos limpos",
  "score": 85,
  "status": "🔥 Roda liso (Ultra)",
  "color": "green",
  "details": {
    "cpuName": "Intel Core i5-8350U",
    "gpuName": "Intel UHD Graphics 620",
    "ramReq": 8,
    "cpuRatio": 0.9,
    "gpuRatio": 0.7
  }
}

🖥️ Frontend
Requisitos

    React (Vite ou Create React App)

    TailwindCSS

Instalação

cd frontend
npm install

Executando

npm run dev

O frontend irá:

    Ler o JSON gerado pelo backend (/games_compatibility.json).

    Renderizar uma grade de cards com cada jogo.

    Permitir filtro por status (Roda liso, Roda suave, Gargalo, Provavelmente não roda).

    Tornar cada card clicável, abrindo a página do jogo na Steam.

    Mostrar detalhes do hardware e barras de desempenho (CPU, GPU, RAM).

🎨 Componentes principais

    App.jsx – Gerencia estado, filtros e grid de jogos.

    GameCard.jsx – Card de cada jogo, mostrando nome, score, status e barras de desempenho.

🚀 Como usar

    Execute o backend para gerar o JSON:

cd backend
node src/index.js

    Execute o frontend para visualizar:

cd frontend
npm run dev

    Abra no navegador e explore os jogos, filtrando por compatibilidade.

🔧 Personalização

    Hardware do usuário: altere no backend/src/index.js:

const user = { cpu: "Intel Core i5-8350U", gpu: "Intel UHD Graphics 620", ram: 8 };

    Número de jogos: altere no getTopSteamGames(limit) (backend).

    Estilo e cores: ajuste TailwindCSS nos componentes frontend.

⚠️ Observações

    O scraping depende da Steam, mudanças na página podem quebrar o backend.

    Requisitos mínimos extraídos podem variar em formatação.

    A análise é aproximada, baseada em benchmarks de usuários.

📄 Licença

MIT License


---