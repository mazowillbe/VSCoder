import { useEffect, useState } from 'react';
import { useFileStore } from '../store/fileStore';
import { useEditorStore } from '../store/editorStore';
import { usePreviewStore } from '../store/previewStore';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { files, fetchFiles } = useFileStore();
  const { openFile } = useEditorStore();
  const { previewUrls, openModal, setActivePreviewUrl } = usePreviewStore();
  const [activeTab, setActiveTab] = useState<'files' | 'previews'>('files');

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="w-12 bg-gray-800 border-r border-gray-700 hover:bg-gray-700 flex items-center justify-center"
      >
        <span className="text-xl">›</span>
      </button>
    );
  }

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('files')}
            className={`text-sm font-medium ${activeTab === 'files' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab('previews')}
            className={`text-sm font-medium ${activeTab === 'previews' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Previews ({previewUrls.length})
          </button>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-200"
        >
          <span className="text-xl">‹</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'files' ? (
          <div className="p-2">
            {files.length === 0 ? (
              <p className="text-gray-500 text-sm p-4">No files available</p>
            ) : (
              <ul className="space-y-1">
                {files.map((file) => (
                  <li key={file.path}>
                    <button
                      onClick={() => openFile(file.path)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded transition-colors"
                    >
                      <span className="text-gray-300">{file.name}</span>
                      <span className="text-xs text-gray-500 block">{file.path}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="p-2">
            <div className="mb-4">
              <button
                onClick={openModal}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Open Preview Window
              </button>
            </div>
            
            {previewUrls.length === 0 ? (
              <p className="text-gray-500 text-sm p-4">
                No preview URLs available. Run a dev server to see previews here.
              </p>
            ) : (
              <ul className="space-y-1">
                {previewUrls.map((preview) => (
                  <li key={preview.id}>
                    <button
                      onClick={() => {
                        setActivePreviewUrl(preview.id);
                        openModal();
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded transition-colors ${
                        preview.isActive ? 'bg-gray-700 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 truncate flex-1">{preview.title}</span>
                        {preview.isActive && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Active</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 block truncate">{preview.url}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(preview.timestamp).toLocaleTimeString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
