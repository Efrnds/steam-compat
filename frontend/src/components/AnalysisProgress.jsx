export default function AnalysisProgress({ progress }) {
  const percentage =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="mt-8">
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white font-semibold">Analisando jogos...</span>
          <span className="text-blue-400 font-bold">
            {progress.current} / {progress.total}
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-gray-600 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 flex items-center justify-center"
            style={{ width: `${percentage}%` }}
          >
            <span className="text-xs font-bold text-white">{percentage}%</span>
          </div>
        </div>

        {progress.currentGame && (
          <p className="text-gray-400 text-sm mt-3 text-center">
            📦 {progress.currentGame}
          </p>
        )}
      </div>
    </div>
  );
}
