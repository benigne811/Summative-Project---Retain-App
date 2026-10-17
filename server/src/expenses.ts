
import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import db from "./db.js";

const router = Router();

const paymentMethods = [
  "Cash",
  "Mobile Money",
  "Bank transfer",
  "Card",
  "Other",
] as const;

type PaymentMethod = (typeof paymentMethods)[number];

interface ExpenseInput {
  title: string;
  description?: string;
  amount: number;
  categoryId: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

interface Expense extends ExpenseInput {
  id: string;
  createdAt: string;
  updatedAt?: string | null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateExpense(body: unknown): {
  data?: ExpenseInput;
  error?: string;
} {
  if (typeof body !== "object" || body === null) {
    return { error: "Request body must be an object." };
  }

  const input = body as Record<string, unknown>;

  if (!isNonEmptyString(input.title)) {
    return { error: "Title is required." };
  }

  if (
    typeof input.amount !== "number" ||
    !Number.isFinite(input.amount) ||
    input.amount < 0
  ) {
    return { error: "Amount must be a valid non-negative number." };
  }

  if (!isNonEmptyString(input.categoryId)) {
    return { error: "Category ID is required." };
  }

  if (!isNonEmptyString(input.date)) {
    return { error: "Date is required." };
  }

  if (
    typeof input.paymentMethod !== "string" ||
    !paymentMethods.includes(input.paymentMethod as PaymentMethod)
  ) {
    return { error: "Invalid payment method." };
  }

  for (const field of ["description", "notes"] as const) {
    if (
      input[field] !== undefined &&
      typeof input[field] !== "string"
    ) {
      return { error: `${field} must be a string.` };
    }
  }

  return {
    data: {
      title: input.title.trim(),
      description: input.description as string | undefined,
      amount: input.amount,
      categoryId: input.categoryId.trim(),
      date: input.date,
      paymentMethod: input.paymentMethod as PaymentMethod,
      notes: input.notes as string | undefined,
    },
  };
}

// GET /api/expenses — list all expenses
router.get("/", (_req: Request, res: Response) => {
  try {
    const expenses = db
      .prepare("SELECT * FROM expenses ORDER BY date DESC, createdAt DESC")
      .all();

    res.json(expenses);
  } catch {
    res.status(500).json({ error: "Failed to retrieve expenses." });
  }
});

// GET /api/expenses/:id — retrieve one expense
router.get("/:id", (req: Request, res: Response) => {
  try {
    const expense = db
      .prepare("SELECT * FROM expenses WHERE id = ?")
      .get(req.params.id) as Expense | undefined;

    if (!expense) {
      res.status(404).json({ error: "Expense not found." });
      return;
    }

    res.json(expense);
  } catch {
    res.status(500).json({ error: "Failed to retrieve expense." });
  }
});

// POST /api/expenses — create an expense
router.post("/", (req: Request, res: Response) => {
  const validation = validateExpense(req.body);

  if (!validation.data) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const expense = validation.data;
  const id = randomUUID();

  try {
    db.prepare(`
      INSERT INTO expenses (
        id, title, description, amount, categoryId,
        date, paymentMethod, notes
      )
      VALUES (
        @id, @title, @description, @amount, @categoryId,
        @date, @paymentMethod, @notes
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
    });

    const savedExpense = db
      .prepare("SELECT * FROM expenses WHERE id = ?")
      .get(id);

    res.status(201).json(savedExpense);
  } catch {
    res.status(500).json({ error: "Failed to create expense." });
  }
});

// PUT /api/expenses/:id — update an expense
router.put("/:id", (req: Request, res: Response) => {
  const validation = validateExpense(req.body);

  if (!validation.data) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const expense = validation.data;

  try {
    const result = db.prepare(`
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
      WHERE id = @id
    `).run({
      id: req.params.id,
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

    const updatedExpense = db
      .prepare("SELECT * FROM expenses WHERE id = ?")
      .get(req.params.id);

    res.json(updatedExpense);
  } catch {
    res.status(500).json({ error: "Failed to update expense." });
  }
});

// DELETE /api/expenses/:id — delete an expense
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const result = db
      .prepare("DELETE FROM expenses WHERE id = ?")
      .run(req.params.id);

    if (result.changes === 0) {
      res.status(404).json({ error: "Expense not found." });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Failed to delete expense." });
  }
});

export default router;
