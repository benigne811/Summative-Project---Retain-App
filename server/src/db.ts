
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const dataDirectory = join(process.cwd(), "data");

mkdirSync(dataDirectory, { recursive: true });

const databasePath = join(dataDirectory, "retain.db");
const db = new Database(databasePath);

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
    updatedAt TEXT,
    userId TEXT
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    month TEXT NOT NULL,
    "limit" REAL NOT NULL CHECK ("limit" >= 0),
    userId TEXT,
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

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    tokenHash TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expiresAt TEXT NOT NULL
  );
`);

// Add user ownership columns to databases created before authentication.
const addColumnIfMissing = (table: string, column: string) => {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
  }
};
addColumnIfMissing("expenses", "userId");
addColumnIfMissing("budgets", "userId");

// Replace the legacy global month uniqueness rule with per-user uniqueness.
const budgetIndexes = db.prepare("PRAGMA index_list(budgets)").all() as Array<{ name: string; unique: number; origin: string }>;
if (budgetIndexes.some((index) => index.unique === 1 && index.origin === "u")) {
  db.exec(`
    CREATE TABLE budgets_migrated (
      id TEXT PRIMARY KEY,
      month TEXT NOT NULL,
      "limit" REAL NOT NULL CHECK ("limit" >= 0),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      userId TEXT,
      CHECK (length(month) = 7 AND month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]' AND substr(month, 6, 2) BETWEEN '01' AND '12')
    );
    INSERT INTO budgets_migrated (id, month, "limit", createdAt, updatedAt, userId)
      SELECT id, month, "limit", createdAt, updatedAt, userId FROM budgets;
    DROP TABLE budgets;
    ALTER TABLE budgets_migrated RENAME TO budgets;
  `);
}
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month ON budgets(userId, month)");

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
  .all() as Array<{ name: string }>;

const existingExpenseColumns = new Set(
  expenseColumns.map((column) => column.name),
);

if (!existingExpenseColumns.has("description")) {
  db.exec("ALTER TABLE expenses ADD COLUMN description TEXT");
}

if (!existingExpenseColumns.has("notes")) {
  db.exec("ALTER TABLE expenses ADD COLUMN notes TEXT");
}

if (!existingExpenseColumns.has("updatedAt")) {
  db.exec("ALTER TABLE expenses ADD COLUMN updatedAt TEXT");
}

export default db;
