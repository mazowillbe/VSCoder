import { Router, Request, Response, NextFunction } from 'express';

interface WebContainerSession {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  projectPath: string;
  status: 'active' | 'inactive' | 'error';
  error?: string;
}

interface FileSyncEvent {
  path: string;
  content: string;
  action: 'write' | 'delete' | 'create';
  timestamp: number;
}

export const webcontainerRouter = Router();

// In-memory store for session metadata
const sessions = new Map<string, WebContainerSession>();

/**
 * POST /api/webcontainer/session
 * Initialize or get a WebContainer session
 */
webcontainerRouter.post(
  '/session',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const projectPath = _req.body.projectPath || process.cwd();
      const sessionId = _req.body.sessionId || generateSessionId();

      // Check if session exists
      let session = sessions.get(sessionId);

      if (!session) {
        session = {
          id: sessionId,
          createdAt: new Date(),
          lastActivity: new Date(),
          projectPath,
          status: 'active',
        };
        sessions.set(sessionId, session);
      } else {
        // Update last activity
        session.lastActivity = new Date();
      }

      res.json({
        sessionId: session.id,
        status: session.status,
        createdAt: session.createdAt,
        projectPath: session.projectPath,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/webcontainer/session/:sessionId
 * Get session metadata
 */
webcontainerRouter.get(
  '/session/:sessionId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = sessions.get(sessionId);

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.json({
        sessionId: session.id,
        status: session.status,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        projectPath: session.projectPath,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/webcontainer/filesync
 * Handle client-initiated file sync events
 * This endpoint receives file changes from the WebContainer
 * and can be used to sync back to the server if needed
 */
webcontainerRouter.post(
  '/filesync',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, events } = req.body as {
        sessionId: string;
        events: FileSyncEvent[];
      };

      if (!sessionId || !events) {
        res
          .status(400)
          .json({ error: 'sessionId and events are required' });
        return;
      }

      const session = sessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Update last activity
      session.lastActivity = new Date();

      // Process sync events
      // In a real implementation, you might:
      // - Save these changes to persistent storage
      // - Broadcast changes to other clients
      // - Trigger rebuilds or other side effects

      console.log(
        `[WebContainer] Sync event from session ${sessionId}:`,
        events.length,
        'file(s)'
      );

      res.json({
        success: true,
        sessionId,
        processedCount: events.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/webcontainer/session/:sessionId
 * Clean up a WebContainer session
 */
webcontainerRouter.delete(
  '/session/:sessionId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = sessions.get(sessionId);

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      sessions.delete(sessionId);

      res.json({
        success: true,
        message: `Session ${sessionId} cleaned up`,
      });
    } catch (error) {
      next(error);
    }
  }
);

function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substring(2, 15);
}
