// End-to-end check of the access-code + one-specification-per-company model,
// against a throwaway server and database.
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

let admin = "";
const call = async (method, path, body, cookie = admin) => {
  const r = await fetch(BASE + path, {
    method, redirect: "manual",
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data, headers: r.headers };
};
const spec = (completion, answers = { q1: "Sustainability, engineering" }, extra = {}) => ({
  schema: "baerel-circular-electronics-requirements", schema_version: 1, completion,
  respondent: { role: answers.q1 || "", organisation: "whatever I typed" },
  interview: { interviewer: "Should be dropped", interviewee: "Jane Doe" },
  answers: Object.entries(answers).map(([id, text]) => ({ id, type: "text", text })),
  draft: { answers, notes: {} }, ...extra
});
const signIn = async (code) => {
  const r = await call("POST", "/api/access", { code }, "");
  return { status: r.status, cookie: r.status === 200 ? r.headers.get("set-cookie").split(";")[0] : "", raw: r.headers.get("set-cookie") };
};
const ok = (name) => console.log("  ✓ " + name);

await up();

/* ---- admin */
assert.equal((await call("GET", "/api/admin/companies", undefined, "")).status, 401); ok("admin API refuses without a session");
assert.equal((await call("POST", "/api/admin/login", { password: "nope" }, "")).status, 401); ok("wrong admin password rejected");
const login = await call("POST", "/api/admin/login", { password: PW }, "");
admin = login.headers.get("set-cookie").split(";")[0];
assert.match(login.headers.get("set-cookie"), /HttpOnly; SameSite=Strict/); ok("admin login: HttpOnly SameSite=Strict session");

const created = await call("POST", "/api/admin/companies", { name: "Kongsberg Maritime" });
assert.equal(created.status, 201);
const co = created.data.company;
assert.match(co.id, /^co_[a-z0-9]{10}$/);
assert.match(co.code, /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
assert.equal(co.code_active, true); assert.equal(co.spec_updated_at, null);
assert.ok(co.access_url.endsWith("/")); ok("create by name → id + 16-character access code (80 bits)");
assert.equal((await call("POST", "/api/admin/companies", { name: "kongsberg maritime" })).status, 409); ok("duplicate name refused");

/* ---- access */
const landing = await call("GET", "/", undefined, "");
assert.equal(landing.status, 200); assert.match(landing.data, /access\.js/);
assert.equal(landing.headers.get("referrer-policy"), "no-referrer");
assert.match(landing.headers.get("x-robots-tag"), /noindex/); ok("landing page asks for the code (no-referrer, noindex)");
assert.equal((await call("GET", "/spec", undefined, "")).headers.get("location"), "/"); ok("/spec without a session → back to the code page");
assert.equal((await call("GET", "/c/kongsberg/abcdefghijklmnopqrstuvwxyz", undefined, "")).headers.get("location"), "/"); ok("old /c/ links redirect to the code page");
assert.equal((await signIn("AAAA-BBBB-CCCC-DDDD")).status, 401); ok("wrong code → 401");
const messy = co.code.toLowerCase().replace(/-/g, " ").replace(/0/g, "o").replace(/1/g, "l");
const s1 = await signIn(messy);
assert.equal(s1.status, 200); assert.match(s1.raw, /HttpOnly; SameSite=Lax/); ok("code accepted forgivingly (case, spaces, O/0, L/1) → HttpOnly session");
const A = s1.cookie;
const B = (await signIn(co.code)).cookie;   // a colleague on another device
assert.equal((await call("GET", "/", undefined, A)).headers.get("location"), "/spec");
const sp = await call("GET", "/spec", undefined, A);
assert.equal(sp.status, 200); assert.match(sp.data, /"mode":"spec"/); assert.match(sp.data, /Kongsberg Maritime/); ok("session opens the company's specification page");
assert.equal((await call("GET", "/api/s/spec", undefined, "")).status, 401); ok("spec API refuses without a session");

/* ---- one specification, conflict detection */
const g0 = await call("GET", "/api/s/spec", undefined, A);
assert.equal(g0.data.response, null); assert.equal(g0.data.updated_at, null);
assert.equal((await call("PUT", "/api/s/spec", { response: { schema: "other" }, base_updated_at: null }, A)).status, 422); ok("non-survey payload rejected");
const p1 = await call("PUT", "/api/s/spec", { response: spec(10), base_updated_at: null }, A);
assert.equal(p1.status, 200); assert.equal(p1.data.version, 1); assert.equal(p1.data.snapshot, true); ok("first save creates the specification and version 1");
const g1 = await call("GET", "/api/s/spec", undefined, B);
assert.equal(g1.data.updated_at, p1.data.updated_at);
assert.equal(g1.data.response.respondent.organisation, "Kongsberg Maritime");
assert.equal(g1.data.response.interview, undefined);
assert.ok(!JSON.stringify(g1.data).includes("Jane Doe")); ok("everyone with the code sees the same spec; server stamps the company, drops names");
const p2 = await call("PUT", "/api/s/spec", { response: spec(20), base_updated_at: p1.data.updated_at }, A);
assert.equal(p2.status, 200); assert.equal(p2.data.snapshot, false); assert.equal(p2.data.version, 1); ok("ordinary sync within 15 minutes takes no new version");
const stale = await call("PUT", "/api/s/spec", { response: spec(30), base_updated_at: p1.data.updated_at }, B);
assert.equal(stale.status, 409); assert.equal(stale.data.updated_at, p2.data.updated_at); assert.equal(stale.data.response.completion, 20); ok("stale base → 409 with the current state to merge");
const p3 = await call("PUT", "/api/s/spec", { response: spec(30, { q1: "Sustainability", q79: "Data silos" }), base_updated_at: stale.data.updated_at, snapshot: "export" }, B);
assert.equal(p3.status, 200); assert.equal(p3.data.version, 2); ok("retry on the fresh base succeeds; export takes version 2");
const p4 = await call("PUT", "/api/s/spec", { response: spec(40, { q1: "Sustainability", q79: "Data silos", q80: "Contracts" }), base_updated_at: p3.data.updated_at, snapshot: "manual" }, A);
assert.equal(p4.data.version, 3);

/* ---- versions and restore */
const vl = await call("GET", "/api/s/versions", undefined, A);
assert.deepEqual(vl.data.versions.map((v) => v.n), [3, 2, 1]);
assert.deepEqual(vl.data.versions.map((v) => v.reason), ["manual", "export", "first"]); ok("version list: manual / export / first");
const v1 = await call("GET", "/api/s/versions/1", undefined, A);
assert.equal(v1.data.response.completion, 10);
const dl = await call("GET", "/api/s/versions/2?download", undefined, A);
assert.match(dl.headers.get("content-disposition"), /baerel-kravspesifikasjon-kongsberg-maritime-v2-\d{8}-\d{4}\.json/); ok("any version can be viewed and downloaded");
const rs = await call("POST", "/api/s/versions/1/restore", {}, A);
assert.equal(rs.status, 200); assert.equal(rs.data.response.completion, 10); assert.equal(rs.data.version, 5);
const vl2 = (await call("GET", "/api/s/versions", undefined, A)).data.versions;
assert.deepEqual(vl2.slice(0, 2).map((v) => v.reason), ["restored-v1", "before-restore"]);
assert.equal(vl2[1].completion, 40);
assert.equal((await call("GET", "/api/s/spec", undefined, B)).data.response.completion, 10); ok("restore: current state saved as 'before-restore', then v1 becomes live — nothing lost");
const undo = await call("POST", "/api/s/versions/4/restore", {}, B);
assert.equal(undo.data.response.completion, 40); ok("a restore can itself be undone");
assert.equal((await call("POST", "/api/s/versions/99/restore", {}, A)).status, 404);

/* ---- admin view */
const list = (await call("GET", "/api/admin/companies")).data.companies;
const c2 = list.find((x) => x.id === co.id);
assert.equal(c2.spec_completion, 40); assert.equal(c2.version_count, 7);
const av = await call("GET", `/api/admin/companies/${co.id}/versions/2`);
assert.equal(av.status, 200); assert.equal(av.data._server.version, 2);
assert.equal((await call("GET", `/api/admin/companies/${co.id}/versions/2`, undefined, A)).status, 401);
const ar = await call("POST", `/api/admin/companies/${co.id}/versions/3/restore`, {});
assert.equal(ar.status, 200);
const subs = await call("GET", `/api/admin/companies/${co.id}/submissions`);
assert.equal(subs.data.responses.length, 1); assert.equal(subs.data.responses[0].completion, 40); ok("admin sees one spec per company, its versions, can download and restore");

/* ---- images */
{
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
  const upl = async (cookie, body, type) => { const r = await fetch(`${BASE}/api/s/attachments`, { method: "POST", headers: { "content-type": type, cookie }, body }); return { status: r.status, data: await r.json().catch(() => ({})) }; };
  const im = await upl(A, jpeg, "image/jpeg");
  assert.equal(im.status, 201); assert.match(im.data.id, /^img_/);
  assert.equal((await upl(A, Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), "image/svg+xml")).status, 415);
  assert.equal((await upl(A, Buffer.from("not really a jpeg"), "image/jpeg")).status, 415);
  const g = await fetch(`${BASE}/api/s/attachments/${im.data.id}`, { headers: { cookie: B } });
  assert.equal(g.status, 200); assert.equal(g.headers.get("content-type"), "image/jpeg");
  const other = (await call("POST", "/api/admin/companies", { name: "Other Co" })).data.company;
  const O = (await signIn(other.code)).cookie;
  assert.equal((await fetch(`${BASE}/api/s/attachments/${im.data.id}`, { headers: { cookie: O } })).status, 404);
  assert.equal((await call("GET", "/api/s/spec", undefined, O)).data.response, null);
  assert.equal((await call("GET", `/api/admin/attachments/${im.data.id}`)).status, 200);
  ok("images: only real images; isolated per company; other company's code sees nothing of ours");
}

/* ---- sample data files */
{
  const upS = async (cookie, name, body) => { const r = await fetch(`${BASE}/api/s/samples`, { method: "POST", headers: { cookie, "x-file-name": encodeURIComponent(name), "content-type": "application/octet-stream" }, body }); return { status: r.status, data: await r.json().catch(() => ({})) }; };
  const csv = Buffer.from("serial,repair,date\nA123,battery,2026-01-02\n");
  const f1 = await upS(A, "Reparasjonslogg ø.csv", csv);
  assert.equal(f1.status, 201); assert.match(f1.data.id, /^smp_/); assert.equal(f1.data.name, "Reparasjonslogg ø.csv");
  assert.equal((await upS(A, "../../etc/evil.csv", csv)).data.name, "evil.csv");
  assert.equal((await upS(A, "tool.exe", Buffer.from("MZ...."))).status, 415);
  assert.equal((await upS(A, "renamed.csv", Buffer.from([0x4d, 0x5a, 0x90, 0x00]))).status, 415);
  assert.equal((await upS(A, "page.html", Buffer.from("<script>alert(1)</script>"))).status, 415);
  assert.equal((await upS(A, "noext", csv)).status, 415);
  assert.equal((await upS("", "a.csv", csv)).status, 401);
  ok("sample upload: listed types only, executables refused by content, names cleaned, needs a session");
  const dlS = await fetch(`${BASE}/api/s/samples/${f1.data.id}`, { headers: { cookie: B } });
  assert.equal(dlS.status, 200); assert.equal(dlS.headers.get("content-type"), "application/octet-stream");
  assert.match(dlS.headers.get("content-disposition"), /^attachment; filename=.*filename\*=UTF-8''Reparasjonslogg%20%C3%B8\.csv$/);
  assert.match(dlS.headers.get("content-security-policy"), /sandbox/);
  assert.equal(Buffer.from(await dlS.arrayBuffer()).toString(), csv.toString()); ok("sample download: always an attachment, sandboxed, byte-exact");
  const cur = (await call("GET", "/api/s/spec", undefined, A)).data;
  const withSamples = spec(40, { q1: "Sustainability", q79: "Data silos", q80: "Contracts" });
  withSamples.answers.push({ id: "q228", type: "samples", selected: [0], samples: [{ status: "available", title: "Repair log", format: 0, files: [{ id: f1.data.id, name: f1.data.name, size: f1.data.size }] }, { status: "desired", title: "Field telemetry", format: 8, files: [] }] });
  assert.equal((await call("PUT", "/api/s/spec", { response: withSamples, base_updated_at: cur.updated_at }, A)).status, 200);
  const z = await fetch(`${BASE}/api/admin/companies/${co.id}/samples.zip`, { headers: { cookie: admin } });
  assert.equal(z.status, 200); assert.equal(z.headers.get("content-type"), "application/zip");
  const zb = Buffer.from(await z.arrayBuffer());
  assert.equal(zb.readUInt32LE(0), 0x04034b50);
  const zs = zb.toString("latin1");
  assert.ok(zs.includes("samples.json")); assert.ok(zs.includes("01-repair-log/")); assert.ok(zs.includes("serial,repair,date"));
  assert.ok(zs.includes("Field telemetry"));
  assert.equal((await fetch(`${BASE}/api/admin/companies/${co.id}/samples.zip`)).status, 401);
  const cv = (await call("GET", "/api/admin/companies")).data.companies.find((x) => x.id === co.id);
  assert.equal(cv.sample_files, 2);
  ok("admin: ZIP with one folder per sample plus a manifest; file counts on the company");
  const other2 = (await call("POST", "/api/admin/companies", { name: "Third Co" })).data.company;
  const T3 = (await signIn(other2.code)).cookie;
  assert.equal((await fetch(`${BASE}/api/s/samples/${f1.data.id}`, { headers: { cookie: T3 } })).status, 404); ok("sample files isolated per company");
}

/* ---- close, rotate, revoke */
assert.equal((await call("POST", `/api/admin/companies/${co.id}/close`, {})).data.company.submissions_open, false);
assert.equal((await call("PUT", "/api/s/spec", { response: spec(50), base_updated_at: null }, A)).status, 423);
assert.equal((await call("POST", "/api/s/versions/1/restore", {}, A)).status, 423);
assert.equal((await call("GET", "/api/s/spec", undefined, A)).data.company.open, false); ok("closed: readable, refuses saves and restores (423)");
await call("POST", `/api/admin/companies/${co.id}/reopen`, {});

const rot = await call("POST", `/api/admin/companies/${co.id}/rotate`, {});
const code2 = rot.data.company.code;
assert.notEqual(code2, co.code); assert.equal(rot.data.company.code_generations, 2);
assert.equal((await call("GET", "/api/s/spec", undefined, A)).status, 401);
assert.equal((await call("GET", "/spec", undefined, B)).headers.get("location"), "/");
assert.equal((await signIn(co.code)).status, 401); ok("new code: old code refused and every open session signed out");
const A2 = (await signIn(code2)).cookie;
assert.equal((await call("GET", "/api/s/spec", undefined, A2)).data.response.completion, 40); ok("new code opens the same specification");

const rv = await call("POST", `/api/admin/companies/${co.id}/revoke`, {});
assert.equal(rv.data.company.code_active, false); assert.equal(rv.data.company.code, null);
assert.equal((await call("GET", "/api/s/spec", undefined, A2)).status, 401);
assert.equal((await signIn(code2)).status, 401); ok("revoke: no code works, sessions end");

/* ---- misc */
const exp = await call("GET", "/api/admin/export");
assert.equal(exp.data.responses.length, 1); ok("full export: one spec per company that has started");
const form = await fetch(BASE + "/api/admin/companies", { method: "POST", headers: { cookie: admin, "content-type": "application/x-www-form-urlencoded" }, body: "name=Evil" });
assert.equal(form.status, 415);
const form2 = await fetch(BASE + "/api/access", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "code=x" });
assert.equal(form2.status, 415); ok("form-encoded (cross-site style) POSTs refused");
let limitedHit = false;
for (let i = 0; i < 12; i++) if ((await signIn("ZZZZ-ZZZZ-ZZZZ-ZZZZ")).status === 429) limitedHit = true;
assert.ok(limitedHit); ok("code guessing is rate-limited");

console.log("\nAll checks passed.");
stop();
process.exit(0);
