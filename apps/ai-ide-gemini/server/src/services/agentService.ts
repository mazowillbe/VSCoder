import { FileService } from './fileService.js';
import { OperationLog, ToolCall, ToolResult } from '../types/index.js';

interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

export class AgentService {
  private fileService: FileService;
  private operationLogs: OperationLog[] = [];
  private filesWritten: Set<string> = new Set();

  constructor() {
    this.fileService = new FileService();
  }

  getToolSchemas(): FunctionDeclaration[] {
    return [
      {
        name: 'write_file',
        description: 'Write content to a file in the WebContainer filesystem. This syncs the file to both backend storage and WebContainer.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The file path relative to the workspace root',
            },
            content: {
              type: 'string',
              description: 'The file content to write',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'read_file',
        description: 'Read content from a file in the WebContainer filesystem',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The file path relative to the workspace root',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'list_files',
        description: 'List files and directories in the WebContainer project structure',
        parameters: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'The directory path to list (defaults to workspace root)',
            },
          },
          required: [],
        },
      },
      {
        name: 'execute_terminal_command',
        description: 'Execute a command inside the WebContainer sandbox',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The command to execute (e.g., "npm install", "node app.js")',
            },
          },
          required: ['command'],
        },
      },
    ];
  }

  async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const { id, name, args } = toolCall;
    const logId = Math.random().toString(36).substring(2, 15);

    try {
      let result: string;
      const filesModified: string[] = [];

      switch (name) {
        case 'write_file': {
          const { path, content } = args as { path: string; content: string };
          if (!path || content === undefined) {
            throw new Error('path and content are required');
          }
          await this.fileService.writeFile(path, content);
          this.filesWritten.add(path);
          filesModified.push(path);
          result = `File written successfully: ${path}`;

          this.operationLogs.push({
            id: logId,
            type: 'file_write',
            timestamp: Date.now(),
            details: {
              path,
              filesWritten: [path],
            },
          });
          break;
        }

        case 'read_file': {
          const { path } = args as { path: string };
          if (!path) {
            throw new Error('path is required');
          }
          const content = await this.fileService.readFile(path);
          result = content;

          this.operationLogs.push({
            id: logId,
            type: 'file_read',
            timestamp: Date.now(),
            details: { path },
          });
          break;
        }

        case 'list_files': {
          const { directory = '.' } = args as { directory?: string };
          const files = await this.fileService.listFiles(directory);
          result = JSON.stringify(files, null, 2);

          this.operationLogs.push({
            id: logId,
            type: 'file_list',
            timestamp: Date.now(),
            details: { path: directory },
          });
          break;
        }

        case 'execute_terminal_command': {
          const { command } = args as { command: string };
          if (!command) {
            throw new Error('command is required');
          }
          // Note: In a real implementation, this would execute in WebContainer
          // For now, we return a placeholder that the frontend will execute
          result = `Command queued for execution: ${command}`;

          this.operationLogs.push({
            id: logId,
            type: 'command_execute',
            timestamp: Date.now(),
            details: {
              command,
              output: result,
              exitCode: null,
            },
          });
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        toolCallId: id,
        name,
        result,
        status: 'success',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.operationLogs.push({
        id: logId,
        type: 'error',
        timestamp: Date.now(),
        details: {
          error: errorMessage,
        },
      });

      return {
        toolCallId: id,
        name,
        result: errorMessage,
        status: 'error',
      };
    }
  }

  getOperationLogs(): OperationLog[] {
    return [...this.operationLogs];
  }

  getFilesWritten(): string[] {
    return Array.from(this.filesWritten);
  }

  clearLogs(): void {
    this.operationLogs = [];
    this.filesWritten.clear();
  }
}
