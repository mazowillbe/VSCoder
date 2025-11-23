import { create } from 'zustand';

interface TerminalEntry {
  id: string;
  command: string;
  output: string;
  error: string;
  exitCode: number | null;
  timestamp: number;
}

interface PreviewURL {
  url: string;
  displayUrl: string;
  port: number;
}

interface WebContainerState {
  isReady: boolean;
  error: string | null;
  terminalHistory: TerminalEntry[];
  previewURLs: PreviewURL[];
  currentOutput: string;

  setReady: (ready: boolean) => void;
  setError: (error: string | null) => void;
  addTerminalEntry: (entry: TerminalEntry) => void;
  clearTerminalHistory: () => void;
  addPreviewURL: (url: PreviewURL) => void;
  removePreviewURL: (port: number) => void;
  setCurrentOutput: (output: string) => void;
  appendToCurrentOutput: (output: string) => void;
}

export const useWebContainerStore = create<WebContainerState>((set, get) => ({
  isReady: false,
  error: null,
  terminalHistory: [],
  previewURLs: [],
  currentOutput: '',

  setReady: (ready: boolean) => {
    set({ isReady: ready });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  addTerminalEntry: (entry: TerminalEntry) => {
    set((state) => ({
      terminalHistory: [...state.terminalHistory, entry],
    }));
  },

  clearTerminalHistory: () => {
    set({ terminalHistory: [] });
  },

  addPreviewURL: (url: PreviewURL) => {
    set((state) => {
      // Avoid duplicates
      if (state.previewURLs.some((u) => u.port === url.port)) {
        return state;
      }
      return {
        previewURLs: [...state.previewURLs, url],
      };
    });
  },

  removePreviewURL: (port: number) => {
    set((state) => ({
      previewURLs: state.previewURLs.filter((u) => u.port !== port),
    }));
  },

  setCurrentOutput: (output: string) => {
    set({ currentOutput: output });
  },

  appendToCurrentOutput: (output: string) => {
    const current = get().currentOutput;
    set({ currentOutput: current + output });
  },
}));
