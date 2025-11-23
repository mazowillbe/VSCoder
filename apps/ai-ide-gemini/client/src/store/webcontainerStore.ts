import { create } from 'zustand';

interface TerminalEntry {
  id: string;
  command: string;
  output: string;
  error: string;
  exitCode: number | null;
  timestamp: number;
}

interface WebContainerState {
  isReady: boolean;
  error: string | null;
  terminalHistory: TerminalEntry[];
  currentOutput: string;

  setReady: (ready: boolean) => void;
  setError: (error: string | null) => void;
  addTerminalEntry: (entry: TerminalEntry) => void;
  clearTerminalHistory: () => void;
  setCurrentOutput: (output: string) => void;
  appendToCurrentOutput: (output: string) => void;
}

export const useWebContainerStore = create<WebContainerState>((set, get) => ({
  isReady: false,
  error: null,
  terminalHistory: [],
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

  setCurrentOutput: (output: string) => {
    set({ currentOutput: output });
  },

  appendToCurrentOutput: (output: string) => {
    const current = get().currentOutput;
    set({ currentOutput: current + output });
  },
}));
