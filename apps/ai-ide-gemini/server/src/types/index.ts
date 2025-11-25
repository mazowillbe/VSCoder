export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: string;
  status: 'success' | 'error';
}

export interface OperationLog {
  id: string;
  type: 'file_write' | 'file_read' | 'file_list' | 'command_execute' | 'error';
  timestamp: number;
  details: {
    path?: string;
    command?: string;
    exitCode?: number | null;
    output?: string;
    error?: string;
    filesWritten?: string[];
  };
}

export interface ChatRequest {
  message: string;
  webcontainerContext?: {
    openFiles?: string[];
    recentTerminalOutput?: string;
    currentPath?: string;
  };
}

export interface ChatResponse {
  reply: string;
  operationLogs?: OperationLog[];
  toolCalls?: ToolCall[];
  filesModified?: string[];
}

export interface ErrorResponse {
  message: string;
  stack?: string;
}
