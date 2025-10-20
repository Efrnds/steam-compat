import { useState } from "react";

export default function HardwareDetection({ onDetect, onManual, onNext }) {
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [hardware, setHardware] = useState({
    cpu: { model: "" },
    gpu: { model: "" },
    mem: { total: 8 },
  });

  const handleAutoDetect = async () => {
    setLoading(true);
    try {
      await onDetect();
    } catch (error) {
      alert("Erro ao detectar hardware automaticamente. Use o modo manual.");
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!hardware.cpu.model || !hardware.gpu.model || !hardware.mem.total) {
      alert("Preencha todos os campos!");
      return;
    }
    onManual(hardware);
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          🖥️ Detectar Hardware
        </h2>

        {!manualMode ? (
          <div className="space-y-6">
            <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-300 mb-3">
                🤖 Detecção Automática
              </h3>
              <p className="text-gray-300 mb-4">
                Vamos tentar detectar automaticamente o hardware do seu Linux.
                Funciona melhor com permissões adequadas.
              </p>
              <button
                onClick={handleAutoDetect}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "⏳ Detectando..." : "🔍 Detectar Automaticamente"}
              </button>
            </div>

            <div className="text-center">
              <p className="text-gray-400 mb-2">ou</p>
              <button
                onClick={() => setManualMode(true)}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                ✏️ Inserir manualmente
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <label className="block text-white font-semibold mb-2">
                🧠 Processador (CPU)
              </label>
              <input
                type="text"
                placeholder="Ex: Intel Core i5-9400F"
                value={hardware.cpu.model}
                onChange={(e) =>
                  setHardware({ ...hardware, cpu: { model: e.target.value } })
                }
                className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <label className="block text-white font-semibold mb-2">
                🎮 Placa de Vídeo (GPU)
              </label>
              <input
                type="text"
                placeholder="Ex: NVIDIA GTX 1660 Ti"
                value={hardware.gpu.model}
                onChange={(e) =>
                  setHardware({ ...hardware, gpu: { model: e.target.value } })
                }
                className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <label className="block text-white font-semibold mb-2">
                💾 Memória RAM (GB)
              </label>
              <input
                type="number"
                min="1"
                max="256"
                value={hardware.mem.total}
                onChange={(e) =>
                  setHardware({
                    ...hardware,
                    mem: { total: parseInt(e.target.value) },
                  })
                }
                className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setManualMode(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                ← Voltar
              </button>
              <button
                onClick={handleManualSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
