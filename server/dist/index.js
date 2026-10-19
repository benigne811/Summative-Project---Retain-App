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
const budgets_js_1 = __importDefault(require("./budgets.js"));
const categories_js_1 = __importDefault(require("./categories.js"));
const authRoutes_js_1 = __importDefault(require("./authRoutes.js"));
const auth_js_1 = require("./auth.js");
const admin_js_1 = __importDefault(require("./admin.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/health", async (_req, res) => {
    try {
        await db_js_1.default.ping();
        res.status(200).json({
            status: "ok",
            message: "Retain backend is running!",
            database: "connected",
            databaseEngine: db_js_1.default.engine,
        });
    }
    catch {
        res.status(500).json({
            status: "error",
            message: "Database connection failed.",
        });
    }
});
app.use("/api/auth", authRoutes_js_1.default);
app.use("/api/admin", admin_js_1.default);
app.use("/api/expenses", auth_js_1.requireAuth, expenses_js_1.default);
app.use("/api/budgets", auth_js_1.requireAuth, budgets_js_1.default);
app.use("/api/categories", categories_js_1.default);
async function start() {
    await db_js_1.default.initialize();
    app.listen(PORT, () => console.log(`Retain backend running at http://localhost:${PORT}`));
}
void start();
