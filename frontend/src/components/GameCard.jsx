export default function GameCard({ game }) {
  const { appid, name, score, status, color, details } = game;

  const colorMap = {
    green: "text-green-400",
    lime: "text-lime-300",
    orange: "text-yellow-400",
    red: "text-red-400",
  };

  // Função para gerar barra de desempenho
  const Bar = ({ value }) => (
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div
        className="h-2 rounded-full"
        style={{
          width: `${Math.min(value * 100, 100)}%`,
          backgroundColor: color === "green" ? "#34d399" : color === "lime" ? "#a3e635" : color === "orange" ? "#facc15" : "#f87171",
        }}
      />
    </div>
  );

  return (
    <a
      href={`https://store.steampowered.com/app/${appid}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#161b22] p-4 rounded-xl shadow hover:scale-105 transition transform"
    >
      <h2 className="text-lg text-blue-400 font-bold mb-2">{name}</h2>
      <p className={`text-xl font-bold ${colorMap[color]} mb-3`}>
        {score}% {status}
      </p>

      {/* Detalhes com barras */}
      <div className="text-sm space-y-2">
        <div>
          <p>🧠 CPU: {details.cpuName}</p>
          <Bar value={details.cpuRatio} />
        </div>
        <div>
          <p>🎮 GPU: {details.gpuName}</p>
          <Bar value={details.gpuRatio} />
        </div>
        <div>
          <p>💾 RAM: {details.ramReq} GB</p>
          <Bar value={details.ramReq / 8} /> {/* assumindo 16GB como referência */}
        </div>
      </div>
    </a>
  );
}
