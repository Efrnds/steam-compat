import stringSimilarity from 'string-similarity';

export class CompatibilityAnalyzer {
  constructor(benchmarks) {
    this.benchmarks = benchmarks;
    this.weights = {
      cpu: 0.25,
      gpu: 0.65,
      ram: 0.10
    };
  }

  /**
   * Normalizar formato de hardware
   */
  normalizeHardware(hardware) {
    return {
      cpu: {
        model: hardware.cpu?.model || hardware.cpu || 'Unknown'
      },
      gpu: {
        model: hardware.gpu?.model || hardware.gpu || 'Unknown'
      },
      ram: {
        total: hardware.ram?.total || hardware.ram || hardware.mem?.total || 8
      }
    };
  }

  analyzeGame(gameRequirements, userHardware) {
    const normalizedHardware = this.normalizeHardware(userHardware);
    const requirements = this.parseRequirements(gameRequirements);

    // Detectar se é jogo leve/indie/antigo
    const isLightGame = this.detectLightGame(gameRequirements);

    const cpuScore = this.analyzeCPU(requirements.cpu, normalizedHardware.cpu, isLightGame);
    const gpuScore = this.analyzeGPU(requirements.gpu, normalizedHardware.gpu, isLightGame);
    const ramScore = this.analyzeRAM(requirements.ram, normalizedHardware.ram);

    let finalScore = Math.round(
      cpuScore.score * this.weights.cpu +
      gpuScore.score * this.weights.gpu +
      ramScore.score * this.weights.ram
    );

    // Bonus para jogos leves se hardware for minimamente decente
    if (isLightGame && finalScore >= 40) {
      finalScore = Math.min(finalScore + 15, 100);
    }

    return {
      score: finalScore,
      rating: this.getRating(finalScore),
      details: {
        cpu: cpuScore,
        gpu: gpuScore,
        ram: ramScore,
        isLightGame
      },
      recommendation: this.getRecommendation(finalScore, gpuScore, cpuScore)
    };
  }

  /**
   * Detectar se é jogo leve baseado nos requisitos
   */
  detectLightGame(requirements) {
    if (!requirements || !requirements.minimum) return false;

    const text = requirements.minimum.toLowerCase();

    // Indicadores de jogo leve
    const lightIndicators = [
      /intel hd/i,
      /integrated graphics/i,
      /geforce 6\d{3}/i,  // GeForce 6xxx
      /geforce 7\d{3}/i,  // GeForce 7xxx
      /geforce 8\d{3}/i,  // GeForce 8xxx
      /geforce 9\d{3}/i,  // GeForce 9xxx
      /radeon hd 3\d{3}/i,
      /radeon hd 4\d{3}/i,
      /athlon/i,
      /pentium/i,
      /core 2 duo/i,
      /2\s*gb.*ram/i,     // 2GB RAM = muito leve
      /4\s*gb.*ram/i,     // 4GB RAM = leve
      /1\s*gb.*vram/i     // 1GB VRAM = leve
    ];

    return lightIndicators.some(pattern => pattern.test(text));
  }

  parseRequirements(requirements) {
    if (!requirements || !requirements.minimum) {
      return { cpu: null, gpu: null, ram: null };
    }

    const text = requirements.minimum.toLowerCase();

    const cpuMatch = text.match(
      /(intel|amd)[\s\w]*?(i[3579]-?\d{3,5}[a-z]*|ryzen\s?[3579]\s?\d{3,4}[a-z]*|fx-?\d{3,4}|core\s?\d|athlon|phenom|pentium|core 2|celeron)/i
    );

    const gpuMatch = text.match(
      /(nvidia|amd|intel)[\s\w]*?(rtx\s?\d{3,4}\s?(ti|super)?|gtx\s?\d{3,4}\s?(ti|super)?|geforce\s?\d{3,4}|rx\s?\d{3,4}\s?(xt)?|radeon\s?(hd|rx|r[3-9])?\s?\d{3,4}|arc\s?[a-z]?\d{3,4}|vega\s?\d+|uhd\s?\d+|iris|hd\s?\d{3,4})/i
    );

    const ramMatch = text.match(/(\d+)\s*gb/i);

    return {
      cpu: cpuMatch ? cpuMatch[0].trim() : null,
      gpu: gpuMatch ? gpuMatch[0].trim() : null,
      ram: ramMatch ? parseInt(ramMatch[1]) : 4
    };
  }

  analyzeCPU(requiredCPU, userCPU, isLightGame) {
    const cpuModel = userCPU.model || userCPU || 'Unknown';

    if (!requiredCPU) {
      // Sem requisitos específicos = assume jogo leve
      return {
        score: isLightGame ? 80 : 65,
        ratio: 1.0,
        confidence: 'low',
        message: 'Requisitos não especificados',
        required: 'Não especificado',
        user: cpuModel
      };
    }

    const reqBench = this.findBenchmark(requiredCPU, 'cpu');
    const userBench = this.findBenchmark(cpuModel, 'cpu');

    if (!reqBench.score || !userBench.score) {
      return {
        score: isLightGame ? 60 : 45,
        ratio: 0.7,
        confidence: 'low',
        message: 'Hardware não encontrado no banco',
        required: requiredCPU,
        user: cpuModel
      };
    }

    const ratio = userBench.score / reqBench.score;

    // Score baseado em benchmark absoluto E ratio
    let score;
    if (userBench.score >= 100) {
      // CPU moderna/decente (score >= 100) sempre consegue rodar algo
      score = Math.min(95, 50 + (ratio * 50));
    } else if (userBench.score >= 50) {
      // CPU antiga mas funcional
      score = Math.min(85, 40 + (ratio * 45));
    } else {
      // CPU muito fraca
      score = Math.min(70, 30 + (ratio * 40));
    }

    // Ajustar baseado na confiança do match
    if (reqBench.confidence < 0.4 || userBench.confidence < 0.4) {
      score *= 0.85;
    }

    return {
      score: Math.round(score),
      ratio: parseFloat(ratio.toFixed(2)),
      required: requiredCPU,
      user: cpuModel,
      userBenchmark: Math.round(userBench.score),
      reqBenchmark: Math.round(reqBench.score),
      confidence: Math.min(reqBench.confidence, userBench.confidence) > 0.5 ? 'high' : 'medium',
      message: ratio >= 1.1 ? 'CPU excelente' : ratio >= 0.9 ? 'CPU adequada' : ratio >= 0.7 ? 'CPU abaixo do ideal' : 'CPU fraca'
    };
  }

  analyzeGPU(requiredGPU, userGPU, isLightGame) {
    const gpuModel = userGPU.model || userGPU || 'Unknown';

    if (!requiredGPU) {
      // Sem requisitos = provavelmente jogo leve
      return {
        score: isLightGame ? 75 : 55,
        ratio: 1.0,
        confidence: 'low',
        message: 'Requisitos não especificados',
        required: 'Não especificado',
        user: gpuModel
      };
    }

    const reqBench = this.findBenchmark(requiredGPU, 'gpu');
    const userBench = this.findBenchmark(gpuModel, 'gpu');

    if (!reqBench.score || !userBench.score) {
      return {
        score: isLightGame ? 55 : 35,
        ratio: 0.6,
        confidence: 'low',
        message: 'GPU não encontrada no banco',
        required: requiredGPU,
        user: gpuModel
      };
    }

    const ratio = userBench.score / reqBench.score;

    // Score baseado em benchmark absoluto E ratio
    let score;

    // Thresholds baseados em performance real de GPUs
    if (userBench.score >= 80) {
      // GPU forte (GTX 1660 Ti+, RTX 2060+, etc)
      score = Math.min(100, 60 + (ratio * 40));
    } else if (userBench.score >= 50) {
      // GPU média (GTX 1050 Ti, GTX 960, RX 570, etc)
      score = Math.min(90, 50 + (ratio * 40));
    } else if (userBench.score >= 25) {
      // GPU fraca mas funcional (GT 1030, GT 730, HD 7770, etc)
      score = Math.min(75, 35 + (ratio * 40));
    } else if (userBench.score >= 10) {
      // GPU muito fraca (GT 630, HD 5450, etc)
      score = Math.min(60, 20 + (ratio * 40));
    } else {
      // GPU integrada/extremamente fraca
      score = Math.min(45, 10 + (ratio * 35));
    }

    // Penalizações graduais por ratio baixo (GPU é crítica)
    if (ratio < 0.8) score *= 0.9;
    if (ratio < 0.6) score *= 0.85;
    if (ratio < 0.4) score *= 0.75;
    if (ratio < 0.3) score *= 0.65;

    // Ajustar por confiança
    if (reqBench.confidence < 0.4 || userBench.confidence < 0.4) {
      score *= 0.85;
    }

    return {
      score: Math.round(score),
      ratio: parseFloat(ratio.toFixed(2)),
      required: requiredGPU,
      user: gpuModel,
      userBenchmark: Math.round(userBench.score),
      reqBenchmark: Math.round(reqBench.score),
      confidence: Math.min(reqBench.confidence, userBench.confidence) > 0.5 ? 'high' : 'medium',
      message: ratio >= 1.2 ? 'GPU excelente' : ratio >= 0.9 ? 'GPU adequada' : ratio >= 0.6 ? 'GPU abaixo do ideal' : 'GPU muito fraca'
    };
  }

  analyzeRAM(requiredRAM, userRAM) {
    const ramTotal = typeof userRAM === 'number' ? userRAM : (userRAM.total || 8);
    const ratio = ramTotal / requiredRAM;

    let score;
    if (ratio >= 1.5) {
      score = 100;
    } else if (ratio >= 1.0) {
      score = 95;
    } else if (ratio >= 0.8) {
      score = 75;
    } else if (ratio >= 0.6) {
      score = 50;
    } else {
      score = 30;
    }

    return {
      score,
      ratio: parseFloat(ratio.toFixed(2)),
      required: `${requiredRAM}GB`,
      user: `${ramTotal}GB`,
      confidence: 'high',
      message: ratio >= 1 ? 'RAM suficiente' : ratio >= 0.8 ? 'RAM ajustada' : 'RAM insuficiente'
    };
  }

  findBenchmark(hardware, type) {
    if (!hardware || !this.benchmarks[type]) {
      return { score: 0, confidence: 0 };
    }

    const keys = Object.keys(this.benchmarks[type]);
    const match = stringSimilarity.findBestMatch(hardware.toLowerCase(), keys);

    return {
      score: this.benchmarks[type][match.bestMatch.target] || 0,
      confidence: match.bestMatch.rating
    };
  }

  getRating(score) {
    if (score >= 85) return { level: 'excellent', label: '🔥 Roda perfeitamente', color: 'green' };
    if (score >= 70) return { level: 'good', label: '✅ Roda bem', color: 'lime' };
    if (score >= 55) return { level: 'fair', label: '⚠️ Roda com limitações', color: 'yellow' };
    if (score >= 40) return { level: 'poor', label: '🐌 Roda com dificuldade', color: 'orange' };
    return { level: 'unplayable', label: '❌ Não roda', color: 'red' };
  }

  getRecommendation(score, gpuScore, cpuScore) {
    if (score >= 85) {
      return 'Jogue com configurações altas/máximas!';
    }

    if (score >= 70) {
      return 'Jogue com configurações médias/altas';
    }

    if (score >= 55) {
      const mainBottleneck = gpuScore.score < cpuScore.score ? 'GPU' : 'CPU';
      return `${mainBottleneck} é o gargalo. Jogue com configurações médias/baixas.`;
    }

    if (score >= 40) {
      if (gpuScore.ratio < 0.5) {
        return 'GPU muito fraca. Jogue com configurações mínimas e baixa resolução.';
      }
      return 'Jogue com configurações mínimas. Espere quedas de FPS.';
    }

    return 'Hardware insuficiente. Considere upgrade ou não compre o jogo.';
  }
}