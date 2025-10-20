import { useMemo } from "react";

export default function Stats({ games, onBack }) {
  const stats = useMemo(() => {
    const levels = {
      excellent: games.filter((g) => g.analysis.rating.level === "excellent")
        .length,
      good: games.filter((g) => g.analysis.rating.level === "good").length,
      fair: games.filter((g) => g.analysis.rating.level === "fair").length,
      poor: games.filter((g) => g.analysis.rating.level === "poor").length,
      unplayable: games.filter((g) => g.analysis.rating.level === "unplayable")
        .length,
    };

    const avgScore = Math.round(
      games.reduce((sum, g) => sum + g.analysis.score, 0) / games.length
    );

    return { ...levels, avgScore, total: games.length };
  }, [games]);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">
          📊 Resultados da Análise
        </h2>
        <button
          onClick={onBack}
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          ← Nova Análise
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {/* Total */}
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-white mb-1">
            {stats.total}
          </div>
          <div className="text-gray-400 text-sm">Total</div>
        </div>

        {/* Score Médio */}
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-blue-400 mb-1">
            {stats.avgScore}%
          </div>
          <div className="text-gray-400 text-sm">Média</div>
        </div>

        {/* Excellent */}
        <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-green-400 mb-1">
            {stats.excellent}
          </div>
          <div className="text-green-300 text-sm">🔥 Perfeitamente</div>
        </div>

        {/* Good */}
        <div className="bg-lime-900/30 border border-lime-500 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-lime-400 mb-1">
            {stats.good}
          </div>
          <div className="text-lime-300 text-sm">✅ Roda bem</div>
        </div>

        {/* Fair + Poor */}
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-1">
            {stats.fair + stats.poor}
          </div>
          <div className="text-yellow-300 text-sm">⚠️ Limitado</div>
        </div>

        {/* Unplayable */}
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-red-400 mb-1">
            {stats.unplayable}
          </div>
          <div className="text-red-300 text-sm">❌ Não roda</div>
        </div>
      </div>
    </div>
  );
}
