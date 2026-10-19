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
const paymentMethods = [
    "Cash",
    "Mobile Money",
    "Bank transfer",
    "Card",
    "Other",
];
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function validateExpense(body) {
    if (typeof body !== "object" || body === null) {
        return { error: "Request body must be an object." };
    }
    const input = body;
    if (!isNonEmptyString(input.title)) {
        return { error: "Title is required." };
    }
    if (typeof input.amount !== "number" ||
        !Number.isFinite(input.amount) ||
        input.amount < 0) {
        return { error: "Amount must be a valid non-negative number." };
    }
    if (!isNonEmptyString(input.categoryId)) {
        return { error: "Category ID is required." };
    }
    if (!isNonEmptyString(input.date)) {
        return { error: "Date is required." };
    }
    if (typeof input.paymentMethod !== "string" ||
        !paymentMethods.includes(input.paymentMethod)) {
        return { error: "Invalid payment method." };
    }
    for (const field of ["description", "notes"]) {
        if (input[field] !== undefined &&
            typeof input[field] !== "string") {
            return { error: `${field} must be a string.` };
        }
    }
    return {
        data: {
            title: input.title.trim(),
            description: input.description,
            amount: input.amount,
            categoryId: input.categoryId.trim(),
            date: input.date,
            paymentMethod: input.paymentMethod,
            notes: input.notes,
        },
    };
}
// GET /api/expenses — list all expenses
router.get("/", async (req, res) => {
    try {
        const expenses = await db_js_1.default
            .prepare("SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC, createdAt DESC")
            .all((0, auth_js_1.authenticatedUserId)(req));
        res.json(expenses);
    }
    catch {
        res.status(500).json({ error: "Failed to retrieve expenses." });
    }
});
// GET /api/expenses/:id — retrieve one expense
router.get("/:id", async (req, res) => {
    try {
        const expense = await db_js_1.default
            .prepare("SELECT * FROM expenses WHERE id = ? AND userId = ?")
            .get(req.params.id, (0, auth_js_1.authenticatedUserId)(req));
        if (!expense) {
            res.status(404).json({ error: "Expense not found." });
            return;
        }
        res.json(expense);
    }
    catch {
        res.status(500).json({ error: "Failed to retrieve expense." });
    }
});
// POST /api/expenses — create an expense
router.post("/", async (req, res) => {
    const validation = validateExpense(req.body);
    if (!validation.data) {
        res.status(400).json({ error: validation.error });
        return;
    }
    const expense = validation.data;
    const id = (0, node_crypto_1.randomUUID)();
    try {
        await db_js_1.default.prepare(`
      INSERT INTO expenses (
        id, title, description, amount, categoryId,
        date, paymentMethod, notes, userId
      )
      VALUES (
        @id, @title, @description, @amount, @categoryId,
        @date, @paymentMethod, @notes, @userId
      )
    `).run({
            id,
            title: expense.title,
            description: expense.description ?? null,
            amount: expense.amount,
            categoryId: expense.categoryId,
            date: expense.date,
            paymentMethod: expense.paymentMethod,
            notes: expense.notes ?? null,
            userId: (0, auth_js_1.authenticatedUserId)(req),
        });
        const savedExpense = await db_js_1.default
            .prepare("SELECT * FROM expenses WHERE id = ?")
            .get(id);
        res.status(201).json(savedExpense);
    }
    catch {
        res.status(500).json({ error: "Failed to create expense." });
    }
});
// PUT /api/expenses/:id — update an expense
router.put("/:id", async (req, res) => {
    const validation = validateExpense(req.body);
    if (!validation.data) {
        res.status(400).json({ error: validation.error });
        return;
    }
    const expense = validation.data;
    try {
        const result = await db_js_1.default.prepare(`
      UPDATE expenses
      SET
        title = @title,
        description = @description,
        amount = @amount,
        categoryId = @categoryId,
        date = @date,
        paymentMethod = @paymentMethod,
        notes = @notes,
        updatedAt = datetime('now')
      WHERE id = @id AND userId = @userId
    `).run({
            id: req.params.id,
            userId: (0, auth_js_1.authenticatedUserId)(req),
            title: expense.title,
            description: expense.description ?? null,
            amount: expense.amount,
            categoryId: expense.categoryId,
            date: expense.date,
            paymentMethod: expense.paymentMethod,
            notes: expense.notes ?? null,
        });
        if (result.changes === 0) {
            res.status(404).json({ error: "Expense not found." });
            return;
        }
        const updatedExpense = await db_js_1.default
            .prepare("SELECT * FROM expenses WHERE id = ? AND userId = ?")
            .get(req.params.id, (0, auth_js_1.authenticatedUserId)(req));
        res.json(updatedExpense);
    }
    catch {
        res.status(500).json({ error: "Failed to update expense." });
    }
});
// DELETE /api/expenses/:id — delete an expense
router.delete("/:id", async (req, res) => {
    try {
        const result = await db_js_1.default
            .prepare("DELETE FROM expenses WHERE id = ? AND userId = ?")
            .run(req.params.id, (0, auth_js_1.authenticatedUserId)(req));
        if (result.changes === 0) {
            res.status(404).json({ error: "Expense not found." });
            return;
        }
        res.status(204).send();
    }
    catch {
        res.status(500).json({ error: "Failed to delete expense." });
    }
});
exports.default = router;
