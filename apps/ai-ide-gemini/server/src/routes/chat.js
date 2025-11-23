"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const geminiService_js_1 = require("../services/geminiService.js");
exports.chatRouter = (0, express_1.Router)();
let geminiService = null;
function getGeminiService() {
    if (!geminiService) {
        geminiService = new geminiService_js_1.GeminiService();
    }
    return geminiService;
}
exports.chatRouter.post('/', async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }
        const reply = await getGeminiService().chat(message);
        res.json({ reply });
    }
    catch (error) {
        next(error);
    }
});
exports.chatRouter.delete('/history', async (_req, res, next) => {
    try {
        getGeminiService().clearHistory();
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=chat.js.map