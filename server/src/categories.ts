
import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import db from "./db.js";
import { requireAdmin, requireAuth } from "./auth.js";

const router = Router();

interface CategoryInput {
  name: string;
  color?: string;
}

interface Category extends CategoryInput {
  id: string;
}

function validateCategory(body: unknown): {
  data?: CategoryInput;
  error?: string;
} {
  if (typeof body !== "object" || body === null) {
    return { error: "Request body must be an object." };
  }

  const input = body as Record<string, unknown>;

  if (typeof input.name !== "string" || !input.name.trim()) {
    return { error: "Category name is required." };
  }

  if (
    input.color !== undefined &&
    input.color !== null &&
    typeof input.color !== "string"
  ) {
    return { error: "Category color must be a string." };
  }

  return {
    data: {
      name: input.name.trim(),
      color:
        typeof input.color === "string" && input.color.trim()
          ? input.color.trim()
          : undefined,
    },
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("UNIQUE constraint failed")
  );
}

// GET /api/categories — list all categories
router.get("/", (_req: Request, res: Response) => {
  try {
    const categories = db
      .prepare("SELECT * FROM categories ORDER BY name ASC")
      .all();

    res.json(categories);
  } catch {
    res.status(500).json({ error: "Failed to retrieve categories." });
  }
});

// GET /api/categories/:id — retrieve one category
router.get("/:id", (req: Request, res: Response) => {
  try {
    const category = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(req.params.id) as Category | undefined;

    if (!category) {
      res.status(404).json({ error: "Category not found." });
      return;
    }

    res.json(category);
  } catch {
    res.status(500).json({ error: "Failed to retrieve category." });
  }
});

// POST /api/categories — create a category
router.post("/", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const validation = validateCategory(req.body);

  if (!validation.data) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const category = validation.data;
  const id = randomUUID();

  try {
    db.prepare(`
      INSERT INTO categories (id, name, color)
      VALUES (@id, @name, @color)
    `).run({
      id,
      name: category.name,
      color: category.color ?? null,
    });

    const savedCategory = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(id);

    res.status(201).json(savedCategory);
  } catch (error) {
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
router.put("/:id", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const validation = validateCategory(req.body);

  if (!validation.data) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const category = validation.data;

  try {
    const result = db.prepare(`
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

    const updatedCategory = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(req.params.id);

    res.json(updatedCategory);
  } catch (error) {
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
router.delete("/:id", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    if (req.params.id === "other") {
      res.status(400).json({ error: "The default Other category cannot be deleted." });
      return;
    }
    const removeCategory = db.transaction(() => {
      const existing = db.prepare("SELECT id FROM categories WHERE id = ?")
        .get(req.params.id);
      if (!existing) return 0;
      db.prepare("UPDATE expenses SET categoryId = 'other' WHERE categoryId = ?")
        .run(req.params.id);
      return db.prepare("DELETE FROM categories WHERE id = ?")
        .run(req.params.id).changes;
    });
    const deletedCount = removeCategory();

    if (deletedCount === 0) {
      res.status(404).json({ error: "Category not found." });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Failed to delete category." });
  }
});

export default router;
