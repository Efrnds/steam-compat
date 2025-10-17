import fs from "fs";
import { parse } from "csv-parse/sync";
import stringSimilarity from "string-similarity";

export function loadBenchmarks() {
  const cpu = parse(fs.readFileSync("./data/CPU_UserBenchmarks.csv"), {
    columns: true,
  });
  const gpu = parse(fs.readFileSync("./data/GPU_UserBenchmarks.csv"), {
    columns: true,
  });

  const cpuMap = Object.fromEntries(
    cpu.map((r) => [`${r.Brand} ${r.Model}`.toLowerCase(), +r.Benchmark])
  );
  const gpuMap = Object.fromEntries(
    gpu.map((r) => [`${r.Brand} ${r.Model}`.toLowerCase(), +r.Benchmark])
  );

  return { cpu: cpuMap, gpu: gpuMap };
}

export function findClosest(name, db) {
  const keys = Object.keys(db);
  const match = stringSimilarity.findBestMatch(name.toLowerCase(), keys);
  return db[match.bestMatch.target] || 0;
}

export function normalizeScore(r) {
  if (r >= 1.2) return 1;
  if (r >= 1.0) return 0.9;
  if (r >= 0.8) return 0.7;
  if (r >= 0.6) return 0.4;
  if (r >= 0.4) return 0.2;
  return 0.0;
}
