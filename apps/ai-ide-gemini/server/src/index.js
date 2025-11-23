"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const files_js_1 = require("./routes/files.js");
const chat_js_1 = require("./routes/chat.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const env_js_1 = require("./utils/env.js");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
(0, env_js_1.validateEnv)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/files', files_js_1.fileRouter);
app.use('/api/chat', chat_js_1.chatRouter);
app.use(errorHandler_js_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Workspace: ${process.env.WORKSPACE_PATH || 'Not configured'}`);
    console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
});
//# sourceMappingURL=index.js.map