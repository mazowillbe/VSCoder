import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useWebContainer } from '../hooks/useWebContainer';
import { useWebContainerStore } from '../store/webcontainerStore';
import { parsePreviewURLs } from '../utils/urlParser';

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const { isReady, error, runCommand } = useWebContainer();
  const {
    addTerminalEntry,
    appendToCurrentOutput,
    addPreviewURL,
    previewURLs,
  } = useWebContainerStore();

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('Welcome to AI IDE Terminal');

    if (error) {
      term.writeln(`\x1b[31m❌ WebContainer Error: ${error}\x1b[0m`);
    } else if (isReady) {
      term.writeln('\x1b[32m✓ WebContainer Ready\x1b[0m');
    } else {
      term.writeln('Initializing WebContainer...');
    }

    term.write('\r\n$ ');

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    let commandBuffer = '';

    const handleData = async (data: string) => {
      if (data === '\r') {
        // Enter key pressed
        const command = commandBuffer.trim();
        commandBuffer = '';

        if (command.toLowerCase() === 'clear') {
          term.clear();
          term.write('$ ');
          return;
        }

        if (command && isReady && !isExecuting) {
          setIsExecuting(true);
          term.writeln('');

          const output = await runCommand(command);

          if (output.stdout) {
            term.write(output.stdout);
          }
          if (output.stderr) {
            term.write(`\x1b[31m${output.stderr}\x1b[0m`);
          }

          const combinedOutput = output.stdout + output.stderr;
          appendToCurrentOutput(combinedOutput);

          // Parse for preview URLs
          const urls = parsePreviewURLs(combinedOutput);
          urls.forEach((url) => addPreviewURL(url));

          // Add to terminal history
          addTerminalEntry({
            id: Math.random().toString(36),
            command,
            output: output.stdout,
            error: output.stderr,
            exitCode: output.exitCode,
            timestamp: Date.now(),
          });

          term.write(
            `\r\n[\x1b[36mexit code: ${output.exitCode}\x1b[0m]\r\n$ `
          );
          setIsExecuting(false);
        } else if (command) {
          term.writeln(
            '\x1b[33mCommand not ready or already executing\x1b[0m'
          );
          term.write('$ ');
        } else {
          term.write('\r\n$ ');
        }
      } else if (data === '\u007f') {
        // Backspace
        if (commandBuffer.length > 0) {
          commandBuffer = commandBuffer.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data.charCodeAt(0) >= 32) {
        // Regular character
        commandBuffer += data;
        term.write(data);
      }
    };

    if (isReady) {
      term.onData(handleData);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [isReady, error, isExecuting, runCommand, addTerminalEntry, appendToCurrentOutput, addPreviewURL]);

  return (
    <div className="h-64 bg-gray-950 border-t border-gray-700">
      <div className="bg-gray-800 px-4 py-1 border-b border-gray-700 flex justify-between items-center">
        <span className="text-sm text-gray-400">
          Terminal{' '}
          {previewURLs.length > 0 && (
            <span className="text-blue-400 ml-2">
              ({previewURLs.length} preview{previewURLs.length !== 1 ? 's' : ''})
            </span>
          )}
        </span>
      </div>
      <div ref={terminalRef} className="h-[calc(100%-33px)] p-2" />
    </div>
  );
}
