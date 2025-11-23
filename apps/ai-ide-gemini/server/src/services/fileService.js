"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class FileService {
    constructor() {
        this.workspacePath = process.env.WORKSPACE_PATH || process.cwd();
    }
    resolvePath(filePath) {
        const resolved = path_1.default.resolve(this.workspacePath, filePath);
        if (!resolved.startsWith(this.workspacePath)) {
            throw new Error('Access denied: Path outside workspace');
        }
        return resolved;
    }
    async listFiles(dirPath = '.') {
        const fullPath = this.resolvePath(dirPath);
        const entries = await fs_1.promises.readdir(fullPath, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            if (entry.name.startsWith('.'))
                continue;
            const entryPath = path_1.default.join(dirPath, entry.name);
            const fullEntryPath = this.resolvePath(entryPath);
            const stats = await fs_1.promises.stat(fullEntryPath);
            files.push({
                name: entry.name,
                path: entryPath,
                type: entry.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime.toISOString(),
            });
        }
        return files.sort((a, b) => {
            if (a.type === b.type)
                return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
        });
    }
    async readFile(filePath) {
        const fullPath = this.resolvePath(filePath);
        return await fs_1.promises.readFile(fullPath, 'utf-8');
    }
    async writeFile(filePath, content) {
        const fullPath = this.resolvePath(filePath);
        const dir = path_1.default.dirname(fullPath);
        await fs_1.promises.mkdir(dir, { recursive: true });
        await fs_1.promises.writeFile(fullPath, content, 'utf-8');
    }
    async deleteFile(filePath) {
        const fullPath = this.resolvePath(filePath);
        await fs_1.promises.unlink(fullPath);
    }
    async createDirectory(dirPath) {
        const fullPath = this.resolvePath(dirPath);
        await fs_1.promises.mkdir(fullPath, { recursive: true });
    }
}
exports.FileService = FileService;
//# sourceMappingURL=fileService.js.map