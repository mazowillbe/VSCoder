"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFileStore = void 0;
const zustand_1 = require("zustand");
const api_1 = require("../utils/api");
exports.useFileStore = (0, zustand_1.create)((set) => ({
    files: [],
    fetchFiles: async () => {
        try {
            const response = await api_1.api.get('/files/list');
            set({ files: response.data.files });
        }
        catch (error) {
            console.error('Failed to fetch files:', error);
            set({ files: [] });
        }
    },
}));
//# sourceMappingURL=fileStore.js.map