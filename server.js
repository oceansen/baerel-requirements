/* Bærel requirements — one self-reported requirements specification per company.
 *
 * Zero-dependency Node (>= 22.5) server: node:http + node:sqlite.
 *
 *   Admin creates a company by name  ->  company id + random secret access code
 *   The company opens the site, types the code  ->  its own specification page
 *   Admin can generate a new code (the old one stops working at once), revoke
 *   access, and close/reopen the specification for changes.
 *
 * Each company has exactly one living specification. Every save goes to it; the
 * server keeps timestamped versions, and any version can be restored. A restore
 * never loses anything: the current state is saved as a version first.
 */
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

/* ------------------------------------------------------------------ config */

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "baerel.sqlite");
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/+$/, ""); // e.g. https://requirements.example.com
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const COOKIE_SECURE = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "1" : null; // null = infer
const SESSION_HOURS = Number(process.env.SESSION_HOURS || 12);
const CODE_SESSION_DAYS = Number(process.env.CODE_SESSION_DAYS || 14);
const MAX_BODY = 1.5 * 1024 * 1024;
const MAX_VERSIONS_PER_COMPANY = Number(process.env.MAX_VERSIONS_PER_COMPANY || 2000);
const SCHEMA = "baerel-circular-electronics-requirements";
const PUB = path.join(__dirname, "public");

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error("Set ADMIN_PASSWORD (at least 12 characters) before starting.");
  process.exit(1);
}

/* ------------------------------------------------------------------ database */

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS companies (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    slug              TEXT NOT NULL,
    submissions_open  INTEGER NOT NULL DEFAULT 1,
    created_at        TEXT NOT NULL,
    closed_at         TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS companies_name ON companies(lower(name));
  -- Access codes. "token" holds the normalised code (16 Crockford base32 characters).
  CREATE TABLE IF NOT EXISTS links (
    token       TEXT PRIMARY KEY,
    company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL,
    revoked_at  TEXT
  );
  CREATE INDEX IF NOT EXISTS links_company ON links(company_id);
  -- The live specification is the row with id 'spec_<company id>'. Rows with other ids
  -- are individual interviews from the earlier multi-interview version, kept untouched.
  CREATE TABLE IF NOT EXISTS submissions (
    id             TEXT PRIMARY KEY,
    company_id     TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    link_token     TEXT NOT NULL,
    edit_key_hash  TEXT NOT NULL,
    role           TEXT NOT NULL DEFAULT '',
    completion     INTEGER NOT NULL DEFAULT 0,
    response       TEXT NOT NULL,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS submissions_company ON submissions(company_id);
  CREATE TABLE IF NOT EXISTS audit (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    at          TEXT NOT NULL,
    company_id  TEXT,
    action      TEXT NOT NULL,
    detail      TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS submission_versions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id  TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    n              INTEGER NOT NULL,
    saved_at       TEXT NOT NULL,
    reason         TEXT NOT NULL,
    completion     INTEGER NOT NULL DEFAULT 0,
    response       TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS submission_versions_n ON submission_versions(submission_id, n);
  CREATE TABLE IF NOT EXISTS attachments (
    id            TEXT PRIMARY KEY,
    company_id    TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    content_type  TEXT NOT NULL,
    size          INTEGER NOT NULL,
    bytes         BLOB NOT NULL,
    created_at    TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS attachments_company ON attachments(company_id);
  -- Sample data files uploaded in the specification's sample-data section.
  CREATE TABLE IF NOT EXISTS sample_files (
    id            TEXT PRIMARY KEY,
    company_id    TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    filename      TEXT NOT NULL,
    size          INTEGER NOT NULL,
    sha256        TEXT NOT NULL,
    bytes         BLOB NOT NULL,
    created_at    TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sample_files_company ON sample_files(company_id);
`);

/* Session-signing secret: env if given, otherwise generated once and kept in the
   database so a restart does not sign anyone out. */
const SESSION_SECRET = process.env.SESSION_SECRET || (() => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'session_secret'").get();
  if (row) return row.value;
  const v = crypto.randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO settings (key, value) VALUES ('session_secret', ?)").run(v);
  return v;
})();

const now = () => new Date().toISOString();
const rand = (bytes) => crypto.randomBytes(bytes).toString("base64url");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

/* Internal company id: short, random, not derived from the name. */
function newCompanyId() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const b = crypto.randomBytes(10);
  let s = "co_";
  for (const x of b) s += alphabet[x % alphabet.length];
  return s;
}

/* Access codes: 16 characters of Crockford base32 = 80 random bits, shown as
   XXXX-XXXX-XXXX-XXXX. The alphabet has no I, L, O or U, and input is forgiving:
   case, spaces and dashes are ignored, O reads as 0 and I/L as 1. With guessing
   limited to 10 tries per 15 minutes per address, 80 bits is far out of reach. */
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_RE = /^[0-9A-HJKMNP-TV-Z]{16}$/;
function newCode() {
  let s = "";
  for (let i = 0; i < 16; i++) s += CODE_ALPHABET[crypto.randomInt(32)];
  return s;
}
function normaliseCode(input) {
  return String(input || "").toUpperCase().replace(/[\s\-–—_.]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
}
const formatCode = (c) => (c ? c.match(/.{1,4}/g).join("-") : null);
const codeFingerprint = (c) => sha256("code:" + c).slice(0, 20);

const specId = (companyId) => "spec_" + companyId;

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 40).replace(/-+$/, "") || "company";
}

function audit(companyId, action, detail) {
  db.prepare("INSERT INTO audit (at, company_id, action, detail) VALUES (?, ?, ?, ?)")
    .run(now(), companyId || null, action, detail || "");
}

const q = {
  companyById: db.prepare("SELECT * FROM companies WHERE id = ?"),
  companyByName: db.prepare("SELECT id FROM companies WHERE lower(name) = lower(?)"),
  allCompanyIds: db.prepare("SELECT id FROM companies"),
  insertCompany: db.prepare("INSERT INTO companies (id, name, slug, submissions_open, created_at) VALUES (?, ?, ?, 1, ?)"),
  setOpen: db.prepare("UPDATE companies SET submissions_open = ?, closed_at = ? WHERE id = ?"),
  codeLookup: db.prepare("SELECT l.*, c.name, c.slug, c.submissions_open FROM links l JOIN companies c ON c.id = l.company_id WHERE l.token = ?"),
  activeCode: db.prepare("SELECT * FROM links WHERE company_id = ? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1"),
  insertCode: db.prepare("INSERT INTO links (token, company_id, created_at) VALUES (?, ?, ?)"),
  revokeCodes: db.prepare("UPDATE links SET revoked_at = ? WHERE company_id = ? AND revoked_at IS NULL"),
  listCompanies: db.prepare(`
    SELECT c.*,
      s.updated_at AS spec_updated_at, s.completion AS spec_completion,
      (SELECT COUNT(*) FROM submission_versions v WHERE v.submission_id = 'spec_' || c.id) AS version_count,
      (SELECT token FROM links l WHERE l.company_id = c.id AND l.revoked_at IS NULL ORDER BY created_at DESC LIMIT 1) AS code,
      (SELECT COUNT(*) FROM links l WHERE l.company_id = c.id) AS code_generations,
      (SELECT COUNT(*) FROM sample_files f WHERE f.company_id = c.id) AS sample_files,
      (SELECT COALESCE(SUM(size), 0) FROM sample_files f WHERE f.company_id = c.id) AS sample_bytes
    FROM companies c LEFT JOIN submissions s ON s.id = 'spec_' || c.id
    ORDER BY c.created_at DESC`),
  spec: db.prepare("SELECT * FROM submissions WHERE id = ?"),
  insertSpec: db.prepare("INSERT INTO submissions (id, company_id, link_token, edit_key_hash, role, completion, response, created_at, updated_at) VALUES (?, ?, '', '', ?, ?, ?, ?, ?)"),
  updateSpec: db.prepare("UPDATE submissions SET role = ?, completion = ?, response = ?, updated_at = ? WHERE id = ?"),
  latestLegacy: db.prepare("SELECT * FROM submissions WHERE company_id = ? AND id NOT LIKE 'spec\\_%' ESCAPE '\\' ORDER BY updated_at DESC LIMIT 1"),
  specFor: db.prepare("SELECT s.*, c.name AS company_name FROM submissions s JOIN companies c ON c.id = s.company_id WHERE s.id = 'spec_' || ?"),
  allSpecs: db.prepare("SELECT s.*, c.name AS company_name FROM submissions s JOIN companies c ON c.id = s.company_id WHERE s.id = 'spec_' || c.id ORDER BY c.name"),
  auditFor: db.prepare("SELECT at, action, detail FROM audit WHERE company_id = ? ORDER BY id DESC LIMIT 50"),
  lastVersion: db.prepare("SELECT n, saved_at FROM submission_versions WHERE submission_id = ? ORDER BY n DESC LIMIT 1"),
  countVersions: db.prepare("SELECT COUNT(*) AS n FROM submission_versions WHERE submission_id = ?"),
  insertVersion: db.prepare("INSERT INTO submission_versions (submission_id, n, saved_at, reason, completion, response) VALUES (?, ?, ?, ?, ?, ?)"),
  versionsFor: db.prepare("SELECT n, saved_at, reason, completion FROM submission_versions WHERE submission_id = ? ORDER BY n DESC"),
  versionGet: db.prepare("SELECT * FROM submission_versions WHERE submission_id = ? AND n = ?"),
  insertAtt: db.prepare("INSERT INTO attachments (id, company_id, content_type, size, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)"),
  getAtt: db.prepare("SELECT * FROM attachments WHERE id = ?"),
  attStats: db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS bytes FROM attachments WHERE company_id = ?"),
  insertSample: db.prepare("INSERT INTO sample_files (id, company_id, filename, size, sha256, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"),
  getSample: db.prepare("SELECT * FROM sample_files WHERE id = ?"),
  sampleStats: db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS bytes FROM sample_files WHERE company_id = ?")
};

function tx(fn) {
  db.exec("BEGIN IMMEDIATE");
  try { const r = fn(); db.exec("COMMIT"); return r; }
  catch (e) { db.exec("ROLLBACK"); throw e; }
}

/* ------------------------------------------------------------------ versions

   The spec row is the live document: an open page syncs into it a few seconds after
   each change. Versions are timestamped snapshots of it — taken on the first save,
   whenever someone exports or saves a version, before and after every restore, and
   automatically when the latest snapshot is more than VERSION_EVERY_MIN minutes old. */

const VERSION_EVERY_MIN = Number(process.env.VERSION_EVERY_MIN || 15);

function snapshot(subId, respJson, completion, reason, t) {
  const last = q.lastVersion.get(subId);
  const n = last ? last.n + 1 : 1;
  q.insertVersion.run(subId, n, t, reason, completion, respJson);
  return n;
}

function maybeSnapshot(subId, respJson, completion, requested, t) {
  const last = q.lastVersion.get(subId);
  if (requested) return { n: snapshot(subId, respJson, completion, requested, t), taken: true };
  if (!last || Date.parse(t) - Date.parse(last.saved_at) >= VERSION_EVERY_MIN * 60000) {
    return { n: snapshot(subId, respJson, completion, last ? "auto" : "first", t), taken: true };
  }
  return { n: last.n, taken: false };
}

/* updated_at doubles as the edit base for conflict detection, so it must move
   forward on every write even when two writes land in the same millisecond. */
function nextStamp(prev) {
  const t = Date.now();
  const p = prev ? Date.parse(prev) : 0;
  return new Date(Math.max(t, p + 1)).toISOString();
}

/* ------------------------------------------------------------------ migration
   From the link-per-company, many-interviews version:
   - a company whose active credential is an old URL token gets an access code
     instead (the old link stops working; the admin shares the new code);
   - a company without a spec gets one seeded from its most recently changed
     interview, so nothing visible is lost. Old interviews stay in the database. */

tx(() => {
  for (const { id } of q.allCompanyIds.all()) {
    const active = q.activeCode.get(id);
    if (active && !CODE_RE.test(active.token)) {
      q.revokeCodes.run(now(), id);
      q.insertCode.run(newCode(), id, now());
      audit(id, "code.migrated", "private link replaced by an access code");
    }
    if (!q.spec.get(specId(id))) {
      const old = q.latestLegacy.get(id);
      if (old) {
        let r = {};
        try { r = JSON.parse(old.response); } catch (e) {}
        delete r.interview;
        const json = JSON.stringify(r), t = now();
        q.insertSpec.run(specId(id), id, old.role, old.completion, json, old.created_at, t);
        snapshot(specId(id), json, old.completion, "migrated", t);
        audit(id, "spec.migrated", "seeded from " + old.id);
      }
    }
  }
});

/* ------------------------------------------------------------------ http helpers */

function baseUrl(req) {
  if (PUBLIC_URL) return PUBLIC_URL;
  const proto = (req.headers["x-forwarded-proto"] || "").split(",")[0].trim() || "http";
  return proto + "://" + (req.headers["x-forwarded-host"] || req.headers.host);
}

function isHttps(req) {
  if (COOKIE_SECURE !== null) return COOKIE_SECURE;
  if (PUBLIC_URL) return PUBLIC_URL.startsWith("https://");
  return (req.headers["x-forwarded-proto"] || "").startsWith("https");
}

const SECURITY_HEADERS = {
  // Never leak page URLs through Referer (Google Fonts included).
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join("; ")
};

function send(res, status, body, headers) {
  const h = Object.assign({}, SECURITY_HEADERS, headers || {});
  res.writeHead(status, h);
  res.end(body);
}

function json(res, status, obj, extra) {
  send(res, status, JSON.stringify(obj), Object.assign({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }, extra || {}));
}

const fail = (res, status, code, message) => json(res, status, { error: code, message });

function readJson(req) {
  return new Promise((resolve, reject) => {
    const ct = (req.headers["content-type"] || "").toLowerCase();
    // JSON-only bodies: a cross-site HTML form cannot send this content type
    // without a CORS preflight, which this server never grants. That, plus
    // SameSite=Strict on the admin cookie, is the CSRF defence.
    if (!ct.startsWith("application/json")) return reject(Object.assign(new Error("json only"), { status: 415 }));
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error("too large"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); }
      catch (e) { reject(Object.assign(new Error("bad json"), { status: 400 })); }
    });
    req.on("error", reject);
  });
}

/* Images for usage scenarios. The client downscales and re-encodes before upload;
   the server still checks the magic bytes, so only real JPEG/PNG/WebP is stored and
   never anything a browser could run (no SVG). */
const MAX_IMAGE = 4 * 1024 * 1024;
const MAX_IMAGES_PER_COMPANY = Number(process.env.MAX_IMAGES_PER_COMPANY || 2000);
const MAX_IMAGE_BYTES_PER_COMPANY = Number(process.env.MAX_IMAGE_MB_PER_COMPANY || 600) * 1024 * 1024;

function readImage(req) {
  return new Promise((resolve, reject) => {
    const ct = (req.headers["content-type"] || "").toLowerCase().split(";")[0].trim();
    if (!["image/jpeg", "image/png", "image/webp"].includes(ct)) return reject(Object.assign(new Error("image only"), { status: 415 }));
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_IMAGE) { reject(Object.assign(new Error("image too large"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      const b = Buffer.concat(chunks);
      const isJpeg = b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
      const isPng = b.length > 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      const isWebp = b.length > 12 && b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP";
      const real = isJpeg ? "image/jpeg" : isPng ? "image/png" : isWebp ? "image/webp" : null;
      if (!real) return reject(Object.assign(new Error("not an image"), { status: 415 }));
      resolve({ type: real, bytes: b });
    });
    req.on("error", reject);
  });
}

function sendImage(res, a) {
  res.writeHead(200, Object.assign({}, SECURITY_HEADERS, {
    "Content-Type": a.content_type,
    "Content-Length": a.size,
    "Cache-Control": "private, max-age=31536000, immutable",
    "Content-Disposition": "inline"
  }));
  res.end(Buffer.from(a.bytes));
}

/* Sample data files. Anything a data example might reasonably be — tables, documents,
   images, CAD, archives — but never something a browser or OS would run: the
   extension must be on the list, executables are refused by their magic bytes, and
   files are only ever served as downloads (application/octet-stream, attachment). */
const MAX_SAMPLE = Number(process.env.MAX_SAMPLE_MB || 25) * 1024 * 1024;
const MAX_SAMPLE_FILES_PER_COMPANY = Number(process.env.MAX_SAMPLE_FILES_PER_COMPANY || 500);
const MAX_SAMPLE_BYTES_PER_COMPANY = Number(process.env.MAX_SAMPLE_MB_PER_COMPANY || 300) * 1024 * 1024;
const SAMPLE_EXT = new Set(("csv tsv txt json jsonl ndjson xml yaml yml xlsx xls ods parquet avro feather arrow sql md log " +
  "pdf docx odt pptx png jpg jpeg webp gif tif tiff bmp heic mp4 mov webm avi mp3 wav " +
  "step stp iges igs stl obj 3mf dxf dwg glb gltf ply e57 las laz " +
  "aml aasx owl ttl rdf jsonld nq nt shacl xsd dtd rng rnc avsc proto h5 hdf5 mat zip gz tgz 7z").split(" "));

function cleanFilename(raw) {
  let n = "";
  try { n = decodeURIComponent(String(raw || "")); } catch (e) { n = String(raw || ""); }
  n = n.split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f"<>|:*?]/g, "").replace(/\s+/g, " ").trim();
  if (n.length > 140) { const dot = n.lastIndexOf("."); n = n.slice(0, 120) + (dot > 0 ? n.slice(dot).slice(0, 12) : ""); }
  return n;
}

function readSample(req) {
  return new Promise((resolve, reject) => {
    // A custom header cannot be sent cross-site without a CORS preflight, which this server never grants.
    const name = cleanFilename(req.headers["x-file-name"]);
    const ext = (name.match(/\.([a-z0-9]+)$/i) || [])[1];
    if (!name || !ext || !SAMPLE_EXT.has(ext.toLowerCase())) return reject(Object.assign(new Error("This file type is not accepted."), { status: 415 }));
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_SAMPLE) { reject(Object.assign(new Error("File too large."), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      const b = Buffer.concat(chunks);
      if (!b.length) return reject(Object.assign(new Error("Empty file."), { status: 400 }));
      const h = b.subarray(0, 4);
      const exe = (h[0] === 0x4d && h[1] === 0x5a) || h.equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46])) ||
        (h[0] === 0x23 && h[1] === 0x21) || h.equals(Buffer.from([0xca, 0xfe, 0xba, 0xbe])) ||
        h.equals(Buffer.from([0xcf, 0xfa, 0xed, 0xfe])) || h.equals(Buffer.from([0xfe, 0xed, 0xfa, 0xcf]));
      if (exe) return reject(Object.assign(new Error("Executable files are not accepted."), { status: 415 }));
      resolve({ name, bytes: b });
    });
    req.on("error", reject);
  });
}

function sendSample(res, f) {
  const ascii = f.filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  res.writeHead(200, Object.assign({}, SECURITY_HEADERS, {
    "Content-Type": "application/octet-stream",
    "Content-Length": f.size,
    "Content-Disposition": 'attachment; filename="' + ascii + '"; filename*=UTF-8\'\'' + encodeURIComponent(f.filename),
    "Content-Security-Policy": "sandbox; default-src 'none'",
    "Cache-Control": "private, no-store"
  }));
  res.end(Buffer.from(f.bytes));
}

/* Minimal ZIP writer (stored, no compression) — enough to hand the admin every
   sample file of a company in one download without adding a dependency. */
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function zip(entries) {
  const d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const locals = [], centrals = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, "utf8"), data = e.data, crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(0, 8);
    lh.writeUInt16LE(time, 10); lh.writeUInt16LE(date, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(time, 12); ch.writeUInt16LE(date, 14); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(offset, 42);
    locals.push(lh, name, data); centrals.push(ch, name);
    offset += 30 + name.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat(locals.concat([cd, end]));
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function clientIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";
}

/* Fixed-window limiter, in memory. Good enough for one process. */
const buckets = new Map();
function limited(key, max, windowMs) {
  const t = Date.now();
  let b = buckets.get(key);
  if (!b || t > b.reset) { b = { n: 0, reset: t + windowMs }; buckets.set(key, b); }
  b.n++;
  return b.n > max;
}
setInterval(() => { const t = Date.now(); for (const [k, b] of buckets) if (t > b.reset) buckets.delete(k); }, 60000).unref();

/* ------------------------------------------------------------------ admin session */

const COOKIE = "baerel_admin";

function sign(v) { return crypto.createHmac("sha256", SESSION_SECRET).update(v).digest("base64url"); }

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function issueSession(req, res) {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const v = "admin." + exp;
  const cookie = COOKIE + "=" + v + "." + sign(v) + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + SESSION_HOURS * 3600 + (isHttps(req) ? "; Secure" : "");
  return cookie;
}

function isAdmin(req) {
  const c = parseCookies(req)[COOKIE];
  if (!c) return false;
  const i = c.lastIndexOf(".");
  if (i < 0) return false;
  const v = c.slice(0, i), sig = c.slice(i + 1);
  if (!safeEqual(sig, sign(v))) return false;
  const exp = Number(v.split(".")[1]);
  return Number.isFinite(exp) && exp > Date.now();
}

/* ------------------------------------------------------------------ pages */

const MIME = { ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };

function serveAsset(res, name, pinned) {
  const file = path.resolve(PUB, name);
  if (!file.startsWith(PUB + path.sep)) return send(res, 404, "Not found");
  const ext = path.extname(file);
  if (!MIME[ext]) return send(res, 404, "Not found");
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, "Not found");
    send(res, 200, buf, { "Content-Type": MIME[ext], "Cache-Control": pinned ? "public, max-age=31536000, immutable" : "no-cache" });
  });
}

function template(name) { return fs.readFileSync(path.join(PUB, name), "utf8"); }

/* Content-hashed asset URLs: every deploy changes the ?v= of whatever changed, so
   browsers never run yesterday's script against today's page. Computed once at boot. */
const ASSET_VERSION = {};
for (const f of fs.readdirSync(PUB)) {
  if (MIME[path.extname(f)]) ASSET_VERSION[f] = crypto.createHash("sha256").update(fs.readFileSync(path.join(PUB, f))).digest("hex").slice(0, 10);
}
const versioned = (html) => html.replace(/\/assets\/([A-Za-z0-9_.-]+)/g, (m, f) => ASSET_VERSION[f] ? m + "?v=" + ASSET_VERSION[f] : m);

/* Boot data goes in a JSON data block (not executable), so CSP can stay script-src 'self'. */
function page(res, file, boot, status) {
  const data = JSON.stringify(boot || {}).replace(/</g, "\\u003c");
  const html = versioned(template(file)).replace("<!--BOOT-->", '<script type="application/json" id="boot">' + data + "</script>");
  send(res, status || 200, html, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
}

function notice(res, status, titleNb, bodyNb, titleEn, bodyEn) {
  page(res, "notice.html", { titleNb, bodyNb, titleEn, bodyEn }, status);
}

/* ------------------------------------------------------------------ company session

   Typing the access code gives a signed cookie bound to the company AND to a
   fingerprint of the code it was opened with. When the admin generates a new code
   or revokes access, the fingerprint no longer matches the active code, so every
   open session ends at once and the new code is needed. SameSite=Lax so a link to
   the site from an email still lands signed in; writes are JSON-only, which keeps
   cross-site forms out. */

const CO_COOKIE = "baerel_co";

function issueCompanySession(req, companyId, code) {
  const exp = Date.now() + CODE_SESSION_DAYS * 86400 * 1000;
  const v = "co." + companyId + "." + codeFingerprint(code) + "." + exp;
  return CO_COOKIE + "=" + v + "." + sign(v) + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + CODE_SESSION_DAYS * 86400 + (isHttps(req) ? "; Secure" : "");
}

const clearCompanySession = (req) => CO_COOKIE + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" + (isHttps(req) ? "; Secure" : "");

/* Returns { id, name, open } or null. */
function companySession(req) {
  const c = parseCookies(req)[CO_COOKIE];
  if (!c) return null;
  const i = c.lastIndexOf(".");
  if (i < 0) return null;
  const v = c.slice(0, i), sig = c.slice(i + 1);
  if (!safeEqual(sig, sign(v))) return null;
  const parts = v.split(".");
  if (parts.length !== 4 || parts[0] !== "co") return null;
  const exp = Number(parts[3]);
  if (!Number.isFinite(exp) || exp <= Date.now()) return null;
  const company = q.companyById.get(parts[1]);
  const active = company && q.activeCode.get(company.id);
  if (!active || !safeEqual(codeFingerprint(active.token), parts[2])) return null;
  return { id: company.id, name: company.name, open: !!company.submissions_open };
}

/* ------------------------------------------------------------------ views of data */

function companyView(req, row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    submissions_open: !!row.submissions_open,
    created_at: row.created_at,
    closed_at: row.closed_at,
    code: formatCode(row.code),
    code_active: !!row.code,
    code_generations: row.code_generations || 0,
    access_url: baseUrl(req) + "/",
    spec_updated_at: row.spec_updated_at || null,
    spec_completion: row.spec_updated_at ? row.spec_completion : null,
    version_count: row.version_count || 0,
    sample_files: row.sample_files || 0,
    sample_bytes: row.sample_bytes || 0
  };
}

function companyRow(id) {
  return q.listCompanies.all().find((r) => r.id === id);
}

function storedResponse(s) {
  const r = JSON.parse(s.response);
  const last = q.lastVersion.get(s.id);
  r._server = { company_id: s.company_id, company_name: s.company_name, created_at: s.created_at, updated_at: s.updated_at, version: last ? last.n : null };
  return r;
}

/* Validate a specification and make the server authoritative for which company
   it belongs to. No personal names are kept: the old interview block is dropped. */
function cleanResponse(body, company) {
  const r = body && body.response;
  if (!r || typeof r !== "object" || r.schema !== SCHEMA || !Array.isArray(r.answers)) return null;
  if (r.answers.length > 500) return null;
  const respondent = r.respondent && typeof r.respondent === "object" ? r.respondent : {};
  r.respondent = { role: String(respondent.role || "").slice(0, 200), organisation: company.name };
  delete r.interview;
  r.format = "specification";
  r.workspace = { company_id: company.id, company_name: company.name };
  r.submitted_at = now();
  return r;
}

function specPayload(s) {
  if (!s) return { updated_at: null, version: null, response: null };
  const last = q.lastVersion.get(s.id);
  return { updated_at: s.updated_at, version: last ? last.n : null, completion: s.completion, response: JSON.parse(s.response) };
}

/* Save the specification. base is the updated_at the writer last saw; if the spec
   moved on since, nothing is written and the caller gets 409 with the current state
   to merge into. */
function saveSpec(company, resp, base, requested) {
  const id = specId(company.id);
  const role = resp.respondent.role;
  const completion = Math.max(0, Math.min(100, Number(resp.completion) || 0));
  return tx(() => {
    const cur = q.spec.get(id);
    if ((cur ? cur.updated_at : null) !== (base || null)) return { conflict: true, cur };
    const t = nextStamp(cur && cur.updated_at);
    resp.updated_at = t;
    const json = JSON.stringify(resp);
    if (cur) q.updateSpec.run(role, completion, json, t, id);
    else q.insertSpec.run(id, company.id, role, completion, json, t, t);
    const capped = q.countVersions.get(id).n >= MAX_VERSIONS_PER_COMPANY;
    const v = capped ? { n: q.lastVersion.get(id).n, taken: false } : maybeSnapshot(id, json, completion, requested, t);
    return { updated_at: t, version: v.n, snapshot: v.taken, created: !cur };
  });
}

/* Restore version n: the current state is saved as a version first, so a restore
   can itself be undone. */
function restoreSpec(companyId, n, who) {
  const id = specId(companyId);
  return tx(() => {
    const v = q.versionGet.get(id, n);
    if (!v) return null;
    const cur = q.spec.get(id);
    const t = nextStamp(cur && cur.updated_at);
    if (cur) snapshot(id, cur.response, cur.completion, "before-restore", t);
    let r = {};
    try { r = JSON.parse(v.response); } catch (e) {}
    r.updated_at = t;
    const json = JSON.stringify(r);
    const role = (r.respondent && r.respondent.role) || "";
    if (cur) q.updateSpec.run(role, v.completion, json, t, id);
    else q.insertSpec.run(id, companyId, role, v.completion, json, t, t);
    const nn = snapshot(id, json, v.completion, "restored-v" + n, t);
    audit(companyId, "spec.restored", "v" + n + " → v" + nn + " (" + who + ")");
    return { updated_at: t, version: nn, completion: v.completion, response: r };
  });
}

function versionDownload(res, company, v) {
  const r = JSON.parse(v.response);
  r._server = { company_id: company.id, company_name: company.name, version: v.n, version_saved_at: v.saved_at, version_reason: v.reason };
  const stamp = v.saved_at.replace(/[-:]/g, "").replace("T", "-").slice(0, 13);
  return send(res, 200, JSON.stringify(r, null, 2), {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": 'attachment; filename="baerel-kravspesifikasjon-' + company.slug + "-v" + v.n + "-" + stamp + '.json"',
    "Cache-Control": "no-store"
  });
}

/* ------------------------------------------------------------------ routes */

async function handle(req, res) {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  const m = req.method;
  let mm;

  if (m === "GET" && p === "/healthz") return json(res, 200, { ok: true });

  if (m === "GET" && p.startsWith("/assets/")) return serveAsset(res, p.slice(8), url.searchParams.has("v"));

  /* ---------- access by code ---------- */
  if (m === "GET" && p === "/") {
    if (companySession(req)) { send(res, 302, "", { Location: "/spec", "Cache-Control": "no-store" }); return; }
    return page(res, "access.html", {});
  }

  // Links from the earlier version: the code replaces them.
  if (m === "GET" && p.startsWith("/c/")) { send(res, 302, "", { Location: "/", "Cache-Control": "no-store" }); return; }

  if (m === "POST" && p === "/api/access") {
    if (limited("code:" + clientIp(req), 10, 15 * 60 * 1000)) return fail(res, 429, "rate_limited", "Too many attempts. Try again in 15 minutes.");
    let body;
    try { body = await readJson(req); } catch (e) { return fail(res, e.status || 400, "bad_request", e.message); }
    const code = normaliseCode(body.code);
    const row = CODE_RE.test(code) ? q.codeLookup.get(code) : null;
    if (!row || row.revoked_at) {
      if (row) audit(row.company_id, "access.old_code", clientIp(req));
      return fail(res, 401, "wrong_code", "The code is not valid.");
    }
    audit(row.company_id, "access.signed_in", clientIp(req));
    return json(res, 200, { ok: true, company: { name: row.name } }, { "Set-Cookie": issueCompanySession(req, row.company_id, code) });
  }

  if (m === "POST" && p === "/api/access/logout") {
    return json(res, 200, { ok: true }, { "Set-Cookie": clearCompanySession(req) });
  }

  if (m === "GET" && (p === "/spec" || p === "/spec/")) {
    const co = companySession(req);
    if (!co) { send(res, 302, "", { Location: "/", "Cache-Control": "no-store" }); return; }
    return page(res, "index.html", { mode: "spec", company: co });
  }

  /* ---------- specification API (company session) ---------- */
  if (p.startsWith("/api/s/")) {
    const co = companySession(req);
    if (!co) return fail(res, 401, "signed_out", "Enter the access code again.");
    if (limited("s:" + co.id + ":" + clientIp(req), 600, 10 * 60 * 1000)) return fail(res, 429, "rate_limited", "Too many requests — wait a few minutes.");
    const id = specId(co.id);

    if (p === "/api/s/spec") {
      if (m === "GET") return json(res, 200, Object.assign({ company: co }, specPayload(q.spec.get(id))));
      if (m === "PUT") {
        if (!co.open) return fail(res, 423, "closed", "The specification is closed for changes.");
        let body;
        try { body = await readJson(req); } catch (e) { return fail(res, e.status || 400, "bad_request", e.message); }
        const resp = cleanResponse(body, co);
        if (!resp) return fail(res, 422, "invalid_response", "Not a specification for this survey.");
        const requested = ["export", "manual"].includes(body.snapshot) ? body.snapshot : null;
        const r = saveSpec(co, resp, body.base_updated_at, requested);
        if (r.conflict) return json(res, 409, Object.assign({ error: "conflict", message: "Someone else saved in the meantime." }, specPayload(r.cur)));
        if (r.created) audit(co.id, "spec.created", "");
        if (r.snapshot) audit(co.id, "spec.version", "v" + r.version + " (" + (requested || "auto") + ")");
        return json(res, 200, r);
      }
      return fail(res, 405, "method_not_allowed", "");
    }

    if (m === "GET" && p === "/api/s/versions") return json(res, 200, { versions: q.versionsFor.all(id) });

    if ((mm = p.match(/^\/api\/s\/versions\/(\d+)(\/restore)?$/))) {
      const n = Number(mm[1]);
      if (m === "GET" && !mm[2]) {
        const v = q.versionGet.get(id, n);
        if (!v) return fail(res, 404, "not_found", "No such version.");
        if (url.searchParams.has("download")) return versionDownload(res, q.companyById.get(co.id), v);
        return json(res, 200, { n: v.n, saved_at: v.saved_at, reason: v.reason, completion: v.completion, response: JSON.parse(v.response) });
      }
      if (m === "POST" && mm[2]) {
        if (!co.open) return fail(res, 423, "closed", "The specification is closed for changes.");
        try { await readJson(req); } catch (e) { return fail(res, e.status || 400, "bad_request", e.message); }
        const r = restoreSpec(co.id, n, "company");
        if (!r) return fail(res, 404, "not_found", "No such version.");
        return json(res, 200, r);
      }
      return fail(res, 405, "method_not_allowed", "");
    }

    if ((mm = p.match(/^\/api\/s\/samples(?:\/(smp_[A-Za-z0-9_-]+))?$/))) {
      if (m === "GET" && mm[1]) {
        const f = q.getSample.get(mm[1]);
        if (!f || f.company_id !== co.id) return fail(res, 404, "not_found", "No such file.");
        return sendSample(res, f);
      }
      if (m === "POST" && !mm[1]) {
        if (!co.open) return fail(res, 423, "closed", "The specification is closed for changes.");
        if (limited("smp:" + co.id + ":" + clientIp(req), 200, 10 * 60 * 1000)) return fail(res, 429, "rate_limited", "Too many uploads — wait a few minutes.");
        const st = q.sampleStats.get(co.id);
        if (st.n >= MAX_SAMPLE_FILES_PER_COMPANY || st.bytes >= MAX_SAMPLE_BYTES_PER_COMPANY) return fail(res, 409, "full", "This specification has reached its storage limit for sample data.");
        let f;
        try { f = await readSample(req); } catch (e) { return fail(res, e.status || 400, "bad_file", e.message); }
        if (st.bytes + f.bytes.length > MAX_SAMPLE_BYTES_PER_COMPANY) return fail(res, 409, "full", "This specification has reached its storage limit for sample data.");
        const fid = "smp_" + rand(12), hash = crypto.createHash("sha256").update(f.bytes).digest("hex");
        q.insertSample.run(fid, co.id, f.name, f.bytes.length, hash, f.bytes, now());
        audit(co.id, "sample.uploaded", f.name + " (" + f.bytes.length + " bytes)");
        return json(res, 201, { id: fid, name: f.name, size: f.bytes.length, sha256: hash });
      }
      return fail(res, 405, "method_not_allowed", "");
    }

    if ((mm = p.match(/^\/api\/s\/attachments(?:\/(img_[A-Za-z0-9_-]+))?$/))) {
      if (m === "GET" && mm[1]) {
        const a = q.getAtt.get(mm[1]);
        if (!a || a.company_id !== co.id) return fail(res, 404, "not_found", "No such image.");
        return sendImage(res, a);
      }
      if (m === "POST" && !mm[1]) {
        if (!co.open) return fail(res, 423, "closed", "The specification is closed for changes.");
        if (limited("img:" + co.id + ":" + clientIp(req), 120, 10 * 60 * 1000)) return fail(res, 429, "rate_limited", "Too many uploads — wait a few minutes.");
        const st = q.attStats.get(co.id);
        if (st.n >= MAX_IMAGES_PER_COMPANY || st.bytes >= MAX_IMAGE_BYTES_PER_COMPANY) return fail(res, 409, "full", "This specification has reached its image limit.");
        let img;
        try { img = await readImage(req); } catch (e) { return fail(res, e.status || 400, "bad_image", e.message); }
        const aid = "img_" + rand(12);
        q.insertAtt.run(aid, co.id, img.type, img.bytes.length, img.bytes, now());
        return json(res, 201, { id: aid, size: img.bytes.length, type: img.type });
      }
      return fail(res, 405, "method_not_allowed", "");
    }

    return fail(res, 404, "not_found", "");
  }

  /* ---------- admin pages ---------- */
  if (m === "GET" && (p === "/admin" || p === "/admin/")) {
    return page(res, "admin.html", { authed: isAdmin(req) });
  }

  if (m === "GET" && p === "/admin/analysis") {
    if (!isAdmin(req)) { send(res, 302, "", { Location: "/admin" }); return; }
    const company = url.searchParams.get("company") || "";
    return page(res, "index.html", { mode: "admin-analysis", company });
  }

  if (m === "POST" && p === "/api/admin/login") {
    if (limited("login:" + clientIp(req), 10, 15 * 60 * 1000)) return fail(res, 429, "rate_limited", "Too many attempts. Try again in 15 minutes.");
    let body;
    try { body = await readJson(req); } catch (e) { return fail(res, e.status || 400, "bad_request", e.message); }
    if (!safeEqual(sha256(String(body.password || "")), sha256(ADMIN_PASSWORD))) {
      audit(null, "admin.login_failed", clientIp(req));
      return fail(res, 401, "wrong_password", "Wrong password.");
    }
    audit(null, "admin.login", clientIp(req));
    return json(res, 200, { ok: true }, { "Set-Cookie": issueSession(req, res) });
  }

  if (m === "POST" && p === "/api/admin/logout") {
    return json(res, 200, { ok: true }, { "Set-Cookie": COOKIE + "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" });
  }

  /* ---------- admin API ---------- */
  if (p.startsWith("/api/admin/")) {
    if (!isAdmin(req)) return fail(res, 401, "unauthorised", "Log in first.");

    if (m === "GET" && p === "/api/admin/companies") {
      return json(res, 200, { companies: q.listCompanies.all().map((r) => companyView(req, r)) });
    }

    if (m === "POST" && p === "/api/admin/companies") {
      let body;
      try { body = await readJson(req); } catch (e) { return fail(res, e.status || 400, "bad_request", e.message); }
      const name = String(body.name || "").replace(/\s+/g, " ").trim();
      if (name.length < 2 || name.length > 120) return fail(res, 422, "bad_name", "Give the company a name (2–120 characters).");
      if (q.companyByName.get(name)) return fail(res, 409, "exists", "A company with that name already exists.");
      const id = newCompanyId();
      tx(() => {
        q.insertCompany.run(id, name, slugify(name), now());
        q.insertCode.run(newCode(), id, now());
        audit(id, "company.created", name);
      });
      return json(res, 201, { company: companyView(req, companyRow(id)) });
    }

    if ((mm = p.match(/^\/api\/admin\/companies\/(co_[a-z0-9]+)(?:\/([a-z-]+))?(?:\/(\d+)(?:\/(restore))?)?$/))) {
      const c = q.companyById.get(mm[1]);
      if (!c) return fail(res, 404, "not_found", "No such company.");
      const action = mm[2] || "";
      const view = () => json(res, 200, { company: companyView(req, companyRow(c.id)) });

      if (m === "GET" && action === "") {
        return json(res, 200, { company: companyView(req, companyRow(c.id)), audit: q.auditFor.all(c.id) });
      }
      if (m === "POST" && action === "rotate" && !mm[3]) {
        tx(() => { q.revokeCodes.run(now(), c.id); q.insertCode.run(newCode(), c.id, now()); audit(c.id, "code.rotated", ""); });
        return view();
      }
      if (m === "POST" && action === "revoke" && !mm[3]) {
        tx(() => { q.revokeCodes.run(now(), c.id); audit(c.id, "code.revoked", ""); });
        return view();
      }
      if (m === "POST" && (action === "close" || action === "reopen") && !mm[3]) {
        const open = action === "reopen";
        q.setOpen.run(open ? 1 : 0, open ? null : now(), c.id);
        audit(c.id, open ? "spec.reopened" : "spec.closed", "");
        return view();
      }
      // Analysis input: the company's specification as a one-element list.
      if (m === "GET" && action === "submissions" && !mm[3]) {
        const s = q.specFor.get(c.id);
        return json(res, 200, { responses: s ? [storedResponse(s)] : [] });
      }
      if (m === "GET" && action === "versions" && !mm[3]) {
        return json(res, 200, { versions: q.versionsFor.all(specId(c.id)) });
      }
      if (action === "versions" && mm[3]) {
        const n = Number(mm[3]);
        if (m === "GET" && !mm[4]) {
          const v = q.versionGet.get(specId(c.id), n);
          if (!v) return fail(res, 404, "not_found", "No such version.");
          return versionDownload(res, c, v);
        }
        if (m === "POST" && mm[4]) {
          try { await readJson(req); } catch (e) { return fail(res, e.status || 400, "bad_request", e.message); }
          const r = restoreSpec(c.id, n, "admin");
          if (!r) return fail(res, 404, "not_found", "No such version.");
          return json(res, 200, { updated_at: r.updated_at, version: r.version });
        }
      }
      return fail(res, 405, "method_not_allowed", "");
    }

    if (m === "GET" && (mm = p.match(/^\/api\/admin\/samples\/(smp_[A-Za-z0-9_-]+)$/))) {
      const f = q.getSample.get(mm[1]);
      if (!f) return fail(res, 404, "not_found", "No such file.");
      return sendSample(res, f);
    }

    /* Every sample file in a company's current specification, one folder per sample,
       with a manifest describing each sample. */
    if (m === "GET" && (mm = p.match(/^\/api\/admin\/companies\/(co_[a-z0-9]+)\/samples\.zip$/))) {
      const c = q.companyById.get(mm[1]);
      if (!c) return fail(res, 404, "not_found", "No such company.");
      const s = q.spec.get(specId(c.id));
      let samples = [];
      try { const rec = (JSON.parse(s.response).answers || []).find((a) => a.type === "samples"); samples = (rec && rec.samples) || []; } catch (e) {}
      const entries = [], manifest = [], used = new Set();
      samples.forEach((sm, i) => {
        const folder = String(i + 1).padStart(2, "0") + "-" + (slugify(sm.title || "") || "sample");
        const add = (list, dir) => {
          const out = [];
          (list || []).forEach((fm) => {
            const f = q.getSample.get(String(fm.id || ""));
            if (!f || f.company_id !== c.id) return;
            let name = dir + "/" + f.filename, k = 2;
            while (used.has(name)) name = dir + "/" + k++ + "-" + f.filename;
            used.add(name);
            entries.push({ name, data: Buffer.from(f.bytes) });
            out.push({ path: name, size: f.size, sha256: f.sha256 });
          });
          return out;
        };
        const files = add(sm.files, folder);
        const entry = Object.assign({}, sm, { files });
        if (sm.metadata) entry.metadata = Object.assign({}, sm.metadata, { files: add(sm.metadata.files, folder + "/metadata") });
        manifest.push(entry);
      });
      entries.unshift({ name: "samples.json", data: Buffer.from(JSON.stringify({ company: c.name, exported_at: now(), samples: manifest }, null, 2)) });
      return send(res, 200, zip(entries), {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="baerel-eksempeldata-' + c.slug + "-" + now().slice(0, 10) + '.zip"',
        "Cache-Control": "no-store"
      });
    }

    if (m === "GET" && (mm = p.match(/^\/api\/admin\/attachments\/(img_[A-Za-z0-9_-]+)$/))) {
      const a = q.getAtt.get(mm[1]);
      if (!a) return fail(res, 404, "not_found", "No such image.");
      return sendImage(res, a);
    }

    if (m === "GET" && p === "/api/admin/submissions") {
      return json(res, 200, { responses: q.allSpecs.all().map(storedResponse) });
    }

    if (m === "GET" && p === "/api/admin/export") {
      const bundle = { schema: SCHEMA + "-bundle", exported_at: now(), responses: q.allSpecs.all().map(storedResponse) };
      return send(res, 200, JSON.stringify(bundle, null, 2), {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="baerel-alle-kravspesifikasjoner-' + now().slice(0, 10) + '.json"',
        "Cache-Control": "no-store"
      });
    }

    return fail(res, 404, "not_found", "");
  }

  send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error(e);
    if (!res.headersSent) fail(res, 500, "server_error", "Something went wrong.");
  });
});

if (require.main === module) {
  server.listen(PORT, HOST, () => console.log("Bærel specifications on http://" + HOST + ":" + PORT + (PUBLIC_URL ? "  (public URL " + PUBLIC_URL + ")" : "")));
}

module.exports = { server, slugify, normaliseCode };
