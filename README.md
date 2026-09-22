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
docker compose up -d --build          # http://localhost:8080
docker compose logs -f app
docker compose down
```

The `Dockerfile` is multistage — `deps` installs from the lockfile, `build` produces
`dist/`, and `runtime` carries only the built bundle plus `node_modules`, running as the
non-root `node` user. The bundle is served by Vite's own preview server, which gets the
SPA fallback and the `application/javascript` type for the pdf.js `.mjs` worker right
without a separate web server.

For hot reload against the source tree instead:

```bash
docker compose --profile dev up dev   # http://localhost:5180
```

That service bind-mounts the working directory with an anonymous volume over
`/app/node_modules`, so the Linux-built dependencies in the image are not shadowed by the
Windows-built ones on the host. File watching uses polling, since bind-mount events do not
propagate from a Windows host.

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
