"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Sidebar;
const react_1 = require("react");
const fileStore_1 = require("../store/fileStore");
const editorStore_1 = require("../store/editorStore");
function Sidebar({ isOpen, onToggle }) {
    const { files, fetchFiles } = (0, fileStore_1.useFileStore)();
    const { openFile } = (0, editorStore_1.useEditorStore)();
    (0, react_1.useEffect)(() => {
        fetchFiles();
    }, [fetchFiles]);
    if (!isOpen) {
        return (<button onClick={onToggle} className="w-12 bg-gray-800 border-r border-gray-700 hover:bg-gray-700 flex items-center justify-center">
        <span className="text-xl">›</span>
      </button>);
    }
    return (<div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Files</h2>
        <button onClick={onToggle} className="text-gray-400 hover:text-gray-200">
          <span className="text-xl">‹</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (<p className="text-gray-500 text-sm p-4">No files available</p>) : (<ul className="space-y-1">
            {files.map((file) => (<li key={file.path}>
                <button onClick={() => openFile(file.path)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded transition-colors">
                  <span className="text-gray-300">{file.name}</span>
                  <span className="text-xs text-gray-500 block">{file.path}</span>
                </button>
              </li>))}
          </ul>)}
      </div>
    </div>);
}
//# sourceMappingURL=Sidebar.js.map