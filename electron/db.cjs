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
    CREATE TABLE IF NOT EXISTS custom_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER))
    );
    CREATE TABLE IF NOT EXISTS garden_plants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      stage INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('alive', 'dead')),
      days INTEGER NOT NULL,
      subject TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER))
    );
    CREATE TABLE IF NOT EXISTS custom_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      default_apps TEXT NOT NULL DEFAULT '[]',
      default_sites TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER))
    );
  `);
  seedGardenIfEmpty();
  return db;
}

const SEED_GARDEN = [
  { id: "p1", name: "Aurora", stage: 4, status: "alive", days: 23, subject: "Coding" },
  { id: "p2", name: "Sprig", stage: 3, status: "alive", days: 14, subject: "Math" },
  { id: "p3", name: "Ember", stage: 2, status: "alive", days: 7, subject: "Reading" },
  { id: "p4", name: "Mossy", stage: 0, status: "dead", days: 2, subject: "Writing" },
  { id: "p5", name: "Vine", stage: 1, status: "dead", days: 4, subject: "Exam Prep" },
  { id: "p6", name: "Lumen", stage: 2, status: "dead", days: 9, subject: "Coding" },
];

function seedGardenIfEmpty() {
  if (!db) return;
  const row = db.prepare("SELECT COUNT(*) AS c FROM garden_plants").get();
  if (Number(row?.c ?? 0) > 0) return;
  const stmt = db.prepare(
    "INSERT INTO garden_plants (id, name, stage, status, days, subject) VALUES (?, ?, ?, ?, ?, ?)",
  );
  for (const p of SEED_GARDEN) {
    stmt.run(p.id, p.name, p.stage, p.status, p.days, p.subject);
  }
}

function normalizeHost(input) {
  let s = String(input ?? "").trim().toLowerCase();
  if (!s) return "";
  // Strip URL scheme/path if the user pasted a full URL.
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/^www\./, "");
  s = s.split("/")[0];
  s = s.split("?")[0];
  s = s.split("#")[0];
  return s;
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

function listCustomSites() {
  if (!db) throw new Error("db not initialized");
  return db
    .prepare("SELECT id, host, created_at FROM custom_sites ORDER BY created_at ASC")
    .all();
}

function addCustomSite(host) {
  if (!db) throw new Error("db not initialized");
  const normalized = normalizeHost(host);
  if (!normalized) throw new Error("host required");
  if (normalized.length > 128) throw new Error("host too long");
  // Reject hostnames that don't look like a real host (need at least one dot or
  // be a known TLD-less internal name — keep it simple and require a dot).
  if (!normalized.includes(".")) throw new Error("invalid host");
  const stmt = db.prepare("INSERT INTO custom_sites (host) VALUES (?)");
  try {
    const res = stmt.run(normalized);
    return { id: Number(res.lastInsertRowid), host: normalized };
  } catch (e) {
    if (/UNIQUE/.test(e.message)) {
      const existing = db
        .prepare("SELECT id, host FROM custom_sites WHERE host = ?")
        .get(normalized);
      return existing ?? null;
    }
    throw e;
  }
}

function removeCustomSite(id) {
  if (!db) throw new Error("db not initialized");
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) throw new Error("invalid id");
  const res = db.prepare("DELETE FROM custom_sites WHERE id = ?").run(numericId);
  return res.changes > 0;
}

function listGardenPlants() {
  if (!db) throw new Error("db not initialized");
  return db
    .prepare(
      `SELECT id, name, stage, status, days, subject, created_at
       FROM garden_plants
       ORDER BY created_at DESC`,
    )
    .all();
}

function addGardenPlant(plant) {
  if (!db) throw new Error("db not initialized");
  const id = String(plant?.id ?? "").trim();
  const name = String(plant?.name ?? "").trim();
  const stage = Number(plant?.stage);
  const status = plant?.status;
  const days = Number(plant?.days);
  const subject = String(plant?.subject ?? "").trim();
  if (!id) throw new Error("id required");
  if (!name) throw new Error("name required");
  if (!Number.isFinite(stage) || stage < 0) throw new Error("invalid stage");
  if (status !== "alive" && status !== "dead") throw new Error("invalid status");
  if (!Number.isFinite(days) || days < 0) throw new Error("invalid days");
  if (!subject) throw new Error("subject required");
  if (name.length > 64) throw new Error("name too long");
  if (subject.length > 64) throw new Error("subject too long");

  db.prepare(
    `INSERT INTO garden_plants (id, name, stage, status, days, subject)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, name, stage, status, days, subject);

  return { id, name, stage, status, days, subject };
}

function clearGardenPlants() {
  if (!db) throw new Error("db not initialized");
  db.prepare("DELETE FROM garden_plants").run();
  return true;
}

function parseJsonArray(raw, field) {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) throw new Error("not array");
    return parsed.map((v) => String(v).trim()).filter(Boolean);
  } catch {
    throw new Error(`invalid ${field}`);
  }
}

function rowToCustomSession(row) {
  return {
    id: Number(row.id),
    name: row.name,
    default_apps: parseJsonArray(row.default_apps, "default_apps"),
    default_sites: parseJsonArray(row.default_sites, "default_sites"),
    created_at: row.created_at,
  };
}

function listCustomSessions() {
  if (!db) throw new Error("db not initialized");
  return db
    .prepare(
      "SELECT id, name, default_apps, default_sites, created_at FROM custom_sessions ORDER BY created_at ASC",
    )
    .all()
    .map(rowToCustomSession);
}

function addCustomSession(payload) {
  if (!db) throw new Error("db not initialized");
  const name = String(payload?.name ?? "").trim();
  if (!name) throw new Error("name required");
  if (name.length > 64) throw new Error("name too long");
  const default_apps = Array.isArray(payload?.default_apps)
    ? payload.default_apps.map((v) => String(v).trim()).filter(Boolean)
    : [];
  const default_sites = Array.isArray(payload?.default_sites)
    ? payload.default_sites.map((v) => String(v).trim()).filter(Boolean)
    : [];
  if (default_apps.length === 0) throw new Error("pick at least one app");

  const stmt = db.prepare(
    "INSERT INTO custom_sessions (name, default_apps, default_sites) VALUES (?, ?, ?)",
  );
  try {
    const res = stmt.run(name, JSON.stringify(default_apps), JSON.stringify(default_sites));
    return rowToCustomSession({
      id: res.lastInsertRowid,
      name,
      default_apps: JSON.stringify(default_apps),
      default_sites: JSON.stringify(default_sites),
      created_at: Math.floor(Date.now() / 1000),
    });
  } catch (e) {
    if (/UNIQUE/.test(e.message)) throw new Error("session name already exists");
    throw e;
  }
}

function removeCustomSession(id) {
  if (!db) throw new Error("db not initialized");
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) throw new Error("invalid id");
  const res = db.prepare("DELETE FROM custom_sessions WHERE id = ?").run(numericId);
  return res.changes > 0;
}

module.exports = {
  init,
  listCustomApps,
  addCustomApp,
  removeCustomApp,
  listCustomSites,
  addCustomSite,
  removeCustomSite,
  listGardenPlants,
  addGardenPlant,
  clearGardenPlants,
  listCustomSessions,
  addCustomSession,
  removeCustomSession,
};
