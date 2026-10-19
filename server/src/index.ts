
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";
import expensesRouter from "./expenses.js";
import budgetsRouter from "./budgets.js";
import categoriesRouter from "./categories.js";
import authRouter from "./authRoutes.js";
import { requireAuth } from "./auth.js";
import adminRouter from "./admin.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await db.ping();

    res.status(200).json({
      status: "ok",
      message: "Retain backend is running!",
      database: "connected",
      databaseEngine: db.engine,
    });
  } catch {
    res.status(500).json({
      status: "error",
      message: "Database connection failed.",
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/expenses", requireAuth, expensesRouter);
app.use("/api/budgets", requireAuth, budgetsRouter);
app.use("/api/categories", categoriesRouter);

async function start() {
  await db.initialize();
  app.listen(PORT, () => console.log(`Retain backend running at http://localhost:${PORT}`));
}

void start();
