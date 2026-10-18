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
function validateCategory(body) {
    if (typeof body !== "object" || body === null) {
        return { error: "Request body must be an object." };
    }
    const input = body;
    if (typeof input.name !== "string" || !input.name.trim()) {
        return { error: "Category name is required." };
    }
    if (input.color !== undefined &&
        input.color !== null &&
        typeof input.color !== "string") {
        return { error: "Category color must be a string." };
    }
    return {
        data: {
            name: input.name.trim(),
            color: typeof input.color === "string" && input.color.trim()
                ? input.color.trim()
                : undefined,
        },
    };
}
function isUniqueConstraintError(error) {
    return (error instanceof Error &&
        error.message.includes("UNIQUE constraint failed"));
}
// GET /api/categories — list all categories
router.get("/", (_req, res) => {
    try {
        const categories = db_js_1.default
            .prepare("SELECT * FROM categories ORDER BY name ASC")
            .all();
        res.json(categories);
    }
    catch {
        res.status(500).json({ error: "Failed to retrieve categories." });
    }
});
// GET /api/categories/:id — retrieve one category
router.get("/:id", (req, res) => {
    try {
        const category = db_js_1.default
            .prepare("SELECT * FROM categories WHERE id = ?")
            .get(req.params.id);
        if (!category) {
            res.status(404).json({ error: "Category not found." });
            return;
        }
        res.json(category);
    }
    catch {
        res.status(500).json({ error: "Failed to retrieve category." });
    }
});
// POST /api/categories — create a category
router.post("/", auth_js_1.requireAuth, auth_js_1.requireAdmin, (req, res) => {
    const validation = validateCategory(req.body);
    if (!validation.data) {
        res.status(400).json({ error: validation.error });
        return;
    }
    const category = validation.data;
    const id = (0, node_crypto_1.randomUUID)();
    try {
        db_js_1.default.prepare(`
      INSERT INTO categories (id, name, color)
      VALUES (@id, @name, @color)
    `).run({
            id,
            name: category.name,
            color: category.color ?? null,
        });
        const savedCategory = db_js_1.default
            .prepare("SELECT * FROM categories WHERE id = ?")
            .get(id);
        res.status(201).json(savedCategory);
    }
    catch (error) {
        if (isUniqueConstraintError(error)) {
            res.status(409).json({
                error: "A category with this name already exists.",
            });
            return;
        }
        res.status(500).json({ error: "Failed to create category." });
    }
});
// PUT /api/categories/:id — update a category
router.put("/:id", auth_js_1.requireAuth, auth_js_1.requireAdmin, (req, res) => {
    const validation = validateCategory(req.body);
    if (!validation.data) {
        res.status(400).json({ error: validation.error });
        return;
    }
    const category = validation.data;
    try {
        const result = db_js_1.default.prepare(`
      UPDATE categories
      SET name = @name, color = @color
      WHERE id = @id
    `).run({
            id: req.params.id,
            name: category.name,
            color: category.color ?? null,
        });
        if (result.changes === 0) {
            res.status(404).json({ error: "Category not found." });
            return;
        }
        const updatedCategory = db_js_1.default
            .prepare("SELECT * FROM categories WHERE id = ?")
            .get(req.params.id);
        res.json(updatedCategory);
    }
    catch (error) {
        if (isUniqueConstraintError(error)) {
            res.status(409).json({
                error: "A category with this name already exists.",
            });
            return;
        }
        res.status(500).json({ error: "Failed to update category." });
    }
});
// DELETE /api/categories/:id — delete a category
router.delete("/:id", auth_js_1.requireAuth, auth_js_1.requireAdmin, (req, res) => {
    try {
        if (req.params.id === "other") {
            res.status(400).json({ error: "The default Other category cannot be deleted." });
            return;
        }
        const removeCategory = db_js_1.default.transaction(() => {
            const existing = db_js_1.default.prepare("SELECT id FROM categories WHERE id = ?")
                .get(req.params.id);
            if (!existing)
                return 0;
            db_js_1.default.prepare("UPDATE expenses SET categoryId = 'other' WHERE categoryId = ?")
                .run(req.params.id);
            return db_js_1.default.prepare("DELETE FROM categories WHERE id = ?")
                .run(req.params.id).changes;
        });
        const deletedCount = removeCategory();
        if (deletedCount === 0) {
            res.status(404).json({ error: "Category not found." });
            return;
        }
        res.status(204).send();
    }
    catch {
        res.status(500).json({ error: "Failed to delete category." });
    }
});
exports.default = router;
