export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface EditorTab {
  path: string;
  content: string;
  isDirty: boolean;
  language?: string;
}

export interface WorkspaceConfig {
  rootPath: string;
  name: string;
}
