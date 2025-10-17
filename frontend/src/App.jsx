import { useEffect, useState } from "react";
import GameCard from "./components/GameCard";

export default function App() {
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/games_compatibility.json")
      .then((res) => res.json())
      .then(setGames);
  }, []);

  // Filtra os jogos pelo status
  const filteredGames = games.filter((g) => {
    if (filter === "all") return true;
    if (filter === "ultra") return g.status.includes("Roda liso");
    if (filter === "medio") return g.status.includes("Roda suave");
    if (filter === "gargalo") return g.status.includes("Roda com gargalo");
    if (filter === "nao") return g.status.includes("Provavelmente não roda");
    return true;
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Relatório de Compatibilidade Steam
      </h1>

      {/* Filtro */}
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === "all" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("ultra")}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === "ultra" ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Roda liso 🔥
        </button>
        <button
          onClick={() => setFilter("medio")}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === "medio" ? "bg-lime-400 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Roda suave ✅
        </button>
        <button
          onClick={() => setFilter("gargalo")}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === "gargalo" ? "bg-yellow-400 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Gargalo ⚠️
        </button>
        <button
          onClick={() => setFilter("nao")}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === "nao" ? "bg-red-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Provavelmente não roda ❌
        </button>
      </div>

      {/* Grid de jogos */}
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
        {filteredGames.map((g) => (
          <GameCard key={g.appid} game={g} />
        ))}
      </div>
    </main>
  );
}
