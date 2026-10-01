# Bærel requirements: self-reported requirements specifications

The Bærel **self-reported requirements specification** for a circular-electronics data platform. Each organisation fills in **one** shared specification of its own. No personal names are collected: question 1 asks which *roles* contributed, and the follow-up contact asks for a functional address.

1. The admin opens `/admin`, clicks **Add company** and types a name, for example `Kongsberg Maritime`.
2. The server creates the company, an internal ID (`co_n8kjkugfsx`) and a random **access code**, e.g. `7KQX-M2PD-9WRT-HB4N` (16 Crockford base32 characters, 80 bits).
3. The admin clicks **Copy code** or **Copy invitation** (Norwegian and English text with the site address and the code) and sends it to the company.
4. Anyone at the company opens the site, types the code and lands on the company's specification. Case, spaces and dashes don't matter; O is read as 0 and I/L as 1.
5. The admin can **Generate new code** (the old code stops working at once and every open session is signed out), **Revoke access**, **Close / Reopen for changes**, open **Analysis**, download the JSON, and list, download or restore **Versions**.

## One living specification per company

There is one version of the questionnaire: the full specification, 194 questions in 20 sections. No question is mandatory, and the work can be split between several people at the company, since they all edit the same document.


- **Shared document.** Everyone with the code works in the same specification. It saves to the server about five seconds after each change, and a working copy is kept in the browser.
- **Simultaneous editing.** Every save carries the timestamp of the state it was based on. If someone else saved in between, the server answers `409` with its current state, and the browser merges question by question: what changed locally wins, everything else is taken from the server, then it saves again. Two people answering different questions at the same time both keep their answers. If both change the *same* question, the last save wins, and the other value is still in the version history.
- **Versions.** The server keeps timestamped versions. It takes one on the first save, on every export, whenever someone clicks **Save a version now**, and automatically when the latest version is older than `VERSION_EVERY_MIN` minutes (default 15). The start page and the summary page list them, and any version can be downloaded.
- **Restore.** **Restore** on an older version first saves the current state as a version (`before-restore`) and then makes the chosen version live (`restored-vN`). Nothing is lost, and a restore can itself be undone. The admin can restore from the console too.
- **Signed out mid-work.** If the code is replaced while someone is working, their next save is refused. The page says so, and the unsaved changes stay in the browser and are merged in once a valid code is entered.
- **Sign out.** **Logg ut / Sign out** saves, ends the session and removes the local copy from the browser (useful on shared devices).
- **Export.** **Export ▾** in the top bar works on every page. It offers a readable document (HTML), data (JSON) and a table (CSV), e.g. `baerel-kravspesifikasjon-kongsberg-maritime-20261001-1401-v3.json`. A JSON export can be opened again with **Open an exported specification**. Importing replaces the content as a new save, so earlier versions remain restorable.

## Upgrading from the link/interview version

On first start the server migrates the database in place:

- Each company's private link is replaced by an access code. Old `/c/…` links redirect to the code page. The admin needs to send each company its new code.
- Each company's specification is seeded from its most recently changed interview, as version 1 (`migrated`), with interviewer and interviewee names removed.
- Older interviews stay in the database untouched, but are no longer shown.

## Platform features derived from the answers

The questions do more than collect opinions: they decide which features the data platform must have. `public/features.js` holds a catalogue of 46 features in seven areas (ingestion and integration, data model and storage, trust and governance, product passport and compliance, sustainability, AI and agents, operations and sharing). Each feature lists the answers that argue for it, with a weight:

- **any** — one of the listed options is selected
- **scale** — rated at or above a threshold
- **count** — at least *n* options selected

Negative weights argue against a feature; for example, "no agent access at all" counts against the agent interface. The sum gives the priority: ≥ 4 **must have**, ≥ 2 **should have**, ≥ 1 **could have**, otherwise not indicated.

- **Plattformfunksjoner / Platform features** (tab in the top bar) shows every feature with its priority and the exact answers behind it. Each answer links back to its question. The view also shows options that configure the feature (e.g. which systems the connectors must reach) and a **platform profile**: latency, volume, retention, hosting, jurisdiction, agent autonomy, passport granularity, budget and so on.
- **Under every question** a line says which features the answer shapes, and links to them.
- The feature list goes into the JSON (`platform_features`), the readable HTML document, and the summary page. The admin analysis counts, across organisations, how many have each feature as must or should.

To tune the derivation, edit the weights in `features.js`.

## Sample data

Section 3 of the specification, **Eksempeldata / Sample data**, lets the organisation add one card per dataset. Each card records:

- whether the data is **available today** or **desired**
- name, description, source system, format and volume
- what kind of data it is: synthetic, anonymised, real but not sensitive, or sensitive
- which usage scenario it supports
- the files themselves

A follow-up question asks what the project may use the samples for.

- **Files.** Up to 25 MB each (`MAX_SAMPLE_MB`), and 300 MB / 500 files per company (`MAX_SAMPLE_MB_PER_COMPANY`, `MAX_SAMPLE_FILES_PER_COMPANY`). Files are stored in the database per company and readable only with that company's code session or by the admin.
- **Accepted types.** Only an allowlist of data, document, image, CAD and archive extensions. Executables are refused by their content, whatever they are called. Files are always served as downloads (`application/octet-stream`, `attachment`, CSP `sandbox`), never rendered.
- **Sensitive data.** Choosing "sensitive" removes the upload button for that sample, so it can only be described.
- **Feeding the features.** The formats of the samples count towards the platform features. For example, PDF samples argue for document extraction and sensor logs for a time-series store.
- **Admin download.** **Sample data (ZIP)** on the company card downloads every file in the company's specification, one folder per sample, with a `samples.json` manifest.

## Scenario images

Each usage scenario can carry up to six images, each with an optional caption. The browser downscales them to 1600 px JPEG before upload, so a 5 MB phone photo is stored at roughly 150–300 KB. The server accepts only real JPEG, PNG or WebP files (checked by their magic bytes, never SVG). Images are stored in the database and can be read only with the owning company's code session or by the admin. Limits per company: `MAX_IMAGES_PER_COMPANY` (2000) and `MAX_IMAGE_MB_PER_COMPANY` (600). Exported documents and JSON files embed the images, so they work without the server.

## Run

Requires Node 22.5 or later. There are no npm dependencies: it uses `node:http` and the built-in `node:sqlite`.

```sh
ADMIN_PASSWORD='at-least-12-characters' PUBLIC_URL=https://requirements.example.com npm start
npm test        # 35 end-to-end checks against a throwaway database
```

Docker: `docker build -t baerel . && docker run -p 8080:8080 -v baerel-data:/data -e ADMIN_PASSWORD=… -e PUBLIC_URL=… baerel`

### Render

`render.yaml` is a Blueprint for a single Docker web service with a persistent disk, running in Frankfurt.

1. Push this folder to a GitHub or GitLab repo.
2. In Render, choose **New → Blueprint** and pick the repo. Render will ask for `ADMIN_PASSWORD` and `PUBLIC_URL`, and generates `SESSION_SECRET` itself.
3. Once it's live, set `PUBLIC_URL` to the service URL or your custom domain, then redeploy. The invitation text uses it as the site address.

This costs the Starter instance plus 1 GB of disk. The free tier can't be used: it has no persistent disk, so the SQLite database would be wiped on every deploy or restart. Because a disk is attached, the service runs as one instance, and each deploy causes a few seconds of downtime. Neither matters for a survey.

Run it behind TLS (Caddy, nginx or the platform's proxy). The access code and the session cookie are credentials, so plain HTTP isn't acceptable in production.

| Variable | Default | |
|---|---|---|
| `ADMIN_PASSWORD` | required | at least 12 characters |
| `PUBLIC_URL` | taken from the request Host | site address used in the invitation text |
| `DB_PATH` | `./data/baerel.sqlite` | back up this file, since it holds every response |
| `SESSION_SECRET` | generated and stored in the DB | set it to share sessions across instances |
| `PORT` / `HOST` | `8080` / `0.0.0.0` | |
| `CODE_SESSION_DAYS` | `14` | how long a code sign-in lasts |
| `VERSION_EVERY_MIN` | `15` | minutes between automatic versions |
| `MAX_VERSIONS_PER_COMPANY` | `2000` | caps stored versions |

## Design decisions

- **The code is the only credential a company holds.** It is 80 random bits. Guessing is limited to 10 attempts per 15 minutes per address, so it is far out of reach. Entering it gives an HMAC-signed `HttpOnly; SameSite=Lax` cookie bound to the company *and* a fingerprint of the current code, which is why a new code signs everyone out at once.
- **Rotation keeps the specification.** A new code replaces access, never content: the company, its ID, the specification and all versions stay.
- **Closed means read-only, not gone.** The specification still opens and can be exported, but saves and restores return `423`.
- **The server is the authority on organisation.** It sets `respondent.organisation` to the company name and drops any interviewer/interviewee block a client might send.
- **Codes are stored in plaintext,** so the admin can copy one again at any time. The database already holds every specification, so it must be protected in any case.
- **Nothing leaks by accident.** Responses use `Referrer-Policy: no-referrer`, `noindex`, `no-store`, a strict CSP and `frame-ancestors 'none'`.
- **Admin is a single password.** It gives an HMAC-signed `HttpOnly; SameSite=Strict` cookie, with logins limited to 10 attempts per 15 minutes. All write requests must be JSON (form posts are refused), which blocks cross-site forms.
- **Audit log.** Company creation, code changes, sign-ins, restores, closing and reopening are written to the `audit` table.

## Layout

```
server.js            routes, database schema, auth, validation
public/access.html   code-entry page (public/access.js)
public/index.html    specification shell; the server injects boot data (mode, company)
public/app.js        the specification: sync and merge, versions and restore, features view, sample data, export, analysis
public/features.js   feature catalogue, weights and platform profile — how answers become platform features
public/admin.js      admin console
public/styles.css    survey styles plus workspace/admin additions
test/smoke.mjs       lifecycle test
```

The `mode` field in the boot data sets how the page behaves: `spec` (the company's specification, after entering the code) or `admin-analysis` (the analysis view, loaded from the server). Without boot data it works on its own, with a local draft and file export.
