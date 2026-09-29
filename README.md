# Bærel requirements: company workspaces

The Bærel **interview guide**, served with admin-generated company workspaces. An interviewer runs it in conversation with someone from the company. There is an optional note on every answer option, plus a note per question and interview details (interviewer, interviewee, date). Notes are saved with the draft, stored on submission, shown in the analysis view and included in the JSON and CSV exports.

1. The admin opens `/admin`, clicks **Add company** and types a name, for example `Kongsberg Maritime`.
2. The server creates the workspace, an internal ID (`co_n8kjkugfsx`), a 256-bit secret token and the private link:
   `https://requirements.example.com/c/kongsberg-maritime/9XGpt3q8IiGbagIeY2VfFTgr69BqRc8uIsocViI-WPo`
3. The admin clicks **Copy link** or **Copy invitation** (Norwegian and English email text) and sends it to the company's contact.
4. Anyone with the link can open the workspace and submit their own response, then update it later from the same browser.
5. The admin can **Generate new link** (the old one returns 410), **Revoke link**, **Close / Reopen submissions**, open **Analysis** or download the JSON.

## Living interview documents

- **Auto-sync.** In a workspace, the interview saves itself to the server about five seconds after each change. The status line shows when it last synced and which version is current.
- **Versions.** The server keeps timestamped versions of each interview. It takes one on first save, on every export, whenever the interviewer clicks **Save a version now**, and automatically when the latest version is older than `VERSION_EVERY_MIN` minutes (default 15). In the admin console, **Interviews and versions** lists every interview and lets you download any version.
- **Export.** **Export ▾** in the top bar works on every page, at any time. It offers a readable document (HTML), data (JSON) and a table (CSV). Filenames carry the date, time and a running number, e.g. `baerel-intervju-kongsberg-maritime-h-k-20260929-1401-v3.json`.
- **Re-open.** A JSON export includes the full draft. **Open an exported interview** on the start page restores it on any device, so it can be updated and exported again.

## Scenario images

Each usage scenario can carry up to six images, each with an optional caption. The browser downscales them to 1600 px JPEG before upload, so a 5 MB phone photo is stored at roughly 150–300 KB. The server accepts only real JPEG, PNG or WebP files (checked by their magic bytes, never SVG). Images are stored in the database and can be read only through the owning company's link or by the admin. Limits per company: `MAX_IMAGES_PER_COMPANY` (2000) and `MAX_IMAGE_MB_PER_COMPANY` (600). Exported documents and JSON files embed the images, so they work without the server.

## Run

Requires Node 22.5 or later. There are no npm dependencies: it uses `node:http` and the built-in `node:sqlite`.

```sh
ADMIN_PASSWORD='at-least-12-characters' PUBLIC_URL=https://requirements.example.com npm start
npm test        # 21 end-to-end checks against a throwaway database
```

Docker: `docker build -t baerel . && docker run -p 8080:8080 -v baerel-data:/data -e ADMIN_PASSWORD=… -e PUBLIC_URL=… baerel`

### Render

`render.yaml` is a Blueprint for a single Docker web service with a persistent disk, running in Frankfurt.

1. Push this folder to a GitHub or GitLab repo.
2. In Render, choose **New → Blueprint** and pick the repo. Render will ask for `ADMIN_PASSWORD` and `PUBLIC_URL`, and generates `SESSION_SECRET` itself.
3. Once it's live, set `PUBLIC_URL` to the service URL or your custom domain, then redeploy. Links are built from `PUBLIC_URL`, so set it before creating companies.

This costs the Starter instance plus 1 GB of disk. The free tier can't be used: it has no persistent disk, so the SQLite database would be wiped on every deploy or restart. Because a disk is attached, the service runs as one instance, and each deploy causes a few seconds of downtime. Neither matters for a survey.

Run it behind TLS (Caddy, nginx or the platform's proxy). The token is a bearer credential in the URL, so plain HTTP isn't acceptable in production.

| Variable | Default | |
|---|---|---|
| `ADMIN_PASSWORD` | required | at least 12 characters |
| `PUBLIC_URL` | taken from the request Host | base URL used in generated links |
| `DB_PATH` | `./data/baerel.sqlite` | back up this file, since it holds every response |
| `SESSION_SECRET` | generated and stored in the DB | set it to share sessions across instances |
| `PORT` / `HOST` | `8080` / `0.0.0.0` | |
| `MAX_SUBMISSIONS_PER_COMPANY` | `300` | limits damage if a link leaks |

## Design decisions

- **The token is the only credential. The slug is cosmetic.** A wrong or outdated slug gets a 301 redirect to the current one. The internal ID never appears in the link.
- **Rotation keeps the workspace intact.** Generating a new link revokes the old token but keeps the company, its ID and its submissions. Contributors' edit keys still work.
- **Closed means read-only, not gone.** The workspace still opens and shows who contributed, but writes return `423`. Contributors can still download their answers as a file.
- **One response per person, not a shared form.** Every contributor submits their own response and gets a private edit key stored in their browser. Other people with the link see each contribution's role, completion and date, but not the answers. This matches how the survey is designed: it asks each respondent about their own role.
- **The workspace is the authority on organisation.** The server sets `respondent.organisation` to the company name. Whatever the person typed is kept as `organisation_stated`.
- **Tokens are stored in plaintext.** This lets the admin copy a link again at any time. Hashing them would force a rotation whenever a link was misplaced. The database already holds every response, so it must be protected in any case.
- **The link can't leak by accident.** Responses use `Referrer-Policy: no-referrer` (otherwise the Google Fonts request would carry the token), `noindex`, `no-store`, a strict CSP and `frame-ancestors 'none'`.
- **Admin is a single password.** It gives an HMAC-signed `HttpOnly; SameSite=Strict` cookie. Logins are limited to 10 attempts per 15 minutes. Admin write requests must be sent as JSON (form posts are refused), which blocks cross-site forms. For more than one admin, put it behind the organisation's SSO proxy.
- **Audit log.** Company creation, rotation, revocation, closing and reopening, submissions and logins are written to the `audit` table.

## Layout

```
server.js            routes, database schema, auth, validation
public/index.html    survey shell; the server injects boot data (mode, token, company)
public/app.js        survey with workspace mode (submit/update, contributors, closed state) and admin-analysis mode
public/admin.js      admin console
public/styles.css    survey styles plus workspace/admin additions
test/smoke.mjs       lifecycle test
```

The `mode` field in the boot data sets how the survey page behaves: `workspace` (opened from a company link) or `admin-analysis` (the existing analysis view, loaded with responses from the server). Without boot data it works as before, with a local draft and file export.
