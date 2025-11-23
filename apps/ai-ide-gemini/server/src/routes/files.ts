import { Router } from 'express';
import { FileService } from '../services/fileService.js';

export const fileRouter = Router();
const fileService = new FileService();

interface FileSyncEvent {
  type: 'file-written' | 'file-deleted';
  path: string;
  timestamp: number;
}

// Store for WebContainer sync callbacks
const syncCallbacks: Set<(event: FileSyncEvent) => void> = new Set();

export function onFileSync(callback: (event: FileSyncEvent) => void) {
  syncCallbacks.add(callback);
  return () => syncCallbacks.delete(callback);
}

function notifySync(event: FileSyncEvent) {
  syncCallbacks.forEach((callback) => callback(event));
}

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

    // Notify WebContainer about file write
    notifySync({
      type: 'file-written',
      path,
      timestamp: Date.now(),
    });

    res.json({ success: true, path });
  } catch (error) {
    next(error);
  }
});

fileRouter.delete('/', async (req, res, next) => {
  try {
    const path = req.query.path as string;

    if (!path) {
      res.status(400).json({ error: 'Path parameter is required' });
      return;
    }

    await fileService.deleteFile(path);

    // Notify WebContainer about file deletion
    notifySync({
      type: 'file-deleted',
      path,
      timestamp: Date.now(),
    });

    res.json({ success: true, path });
  } catch (error) {
    next(error);
  }
});
