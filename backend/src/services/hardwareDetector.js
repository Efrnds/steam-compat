import si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class HardwareDetector {
  async detectLinuxHardware() {
    try {
      const [cpu, gpu, mem] = await Promise.all([
        this.detectCPU(),
        this.detectGPU(),
        this.detectRAM()
      ]);

      return {
        cpu,
        gpu,
        mem,
        os: await this.detectOS()
      };
    } catch (error) {
      console.error('❌ Erro ao detectar hardware:', error);
      return null;
    }
  }

  async detectCPU() {
    try {
      const cpu = await si.cpu();
      return {
        brand: cpu.brand,
        model: `${cpu.manufacturer} ${cpu.brand}`,
        cores: cpu.cores,
        speed: cpu.speed,
        cache: cpu.cache
      };
    } catch (error) {
      // Fallback para lscpu
      try {
        const { stdout } = await execAsync('lscpu');
        const modelLine = stdout.split('\n').find(line => line.includes('Model name'));
        const model = modelLine ? modelLine.split(':')[1].trim() : 'Desconhecido';
        return { model };
      } catch {
        return { model: 'Desconhecido' };
      }
    }
  }

  async detectGPU() {
    try {
      const graphics = await si.graphics();
      const mainGPU = graphics.controllers[0];

      return {
        vendor: mainGPU.vendor,
        model: mainGPU.model,
        vram: mainGPU.vram,
        driver: mainGPU.driverVersion
      };
    } catch (error) {
      // Fallback para lspci
      try {
        const { stdout } = await execAsync('lspci | grep -i vga');
        const gpuLine = stdout.split('\n')[0];
        const model = gpuLine ? gpuLine.split(':').pop().trim() : 'Desconhecido';
        return { model };
      } catch {
        return { model: 'Desconhecido' };
      }
    }
  }

  async detectRAM() {
    try {
      const mem = await si.mem();
      return {
        total: Math.round(mem.total / 1024 / 1024 / 1024), // GB
        used: Math.round(mem.used / 1024 / 1024 / 1024),
        free: Math.round(mem.free / 1024 / 1024 / 1024)
      };
    } catch (error) {
      // Fallback para free
      try {
        const { stdout } = await execAsync('free -g');
        const lines = stdout.split('\n');
        const memLine = lines[1].split(/\s+/);
        return { total: parseInt(memLine[1]) };
      } catch {
        return { total: 8 }; // Default
      }
    }
  }

  async detectOS() {
    try {
      const osInfo = await si.osInfo();
      return {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        kernel: osInfo.kernel
      };
    } catch {
      return {
        platform: 'linux',
        distro: 'Desconhecido'
      };
    }
  }
}