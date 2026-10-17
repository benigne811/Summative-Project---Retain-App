"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = __importDefault(require("./db.js"));
const expenses_js_1 = __importDefault(require("./expenses.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/health", (_req, res) => {
    try {
        const result = db_js_1.default.prepare("SELECT 1 AS connected").get();
        res.status(200).json({
            status: "ok",
            message: "Retain backend is running!",
            database: result.connected === 1 ? "connected" : "disconnected",
        });
    }
    catch {
        res.status(500).json({
            status: "error",
            message: "Database connection failed.",
        });
    }
});
app.use("/api/expenses", expenses_js_1.default);
app.listen(PORT, () => {
    console.log(`Retain backend running at http://localhost:${PORT}`);
});
