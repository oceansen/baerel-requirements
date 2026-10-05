# Bærel requirements: self-reported requirements specifications

The Bærel **self-reported requirements specification** for a circular-electronics data platform. Each organisation fills in **one** shared specification of its own. No personal names are collected: question 1 asks which *roles* contributed, and the follow-up contact asks for a functional address.

1. The admin opens `/admin`, clicks **Add company** and types a name, for example `Kongsberg Maritime`.
2. The server creates the company, an internal ID (`co_n8kjkugfsx`) and a random **access code**, e.g. `7KQX-M2PD-9WRT-HB4N` (16 Crockford base32 characters, 80 bits).
3. The admin clicks **Copy code** or **Copy invitation** (Norwegian and English text with the site address and the code) and sends it to the company.
4. Anyone at the company opens the site, types the code and lands on the company's specification. Case, spaces and dashes don't matter; O is read as 0 and I/L as 1.
5. The admin can **Generate new code** (the old code stops working at once and every open session is signed out), **Revoke access**, **Close / Reopen for changes**, open **Analysis**, download the JSON, and list, download or restore **Versions**.

## An example in every invitation

The admin console has an **Example in invitations** panel. Choose a filled-in specification (for example a fictional test company) and every **Copy invitation** text gets an extra paragraph, in Norwegian and English, with that company's code. Invited companies can then open a completed example before they start, and sign out to enter their own code.

- The example should be **closed for changes**, since everyone invited gets its code. The panel warns while it is still open, and the invitation only calls it read-only once it is closed.
- The invitation always uses the example's current code, so generating a new code for it needs no other change. With no active code, the example is left out.
- The example company's own invitation never mentions itself.

## Question sets: full or lean

The admin console has a **Question set** switch:

- **Full.** 207 questions in 21 sections. This is the default.
- **Lean.** 50 questions in 5 sections: needs, scenarios and data; data model, trust and sovereignty; product passport, footprint and LCA; AI, automation and operations; cost, the future and priorities.

`public/questions-lean.js` builds the lean set from the full bank:

- 44 questions are reused exactly (same id and options), so their answers carry over both ways.
- Two are new merges: q243 (critical platform properties) and q244 (concerns).
- Four free-text questions get a broader wording.

Switching takes effect when a company opens or reloads its page. It never deletes anything: answers to questions outside the lean set stay stored and reappear with the full set.

In the lean set, platform-feature thresholds scale to the signals that are still asked, and features with no question behind them are hidden.

The state before this option was added is kept on the branch `restore/full-207`.

## One living specification per company

There is one version of the questionnaire: the full specification, 207 questions in 21 sections. No question is mandatory, and the work can be split between several people at the company, since they all edit the same document.


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

The questions do more than collect opinions: they decide which features the data platform must have. `public/features.js` holds a catalogue of 48 features in seven areas (ingestion and integration, data model and storage, trust and governance, product passport and compliance, sustainability, AI and agents, operations and sharing). Each feature lists the answers that argue for it, with a weight:

- **any** — one of the listed options is selected
- **scale** — rated at or above a threshold
- **count** — at least *n* options selected

Negative weights argue against a feature; for example, "no agent access at all" counts against the agent interface. The sum gives the priority: ≥ 4 **must have**, ≥ 2 **should have**, ≥ 1 **could have**, otherwise not indicated.

- **Plattformfunksjoner / Platform features** (tab in the top bar) shows every feature with its priority and the exact answers behind it. Each answer links back to its question. The view also shows options that configure the feature (e.g. which systems the connectors must reach) and a **platform profile**: latency, volume, retention, hosting, jurisdiction, agent autonomy, passport granularity, budget and so on.
- **Under every question** a line says which features the answer shapes, and links to them.
- The feature list goes into the JSON (`platform_features`), the readable HTML document, and the summary page. The admin analysis counts, across organisations, how many have each feature as must or should.

To tune the derivation, edit the weights in `features.js`.

## Life cycle assessment (LCA)

Section 7, **Livsløpsvurdering (LCA)**, follows the carbon-footprint section and asks what the platform must do to support LCA in the circular electronics value chain, referring to the standards that apply in Norway and Europe:

- **Practice and modelling.** Current LCA practice, and who should model once the platform runs.
- **Rules.** Product category rules and supporting standards: EN 50693, ITU-T L.1410 / ETSI ES 203 199, PEFCR, EPD-Norge PCR, ISO 14071, ISO/TS 14048, ISO 14046, ISO 59020, EN 45552–45559, EN 50625 / EN 50614.
- **Model choices.** System boundaries and multiple life cycles; allocation for reuse and recycling (including PEF's Circular Footprint Formula); background data such as ecoinvent, EF 3.1 and EPDs; the Norwegian electricity mix (location-based, residual mix after guarantees of origin, market-based); impact categories beyond climate.
- **Exchange and traceability.** Exchange formats (ILCD, ecoSpold2, openLCA, PACT, digital EPDs); what must be stored for results to be reproducible; automatic recalculation.
- **Labels and claims.** Ecolabels, claim rules and procurement requirements: Nordic Swan Ecolabel, EU Ecolabel, TCO Certified, EPEAT, Norwegian procurement regulation § 7-9, the Consumer Authority's guidance on sustainability claims, and Directive (EU) 2024/825.

Every standard has a glossary entry with a source link. The answers feed two features, **LCA engine with traceable models** and **LCA data exchange and background databases**, and the platform profile gains allocation and electricity mix.

## Sample data

Section 3, **Eksempeldata / Sample data**, has two kinds of entry, added separately with their own buttons:

- **Sample data**, one card per dataset: whether it is **available today** or **desired**; name, description, source system, format and volume; what kind of data it is (synthetic, anonymised, real but not sensitive, or sensitive); the usage scenario it supports; and the files.
- **Metadata**, one card per metadata description: available or desired; name; which dataset or system it describes (optional, with the data samples' names offered); the metadata standard (DCAT-AP-NO / DCAT-AP, Dublin Core, JSON Schema, XSD, SHACL/OWL, AAS submodel templates, ECLASS, CSVW, a data dictionary, an internal model or none); what metadata exists; and example files such as schemas, data dictionaries or catalogue records.

Metadata can be given without any data, for example when the data itself is sensitive. Entries saved in the earlier combined format are split into a data card and a metadata card automatically.

A follow-up question asks what the project may use the samples for.

- **Files.** Up to 25 MB each (`MAX_SAMPLE_MB`), and 300 MB / 500 files per company (`MAX_SAMPLE_MB_PER_COMPANY`, `MAX_SAMPLE_FILES_PER_COMPANY`). Files are stored in the database per company and readable only with that company's code session or by the admin.
- **Accepted types.** Only an allowlist of data, document, image, CAD and archive extensions. Executables are refused by their content, whatever they are called. Files are always served as downloads (`application/octet-stream`, `attachment`, CSP `sandbox`), never rendered.
- **Sensitive data.** Choosing "sensitive" removes the upload button for that sample, so it can only be described.
- **Feeding the features.** The formats of the samples count towards the platform features: PDF samples argue for document extraction, and sensor logs for a time-series store. Named metadata standards count towards the data catalogue and standards-based models.
- **Admin download.** **Sample data (ZIP)** on the company card downloads every file in the company's specification, one folder per data sample and one per metadata entry, with a `samples.json` manifest.

## Scenario images

Each usage scenario can carry up to six images, each with an optional caption. The browser downscales them to 1600 px JPEG before upload, so a 5 MB phone photo is stored at roughly 150–300 KB. The server accepts only real JPEG, PNG or WebP files (checked by their magic bytes, never SVG). Images are stored in the database and can be read only with the owning company's code session or by the admin. Limits per company: `MAX_IMAGES_PER_COMPANY` (2000) and `MAX_IMAGE_MB_PER_COMPANY` (600). Exported documents and JSON files embed the images, so they work without the server.

## Run

Requires Node 22.5 or later. There are no npm dependencies: it uses `node:http` and the built-in `node:sqlite`.

```sh
ADMIN_PASSWORD='at-least-12-characters' PUBLIC_URL=https://requirements.example.com npm start
npm test        # 36 end-to-end checks against a throwaway database
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
