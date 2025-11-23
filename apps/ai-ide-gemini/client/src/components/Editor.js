"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Editor;
const react_1 = __importDefault(require("@monaco-editor/react"));
const editorStore_1 = require("../store/editorStore");
function Editor() {
    const { currentFile, content, updateContent } = (0, editorStore_1.useEditorStore)();
    return (<div className="flex-1 bg-gray-900">
      <div className="h-full">
        {currentFile ? (<>
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <span className="text-sm text-gray-300">{currentFile}</span>
            </div>
            <react_1.default height="calc(100% - 42px)" language="typescript" theme="vs-dark" value={content} onChange={(value) => updateContent(value || '')} options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
            }}/>
          </>) : (<div className="flex items-center justify-center h-full text-gray-500">
            <p>No file open. Select a file from the sidebar to begin.</p>
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=Editor.js.map