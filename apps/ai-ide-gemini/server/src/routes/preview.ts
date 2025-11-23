import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory storage for preview URLs
const previewStore = new Map<string, {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  isActive: boolean;
  projectId?: string;
}>();

// POST /api/preview - Add or update a preview URL
router.post('/', (req, res) => {
  try {
    const { url, title, timestamp, projectId } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Deactivate all existing URLs for this project
    for (const [, preview] of previewStore.entries()) {
      if (preview.projectId === projectId) {
        preview.isActive = false;
      }
    }

    const newPreview = {
      id: uuidv4(),
      url,
      title: title || extractTitleFromUrl(url),
      timestamp: timestamp || Date.now(),
      isActive: true,
      projectId: projectId || 'default'
    };

    previewStore.set(newPreview.id, newPreview);

    return res.status(201).json({
      success: true,
      preview: newPreview
    });
  } catch (error) {
    console.error('Error adding preview URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/preview - Get all preview URLs
router.get('/', (req, res) => {
  try {
    const { projectId } = req.query;
    
    const previews = Array.from(previewStore.values());
    
    if (projectId) {
      previews = previews.filter(p => p.projectId === projectId);
    }

    // Sort by timestamp (most recent first) and then by active status
    previews.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return b.timestamp - a.timestamp;
    });

    res.json({
      success: true,
      previewUrls: previews,
      count: previews.length
    });
  } catch (error) {
    console.error('Error fetching preview URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/preview/:projectId - Get preview URLs for a specific project
router.get('/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    
    const previews = Array.from(previewStore.values())
      .filter(p => p.projectId === projectId)
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return b.timestamp - a.timestamp;
      });

    const activePreview = previews.find(p => p.isActive) || null;

    res.json({
      success: true,
      projectId,
      previewUrls: previews,
      activePreview,
      count: previews.length
    });
  } catch (error) {
    console.error('Error fetching preview URLs for project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/preview/:id/activate - Activate a specific preview URL
router.put('/:id/activate', (req, res) => {
  try {
    const { id } = req.params;
    
    const preview = previewStore.get(id);
    if (!preview) {
      return res.status(404).json({ error: 'Preview URL not found' });
    }

    // Deactivate all other URLs for this project
    for (const [, p] of previewStore.entries()) {
      if (p.projectId === preview.projectId) {
        p.isActive = false;
      }
    }

    // Activate the requested preview
    preview.isActive = true;

    res.json({
      success: true,
      preview
    });
  } catch (error) {
    console.error('Error activating preview URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/preview/:id - Remove a preview URL
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const preview = previewStore.get(id);
    if (!preview) {
      return res.status(404).json({ error: 'Preview URL not found' });
    }

    previewStore.delete(id);

    // If this was the active preview, activate another one if available
    const remainingPreviews = Array.from(previewStore.values())
      .filter(p => p.projectId === preview.projectId);
      
      if (remainingPreviews.length > 0) {
        // Activate the most recent remaining preview
        const nextActive = remainingPreviews.sort((a, b) => b.timestamp - a.timestamp)[0];
        nextActive.isActive = true;
      }
    }

    res.json({
      success: true,
      message: 'Preview URL removed successfully'
    });
  } catch (error) {
    console.error('Error removing preview URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/preview - Clear all preview URLs (optionally for a specific project)
router.delete('/', (req, res) => {
  try {
    const { projectId } = req.query;
    
    if (projectId) {
      // Clear only for specific project
      for (const [id, preview] of previewStore.entries()) {
        if (preview.projectId === projectId) {
          previewStore.delete(id);
        }
      }
    } else {
      // Clear all
      previewStore.clear();
    }

    res.json({
      success: true,
      message: projectId 
        ? `Preview URLs cleared for project ${projectId}`
        : 'All preview URLs cleared'
    });
  } catch (error) {
    console.error('Error clearing preview URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

export { router as previewRouter };
