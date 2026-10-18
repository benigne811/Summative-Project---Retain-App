import { Router, type Response } from "express";
import db from "./db.js";
import { requireAdmin, requireAuth, type AuthenticatedRequest } from "./auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/insights", (_req: AuthenticatedRequest, res: Response) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const totals = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) AS totalUsers,
        (SELECT COUNT(*) FROM expenses) AS totalExpenses,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS totalExpenseValue,
        (SELECT COUNT(*) FROM expenses WHERE substr(date, 1, 7) = ?) AS currentMonthExpenses
    `).get(currentMonth);

    const spendingByCategory = db.prepare(`
      SELECT c.id AS categoryId, c.name AS categoryName, c.color,
        COUNT(e.id) AS expenseCount, COALESCE(SUM(e.amount), 0) AS totalAmount
      FROM categories c LEFT JOIN expenses e ON e.categoryId = c.id
      GROUP BY c.id, c.name, c.color ORDER BY totalAmount DESC, c.name ASC
    `).all();
    const mostUsedCategories = db.prepare(`
      SELECT c.id AS categoryId, c.name AS categoryName, c.color, COUNT(e.id) AS expenseCount
      FROM categories c LEFT JOIN expenses e ON e.categoryId = c.id
      GROUP BY c.id, c.name, c.color ORDER BY expenseCount DESC, c.name ASC LIMIT 5
    `).all();
    const leastUsedCategories = db.prepare(`
      SELECT c.id AS categoryId, c.name AS categoryName, c.color, COUNT(e.id) AS expenseCount
      FROM categories c LEFT JOIN expenses e ON e.categoryId = c.id
      GROUP BY c.id, c.name, c.color ORDER BY expenseCount ASC, c.name ASC LIMIT 5
    `).all();
    const recentExpenses = db.prepare(`
      SELECT e.id, e.title, e.amount, e.categoryId, e.date, e.createdAt, u.name AS userName, u.email AS userEmail
      FROM expenses e LEFT JOIN users u ON u.id = e.userId
      ORDER BY e.createdAt DESC LIMIT 10
    `).all();
    const recentUsers = db.prepare(`
      SELECT id, name, email, role, createdAt FROM users ORDER BY createdAt DESC LIMIT 10
    `).all();

    res.json({
      currentMonth,
      totals,
      spendingByCategory,
      mostUsedCategories,
      leastUsedCategories,
      recentExpenses,
      recentUsers,
    });
  } catch {
    res.status(500).json({ error: "Failed to retrieve admin insights." });
  }
});

export default router;
