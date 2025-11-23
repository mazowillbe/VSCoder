import MonacoEditor from '@monaco-editor/react';
import { useEditorStore } from '../store/editorStore';

export default function Editor() {
  const { currentFile, content, updateContent } = useEditorStore();

  return (
    <div className="flex-1 bg-gray-900">
      <div className="h-full">
        {currentFile ? (
          <>
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <span className="text-sm text-gray-300">{currentFile}</span>
            </div>
            <MonacoEditor
              height="calc(100% - 42px)"
              language="typescript"
              theme="vs-dark"
              value={content}
              onChange={(value) => updateContent(value || '')}
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
