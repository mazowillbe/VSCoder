import { create } from 'zustand';
import { api } from '../utils/api';

interface OperationLog {
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  operationLogs?: OperationLog[];
  filesModified?: string[];
}

interface WebContainerContext {
  openFiles?: string[];
  recentTerminalOutput?: string;
  currentPath?: string;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, webcontainerContext?: WebContainerContext) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  
  sendMessage: async (content: string, webcontainerContext?: WebContainerContext) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    set({ messages: [...get().messages, userMessage], isLoading: true });
    
    try {
      const response = await api.post('/chat', {
        message: content,
        webcontainerContext,
      });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.reply,
        timestamp: Date.now(),
        operationLogs: response.data.operationLogs,
        filesModified: response.data.filesModified,
      };
      
      set({ messages: [...get().messages, assistantMessage], isLoading: false });
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: Date.now(),
      };
      
      set({ messages: [...get().messages, errorMessage], isLoading: false });
    }
  },
  
  clearMessages: () => {
    set({ messages: [] });
  },
}));
