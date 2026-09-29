// End-to-end check of the workspace lifecycle against a throwaway server and database.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORT}`;
const PW = "correct horse battery staple";
const srv = spawn(process.execPath, ["--disable-warning=ExperimentalWarning", "server.js"], {
  cwd: root,
  env: { ...process.env, PORT: String(PORT), HOST: "127.0.0.1", ADMIN_PASSWORD: PW, DB_PATH: join(mkdtempSync(join(tmpdir(), "baerel-")), "t.sqlite") },
  stdio: ["ignore", "inherit", "inherit"]
});
const stop = () => srv.kill();
process.on("exit", stop);

async function up() { for (let i = 0; i < 50; i++) { try { if ((await fetch(BASE + "/healthz")).ok) return; } catch {} await new Promise(r => setTimeout(r, 100)); } throw new Error("server did not start"); }

let cookie = "";
const call = async (method, path, body, opts = {}) => {
  const r = await fetch(BASE + path, {
    method, redirect: "manual",
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(opts.admin !== false && cookie ? { cookie } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data, headers: r.headers };
};
const response = (role, completion = 40) => ({ schema: "baerel-circular-electronics-requirements", schema_version: 1, completion, respondent: { role, organisation: "whatever I typed" }, answers: [{ id: "q1", type: "text", text: role }] });
const ok = (name) => console.log("  ✓ " + name);

await up();

assert.equal((await call("GET", "/api/admin/companies")).status, 401); ok("admin API refuses without a session");
assert.equal((await call("POST", "/api/admin/login", { password: "nope" })).status, 401); ok("wrong password rejected");
const login = await call("POST", "/api/admin/login", { password: PW });
assert.equal(login.status, 200);
cookie = login.headers.get("set-cookie").split(";")[0];
assert.match(login.headers.get("set-cookie"), /HttpOnly; SameSite=Strict/); ok("login issues HttpOnly SameSite=Strict session");

const created = await call("POST", "/api/admin/companies", { name: "Kongsberg Maritime" });
assert.equal(created.status, 201);
const co = created.data.company;
assert.match(co.id, /^co_[a-z0-9]{10}$/);
assert.equal(co.slug, "kongsberg-maritime");
const token = co.url.split("/").pop();
assert.equal(token.length, 43);
assert.ok(co.url.endsWith(`/c/kongsberg-maritime/${token}`)); ok("create by name → id, slug, 256-bit token, private URL");
assert.equal((await call("POST", "/api/admin/companies", { name: "kongsberg maritime" })).status, 409); ok("duplicate name refused");
assert.equal((await call("POST", "/api/admin/companies", { name: "Bærum Gjenvinning Øst" })).data.company.slug, "baerum-gjenvinning-ost"); ok("Norwegian letters slugged");

const page = await call("GET", `/c/kongsberg-maritime/${token}`, undefined, { admin: false });
assert.equal(page.status, 200);
assert.match(page.data, /"mode":"workspace"/);
assert.equal(page.headers.get("referrer-policy"), "no-referrer");
assert.match(page.headers.get("x-robots-tag"), /noindex/); ok("workspace page serves with no-referrer + noindex");
const moved = await call("GET", `/c/old-name/${token}`, undefined, { admin: false });
assert.equal(moved.status, 301); assert.equal(moved.headers.get("location"), `/c/kongsberg-maritime/${token}`); ok("wrong slug redirects to canonical");
assert.equal((await call("GET", `/c/kongsberg-maritime/${"x".repeat(43)}`, undefined, { admin: false })).status, 404); ok("unknown token → 404");

const a = await call("POST", `/api/w/${token}/submissions`, { response: response("Head of sustainability", 55) }, { admin: false });
assert.equal(a.status, 201); assert.ok(a.data.edit_key);
const b = await call("POST", `/api/w/${token}/submissions`, { response: response("Service engineer", 30) }, { admin: false });
assert.equal(b.status, 201); ok("two contributors submit through the link");
assert.equal((await call("POST", `/api/w/${token}/submissions`, { response: { schema: "other" } }, { admin: false })).status, 422); ok("non-survey payload rejected");
assert.equal((await call("PUT", `/api/w/${token}/submissions/${a.data.id}`, { response: response("Head of sustainability", 80), edit_key: b.data.edit_key }, { admin: false })).status, 403); ok("cannot overwrite someone else's submission");
assert.equal((await call("PUT", `/api/w/${token}/submissions/${a.data.id}`, { response: response("Head of sustainability", 80), edit_key: a.data.edit_key }, { admin: false })).status, 200); ok("contributor updates own submission with edit key");
const ws = await call("GET", `/api/w/${token}`, undefined, { admin: false });
assert.equal(ws.data.contributions.length, 2);
assert.equal(ws.data.contributions[0].completion, 80);
assert.equal(ws.data.contributions[0].response, undefined); ok("workspace lists contributors (role/completion/date) but not answers");

const subs = await call("GET", `/api/admin/companies/${co.id}/submissions`);
assert.equal(subs.data.responses.length, 2);
assert.equal(subs.data.responses[0].respondent.organisation, "Kongsberg Maritime");
assert.equal(subs.data.responses[0].respondent.organisation_stated, "whatever I typed"); ok("server stamps the workspace company on every response");

assert.equal((await call("POST", `/api/admin/companies/${co.id}/close`)).data.company.submissions_open, false);
assert.equal((await call("POST", `/api/w/${token}/submissions`, { response: response("Late") }, { admin: false })).status, 423);
assert.equal((await call("GET", `/api/w/${token}`, undefined, { admin: false })).data.company.open, false); ok("closed workspace stays readable, refuses writes (423)");
await call("POST", `/api/admin/companies/${co.id}/reopen`);

const rotated = await call("POST", `/api/admin/companies/${co.id}/rotate`);
const token2 = rotated.data.company.url.split("/").pop();
assert.notEqual(token2, token);
assert.equal((await call("GET", `/c/kongsberg-maritime/${token}`, undefined, { admin: false })).status, 410);
assert.equal((await call("POST", `/api/w/${token}/submissions`, { response: response("Old link") }, { admin: false })).status, 410);
assert.equal((await call("GET", `/c/kongsberg-maritime/${token2}`, undefined, { admin: false })).status, 200);
assert.equal((await call("GET", `/api/w/${token2}`, undefined, { admin: false })).data.contributions.length, 2); ok("rotate: old link 410, new link sees the same workspace");
assert.equal((await call("PUT", `/api/w/${token2}/submissions/${a.data.id}`, { response: response("Head of sustainability", 90), edit_key: a.data.edit_key }, { admin: false })).status, 200); ok("edit key survives a link rotation");

const revoked = await call("POST", `/api/admin/companies/${co.id}/revoke`);
assert.equal(revoked.data.company.link_active, false); assert.equal(revoked.data.company.url, null);
assert.equal((await call("GET", `/api/w/${token2}`, undefined, { admin: false })).status, 410); ok("revoke: no active link at all");

// Living document: every create is v1; exports and manual saves add a version; plain syncs don't (within 15 min).
{
  const tok = (await call("POST", `/api/admin/companies/${co.id}/rotate`)).data.company.url.split("/").pop();
  const c1 = await call("POST", `/api/w/${tok}/submissions`, { response: response("Live doc", 10) }, { admin: false });
  assert.equal(c1.data.version, 1);
  const k = c1.data.edit_key, id = c1.data.id;
  const s1 = await call("PUT", `/api/w/${tok}/submissions/${id}`, { response: response("Live doc", 20), edit_key: k }, { admin: false });
  assert.equal(s1.data.snapshot, false); assert.equal(s1.data.version, 1);
  const s2 = await call("PUT", `/api/w/${tok}/submissions/${id}`, { response: response("Live doc", 30), edit_key: k, snapshot: "export" }, { admin: false });
  assert.equal(s2.data.snapshot, true); assert.equal(s2.data.version, 2);
  const s3 = await call("PUT", `/api/w/${tok}/submissions/${id}`, { response: response("Live doc", 40), edit_key: k, snapshot: "manual" }, { admin: false });
  assert.equal(s3.data.version, 3);
  const ivs = (await call("GET", `/api/admin/companies/${co.id}/interviews`)).data.interviews;
  const mineIv = ivs.find((x) => x.id === id);
  assert.deepEqual(mineIv.versions.map((v) => v.n), [3, 2, 1]);
  assert.deepEqual(mineIv.versions.map((v) => v.reason), ["manual", "export", "first"]);
  const v2 = await call("GET", `/api/admin/submissions/${id}/versions/2`);
  assert.equal(v2.status, 200); assert.equal(v2.data.completion, 30); assert.equal(v2.data._server.version, 2);
  assert.match(v2.headers.get("content-disposition"), /-v2-\d{8}-\d{4}\.json/);
  assert.equal((await call("GET", `/api/admin/submissions/${id}/versions/2`, undefined, { admin: false })).status, 401);
  ok("living document: live copy + timestamped versions (first/export/manual), admin can list and download");
}

// Scenario images: real JPEG/PNG/WebP only, readable only through the owning company's link or by admin.
{
  const tokA = (await call("POST", `/api/admin/companies/${co.id}/rotate`)).data.company.url.split("/").pop();
  const other = (await call("POST", "/api/admin/companies", { name: "Other Co" })).data.company;
  const tokB = other.url.split("/").pop();
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
  const up = async (tok, body, type) => { const r = await fetch(`${BASE}/api/w/${tok}/attachments`, { method: "POST", headers: { "content-type": type }, body }); return { status: r.status, data: await r.json().catch(() => ({})) }; };
  const ok1 = await up(tokA, jpeg, "image/jpeg");
  assert.equal(ok1.status, 201); assert.match(ok1.data.id, /^img_/);
  assert.equal((await up(tokA, Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), "image/svg+xml")).status, 415);
  assert.equal((await up(tokA, Buffer.from("not really a jpeg"), "image/jpeg")).status, 415);
  const g = await fetch(`${BASE}/api/w/${tokA}/attachments/${ok1.data.id}`);
  assert.equal(g.status, 200); assert.equal(g.headers.get("content-type"), "image/jpeg"); assert.equal(Buffer.from(await g.arrayBuffer()).length, jpeg.length);
  assert.equal((await fetch(`${BASE}/api/w/${tokB}/attachments/${ok1.data.id}`)).status, 404);
  assert.equal((await call("GET", `/api/admin/attachments/${ok1.data.id}`)).status, 200);
  assert.equal((await call("GET", `/api/admin/attachments/${ok1.data.id}`, undefined, { admin: false })).status, 401);
  ok("scenario images: only real images stored; isolated per company; admin can read");
}

const exp = await call("GET", "/api/admin/export");
assert.equal(exp.data.responses.length, 3); ok("full export");
const form = await fetch(BASE + "/api/admin/companies", { method: "POST", headers: { cookie, "content-type": "application/x-www-form-urlencoded" }, body: "name=Evil" });
assert.equal(form.status, 415);
ok("form-encoded (cross-site style) POST refused");

console.log("\nAll checks passed.");
stop();
process.exit(0);
