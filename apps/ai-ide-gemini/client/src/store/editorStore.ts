import { create } from 'zustand';
import { api } from '../utils/api';

interface EditorState {
  currentFile: string | null;
  content: string;
  openFile: (path: string) => Promise<void>;
  updateContent: (content: string) => void;
  saveFile: () => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentFile: null,
  content: '',
  
  openFile: async (path: string) => {
    try {
      const response = await api.get(`/files?path=${encodeURIComponent(path)}`);
      set({ currentFile: path, content: response.data.content });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  },
  
  updateContent: (content: string) => {
    set({ content });
  },
  
  saveFile: async () => {
    const { currentFile, content } = get();
    if (!currentFile) return;
    
    try {
      await api.post('/files', { path: currentFile, content });
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  },
}));
