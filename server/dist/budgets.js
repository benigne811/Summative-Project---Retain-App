"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const express_1 = require("express");
const db_js_1 = __importDefault(require("./db.js"));
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
router.get("/", (_req, res) => {
    try {
        const budgets = db_js_1.default
            .prepare("SELECT * FROM budgets ORDER BY month DESC")
            .all();
        res.json(budgets);
    }
    catch {
        res.status(500).json({ error: "Failed to retrieve budgets." });
    }
});
// GET /api/budgets/:id — retrieve one budget
router.get("/:id", (req, res) => {
    try {
        const budget = db_js_1.default
            .prepare("SELECT * FROM budgets WHERE id = ?")
            .get(req.params.id);
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
router.post("/", (req, res) => {
    const validation = validateBudget(req.body);
    if (!validation.data) {
        res.status(400).json({ error: validation.error });
        return;
    }
    const budget = validation.data;
    const id = (0, node_crypto_1.randomUUID)();
    try {
        db_js_1.default.prepare(`
      INSERT INTO budgets (id, month, "limit")
      VALUES (@id, @month, @limit)
    `).run({
            id,
            month: budget.month,
            limit: budget.limit,
        });
        const savedBudget = db_js_1.default
            .prepare("SELECT * FROM budgets WHERE id = ?")
            .get(id);
        res.status(201).json(savedBudget);
    }
    catch (error) {
        if (error instanceof Error &&
            error.message.includes("UNIQUE constraint failed")) {
            res.status(409).json({
                error: "A budget already exists for this month.",
            });
            return;
        }
        res.status(500).json({ error: "Failed to create budget." });
    }
});
// PUT /api/budgets/:id — update an existing budget
router.put("/:id", (req, res) => {
    const validation = validateBudget(req.body);
    if (!validation.data) {
        res.status(400).json({ error: validation.error });
        return;
    }
    const budget = validation.data;
    try {
        const result = db_js_1.default.prepare(`
      UPDATE budgets
      SET month = @month,
          "limit" = @limit,
          updatedAt = datetime('now')
      WHERE id = @id
    `).run({
            id: req.params.id,
            month: budget.month,
            limit: budget.limit,
        });
        if (result.changes === 0) {
            res.status(404).json({ error: "Budget not found." });
            return;
        }
        const updatedBudget = db_js_1.default
            .prepare("SELECT * FROM budgets WHERE id = ?")
            .get(req.params.id);
        res.json(updatedBudget);
    }
    catch (error) {
        if (error instanceof Error &&
            error.message.includes("UNIQUE constraint failed")) {
            res.status(409).json({
                error: "A budget already exists for this month.",
            });
            return;
        }
        res.status(500).json({ error: "Failed to update budget." });
    }
});
// DELETE /api/budgets/:id — delete a budget
router.delete("/:id", (req, res) => {
    try {
        const result = db_js_1.default
            .prepare("DELETE FROM budgets WHERE id = ?")
            .run(req.params.id);
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
