"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const Editor_1 = __importDefault(require("./components/Editor"));
const Terminal_1 = __importDefault(require("./components/Terminal"));
const Chat_1 = __importDefault(require("./components/Chat"));
const Sidebar_1 = __importDefault(require("./components/Sidebar"));
function App() {
    const [sidebarOpen, setSidebarOpen] = (0, react_1.useState)(true);
    return (<div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar_1.default isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}/>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <h1 className="text-xl font-semibold">AI IDE - Gemini Assistant</h1>
        </header>
        
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            <Editor_1.default />
            <Terminal_1.default />
          </div>
          
          <Chat_1.default />
        </div>
      </div>
    </div>);
}
exports.default = App;
//# sourceMappingURL=App.js.map