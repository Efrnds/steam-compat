import { useState, useEffect } from "react";
import HardwareDetection from "./components/HardwareDetection";
import GameList from "./components/GameList";
import AnalysisProgress from "./components/AnalysisProgress";
import Stats from "./components/Stats";

const API_URL = "http://localhost:3002";
const WS_URL = "ws://localhost:3002";

export default function App() {
  const [hardware, setHardware] = useState(null);
  const [games, setGames] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [ws, setWs] = useState(null);
  const [view, setView] = useState("hardware"); // 'hardware' | 'analysis' | 'results'

  // Conectar WebSocket
  useEffect(() => {
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => console.log("🔌 WebSocket conectado");
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "progress") {
        setProgress(data.payload);
      }
    };
    websocket.onerror = (error) => console.error("❌ WebSocket erro:", error);

    setWs(websocket);
    return () => websocket.close();
  }, []);

  // Detectar hardware automaticamente
  const detectHardware = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hardware/detect`);
      const data = await res.json();
      setHardware(data.hardware);
      setView("analysis");
    } catch (error) {
      console.error("❌ Erro ao detectar hardware:", error);
      alert("Erro ao detectar hardware. Insira manualmente.");
    }
  };

  // Analisar compatibilidade
  const startAnalysis = async (limit = 100) => {
    setAnalyzing(true);
    setView("analysis");
    setProgress({ current: 0, total: limit });

    try {
      const res = await fetch(`${API_URL}/api/analysis/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hardware, limit }),
      });

      const data = await res.json();
      setGames(data.results);
      setView("results");
    } catch (error) {
      console.error("❌ Erro na análise:", error);
      alert("Erro ao analisar jogos.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎮 Steam Compatibility Analyzer
          </h1>
          <p className="text-gray-300 text-lg">
            Descubra quais jogos rodam no seu PC
          </p>
        </header>

        {view === "hardware" && (
          <HardwareDetection
            onDetect={detectHardware}
            onManual={setHardware}
            onNext={() => hardware && setView("analysis")}
          />
        )}

        {view === "analysis" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">
                Pronto para analisar!
              </h2>

              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Seu Hardware:
                </h3>
                <p className="text-gray-300">🧠 CPU: {hardware?.cpu?.model}</p>
                <p className="text-gray-300">🎮 GPU: {hardware?.gpu?.model}</p>
                <p className="text-gray-300">
                  💾 RAM: {hardware?.mem?.total}GB
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => startAnalysis(100)}
                  disabled={analyzing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition"
                >
                  Analisar Top 100 Jogos
                </button>
                <button
                  onClick={() => startAnalysis(500)}
                  disabled={analyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition"
                >
                  Analisar Top 500 Jogos
                </button>
                <button
                  onClick={() => setView("hardware")}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  ← Voltar
                </button>
              </div>

              {analyzing && <AnalysisProgress progress={progress} />}
            </div>
          </div>
        )}

        {view === "results" && games.length > 0 && (
          <>
            <Stats games={games} onBack={() => setView("analysis")} />
            <GameList games={games} />
          </>
        )}
      </div>
    </div>
  );
}
