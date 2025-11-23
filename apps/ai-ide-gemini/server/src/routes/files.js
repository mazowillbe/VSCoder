"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileRouter = void 0;
const express_1 = require("express");
const fileService_js_1 = require("../services/fileService.js");
exports.fileRouter = (0, express_1.Router)();
const fileService = new fileService_js_1.FileService();
exports.fileRouter.get('/list', async (_req, res, next) => {
    try {
        const files = await fileService.listFiles();
        res.json({ files });
    }
    catch (error) {
        next(error);
    }
});
exports.fileRouter.get('/', async (req, res, next) => {
    try {
        const path = req.query.path;
        if (!path) {
            res.status(400).json({ error: 'Path parameter is required' });
            return;
        }
        const content = await fileService.readFile(path);
        res.json({ path, content });
    }
    catch (error) {
        next(error);
    }
});
exports.fileRouter.post('/', async (req, res, next) => {
    try {
        const { path, content } = req.body;
        if (!path || content === undefined) {
            res.status(400).json({ error: 'Path and content are required' });
            return;
        }
        await fileService.writeFile(path, content);
        res.json({ success: true, path });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=files.js.map