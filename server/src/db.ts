
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
    amount REAL NOT NULL CHECK (amount >= 0),
    date TEXT NOT NULL,
    categoryId TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
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
`);

export default db;
