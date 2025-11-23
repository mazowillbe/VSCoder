import { Router } from 'express';

const router = Router();

// In-memory storage for WebContainer sessions
const sessions = new Map<string, {
  id: string;
  status: 'initializing' | 'ready' | 'error';
  error?: string;
  createdAt: number;
}>();

// POST /api/webcontainer/session - Initialize or get WebContainer session
router.post('/session', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    let session = sessions.get(sessionId || 'default');
    
    if (!session) {
      // Create new session
      const newSessionId = sessionId || `session_${Date.now()}`;
      session = {
        id: newSessionId,
        status: 'initializing',
        createdAt: Date.now()
      };
      
      sessions.set(newSessionId, session);
      
      // Simulate initialization
      setTimeout(() => {
        const existingSession = sessions.get(newSessionId);
        if (existingSession) {
          existingSession.status = 'ready';
        }
      }, 2000);
    }
    
    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        error: session.error,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Error managing WebContainer session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/webcontainer/session/:sessionId - Get session info
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        error: session.error,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting WebContainer session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/webcontainer/execute - Execute command in WebContainer
router.post('/execute', (req, res) => {
  try {
    const { sessionId, command } = req.body;
    
    if (!sessionId || !command) {
      return res.status(400).json({ error: 'Session ID and command are required' });
    }
    
    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'ready') {
      return res.status(400).json({ error: 'WebContainer not ready' });
    }
    
    // Simulate command execution
    const output = simulateCommandExecution(command);
    const exitCode = output.includes('Error') ? 1 : 0;
    
    res.json({
      success: true,
      output,
      exitCode,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/webcontainer/session/:sessionId - Clean up session
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    sessions.delete(sessionId);
    
    res.json({
      success: true,
      message: 'Session cleaned up successfully'
    });
  } catch (error) {
    console.error('Error cleaning up WebContainer session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to simulate command execution
function simulateCommandExecution(command: string): string {
  const lowerCommand = command.toLowerCase();
  
  if (lowerCommand.includes('npm run dev') || lowerCommand.includes('yarn dev')) {
    return `
Starting development server...
✓ Server running on http://localhost:3000
✓ Server running on http://localhost:5173
Ready! Open your browser to http://localhost:3000
    `.trim();
  }
  
  if (lowerCommand.includes('npm start') || lowerCommand.includes('yarn start')) {
    return `
Starting production server...
✓ Server running on http://localhost:8080
Ready! Open your browser to http://localhost:8080
    `.trim();
  }
  
  if (lowerCommand.includes('ls') || lowerCommand.includes('dir')) {
    return `
file1.txt
file2.js
folder/
    `.trim();
  }
  
  return `Command executed: ${command}`;
}

export { router as webcontainerRouter };
