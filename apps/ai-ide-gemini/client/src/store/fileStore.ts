import { create } from 'zustand';
import { api } from '../utils/api';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

interface FileState {
  files: FileItem[];
  fetchFiles: () => Promise<void>;
}

export const useFileStore = create<FileState>((set) => ({
  files: [],
  
  fetchFiles: async () => {
    try {
      const response = await api.get('/files/list');
      set({ files: response.data.files });
    } catch (error) {
      console.error('Failed to fetch files:', error);
      set({ files: [] });
    }
  },
}));
