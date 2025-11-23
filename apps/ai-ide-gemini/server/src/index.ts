import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fileRouter } from './routes/files.js';
import { chatRouter } from './routes/chat.js';
import { webcontainerRouter } from './routes/webcontainer.js';
import { previewRouter } from './routes/preview.js';
import { errorHandler } from './middleware/errorHandler.js';
import { validateEnv } from './utils/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/files', fileRouter);
app.use('/api/chat', chatRouter);
app.use('/api/webcontainer', webcontainerRouter);
app.use('/api/preview', previewRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Workspace: ${process.env.WORKSPACE_PATH || 'Not configured'}`);
  console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
});
