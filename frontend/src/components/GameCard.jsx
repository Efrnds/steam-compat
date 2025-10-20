export default function GameCard({ game }) {
  const { appid, name, header_image, analysis, requirements } = game;

  if (!analysis) return null;

  const { score, rating, details, recommendation } = analysis;
  const colorMap = {
    green: "bg-green-500",
    lime: "bg-lime-400",
    yellow: "bg-yellow-400",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  const textColorMap = {
    green: "text-green-400",
    lime: "text-lime-400",
    yellow: "text-yellow-400",
    orange: "text-orange-400",
    red: "text-red-400",
  };

  const ProgressBar = ({ label, value, max = 100 }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const color = rating.color;

    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${colorMap[color]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <a
      href={`https://store.steampowered.com/app/${appid}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
    >
      {/* Imagem */}
      {header_image && (
        <img
          src={header_image}
          alt={name}
          className="w-full h-40 object-cover"
        />
      )}

      {/* Conteúdo */}
      <div className="p-4">
        {/* Nome */}
        <h3 className="text-lg font-bold text-white mb-2 truncate" title={name}>
          {name}
        </h3>

        {/* Score principal */}
        <div
          className={`text-center py-3 rounded-lg mb-4 ${
            colorMap[rating.color]
          }`}
        >
          <div className="text-3xl font-bold text-white">{score}%</div>
          <div className="text-sm text-white/90">{rating.label}</div>
        </div>

        {/* Detalhes de hardware */}
        <div className="space-y-2 mb-4">
          <ProgressBar label="🧠 CPU" value={details.cpu.score} />
          <ProgressBar label="🎮 GPU" value={details.gpu.score} />
          <ProgressBar label="💾 RAM" value={details.ram.score} />
        </div>

        {/* Requisitos Mínimos */}
        <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1">
            <span>📋</span>
            <span>Requisitos Mínimos:</span>
          </h4>
          <div className="space-y-1 text-xs text-gray-400">
            {details.cpu.required !== "Não especificado" && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500">CPU:</span>
                <span className="flex-1">{details.cpu.required}</span>
              </div>
            )}
            {details.gpu.required !== "Não especificado" && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500">GPU:</span>
                <span className="flex-1">{details.gpu.required}</span>
              </div>
            )}
            {details.ram.required && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500">RAM:</span>
                <span>{details.ram.required}</span>
              </div>
            )}
          </div>
        </div>

        {/* Badge de jogo leve */}
        {details.isLightGame && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-green-900/30 border border-green-500/50 text-green-300 text-xs rounded-full">
              🎮 Jogo Leve
            </span>
          </div>
        )}

        {/* Recomendação */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center italic">
            💡 {recommendation}
          </p>
        </div>
      </div>
    </a>
  );
}
