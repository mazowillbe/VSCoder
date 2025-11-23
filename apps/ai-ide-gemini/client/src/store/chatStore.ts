import { create } from 'zustand';
import { api } from '../utils/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  
  sendMessage: async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    set({ messages: [...get().messages, userMessage], isLoading: true });
    
    try {
      const response = await api.post('/chat', { message: content });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.reply,
        timestamp: Date.now(),
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
