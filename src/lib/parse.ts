import type { Bullet, Resume } from '../types'
import { emptyResume, uid } from './sample'

export interface ParseReport {
  text: string
  warnings: string[]
  resume: Resume
}

/* ------------------------------------------------------------------ text extraction */

async function extractPdf(file: File): Promise<{ text: string; warnings: string[] }> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise
  const warnings: string[] = []
  const pages: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const items = content.items as { str: string; transform: number[] }[]
    // Rebuild lines from text-item y positions, the same way a naive ATS parser does.
    const rows = new Map<number, { x: number; s: string }[]>()
    for (const it of items) {
      if (!it.str.trim()) continue
      const y = Math.round(it.transform[5])
      const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y
      const arr = rows.get(key) ?? []
      arr.push({ x: it.transform[4], s: it.str })
      rows.set(key, arr)
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map((p) => p.s).join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    pages.push(lines.join('\n'))

    // Column detection: many lines with a wide horizontal gap suggests a 2-column layout.
    const gappy = [...rows.values()].filter((parts) => {
      const sorted = parts.sort((a, b) => a.x - b.x)
      for (let j = 1; j < sorted.length; j++) {
        if (sorted[j].x - sorted[j - 1].x > 180) return true
      }
      return false
    }).length
    if (gappy >= 6 && !warnings.some((w) => w.startsWith('Multi-column'))) {
      warnings.push(
        'Multi-column layout detected. ATS parsers read across the page, so text from a sidebar gets interleaved with the main column.',
      )
    }
  }

  const text = pages.join('\n\n')
  if (text.replace(/\s/g, '').length < 200) {
    warnings.push(
      'Almost no extractable text found — this PDF is likely a scan or an image export. An ATS would receive an empty document.',
    )
  }
  if (doc.numPages > 2) warnings.push(`${doc.numPages} pages detected — most recruiters expect one or two.`)
  return { text, warnings }
}

async function extractDocx(file: File): Promise<{ text: string; warnings: string[] }> {
  const mod: any = await import('mammoth/mammoth.browser.js')
  const mammoth = mod.default ?? mod
  const buf = await file.arrayBuffer()
  const { value, messages } = await mammoth.extractRawText({ arrayBuffer: buf })
  const warnings: string[] = []
  if (messages?.some((m: any) => /table/i.test(m.message ?? ''))) {
    warnings.push('Tables found in the document — table cells are a common source of scrambled ATS output.')
  }
  return { text: value, warnings }
}

export async function extractText(file: File): Promise<{ text: string; warnings: string[] }> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return extractPdf(file)
  if (name.endsWith('.docx')) return extractDocx(file)
  if (name.endsWith('.doc')) {
    return { text: await file.text(), warnings: ['Legacy .doc format is unreliable for ATS parsing — save as .docx or PDF.'] }
  }
  return { text: await file.text(), warnings: [] }
}

/* ------------------------------------------------------------------ text → structure */

const HEADING_MAP: { key: string; re: RegExp }[] = [
  { key: 'summary', re: /^(professional\s+)?(summary|profile|about me|objective|career objective)\s*:?$/i },
  { key: 'experience', re: /^(work\s+|professional\s+|employment\s+|relevant\s+)?(experience|history|employment)\s*:?$/i },
  { key: 'education', re: /^(education|academic background|qualifications)\s*:?$/i },
  { key: 'skills', re: /^(technical\s+|core\s+|key\s+)?(skills|competencies|technologies|expertise)\s*:?$/i },
  { key: 'projects', re: /^(projects|personal projects|selected projects)\s*:?$/i },
  { key: 'certifications', re: /^(certifications?|licenses?|certifications? (and|&) licenses?|awards)\s*:?$/i },
]

const BULLET_PREFIX = /^[\s]*([•▪◦‣·∙*\-–—]|\d+[.)])\s+/
const EMAIL_FIND = /[\w.+-]+@[\w-]+\.[\w.-]+/
const PHONE_FIND = /(\+?\d[\d\s().-]{7,}\d)/
const LINKEDIN_FIND = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i
const SITE_FIND = /(?:https?:\/\/)?(?:www\.)?(github\.com\/[\w-]+|[a-z0-9-]+\.(?:com|io|dev|net|me|org)(?:\/[\w-]*)?)/i
const DATE_RANGE =
  /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{1,2}\/\d{4}|\d{4}-\d{1,2}|\d{4})\s*(?:-|–|—|to)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{1,2}\/\d{4}|\d{4}-\d{1,2}|\d{4}|present|current|now)/i

export function textToResume(raw: string): { resume: Resume; warnings: string[] } {
  const warnings: string[] = []
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/ /g, ' ').trimEnd())
    .filter((l, i, arr) => l.trim() || (arr[i - 1] ?? '').trim())

  const resume = emptyResume()
  resume.experience = []
  resume.education = []
  resume.skills = []

  // Contact block: scan the first ~12 lines.
  const head = lines.slice(0, 14).join('\n')
  resume.contact.email = (head.match(EMAIL_FIND) || [''])[0]
  resume.contact.phone = (head.match(PHONE_FIND) || [''])[0].trim()
  resume.contact.linkedin = (head.match(LINKEDIN_FIND) || [''])[0]
  const site = head.match(SITE_FIND)
  if (site && !/linkedin/i.test(site[0])) resume.contact.website = site[0]

  const nameLine = lines.find(
    (l) =>
      l.trim() &&
      !EMAIL_FIND.test(l) &&
      !PHONE_FIND.test(l) &&
      l.trim().split(/\s+/).length <= 5 &&
      /^[A-Za-z][A-Za-z.'-]*(\s+[A-Za-z][A-Za-z.'-]*)+$/.test(l.trim()),
  )
  if (nameLine) resume.contact.fullName = nameLine.trim()
  else warnings.push('Could not confidently identify a name in the top block.')

  const locLine = lines.slice(0, 14).find((l) => /,\s*[A-Z]{2}\b|,\s*[A-Z][a-z]+$/.test(l.trim()) && l.trim().length < 60 && l !== nameLine)
  if (locLine && !EMAIL_FIND.test(locLine)) resume.contact.location = locLine.replace(/[|•].*$/, '').trim()

  // Split into sections.
  const sections = new Map<string, string[]>()
  let current = 'header'
  for (const line of lines) {
    const t = line.trim().replace(/[:\s]+$/, '')
    const match = HEADING_MAP.find((h) => h.re.test(t))
    if (match && t.length < 45) {
      current = match.key
      if (!sections.has(current)) sections.set(current, [])
      continue
    }
    if (!sections.has(current)) sections.set(current, [])
    sections.get(current)!.push(line)
  }

  const found = HEADING_MAP.map((h) => h.key).filter((k) => sections.has(k))
  if (found.length < 3)
    warnings.push(
      `Only ${found.length} standard section heading${found.length === 1 ? '' : 's'} recognised. Use plain headings such as "Work Experience", "Education" and "Skills".`,
    )

  // Summary
  const summary = (sections.get('summary') || []).join(' ').replace(/\s+/g, ' ').trim()
  if (summary) resume.summary = summary

  // Experience
  const expLines = sections.get('experience') || []
  let job: Resume['experience'][number] | null = null
  const pushJob = () => {
    if (job && (job.title || job.company || job.bullets.length)) resume.experience.push(job)
  }
  for (const line of expLines) {
    const t = line.trim()
    if (!t) continue
    if (BULLET_PREFIX.test(line)) {
      const text = line.replace(BULLET_PREFIX, '').trim()
      if (!job) job = newJob()
      if (text) job.bullets.push({ id: uid(), text })
      continue
    }
    const dates = t.match(DATE_RANGE)
    if (dates) {
      // "Job Title, Company" on one line and "Mar 2022 - Present | London" on the next is
      // the most common layout — attach the dates to the role we just opened rather than
      // starting a second, empty one.
      const continues = job !== null && !!job.title && !job.start && job.bullets.length === 0
      if (!continues) {
        pushJob()
        job = newJob()
      }
      const target = job!
      target.start = tidyDate(dates[1])
      const end = dates[2]
      if (/present|current|now/i.test(end)) target.current = true
      else target.end = tidyDate(end)
      const rest = t.replace(DATE_RANGE, '').replace(/^[|•–—,\s-]+/, '').replace(/[|•–—,\s-]+$/, '').trim()
      if (continues) {
        if (!target.location && rest) target.location = rest
      } else {
        assignTitleCompany(target, rest)
      }
      continue
    }
    if (!job) job = newJob()
    if (!job.title || !job.company) {
      assignTitleCompany(job, t)
    } else if (
      (job.start || job.bullets.length) &&
      t.length <= 80 &&
      !/[.;]$/.test(t) &&
      // A role header pairs a title with an employer, so it carries a separator.
      /[,|–—]|\sat\s/i.test(t)
    ) {
      // The current role is already populated, so a header-shaped line starts the next one.
      pushJob()
      job = newJob()
      assignTitleCompany(job, t)
    } else if (t.length > 40) {
      job.bullets.push({ id: uid(), text: t })
    }
  }
  pushJob()

  // Education
  for (const line of sections.get('education') || []) {
    const t = line.trim()
    if (!t || BULLET_PREFIX.test(t)) continue
    const dates = t.match(DATE_RANGE) || t.match(/\b(19|20)\d{2}\b/)
    const clean = t.replace(DATE_RANGE, '').replace(/\b(19|20)\d{2}\b/g, '').replace(/[|,–—-]\s*$/, '').trim()
    const prev = resume.education[resume.education.length - 1]
    // A dates-and-location line belongs to the entry above it, not to a new one.
    if (prev && dates && (!clean || clean.replace(/[|,\s-]/g, '').length < 22)) {
      if (!prev.end) prev.end = tidyDate(Array.isArray(dates) ? dates[2] ?? dates[0] : '')
      if (!prev.start && Array.isArray(dates) && dates[1]) prev.start = tidyDate(dates[1])
      if (!prev.location && clean) prev.location = clean.replace(/^[|,\s-]+/, '')
      continue
    }
    if (!clean) continue
    if (prev && !dates && /^[^,|]{0,60}$/.test(clean) && !/\b(university|college|institute|school|academy)\b/i.test(clean) && prev.detail === '') {
      prev.detail = clean
      continue
    }
    const degreeMatch = clean.match(/\b(ph\.?d|m\.?sc|m\.?s|m\.?b\.?a|m\.?a|b\.?sc|b\.?s|b\.?a|b\.?eng|b\.?tech|m\.?tech|diploma|associate|bachelor[s']*|master[s']*)\b\.?/i)
    resume.education.push({
      id: uid(),
      degree: degreeMatch ? degreeMatch[0] : '',
      field: degreeMatch
        ? clean.replace(degreeMatch[0], '').replace(/^\s*(?:of|in|,|-)\b\s*/i, '').split(/[,|]/)[0].trim()
        : clean.split(/[,|]/)[0].trim(),
      school: clean.split(/[,|]/).slice(1).join(',').trim() || (degreeMatch ? '' : clean),
      location: '',
      start: '',
      end: dates ? tidyDate(Array.isArray(dates) ? dates[2] ?? dates[0] : '') : '',
      detail: '',
    })
  }

  // Skills
  const skillLines = sections.get('skills') || []
  const groups: { label: string; items: string[] }[] = []
  for (const line of skillLines) {
    const t = line.replace(BULLET_PREFIX, '').trim()
    if (!t) continue
    const labelled = t.match(/^([A-Za-z&/ ]{3,30}):\s*(.+)$/)
    if (labelled) groups.push({ label: labelled[1].trim(), items: splitSkills(labelled[2]) })
    else if (groups.length) groups[groups.length - 1].items.push(...splitSkills(t))
    else groups.push({ label: 'Technical Skills', items: splitSkills(t) })
  }
  resume.skills = groups
    .filter((g) => g.items.length)
    .map((g) => ({ id: uid(), label: g.label, items: [...new Set(g.items)].slice(0, 40) }))
  if (!resume.skills.length) resume.skills = [{ id: uid(), label: 'Technical Skills', items: [] }]

  // Certifications
  for (const line of sections.get('certifications') || []) {
    const t = line.replace(BULLET_PREFIX, '').trim()
    if (!t) continue
    const date = (t.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}\b|\b(19|20)\d{2}\b/i) || [''])[0]
    const name = t.replace(date, '').replace(/[|,–—-]\s*$/, '').trim()
    if (name.length > 2) resume.certifications.push({ id: uid(), name, issuer: '', date: tidyDate(date), credentialId: '' })
  }

  // Projects
  const projLines = sections.get('projects') || []
  let project: Resume['projects'][number] | null = null
  for (const line of projLines) {
    const t = line.trim()
    if (!t) continue
    // Bullet markers are lost by some extractors, so length stands in for the missing glyph.
    const isBullet = BULLET_PREFIX.test(line) || (project !== null && t.length > 60)
    if (isBullet) {
      if (!project) project = { id: uid(), name: 'Project', role: '', link: '', start: '', end: '', bullets: [] }
      project.bullets.push({ id: uid(), text: line.replace(BULLET_PREFIX, '').trim() })
    } else {
      if (project) resume.projects.push(project)
      const parts = t.split(/\s*[|–—]\s*|,\s+(?=[A-Z])/)
      project = { id: uid(), name: parts[0].trim(), role: parts[1]?.trim() ?? '', link: parts.find((p) => /\.[a-z]{2,}\//.test(p))?.trim() ?? '', start: '', end: '', bullets: [] }
    }
  }
  if (project) resume.projects.push(project)

  if (!resume.experience.length) {
    warnings.push('No work experience entries could be reconstructed — check that each role has a recognisable date range.')
    resume.experience = emptyResume().experience
  }
  if (!resume.education.length) resume.education = emptyResume().education

  resume.targetRole = resume.contact.headline || resume.experience[0]?.title || ''
  if (!resume.contact.headline) resume.contact.headline = resume.experience[0]?.title || ''

  return { resume, warnings }
}

function newJob(): Resume['experience'][number] {
  return { id: uid(), title: '', company: '', location: '', start: '', end: '', current: false, bullets: [] as Bullet[] }
}

function assignTitleCompany(job: Resume['experience'][number], text: string) {
  if (!text) return
  const parts = text.split(/\s*(?:\||—|–|,|\bat\b)\s*/i).map((p) => p.trim()).filter(Boolean)
  if (!job.title) job.title = parts[0] ?? ''
  if (!job.company && parts[1]) job.company = parts[1]
  if (!job.location && parts[2]) job.location = parts[2]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function tidyDate(value: string): string {
  const v = (value || '').trim()
  if (!v) return ''
  const m = v.match(/^([a-z]{3,9})\.?\s*(\d{4})$/i)
  if (m) {
    const idx = MONTHS.findIndex((mo) => m[1].toLowerCase().startsWith(mo.toLowerCase()))
    return idx >= 0 ? `${MONTHS[idx]} ${m[2]}` : v
  }
  return v
}

function splitSkills(text: string): string[] {
  return text
    .split(/[,;|•·]|\s{3,}/)
    .map((s) => s.replace(BULLET_PREFIX, '').trim())
    .filter((s) => s.length > 1 && s.length < 40)
}
