import { Router } from 'express';
import { GeminiService } from '../services/geminiService.js';

export const chatRouter = Router();
let geminiService: GeminiService | null = null;

function getGeminiService(): GeminiService {
  if (!geminiService) {
    geminiService = new GeminiService();
  }
  return geminiService;
}

chatRouter.post('/', async (req, res, next) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    
    const reply = await getGeminiService().chat(message);
    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

chatRouter.delete('/history', async (_req, res, next) => {
  try {
    getGeminiService().clearHistory();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
