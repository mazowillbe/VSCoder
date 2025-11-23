import { Router } from 'express';
import { FileService } from '../services/fileService.js';

export const fileRouter = Router();
const fileService = new FileService();

fileRouter.get('/list', async (_req, res, next) => {
  try {
    const files = await fileService.listFiles();
    res.json({ files });
  } catch (error) {
    next(error);
  }
});

fileRouter.get('/', async (req, res, next) => {
  try {
    const path = req.query.path as string;
    if (!path) {
      res.status(400).json({ error: 'Path parameter is required' });
      return;
    }
    
    const content = await fileService.readFile(path);
    res.json({ path, content });
  } catch (error) {
    next(error);
  }
});

fileRouter.post('/', async (req, res, next) => {
  try {
    const { path, content } = req.body;
    
    if (!path || content === undefined) {
      res.status(400).json({ error: 'Path and content are required' });
      return;
    }
    
    await fileService.writeFile(path, content);
    res.json({ success: true, path });
  } catch (error) {
    next(error);
  }
});
