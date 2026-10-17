"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const dataDirectory = (0, node_path_1.join)(process.cwd(), "data");
(0, node_fs_1.mkdirSync)(dataDirectory, { recursive: true });
const databasePath = (0, node_path_1.join)(dataDirectory, "retain.db");
const db = new better_sqlite3_1.default(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL CHECK (amount >= 0),
    categoryId TEXT NOT NULL,
    date TEXT NOT NULL,
    paymentMethod TEXT NOT NULL
      CHECK (
        paymentMethod IN (
          'Cash',
          'Mobile Money',
          'Bank transfer',
          'Card',
          'Other'
        )
      ),
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    month TEXT NOT NULL UNIQUE,
    "limit" REAL NOT NULL CHECK ("limit" >= 0),
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (
      length(month) = 7
      AND month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'
      AND substr(month, 6, 2) BETWEEN '01' AND '12'
    )
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT
  );
`);
// Initialize default categories without duplicating existing records.
// Stable IDs preserve compatibility with existing expense categoryId values.
const defaultCategories = [
    { id: "food", name: "Food & Dining", color: "#10b981" },
    { id: "transport", name: "Transport", color: "#3b82f6" },
    { id: "housing", name: "Housing", color: "#f97316" },
    { id: "shopping", name: "Shopping", color: "#8b5cf6" },
    { id: "bills", name: "Bills & Utilities", color: "#eab308" },
    { id: "health", name: "Health", color: "#ef4444" },
    { id: "entertainment", name: "Entertainment", color: "#ec4899" },
    { id: "other", name: "Other", color: "#64748b" },
];
const insertDefaultCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (id, name, color)
  VALUES (@id, @name, @color)
`);
const seedCategories = db.transaction(() => {
    for (const category of defaultCategories) {
        insertDefaultCategory.run(category);
    }
});
seedCategories();
// Safely add fields missing from an existing expenses table.
// Existing records are preserved.
const expenseColumns = db
    .prepare("PRAGMA table_info(expenses)")
    .all();
const existingExpenseColumns = new Set(expenseColumns.map((column) => column.name));
if (!existingExpenseColumns.has("description")) {
    db.exec("ALTER TABLE expenses ADD COLUMN description TEXT");
}
if (!existingExpenseColumns.has("notes")) {
    db.exec("ALTER TABLE expenses ADD COLUMN notes TEXT");
}
if (!existingExpenseColumns.has("updatedAt")) {
    db.exec("ALTER TABLE expenses ADD COLUMN updatedAt TEXT");
}
exports.default = db;
