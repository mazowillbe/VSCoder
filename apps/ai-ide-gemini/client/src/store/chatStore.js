"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChatStore = void 0;
const zustand_1 = require("zustand");
const api_1 = require("../utils/api");
exports.useChatStore = (0, zustand_1.create)((set, get) => ({
    messages: [],
    isLoading: false,
    sendMessage: async (content) => {
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now(),
        };
        set({ messages: [...get().messages, userMessage], isLoading: true });
        try {
            const response = await api_1.api.post('/chat', { message: content });
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.reply,
                timestamp: Date.now(),
            };
            set({ messages: [...get().messages, assistantMessage], isLoading: false });
        }
        catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request.',
                timestamp: Date.now(),
            };
            set({ messages: [...get().messages, errorMessage], isLoading: false });
        }
    },
    clearMessages: () => {
        set({ messages: [] });
    },
}));
//# sourceMappingURL=chatStore.js.map