
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const dataDirectory = join(process.cwd(), "data");

mkdirSync(dataDirectory, { recursive: true });

const databasePath = join(dataDirectory, "retain.db");

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");

export default db;
