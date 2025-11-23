"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEditorStore = void 0;
const zustand_1 = require("zustand");
const api_1 = require("../utils/api");
exports.useEditorStore = (0, zustand_1.create)((set, get) => ({
    currentFile: null,
    content: '',
    openFile: async (path) => {
        try {
            const response = await api_1.api.get(`/files?path=${encodeURIComponent(path)}`);
            set({ currentFile: path, content: response.data.content });
        }
        catch (error) {
            console.error('Failed to open file:', error);
        }
    },
    updateContent: (content) => {
        set({ content });
    },
    saveFile: async () => {
        const { currentFile, content } = get();
        if (!currentFile)
            return;
        try {
            await api_1.api.post('/files', { path: currentFile, content });
        }
        catch (error) {
            console.error('Failed to save file:', error);
        }
    },
}));
//# sourceMappingURL=editorStore.js.map