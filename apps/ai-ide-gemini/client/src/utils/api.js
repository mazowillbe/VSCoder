"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const axios_1 = __importDefault(require("axios"));
exports.api = axios_1.default.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});
exports.api.interceptors.response.use((response) => response, (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
});
//# sourceMappingURL=api.js.map