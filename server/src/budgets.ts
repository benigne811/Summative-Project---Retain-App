
import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import db from "./db.js";
import { authenticatedUserId, type AuthenticatedRequest } from "./auth.js";

const router = Router();

interface BudgetInput {
  month: string;
  limit: number;
}

interface Budget extends BudgetInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

function validateBudget(body: unknown): {
  data?: BudgetInput;
  error?: string;
} {
  if (typeof body !== "object" || body === null) {
    return { error: "Request body must be an object." };
  }

  const input = body as Record<string, unknown>;

  if (typeof input.month !== "string") {
    return { error: "Month is required in YYYY-MM format." };
  }

  const month = input.month.trim();

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return { error: "Month must use YYYY-MM format." };
  }

  if (
    typeof input.limit !== "number" ||
    !Number.isFinite(input.limit) ||
    input.limit < 0
  ) {
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
router.get("/", (req: AuthenticatedRequest, res: Response) => {
  try {
    const budgets = db
      .prepare("SELECT * FROM budgets WHERE userId = ? ORDER BY month DESC")
      .all(authenticatedUserId(req));

    res.json(budgets);
  } catch {
    res.status(500).json({ error: "Failed to retrieve budgets." });
  }
});

// GET /api/budgets/:id — retrieve one budget
router.get("/:id", (req: AuthenticatedRequest, res: Response) => {
  try {
    const budget = db
      .prepare("SELECT * FROM budgets WHERE id = ? AND userId = ?")
      .get(req.params.id, authenticatedUserId(req));

    if (!budget) {
      res.status(404).json({ error: "Budget not found." });
      return;
    }

    res.json(budget);
  } catch {
    res.status(500).json({ error: "Failed to retrieve budget." });
  }
});

// POST /api/budgets — create a monthly budget
router.post("/", (req: AuthenticatedRequest, res: Response) => {
  const validation = validateBudget(req.body);

  if (!validation.data) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const budget = validation.data;
  const id = randomUUID();

  try {
    db.prepare(`
      INSERT INTO budgets (id, month, "limit", userId)
      VALUES (@id, @month, @limit, @userId)
    `).run({
      id,
      month: budget.month,
      limit: budget.limit,
      userId: authenticatedUserId(req),
    });

    const savedBudget = db
      .prepare("SELECT * FROM budgets WHERE id = ?")
      .get(id);

    res.status(201).json(savedBudget);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      res.status(409).json({
        error: "A budget already exists for this month.",
      });
      return;
    }

    res.status(500).json({ error: "Failed to create budget." });
  }
});

// PUT /api/budgets/:id — update an existing budget
router.put("/:id", (req: AuthenticatedRequest, res: Response) => {
  const validation = validateBudget(req.body);

  if (!validation.data) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const budget = validation.data;

  try {
    const result = db.prepare(`
      UPDATE budgets
      SET month = @month,
          "limit" = @limit,
          updatedAt = datetime('now')
      WHERE id = @id AND userId = @userId
    `).run({
      id: req.params.id,
      userId: authenticatedUserId(req),
      month: budget.month,
      limit: budget.limit,
    });

    if (result.changes === 0) {
      res.status(404).json({ error: "Budget not found." });
      return;
    }

    const updatedBudget = db
      .prepare("SELECT * FROM budgets WHERE id = ? AND userId = ?")
      .get(req.params.id, authenticatedUserId(req));

    res.json(updatedBudget);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      res.status(409).json({
        error: "A budget already exists for this month.",
      });
      return;
    }

    res.status(500).json({ error: "Failed to update budget." });
  }
});

// DELETE /api/budgets/:id — delete a budget
router.delete("/:id", (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = db
      .prepare("DELETE FROM budgets WHERE id = ? AND userId = ?")
      .run(req.params.id, authenticatedUserId(req));

    if (result.changes === 0) {
      res.status(404).json({ error: "Budget not found." });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Failed to delete budget." });
  }
});

export default router;
