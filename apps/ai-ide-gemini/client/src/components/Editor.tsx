import { useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useEditorStore } from '../store/editorStore';
import { useWebContainer } from '../hooks/useWebContainer';

export default function Editor() {
  const { currentFile, content, updateContent, saveFile } = useEditorStore();
  const { isReady, writeFile } = useWebContainer();

  // Sync file changes to WebContainer filesystem
  useEffect(() => {
    const syncToWebContainer = async () => {
      if (isReady && currentFile && content) {
        try {
          await writeFile(currentFile, content);
        } catch (error) {
          console.error('Failed to sync file to WebContainer:', error);
        }
      }
    };

    // Debounce the sync to avoid too frequent writes
    const timer = setTimeout(() => {
      syncToWebContainer();
    }, 500);

    return () => clearTimeout(timer);
  }, [isReady, currentFile, content, writeFile]);

  const handleEditorChange = (value: string | undefined) => {
    updateContent(value || '');
  };

  const handleEditorSave = async () => {
    await saveFile();
  };

  return (
    <div className="flex-1 bg-gray-900">
      <div className="h-full">
        {currentFile ? (
          <>
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-300">{currentFile}</span>
              <button
                onClick={handleEditorSave}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white"
              >
                Save
              </button>
            </div>
            <MonacoEditor
              height="calc(100% - 42px)"
              language="typescript"
              theme="vs-dark"
              value={content}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No file open. Select a file from the sidebar to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
