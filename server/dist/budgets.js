"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const express_1 = require("express");
const db_js_1 = __importDefault(require("./db.js"));
const auth_js_1 = require("./auth.js");
const router = (0, express_1.Router)();
function validateBudget(body) {
    if (typeof body !== "object" || body === null) {
        return { error: "Request body must be an object." };
    }
    const input = body;
    if (typeof input.month !== "string") {
        return { error: "Month is required in YYYY-MM format." };
    }
    const month = input.month.trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return { error: "Month must use YYYY-MM format." };
    }
    if (typeof input.limit !== "number" ||
        !Number.isFinite(input.limit) ||
        input.limit < 0) {
        return {
            error: "Budget limit must be a valid non-negative number.",
        };
    }
    return {
        data: {
            month,
            limit: input.limit,
        },
    };
}
// GET /api/budgets — list all budgets
router.get("/", async (req, res) => {
    try {
        const budgets = await db_js_1.default
            .prepare("SELECT * FROM budgets WHERE userId = ? ORDER BY month DESC")
            .all((0, auth_js_1.authenticatedUserId)(req));
        res.json(budgets);
    }
    catch {
        res.status(500).json({ error: "Failed to retrieve budgets." });
    }
});
// GET /api/budgets/:id — retrieve one budget
router.get("/:id", async (req, res) => {
    try {
        const budget = await db_js_1.default
            .prepare("SELECT * FROM budgets WHERE id = ? AND userId = ?")
            .get(req.params.id, (0, auth_js_1.authenticatedUserId)(req));
        if (!budget) {
            res.status(404).json({ error: "Budget not found." });
            return;
        }
        res.json(budget);
    }
    catch {
        res.status(500).json({ error: "Failed to retrieve budget." });
    }
});
// POST /api/budgets — create a monthly budget
router.post("/", async (req, res) => {
    const validation = validateBudget(req.body);
    if (!validation.data) {
        res.status(400).json({ error: validation.error });
        return;
    }
    const budget = validation.data;
    const id = (0, node_crypto_1.randomUUID)();
    try {
        await db_js_1.default.prepare(`
      INSERT INTO budgets (id, month, "limit", userId)
      VALUES (@id, @month, @limit, @userId)
    `).run({
            id,
            month: budget.month,
            limit: budget.limit,
            userId: (0, auth_js_1.authenticatedUserId)(req),
        });
        const savedBudget = await db_js_1.default
            .prepare("SELECT * FROM budgets WHERE id = ?")
            .get(id);
        res.status(201).json(savedBudget);
    }
    catch (error) {
        if (error instanceof Error &&
            error.message.includes("UNIQUE constraint failed") ||
            error.code === "23505") {
            res.status(409).json({
                error: "A budget already exists for this month.",
            });
            return;
        }
        res.status(500).json({ error: "Failed to create budget." });
    }
});
// PUT /api/budgets/:id — update an existing budget
router.put("/:id", async (req, res) => {
    const validation = validateBudget(req.body);
    if (!validation.data) {
        res.status(400).json({ error: validation.error });
        return;
    }
    const budget = validation.data;
    try {
        const result = await db_js_1.default.prepare(`
      UPDATE budgets
      SET month = @month,
          "limit" = @limit,
          updatedAt = datetime('now')
      WHERE id = @id AND userId = @userId
    `).run({
            id: req.params.id,
            userId: (0, auth_js_1.authenticatedUserId)(req),
            month: budget.month,
            limit: budget.limit,
        });
        if (result.changes === 0) {
            res.status(404).json({ error: "Budget not found." });
            return;
        }
        const updatedBudget = await db_js_1.default
            .prepare("SELECT * FROM budgets WHERE id = ? AND userId = ?")
            .get(req.params.id, (0, auth_js_1.authenticatedUserId)(req));
        res.json(updatedBudget);
    }
    catch (error) {
        if (error instanceof Error &&
            error.message.includes("UNIQUE constraint failed") ||
            error.code === "23505") {
            res.status(409).json({
                error: "A budget already exists for this month.",
            });
            return;
        }
        res.status(500).json({ error: "Failed to update budget." });
    }
});
// DELETE /api/budgets/:id — delete a budget
router.delete("/:id", async (req, res) => {
    try {
        const result = await db_js_1.default
            .prepare("DELETE FROM budgets WHERE id = ? AND userId = ?")
            .run(req.params.id, (0, auth_js_1.authenticatedUserId)(req));
        if (result.changes === 0) {
            res.status(404).json({ error: "Budget not found." });
            return;
        }
        res.status(204).send();
    }
    catch {
        res.status(500).json({ error: "Failed to delete budget." });
    }
});
exports.default = router;
