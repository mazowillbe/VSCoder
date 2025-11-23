"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Terminal;
const react_1 = require("react");
const xterm_1 = require("@xterm/xterm");
const addon_fit_1 = require("@xterm/addon-fit");
require("@xterm/xterm/css/xterm.css");
function Terminal() {
    const terminalRef = (0, react_1.useRef)(null);
    const xtermRef = (0, react_1.useRef)(null);
    const fitAddonRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!terminalRef.current)
            return;
        const term = new xterm_1.Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
            },
        });
        const fitAddon = new addon_fit_1.FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();
        term.writeln('Welcome to AI IDE Terminal');
        term.writeln('Connected to server...');
        term.write('\r\n$ ');
        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
        const handleResize = () => {
            fitAddon.fit();
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, []);
    return (<div className="h-64 bg-gray-950 border-t border-gray-700">
      <div className="bg-gray-800 px-4 py-1 border-b border-gray-700">
        <span className="text-sm text-gray-400">Terminal</span>
      </div>
      <div ref={terminalRef} className="h-[calc(100%-33px)] p-2"/>
    </div>);
}
//# sourceMappingURL=Terminal.js.map