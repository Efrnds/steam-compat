import fs from "fs-extra";
import { getTopSteamGames, getGameInfo } from "./scrapeSteam.js";
import { analyzeCompatibility } from "./analyze.js";
import { loadBenchmarks } from "./utils.js";

const user = { cpu: "Intel Core i5-8350U", gpu: "Intel UHD Graphics 620", ram: 8 };
const db = loadBenchmarks();

console.log(`Seu PC: ${user.cpu} / ${user.gpu} / ${user.ram}GB\n`);

const appids = await getTopSteamGames(2000);
const results = [];

function showProgress(current, total, length = 30) {
    const ratio = current / total;
    const filledLength = Math.round(length * ratio);
    const bar = "█".repeat(filledLength) + "-".repeat(length - filledLength);
    process.stdout.write(`\r[${bar}] ${(ratio * 100).toFixed(1)}%`);
}

for (let i = 0; i < appids.length; i++) {
    const info = await getGameInfo(appids[i]);
    if (!info) continue;
    const compat = analyzeCompatibility(info.reqs, user, db);
    results.push({ ...info, ...compat });

    showProgress(i + 1, appids.length); // atualiza a barra
}

console.log("\n✅ JSON gerado: games_compatibility.json");
await fs.writeJSON("./games_compatibility.json", results, { spaces: 2 });
