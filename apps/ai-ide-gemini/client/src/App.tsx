import { useState, useEffect } from 'react';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import { useWebContainer } from './hooks/useWebContainer';
import { useWebContainerStore } from './store/webcontainerStore';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isReady, error } = useWebContainer();
  const { setReady, setError } = useWebContainerStore();

  useEffect(() => {
    setReady(isReady);
    if (error) {
      setError(error);
    }
  }, [isReady, error, setReady, setError]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">
              AI IDE - Gemini Assistant
            </h1>
            <div className="flex items-center gap-2 text-sm">
              {isReady ? (
                <span className="text-green-400">
                  ✓ WebContainer Ready
                </span>
              ) : error ? (
                <span className="text-red-400">❌ {error}</span>
              ) : (
                <span className="text-yellow-400">⏳ Initializing...</span>
              )}
            </div>
          </div>
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
