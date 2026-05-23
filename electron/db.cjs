const sqlite = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");

let db = null;

function init(userDataDir) {
  if (db) return db;
  fs.mkdirSync(userDataDir, { recursive: true });
  const file = path.join(userDataDir, "lockin.db");
  db = new sqlite.DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER))
    );
  `);
  return db;
}

function listCustomApps() {
  if (!db) throw new Error("db not initialized");
  return db.prepare("SELECT id, name, created_at FROM custom_apps ORDER BY created_at ASC").all();
}

function addCustomApp(name) {
  if (!db) throw new Error("db not initialized");
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new Error("name required");
  if (trimmed.length > 64) throw new Error("name too long");
  const stmt = db.prepare("INSERT INTO custom_apps (name) VALUES (?)");
  try {
    const res = stmt.run(trimmed);
    return { id: Number(res.lastInsertRowid), name: trimmed };
  } catch (e) {
    if (/UNIQUE/.test(e.message)) {
      // Already exists — return the existing row instead of erroring.
      const existing = db
        .prepare("SELECT id, name FROM custom_apps WHERE name = ?")
        .get(trimmed);
      return existing ?? null;
    }
    throw e;
  }
}

function removeCustomApp(id) {
  if (!db) throw new Error("db not initialized");
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) throw new Error("invalid id");
  const res = db.prepare("DELETE FROM custom_apps WHERE id = ?").run(numericId);
  return res.changes > 0;
}

module.exports = { init, listCustomApps, addCustomApp, removeCustomApp };
