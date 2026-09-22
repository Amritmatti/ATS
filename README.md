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

### Docker

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

**Exports.** `.docx` (single column, standard headings, no tables or text boxes),
plain `.txt`, browser Print → PDF from a dedicated print stylesheet, and a `.json`
project file that round-trips the resume and the job description.

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
