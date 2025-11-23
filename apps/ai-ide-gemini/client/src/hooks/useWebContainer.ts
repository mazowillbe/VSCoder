import { useEffect, useRef, useState, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
import { api } from '../utils/api';

interface WebContainerInstance {
  isReady: boolean;
  error: string | null;
}

interface CommandOutput {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export function useWebContainer() {
  const [instance, setInstance] = useState<WebContainerInstance>({
    isReady: false,
    error: null,
  });

  const webContainerRef = useRef<WebContainer | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeWebContainer = async () => {
      try {
        const wc = await WebContainer.boot();
        if (!mounted) return;

        webContainerRef.current = wc;

        // Fetch file tree from backend and mount into WebContainer
        try {
          const response = await api.get('/files/list');
          const files = response.data.files;

          // Create directory structure and mount files
          await mountFiles(wc, files);
        } catch (error) {
          console.warn('Could not mount files from backend:', error);
          // Continue even if file mounting fails
        }

        setInstance({ isReady: true, error: null });
      } catch (error) {
        if (mounted) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          setInstance({ isReady: false, error: errorMessage });
          console.error('WebContainer initialization failed:', error);
        }
      }
    };

    initializeWebContainer();

    return () => {
      mounted = false;
    };
  }, []);

  const mountFiles = async (
    wc: WebContainer,
    files: Array<{ path: string; type: 'file' | 'directory' }>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileStructure: Record<string, any> = {};

    for (const file of files) {
      if (file.type === 'directory') {
        fileStructure[file.path] = { directory: {} };
      } else if (file.type === 'file') {
        try {
          const response = await api.get(
            `/files?path=${encodeURIComponent(file.path)}`
          );
          fileStructure[file.path] = {
            file: { contents: response.data.content },
          };
        } catch (error) {
          console.warn(`Could not read file ${file.path}:`, error);
        }
      }
    }

    // Mount the file structure to WebContainer
    if (Object.keys(fileStructure).length > 0) {
      await wc.mount(fileStructure);
    }
  };

  const runCommand = useCallback(
    async (command: string): Promise<CommandOutput> => {
      if (!webContainerRef.current) {
        return {
          stdout: '',
          stderr: 'WebContainer not initialized',
          exitCode: -1,
        };
      }

      const [cmd, ...args] = command.split(' ');
      let stdout = '';
      let stderr = '';
      let exitCode: number | null = null;

      try {
        const process = await webContainerRef.current.spawn(cmd, args);

        // WebContainer process has a single output stream that combines stdout and stderr
        const reader = process.output.getReader();
        const decoder = new TextDecoder();

        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Value can be Uint8Array or string depending on WebContainer version
            const text = typeof value === 'string' ? value : decoder.decode(value as Uint8Array, { stream: true });
            stdout += text;
          }
        } finally {
          reader.releaseLock();
        }

        exitCode = await process.exit;
      } catch (error) {
        stderr = error instanceof Error ? error.message : 'Unknown error';
        exitCode = -1;
      }

      return { stdout, stderr, exitCode };
    },
    []
  );

  const writeFile = useCallback(
    async (path: string, content: string) => {
      if (!webContainerRef.current) {
        throw new Error('WebContainer not initialized');
      }

      await webContainerRef.current.fs.writeFile(path, content);
    },
    []
  );

  const readFile = useCallback(
    async (path: string): Promise<string> => {
      if (!webContainerRef.current) {
        throw new Error('WebContainer not initialized');
      }

      return await webContainerRef.current.fs.readFile(path, 'utf-8');
    },
    []
  );

  const subscribeToStdout = useCallback(() => {
    // This is a helper for streaming commands
    // Actual implementation depends on how we structure command execution
    return () => {
      // Cleanup function
    };
  }, []);

  return {
    isReady: instance.isReady,
    error: instance.error,
    runCommand,
    writeFile,
    readFile,
    subscribeToStdout,
    webContainer: webContainerRef.current,
  };
}
