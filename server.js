/* Bærel requirements — company workspaces.
 *
 * Zero-dependency Node (>= 22.5) server: node:http + node:sqlite.
 *
 *   Admin creates a company by name  ->  company id + secret token + private URL
 *   /c/<slug>/<token>                ->  the survey, bound to that company's workspace
 *   Admin can rotate/revoke the link and close/reopen submissions.
 *
 * The token is the only credential a company contact holds. The slug is cosmetic:
 * a stale or wrong slug redirects to the canonical one, so renaming never breaks links.
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
const MAX_BODY = 1.5 * 1024 * 1024;
const MAX_SUBMISSIONS_PER_COMPANY = Number(process.env.MAX_SUBMISSIONS_PER_COMPANY || 300);
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
  CREATE TABLE IF NOT EXISTS links (
    token       TEXT PRIMARY KEY,
    company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL,
    revoked_at  TEXT
  );
  CREATE INDEX IF NOT EXISTS links_company ON links(company_id);
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
`);

/* Session-signing secret: env if given, otherwise generated once and kept in the
   database so a restart does not log the admin out. */
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

/* 32 random bytes -> 43-char base64url. 256 bits: not guessable, not enumerable. */
const newToken = () => rand(32);

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
  insertCompany: db.prepare("INSERT INTO companies (id, name, slug, submissions_open, created_at) VALUES (?, ?, ?, 1, ?)"),
  setOpen: db.prepare("UPDATE companies SET submissions_open = ?, closed_at = ? WHERE id = ?"),
  linkByToken: db.prepare("SELECT l.*, c.name, c.slug, c.submissions_open FROM links l JOIN companies c ON c.id = l.company_id WHERE l.token = ?"),
  activeLink: db.prepare("SELECT * FROM links WHERE company_id = ? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1"),
  insertLink: db.prepare("INSERT INTO links (token, company_id, created_at) VALUES (?, ?, ?)"),
  revokeLinks: db.prepare("UPDATE links SET revoked_at = ? WHERE company_id = ? AND revoked_at IS NULL"),
  listCompanies: db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM submissions s WHERE s.company_id = c.id) AS submission_count,
      (SELECT MAX(updated_at) FROM submissions s WHERE s.company_id = c.id) AS last_submission_at,
      (SELECT token FROM links l WHERE l.company_id = c.id AND l.revoked_at IS NULL ORDER BY created_at DESC LIMIT 1) AS token,
      (SELECT COUNT(*) FROM links l WHERE l.company_id = c.id) AS link_generations
    FROM companies c ORDER BY c.created_at DESC`),
  contributions: db.prepare("SELECT id, role, completion, created_at, updated_at FROM submissions WHERE company_id = ? ORDER BY created_at ASC"),
  countSubs: db.prepare("SELECT COUNT(*) AS n FROM submissions WHERE company_id = ?"),
  subById: db.prepare("SELECT * FROM submissions WHERE id = ? AND company_id = ?"),
  insertSub: db.prepare("INSERT INTO submissions (id, company_id, link_token, edit_key_hash, role, completion, response, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"),
  updateSub: db.prepare("UPDATE submissions SET role = ?, completion = ?, response = ?, updated_at = ?, link_token = ? WHERE id = ?"),
  subsForCompany: db.prepare("SELECT s.*, c.name AS company_name FROM submissions s JOIN companies c ON c.id = s.company_id WHERE s.company_id = ? ORDER BY s.created_at"),
  allSubs: db.prepare("SELECT s.*, c.name AS company_name FROM submissions s JOIN companies c ON c.id = s.company_id ORDER BY c.name, s.created_at"),
  auditFor: db.prepare("SELECT at, action, detail FROM audit WHERE company_id = ? ORDER BY id DESC LIMIT 50")
};

function tx(fn) {
  db.exec("BEGIN IMMEDIATE");
  try { const r = fn(); db.exec("COMMIT"); return r; }
  catch (e) { db.exec("ROLLBACK"); throw e; }
}

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

function workspaceUrl(req, slug, token) {
  return baseUrl(req) + "/c/" + slug + "/" + token;
}

const SECURITY_HEADERS = {
  // The token sits in the URL path: never leak it through Referer (Google Fonts included).
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

function serveAsset(res, name) {
  const file = path.resolve(PUB, name);
  if (!file.startsWith(PUB + path.sep)) return send(res, 404, "Not found");
  const ext = path.extname(file);
  if (!MIME[ext]) return send(res, 404, "Not found");
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, "Not found");
    send(res, 200, buf, { "Content-Type": MIME[ext], "Cache-Control": "public, max-age=300" });
  });
}

function template(name) { return fs.readFileSync(path.join(PUB, name), "utf8"); }

/* Boot data goes in a JSON data block (not executable), so CSP can stay script-src 'self'. */
function page(res, file, boot, status) {
  const data = JSON.stringify(boot || {}).replace(/</g, "\\u003c");
  const html = template(file).replace("<!--BOOT-->", '<script type="application/json" id="boot">' + data + "</script>");
  send(res, status || 200, html, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
}

function notice(res, status, titleNb, bodyNb, titleEn, bodyEn) {
  page(res, "notice.html", { titleNb, bodyNb, titleEn, bodyEn }, status);
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
    submission_count: row.submission_count || 0,
    last_submission_at: row.last_submission_at || null,
    link_active: !!row.token,
    link_generations: row.link_generations || 0,
    url: row.token ? workspaceUrl(req, row.slug, row.token) : null
  };
}

function companyRow(id) {
  return q.listCompanies.all().find((r) => r.id === id);
}

function storedResponse(s) {
  const r = JSON.parse(s.response);
  r._server = { submission_id: s.id, company_id: s.company_id, company_name: s.company_name, created_at: s.created_at, updated_at: s.updated_at };
  return r;
}

/* Validate a submitted survey response and make the workspace authoritative for
   which organisation it belongs to. */
function cleanResponse(body, company) {
  const r = body && body.response;
  if (!r || typeof r !== "object" || r.schema !== SCHEMA || !Array.isArray(r.answers)) return null;
  if (r.answers.length > 500) return null;
  const respondent = r.respondent && typeof r.respondent === "object" ? r.respondent : {};
  r.respondent = {
    role: String(respondent.role || "").slice(0, 200),
    organisation: company.name,
    organisation_stated: String(respondent.organisation || "").slice(0, 200)
  };
  r.workspace = { company_id: company.company_id || company.id, company_name: company.name };
  r.submitted_at = now();
  return r;
}

/* ------------------------------------------------------------------ routes */

async function handle(req, res) {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  const m = req.method;

  if (m === "GET" && p === "/healthz") return json(res, 200, { ok: true });

  if (m === "GET" && p.startsWith("/assets/")) return serveAsset(res, p.slice(8));

  if (m === "GET" && p === "/") {
    return notice(res, 200,
      "Bærel kravkartlegging",
      "Kartleggingen er kun på invitasjon. Bruk lenken du har fått tilsendt fra prosjektet.",
      "Bærel requirements survey",
      "The survey is by invitation only. Use the link the project sent you.");
  }

  /* ---------- company workspace page ---------- */
  let mm;
  if (m === "GET" && (mm = p.match(/^\/c\/([^/]+)\/([A-Za-z0-9_-]{20,100})\/?$/))) {
    const link = q.linkByToken.get(mm[2]);
    if (!link) {
      return notice(res, 404,
        "Lenken er ikke gyldig", "Sjekk at du har kopiert hele lenken, eller be kontaktpersonen din om en ny.",
        "This link is not valid", "Check that you copied the whole link, or ask your contact for a new one.");
    }
    if (link.revoked_at) {
      return notice(res, 410,
        "Lenken er trukket tilbake", "Denne lenken er erstattet eller deaktivert. Be kontaktpersonen din om den nye lenken.",
        "This link has been withdrawn", "The link was replaced or deactivated. Ask your contact for the current one.");
    }
    if (mm[1] !== link.slug) {
      send(res, 301, "", { Location: "/c/" + link.slug + "/" + link.token, "Cache-Control": "no-store" });
      return;
    }
    return page(res, "index.html", {
      mode: "workspace",
      token: link.token,
      company: { id: link.company_id, name: link.name, open: !!link.submissions_open }
    });
  }

  /* ---------- workspace API ---------- */
  if ((mm = p.match(/^\/api\/w\/([A-Za-z0-9_-]{20,100})(\/submissions(?:\/([A-Za-z0-9_-]+))?)?$/))) {
    const link = q.linkByToken.get(mm[1]);
    if (!link || link.revoked_at) return fail(res, link ? 410 : 404, link ? "link_revoked" : "not_found", "This link is not active.");
    const company = { id: link.company_id, name: link.name, open: !!link.submissions_open };

    if (m === "GET" && !mm[2]) {
      return json(res, 200, {
        company,
        contributions: q.contributions.all(link.company_id).map((s) => ({
          id: s.id, role: s.role, completion: s.completion, created_at: s.created_at, updated_at: s.updated_at
        }))
      });
    }

    if (mm[2] && (m === "POST" || m === "PUT")) {
      if (limited("w:" + link.token + ":" + clientIp(req), 40, 10 * 60 * 1000)) return fail(res, 429, "rate_limited", "Too many submissions — wait a few minutes.");
      if (!company.open) return fail(res, 423, "closed", "Submissions for this workspace are closed.");
      let body;
      try { body = await readJson(req); } catch (e) { return fail(res, e.status || 400, "bad_request", e.message); }
      const resp = cleanResponse(body, company);
      if (!resp) return fail(res, 422, "invalid_response", "Not a response to this survey.");
      const role = resp.respondent.role;
      const completion = Math.max(0, Math.min(100, Number(resp.completion) || 0));
      const t = now();

      if (m === "POST" && !mm[3]) {
        if (q.countSubs.get(link.company_id).n >= MAX_SUBMISSIONS_PER_COMPANY) return fail(res, 409, "full", "This workspace has reached its submission limit.");
        const id = "sub_" + rand(9);
        const key = rand(24);
        q.insertSub.run(id, link.company_id, link.token, sha256(key), role, completion, JSON.stringify(resp), t, t);
        audit(link.company_id, "submission.created", id);
        return json(res, 201, { id, edit_key: key, updated_at: t });
      }

      if (m === "PUT" && mm[3]) {
        const s = q.subById.get(mm[3], link.company_id);
        if (!s || !body.edit_key || !safeEqual(sha256(String(body.edit_key)), s.edit_key_hash)) {
          return fail(res, 403, "not_yours", "This submission cannot be changed from here.");
        }
        q.updateSub.run(role, completion, JSON.stringify(resp), t, link.token, s.id);
        audit(link.company_id, "submission.updated", s.id);
        return json(res, 200, { id: s.id, updated_at: t });
      }
    }
    return fail(res, 405, "method_not_allowed", "");
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
      const token = newToken();
      tx(() => {
        q.insertCompany.run(id, name, slugify(name), now());
        q.insertLink.run(token, id, now());
        audit(id, "company.created", name);
      });
      return json(res, 201, { company: companyView(req, companyRow(id)) });
    }

    if ((mm = p.match(/^\/api\/admin\/companies\/(co_[a-z0-9]+)(?:\/([a-z-]+))?$/))) {
      const c = q.companyById.get(mm[1]);
      if (!c) return fail(res, 404, "not_found", "No such company.");
      const action = mm[2] || "";

      if (m === "GET" && action === "") {
        return json(res, 200, { company: companyView(req, companyRow(c.id)), audit: q.auditFor.all(c.id) });
      }
      if (m === "POST" && action === "rotate") {
        const token = newToken();
        tx(() => { q.revokeLinks.run(now(), c.id); q.insertLink.run(token, c.id, now()); audit(c.id, "link.rotated", ""); });
        return json(res, 200, { company: companyView(req, companyRow(c.id)) });
      }
      if (m === "POST" && action === "revoke") {
        tx(() => { q.revokeLinks.run(now(), c.id); audit(c.id, "link.revoked", ""); });
        return json(res, 200, { company: companyView(req, companyRow(c.id)) });
      }
      if (m === "POST" && (action === "close" || action === "reopen")) {
        const open = action === "reopen";
        q.setOpen.run(open ? 1 : 0, open ? null : now(), c.id);
        audit(c.id, open ? "submissions.reopened" : "submissions.closed", "");
        return json(res, 200, { company: companyView(req, companyRow(c.id)) });
      }
      if (m === "GET" && action === "submissions") {
        return json(res, 200, { responses: q.subsForCompany.all(c.id).map(storedResponse) });
      }
      return fail(res, 405, "method_not_allowed", "");
    }

    if (m === "GET" && p === "/api/admin/submissions") {
      return json(res, 200, { responses: q.allSubs.all().map(storedResponse) });
    }

    if (m === "GET" && p === "/api/admin/export") {
      const bundle = { schema: SCHEMA + "-bundle", exported_at: now(), responses: q.allSubs.all().map(storedResponse) };
      return send(res, 200, JSON.stringify(bundle, null, 2), {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="baerel-all-responses-' + now().slice(0, 10) + '.json"',
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
  server.listen(PORT, HOST, () => console.log("Bærel workspaces on http://" + HOST + ":" + PORT + (PUBLIC_URL ? "  (links use " + PUBLIC_URL + ")" : "")));
}

module.exports = { server, slugify };
