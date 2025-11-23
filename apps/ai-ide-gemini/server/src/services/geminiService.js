"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GeminiService {
    constructor() {
        this.chatHistory = [];
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: `You are an AI coding assistant integrated into an IDE. You help developers with:
- Understanding and explaining code
- Writing and refactoring code
- Debugging and problem-solving
- Answering technical questions
- Providing best practices and suggestions

Be concise, helpful, and accurate. Format code using markdown code blocks.`,
        });
    }
    async chat(message) {
        try {
            const chat = this.model.startChat({
                history: this.chatHistory.map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.parts }],
                })),
            });
            const result = await chat.sendMessage(message);
            const response = result.response;
            const text = response.text();
            this.chatHistory.push({ role: 'user', parts: message });
            this.chatHistory.push({ role: 'model', parts: text });
            if (this.chatHistory.length > 20) {
                this.chatHistory = this.chatHistory.slice(-20);
            }
            return text;
        }
        catch (error) {
            console.error('Gemini API error:', error);
            throw new Error('Failed to process chat message');
        }
    }
    clearHistory() {
        this.chatHistory = [];
    }
    getHistory() {
        return [...this.chatHistory];
    }
}
exports.GeminiService = GeminiService;
//# sourceMappingURL=geminiService.js.map