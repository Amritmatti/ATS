# ATS Resume Pro

A local, offline resume builder that scores your resume the way an applicant tracking
system ranks it, and tells you exactly what to change to score higher.

Nothing leaves your machine — there is no backend, no account and no upload. Your work
autosaves to browser local storage and can be exported as a project file.

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # static bundle in dist/
```

### Make

```bash
make            # list targets
make up         # git pull --ff-only, then docker compose up -d --build
make logs       # follow container logs
make health     # check the app answers over HTTP
make down       # stop and remove the container
make clean      # also drop volumes and the built image
```

`make up` fast-forwards the checkout first, so a stale clone can never be built. If the
directory is not a git repo, or the branch has no upstream, the pull is skipped with a
notice rather than failing the build.

The host port lives in one place and flows from the Makefile into compose:

```bash
make up ATS_PORT=9000      # http://localhost:9000
```

GNU Make is not bundled with Windows — `choco install make`, `winget install
ezwinports.make`, or run the targets from WSL.

### Docker directly

```bash
docker compose up -d --build          # http://localhost:8100
docker compose logs -f app
docker compose down
```

The `Dockerfile` is multistage:

| Stage | Does |
| --- | --- |
| `deps` | `npm ci` from the lockfile, in its own layer so source edits do not re-install |
| `build` | `npm run build` → `dist/` |
| `runtime` | copies **only** `dist/` and `server.mjs` — no toolchain, no `node_modules` |

`server.mjs` is a dependency-free Node static server (~90 lines): correct MIME types
including the pdf.js `.mjs` worker, immutable caching for hashed `/assets/`, SPA history
fallback for navigations only — a missing `.js` returns 404 rather than HTML — and path
resolution confined to the served root.

The container runs as the non-root `node` user with `cap_drop: ALL` and
`no-new-privileges`, and publishes to `127.0.0.1` only, since resumes are personal data
and this needs no LAN exposure. Change the host port in `docker-compose.yml` if 8100 is
taken.

For hot reload during development, run Vite on the host (`npm run dev`) — it is faster
than a bind-mounted container and needs no polling workaround.

## Templates

The app opens on a **Senior DevOps / Cloud / SRE** template with a matching job posting
loaded, so the scoring, keyword gap analysis and exports all have something real to work
on from the first second. Pick another from the **Templates** dropdown in the toolbar, or
**New** for a blank document.

The default template is written to demonstrate what scores well — every bullet opens with
an achievement verb, all of them carry a metric with a before/after, and the skills are
grouped the way recruiters search (`Cloud & Infrastructure`, `Containers &
Orchestration`, `CI/CD & Automation`, `Reliability & Observability`, `Security &
Governance`, `Core Competencies`). It scores 100/100 against its paired posting; replace
the content with your own and the score moves to reflect it.

| Template | For |
| --- | --- |
| Senior DevOps / Cloud / SRE | Platform, reliability and cloud infrastructure roles |
| Senior Data Engineer | Data platform, pipeline and analytics engineering roles |

## What it does

**Three panes, always in sync.** Editor (or job-match) on the left, an ATS-safe live
preview in the middle, score and recommendations on the right. Every keystroke rescores.

**Scores out of 100 across five categories.**

| Category | Max | What it measures |
| --- | --- | --- |
| Parseability | 20 | Contact fields a parser can extract, standard sections, no glyphs or tab-columns that scramble extraction |
| Keyword Match | 30 | Weighted match against the target job description, plus job-title alignment |
| Impact & Content | 25 | Action-verb openers, quantified results, bullet length, duty language, pronouns and buzzwords |
| Completeness | 15 | Summary, dated roles, depth on recent roles, education, skills breadth |
| Format & Length | 10 | Word count, estimated page count, date-format consistency |

**Recommendations are specific and ranked by point gain.** Each one says what is wrong,
why an ATS or recruiter cares, how many points it is worth, and jumps you to the field
that needs editing. Some carry a one-click fix (set the headline to the posted title, add
missing keywords to the right skills group).

**Job description matching.** Paste the posting and the extractor pulls out weighted
keywords — canonical skills from a ~180-entry taxonomy with alias resolution (`k8s` →
Kubernetes, `google cloud platform` → GCP), certifications, and recurring domain phrases.
Terms are weighted 3 / 2 / 1 by how central they are to the posting, then matched against
every section of your resume so you can see not just *whether* a keyword is present but
*where*. Keywords found only in your skills list get flagged — that pattern reads as
stuffing to both humans and modern semantic ranking.

**Import and ATS X-ray.** Drop in a PDF, DOCX or TXT. Text is extracted the way a parser
does it, the structure is rebuilt into editable fields, and you get the warnings a real
ATS would hit: multi-column layouts, image-only PDFs, tables, unrecognised headings, page
count. The raw extracted text is shown so you can see what the machine actually reads.

**Font size.** The stepper above the preview resizes the whole document proportionally
from 9.0pt to 13.3pt (default 10.6pt) — click the value to reset. Everything inside the
page is sized in `em` off one `--paper-scale`, so headings, dates and body text stay in
proportion. The setting flows through to the page estimate, the `.docx` export and print.

**Exports.** `.docx` (single column, standard headings, no tables or text boxes),
plain `.txt`, browser Print → PDF from a dedicated print stylesheet, and a `.json`
project file that round-trips the resume, the job description and the font size.

**Clean printing.** The print stylesheet sets `@page { margin: 0 }` and moves the page
margin onto the content, which leaves the browser no margin box to draw its own header
and footer into — so the printout carries no URL, date or page title. The document title
is also swapped for the resume filename while printing, so Chrome's "Save as PDF" names
the file after the candidate rather than after this app.

## Layout

```
src/
  types.ts              resume + score data model
  lib/
    vocab.ts            skill taxonomy, action verbs, weak openers, buzzwords, stopwords
    keywords.ts         JD keyword extraction, weighting, resume matching
    scoring.ts          the scoring engine and recommendation rules
    parse.ts            PDF/DOCX/TXT extraction and text → structured resume
    export.ts           .docx / .txt / filename generation
    sample.ts           blank + worked example resume, sample job posting
  components/
    Editor.tsx          the form, with per-bullet verb/metric/length flags
    Preview.tsx         ATS-safe paper with keyword highlighting
    ScorePanel.tsx      ring, category meters, recommendations
    JobMatch.tsx        job description input and keyword gap analysis
    ImportDialog.tsx    upload, parse report, review before import
```

## Notes on the scoring

The score is calibrated against how mainstream ATS platforms parse and rank, but no tool
can reproduce a specific employer's configuration. Treat it as a checklist that catches
the mechanical failures — unparseable contact details, missing keywords, duty-language
bullets, inconsistent dates — not as a guarantee.

Without a job description the Keyword Match category is capped at 18/30, because keyword
ranking is relative to one posting and cannot be scored in the abstract.

Only add keywords you can genuinely back up in an interview.
