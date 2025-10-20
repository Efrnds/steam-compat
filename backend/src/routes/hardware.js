import express from 'express';
import { HardwareDetector } from '../services/hardwareDetector.js';

const router = express.Router();
const detector = new HardwareDetector();

// Detectar hardware automaticamente
router.get('/detect', async (req, res) => {
  try {
    console.log('🔍 Detectando hardware do sistema...');
    const hardware = await detector.detectLinuxHardware();

    if (!hardware) {
      return res.status(500).json({
        error: 'Falha ao detectar hardware',
        message: 'Não foi possível detectar o hardware automaticamente'
      });
    }

    console.log('✅ Hardware detectado:', {
      cpu: hardware.cpu.model,
      gpu: hardware.gpu.model,
      ram: `${hardware.mem.total}GB`
    });

    res.json({ success: true, hardware });
  } catch (error) {
    console.error('❌ Erro ao detectar hardware:', error);
    res.status(500).json({
      error: 'Erro ao detectar hardware',
      message: error.message
    });
  }
});

// Validar hardware manual
router.post('/validate', (req, res) => {
  try {
    const { cpu, gpu, ram } = req.body;

    if (!cpu?.model || !gpu?.model || !ram?.total) {
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'CPU, GPU e RAM são obrigatórios'
      });
    }

    // Validações básicas
    if (ram.total < 1 || ram.total > 256) {
      return res.status(400).json({
        error: 'RAM inválida',
        message: 'RAM deve estar entre 1GB e 256GB'
      });
    }

    res.json({ success: true, message: 'Hardware válido' });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao validar hardware',
      message: error.message
    });
  }
});

// Obter informações do sistema
router.get('/system-info', async (req, res) => {
  try {
    const hardware = await detector.detectLinuxHardware();

    res.json({
      success: true,
      system: {
        os: hardware.os,
        cpu: {
          model: hardware.cpu.model,
          cores: hardware.cpu.cores,
          speed: hardware.cpu.speed
        },
        gpu: {
          model: hardware.gpu.model,
          vram: hardware.gpu.vram,
          driver: hardware.gpu.driver
        },
        memory: {
          total: hardware.mem.total,
          free: hardware.mem.free,
          used: hardware.mem.used
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao obter informações do sistema',
      message: error.message
    });
  }
});

export default router;