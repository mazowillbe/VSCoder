import { useEffect, useState } from 'react';
import { usePreviewStore, detectDevServerUrls } from '../store/previewStore';

interface WebContainerState {
  isReady: boolean;
  error: string | null;
  runCommand: (command: string) => Promise<{ output: string; exitCode: number }>;
}

export function useWebContainer(): WebContainerState {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addPreviewUrl } = usePreviewStore();

  useEffect(() => {
    // Simulate WebContainer initialization
    const initWebContainer = async () => {
      try {
        // Simulate initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsReady(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize WebContainer');
        setIsReady(false);
      }
    };

    initWebContainer();
  }, []);

  const runCommand = async (command: string): Promise<{ output: string; exitCode: number }> => {
    if (!isReady) {
      return { output: 'WebContainer not ready', exitCode: 1 };
    }

    try {
      console.log(`Executing command: ${command}`);
      
      // Simulate command execution
      const simulatedOutput = await simulateCommandOutput(command);
      
      // Detect and add preview URLs from output
      const urls = detectDevServerUrls(simulatedOutput);
      urls.forEach(url => {
        addPreviewUrl(url, `Dev Server: ${new URL(url).host}`);
      });

      return { 
        output: simulatedOutput, 
        exitCode: 0 
      };
    } catch (err) {
      return { 
        output: err instanceof Error ? err.message : 'Command execution failed', 
        exitCode: 1 
      };
    }
  };

  return {
    isReady,
    error,
    runCommand
  };
}

// Helper function to simulate command output
async function simulateCommandOutput(command: string): Promise<string> {
  // Simulate different command outputs
  if (command.includes('npm run dev') || command.includes('yarn dev')) {
    return `
Starting development server...
✓ Server running on http://localhost:3000
✓ Server running on http://localhost:5173
Ready! Open your browser to http://localhost:3000
    `.trim();
  }
  
  if (command.includes('npm start') || command.includes('yarn start')) {
    return `
Starting production server...
✓ Server running on http://localhost:8080
Ready! Open your browser to http://localhost:8080
    `.trim();
  }

  return `Command executed: ${command}`;
}
