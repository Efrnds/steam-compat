import { findClosest, normalizeScore } from "./utils.js";

export function analyzeCompatibility(reqs, user, db) {
    const weights = { cpu: 0.4, gpu: 0.45, ram: 0.15 };
    const reqLower = reqs
        .toLowerCase()
        .replace(/[\n\r\t]+/g, " ")
        .replace(/[^a-z0-9\s\-\+\.]/g, " ")
        .replace(/\s+/g, " ");

    // CPU
    const cpuMatch = reqLower.match(
        /(intel|amd).*?(i[3579]-?\d{3,4}|ryzen ?\d|fx-?\d{3,4})/
    );
    const cpuName = cpuMatch ? cpuMatch[0] : "Desconhecido";
    const cpuReq = findClosest(cpuName, db.cpu);
    const cpuUser = findClosest(user.cpu, db.cpu);
    const cpuRatio = cpuReq && cpuUser ? cpuUser / cpuReq : 0.8;
    let cpuScore = normalizeScore(cpuRatio);
    if (!cpuReq || cpuRatio < 0.4) cpuScore *= 0.5;

    // GPU
    const gpuMatch = reqLower.match(
        /(rtx\s?\d{3,4}\s?(ti|super)?|gtx\s?\d{3,4}\s?(ti|super)?|rx\s?\d{3,4}|arc\s?[a-z]?\d{3,4}|radeon\s?(hd|rx)?\s?\d{3,4}|intel\s?(uhd|hd|iris)\s?\d{3,4})/
    );
    const gpuName = gpuMatch ? gpuMatch[0].trim() : "Desconhecido";
    const gpuReq = findClosest(gpuName, db.gpu);
    const gpuUser = findClosest(user.gpu, db.gpu);
    const gpuRatio = gpuReq && gpuUser ? gpuUser / gpuReq : 0.8;
    let gpuScore = normalizeScore(gpuRatio);
    if (!gpuReq || gpuRatio < 0.4) gpuScore *= 0.5;

    // RAM
    const ramMatch = reqLower.match(/(\d+)\s*gb/);
    const ramReq = ramMatch ? parseInt(ramMatch[1]) : 4;
    const ramRatio = user.ram / ramReq;
    const ramScore = normalizeScore(ramRatio);

    const total =
        cpuScore * weights.cpu +
        gpuScore * weights.gpu +
        ramScore * weights.ram;

    const finalScore = Math.round(total * 100);
    let status, color;

    if (finalScore >= 85) {
        status = "🔥 Roda liso (Ultra)";
        color = "green";
    } else if (finalScore >= 70) {
        status = "✅ Roda suave (Médio)";
        color = "lime";
    } else if (finalScore >= 55) {
        status = "⚠️ Roda com gargalo";
        color = "orange";
    } else {
        status = "❌ Provavelmente não roda";
        color = "red";
    }

    return { score: finalScore, status, color, details: { cpuName, gpuName, ramReq, cpuRatio, gpuRatio } };
}
