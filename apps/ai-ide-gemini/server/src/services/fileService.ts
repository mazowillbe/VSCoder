import { promises as fs } from 'fs';
import path from 'path';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

export class FileService {
  private workspacePath: string;

  constructor() {
    this.workspacePath = process.env.WORKSPACE_PATH || process.cwd();
  }

  private resolvePath(filePath: string): string {
    const resolved = path.resolve(this.workspacePath, filePath);
    
    if (!resolved.startsWith(this.workspacePath)) {
      throw new Error('Access denied: Path outside workspace');
    }
    
    return resolved;
  }

  async listFiles(dirPath: string = '.'): Promise<FileItem[]> {
    const fullPath = this.resolvePath(dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const files: FileItem[] = [];
    
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      
      const entryPath = path.join(dirPath, entry.name);
      const fullEntryPath = this.resolvePath(entryPath);
      const stats = await fs.stat(fullEntryPath);
      
      files.push({
        name: entry.name,
        path: entryPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime.toISOString(),
      });
    }
    
    return files.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });
  }

  async readFile(filePath: string): Promise<string> {
    const fullPath = this.resolvePath(filePath);
    return await fs.readFile(fullPath, 'utf-8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    const dir = path.dirname(fullPath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    await fs.unlink(fullPath);
  }

  async createDirectory(dirPath: string): Promise<void> {
    const fullPath = this.resolvePath(dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }
}
