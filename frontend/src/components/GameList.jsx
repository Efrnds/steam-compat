import { useState, useMemo } from "react";
import GameCard from "./GameCard";

export default function GameList({ games }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("score"); // 'score' | 'name' | 'rating'

  const filteredGames = useMemo(() => {
    let filtered = games;

    // Filtro por rating
    if (filter !== "all") {
      filtered = filtered.filter((g) => g.analysis.rating.level === filter);
    }

    // Busca por nome
    if (search) {
      filtered = filtered.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      if (sortBy === "score") {
        return b.analysis.score - a.analysis.score;
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return filtered;
  }, [games, filter, search, sortBy]);

  const filters = [
    { value: "all", label: "🎮 Todos", color: "gray" },
    { value: "excellent", label: "🔥 Perfeitamente", color: "green" },
    { value: "good", label: "✅ Roda bem", color: "lime" },
    { value: "fair", label: "⚠️ Limitações", color: "yellow" },
    { value: "poor", label: "🐌 Dificuldade", color: "orange" },
    { value: "unplayable", label: "❌ Não roda", color: "red" },
  ];

  return (
    <div>
      {/* Barra de ferramentas */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 space-y-4">
        {/* Busca */}
        <div>
          <input
            type="text"
            placeholder="🔍 Buscar jogo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f.value
                  ? `bg-${f.color}-600 text-white`
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="score">Score (maior primeiro)</option>
            <option value="name">Nome (A-Z)</option>
          </select>
        </div>

        {/* Contador */}
        <div className="text-gray-400 text-sm text-center">
          Mostrando {filteredGames.length} de {games.length} jogos
        </div>
      </div>

      {/* Grid de jogos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGames.map((game, index) => (
          <GameCard key={`${game.appid}-${index}`} game={game} />
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-xl">
            Nenhum jogo encontrado com esses filtros
          </p>
        </div>
      )}
    </div>
  );
}
