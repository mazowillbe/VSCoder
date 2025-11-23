import { create } from 'zustand';
import { api } from '../utils/api';

interface PreviewUrl {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  isActive: boolean;
}

interface PreviewState {
  previewUrls: PreviewUrl[];
  activePreviewUrl: PreviewUrl | null;
  isModalOpen: boolean;
  isLoading: boolean;
  
  // Actions
  addPreviewUrl: (url: string, title?: string) => Promise<void>;
  setActivePreviewUrl: (id: string) => void;
  removePreviewUrl: (id: string) => void;
  openModal: () => void;
  closeModal: () => void;
  clearPreviewUrls: () => void;
  loadPreviewUrls: () => Promise<void>;
}

export const usePreviewStore = create<PreviewState>((set, get) => ({
  previewUrls: [],
  activePreviewUrl: null,
  isModalOpen: false,
  isLoading: false,

  addPreviewUrl: async (url: string, title?: string) => {
    try {
      set({ isLoading: true });
      
      // Check if URL already exists
      const existingUrl = get().previewUrls.find(p => p.url === url);
      if (existingUrl) {
        // Activate existing URL
        get().setActivePreviewUrl(existingUrl.id);
        get().openModal();
        return;
      }

      const newPreviewUrl: PreviewUrl = {
        id: Date.now().toString(),
        url,
        title: title || extractTitleFromUrl(url),
        timestamp: Date.now(),
        isActive: true
      };

      // Send to backend
      await api.post('/preview', {
        url,
        title: newPreviewUrl.title,
        timestamp: newPreviewUrl.timestamp
      });

      set(state => ({
        previewUrls: [...state.previewUrls.map(p => ({ ...p, isActive: false })), newPreviewUrl],
        activePreviewUrl: newPreviewUrl,
        isLoading: false
      }));

      // Open modal automatically
      get().openModal();
    } catch (error) {
      console.error('Failed to add preview URL:', error);
      set({ isLoading: false });
    }
  },

  setActivePreviewUrl: (id: string) => {
    const previewUrl = get().previewUrls.find(p => p.id === id);
    if (previewUrl) {
      set(state => ({
        previewUrls: state.previewUrls.map(p => ({ 
          ...p, 
          isActive: p.id === id 
        })),
        activePreviewUrl: previewUrl
      }));
    }
  },

  removePreviewUrl: (id: string) => {
    const newActivePreview = get().previewUrls.find(p => p.id !== id && p.isActive);
    set(state => ({
      previewUrls: state.previewUrls.filter(p => p.id !== id),
      activePreviewUrl: newActivePreview || null
    }));
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  clearPreviewUrls: () => set({ 
    previewUrls: [], 
    activePreviewUrl: null 
  }),

  loadPreviewUrls: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/preview');
      const previewUrls: PreviewUrl[] = response.data.previewUrls || [];
      const activePreview = previewUrls.find(p => p.isActive) || null;
      
      set({ 
        previewUrls, 
        activePreviewUrl: activePreview,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load preview URLs:', error);
      set({ isLoading: false });
    }
  }
}));

// Helper function to extract title from URL
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const port = urlObj.port;
    const pathname = urlObj.pathname;
    
    let title = hostname;
    if (port && port !== '80' && port !== '443') {
      title += `:${port}`;
    }
    
    if (pathname && pathname !== '/') {
      title += pathname;
    }
    
    return title;
  } catch {
    return url;
  }
}

// Helper function to detect dev server URLs in text
export function detectDevServerUrls(text: string): string[] {
  const urlPatterns = [
    // localhost URLs with various ports
    /https?:\/\/localhost:\d+(\/[^\s]*)?/gi,
    // 127.0.0.1 URLs with various ports  
    /https?:\/\/127\.0\.0\.1:\d+(\/[^\s]*)?/gi,
    // 0.0.0.0 URLs with various ports
    /https?:\/\/0\.0\.0\.0:\d+(\/[^\s]*)?/gi,
    // Common dev server patterns
    /https?:\/\/[a-zA-Z0-9.-]+\.local:\d+(\/[^\s]*)?/gi,
    // IP addresses with ports
    /https?:\/\/\d+\.\d+\.\d+\.\d+:\d+(\/[^\s]*)?/gi
  ];

  const urls: string[] = [];
  const seenUrls = new Set<string>();

  for (const pattern of urlPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleanUrl = match.trim();
        if (!seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          urls.push(cleanUrl);
        }
      }
    }
  }

  return urls;
}
