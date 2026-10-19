"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const node_async_hooks_1 = require("node:async_hooks");
dotenv_1.default.config();
const pool = process.env.DATABASE_URL
    ? new pg_1.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 })
    : null;
const activeClient = new node_async_hooks_1.AsyncLocalStorage();
let sqlite = null;
if (!pool) {
    const directory = process.env.DATA_DIR || (0, node_path_1.join)(process.cwd(), "data");
    (0, node_fs_1.mkdirSync)(directory, { recursive: true });
    sqlite = new better_sqlite3_1.default((0, node_path_1.join)(directory, "retain.db"));
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
}
const quotedColumns = /\b(userId|categoryId|paymentMethod|createdAt|updatedAt|tokenHash|expiresAt|passwordHash)\b/g;
function namedParameters(sql, args) {
    if (args.length === 1 && args[0] && typeof args[0] === "object" && !Array.isArray(args[0])) {
        const object = args[0];
        const names = [];
        const positional = sql.replace(/@([A-Za-z][A-Za-z0-9_]*)/g, (_match, name) => {
            names.push(name);
            return "?";
        });
        return { sql: positional, args: names.map((name) => object[name]) };
    }
    return { sql, args };
}
function pgSql(sql) {
    let i = 0;
    const quoted = sql.replace(quotedColumns, '"$1"').replace(/datetime\('now'\)/gi, "CURRENT_TIMESTAMP");
    return quoted.replace(/\?/g, () => `$${++i}`);
}
async function execute(sql, args = [], client) {
    if (pool) {
        const result = await (client ?? activeClient.getStore() ?? pool).query(pgSql(sql), args);
        const numeric = new Set(["count", "totalUsers", "totalExpenses", "currentMonthExpenses", "expenseCount"]);
        result.rows = result.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, numeric.has(key) && typeof value === "string" ? Number(value) : value])));
        return result;
    }
    return null;
}
function prepare(sql) {
    const argsFor = (args) => namedParameters(sql, args);
    return {
        all: async (...args) => {
            const p = argsFor(args);
            if (pool)
                return (await execute(p.sql, p.args)).rows;
            return sqlite.prepare(p.sql).all(...p.args);
        },
        get: async (...args) => {
            const p = argsFor(args);
            if (pool)
                return (await execute(p.sql, p.args)).rows[0];
            return sqlite.prepare(p.sql).get(...p.args);
        },
        run: async (...args) => {
            const p = argsFor(args);
            if (pool)
                return { changes: (await execute(p.sql, p.args)).rowCount ?? 0 };
            return { changes: sqlite.prepare(p.sql).run(...p.args).changes };
        },
    };
}
async function initialize() {
    const defaults = [
        ["food", "Food & Dining", "#10b981"], ["transport", "Transport", "#3b82f6"],
        ["housing", "Housing", "#f97316"], ["shopping", "Shopping", "#8b5cf6"],
        ["bills", "Bills & Utilities", "#eab308"], ["health", "Health", "#ef4444"],
        ["entertainment", "Entertainment", "#ec4899"], ["other", "Other", "#64748b"],
    ];
    if (pool) {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
        amount DOUBLE PRECISION NOT NULL CHECK(amount >= 0), "categoryId" TEXT NOT NULL,
        date TEXT NOT NULL, "paymentMethod" TEXT NOT NULL, notes TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP, "userId" TEXT
      );
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY, month TEXT NOT NULL, "limit" DOUBLE PRECISION NOT NULL CHECK("limit" >= 0),
        "userId" TEXT, "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT);
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS sessions (
        "tokenHash" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "expiresAt" TIMESTAMP NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month ON budgets("userId", month);
    `);
        const expenseColumns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='expenses'");
        const existing = new Set(expenseColumns.rows.map((row) => row.column_name));
        for (const column of ["description", "notes", "updatedAt", "userId"]) {
            if (!existing.has(column))
                await pool.query(`ALTER TABLE expenses ADD COLUMN "${column}" TEXT`);
        }
        const budgetColumns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='budgets'");
        if (!budgetColumns.rows.some((row) => row.column_name === "userId"))
            await pool.query('ALTER TABLE budgets ADD COLUMN "userId" TEXT');
        for (const [id, name, color] of defaults) {
            await pool.query("INSERT INTO categories(id,name,color) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING", [id, name, color]);
        }
    }
    else {
        sqlite.exec(`
      CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, amount REAL NOT NULL CHECK(amount >= 0), categoryId TEXT NOT NULL, date TEXT NOT NULL, paymentMethod TEXT NOT NULL, notes TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT, userId TEXT);
      CREATE TABLE IF NOT EXISTS budgets (id TEXT PRIMARY KEY, month TEXT NOT NULL, "limit" REAL NOT NULL CHECK("limit" >= 0), userId TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT);
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, passwordHash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')), createdAt TEXT NOT NULL DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS sessions (tokenHash TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expiresAt TEXT NOT NULL);
      CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month ON budgets(userId, month);
    `);
        for (const [id, name, color] of defaults)
            sqlite.prepare("INSERT OR IGNORE INTO categories(id,name,color) VALUES(?,?,?)").run(id, name, color);
    }
}
async function transaction(work) {
    if (!pool)
        return work();
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await activeClient.run(client, () => work(client));
        await client.query("COMMIT");
        return result;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
async function ping() { if (pool)
    await pool.query("SELECT 1");
else
    sqlite.prepare("SELECT 1").get(); }
exports.default = { prepare, initialize, transaction, ping };
