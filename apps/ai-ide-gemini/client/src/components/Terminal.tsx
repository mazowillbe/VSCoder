import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useWebContainer } from '../hooks/useWebContainer';
import { usePreviewStore, detectDevServerUrls } from '../store/previewStore';

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { isReady, runCommand } = useWebContainer();
  const { addPreviewUrl } = usePreviewStore();

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
    term.writeln('Connected to server...');
    if (isReady) {
      term.writeln('✓ WebContainer Ready');
    } else {
      term.writeln('⏳ Initializing WebContainer...');
    }
    term.write('\r\n$ ');

    // Set up command handler
    const handleCommand = async (command: string) => {
      if (!isReady) {
        term.writeln('WebContainer not ready. Please wait...');
        return;
      }

      term.write(`\r\n$ ${command}\r\n`);
      
      try {
        const result = await runCommand(command);
        
        // Display output
        term.write(result.output);
        
        // Detect preview URLs in output
        const urls = detectDevServerUrls(result.output);
        if (urls.length > 0) {
          urls.forEach(url => {
            addPreviewUrl(url, `Dev Server: ${new URL(url).host}`);
            term.writeln(`\r\n🌐 Preview detected: ${url}`);
          });
        }
        
        // Show exit code if non-zero
        if (result.exitCode !== 0) {
          term.writeln(`\r\n❌ Command failed with exit code ${result.exitCode}`);
        }
        
        term.write('\r\n$ ');
      } catch (error) {
        term.writeln(`\r\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        term.write('\r\n$ ');
      }
    };

    // Set up input handling
    let commandBuffer = '';
    term.onData((data) => {
      if (data === '\r' || data === '\n') {
        if (commandBuffer.trim()) {
          const command = commandBuffer.trim();
          handleCommand(command);
          commandBuffer = '';
        }
      } else if (data === '\u007f') { // Backspace
        commandBuffer = commandBuffer.slice(0, -1);
        term.write(`\b \b`);
      } else {
        commandBuffer += data;
        term.write(data);
      }
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      term.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="h-64 bg-gray-950 border-t border-gray-700">
      <div className="bg-gray-800 px-4 py-1 border-b border-gray-700">
        <span className="text-sm text-gray-400">Terminal</span>
      </div>
      <div ref={terminalRef} className="h-[calc(100%-33px)] p-2" />
    </div>
  );
}
