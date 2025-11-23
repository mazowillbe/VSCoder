import { useState } from 'react';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <h1 className="text-xl font-semibold">AI IDE - Gemini Assistant</h1>
        </header>
        
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            <Editor />
            <Terminal />
          </div>
          
          <Chat />
        </div>
      </div>
    </div>
  );
}

export default App;
