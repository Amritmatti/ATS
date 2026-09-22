import { CERT_PATTERNS, SKILL_TAXONOMY, SOFT_SKILLS, STOPWORDS, TOOL_SKILLS } from './vocab'
import type { KeywordHit, Resume } from '../types'

/** Aliases that are short/ambiguous and must match as whole words only. */
const ALIAS_INDEX: { alias: string; canonical: string }[] = []
for (const [canonical, aliases] of Object.entries(SKILL_TAXONOMY)) {
  for (const alias of aliases) ALIAS_INDEX.push({ alias, canonical })
}
// Longest aliases first so "google cloud platform" wins over "google".
ALIAS_INDEX.sort((a, b) => b.alias.length - a.alias.length)

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Whole-word-ish containment that tolerates +, #, ., / inside terms (c++, ci/cd, node.js). */
export function containsTerm(haystack: string, term: string): boolean {
  const t = escapeRe(term)
  const re = new RegExp(`(^|[^a-z0-9+#./-])${t}($|[^a-z0-9+#/-])`, 'i')
  return re.test(haystack)
}

function countTerm(haystack: string, term: string): number {
  const t = escapeRe(term)
  const re = new RegExp(`(^|[^a-z0-9+#./-])${t}($|[^a-z0-9+#/-])`, 'gi')
  return (haystack.match(re) || []).length
}

function kindOf(canonical: string): KeywordHit['kind'] {
  if (SOFT_SKILLS.has(canonical)) return 'soft'
  if (TOOL_SKILLS.has(canonical)) return 'tool'
  return 'hard'
}

/** Sentences that read like requirements get their keywords weighted higher. */
const REQUIREMENT_CUE = /(require|must have|essential|you (will )?(have|need)|proficien|expert|strong|experience (with|in)|minimum|qualification|responsib)/i

/** Flatten the whole resume to searchable text, tracking which section text came from. */
export function resumeSections(resume: Resume): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  out.push({ where: 'Headline', text: `${resume.contact.headline} ${resume.targetRole}` })
  out.push({ where: 'Summary', text: resume.summary })
  for (const e of resume.experience) {
    out.push({
      where: `Experience — ${e.title || e.company || 'role'}`,
      text: `${e.title} ${e.company} ${e.bullets.map((b) => b.text).join(' ')}`,
    })
  }
  for (const p of resume.projects) {
    out.push({ where: `Project — ${p.name || 'project'}`, text: `${p.name} ${p.role} ${p.bullets.map((b) => b.text).join(' ')}` })
  }
  out.push({ where: 'Skills', text: resume.skills.map((g) => `${g.label} ${g.items.join(' ')}`).join(' ') })
  out.push({ where: 'Education', text: resume.education.map((e) => `${e.degree} ${e.field} ${e.school} ${e.detail}`).join(' ') })
  out.push({ where: 'Certifications', text: resume.certifications.map((c) => `${c.name} ${c.issuer}`).join(' ') })
  return out.map((s) => ({ where: s.where, text: normalise(s.text) }))
}

export function resumeText(resume: Resume): string {
  return resumeSections(resume).map((s) => s.text).join(' \n ')
}

/** Pull the likely job title out of the top of a job description. */
export function extractJobTitle(jd: string): string {
  const lines = jd.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const labelled = lines.find((l) => /^(job\s*title|position|role)\s*[:\-]/i.test(l))
  if (labelled) return labelled.replace(/^[^:\-]*[:\-]\s*/, '').trim().slice(0, 80)
  const first = lines[0]
  if (first && first.length <= 80 && !/\.$/.test(first)) return first
  return ''
}

interface ExtractOptions {
  /** cap on how many extra (non-taxonomy) phrases to surface */
  maxPhrases?: number
}

/**
 * Extract weighted keywords from a job description.
 * Weight 3 = core requirement, 2 = important, 1 = nice to have.
 */
export function extractKeywords(jd: string, opts: ExtractOptions = {}): KeywordHit[] {
  const maxPhrases = opts.maxPhrases ?? 8
  const text = normalise(jd)
  if (!text.trim()) return []

  const sentences = jd.split(/(?<=[.!?;:\n])\s+/).map(normalise)
  const requirementText = sentences.filter((s) => REQUIREMENT_CUE.test(s)).join(' ')

  const found = new Map<string, KeywordHit & { raw: number }>()

  // 1. Taxonomy matches.
  for (const { alias, canonical } of ALIAS_INDEX) {
    if (found.has(canonical)) continue
    const n = countTerm(text, alias)
    if (n === 0) continue
    const inRequirements = containsTerm(requirementText, alias)
    let weight = 1
    if (n >= 2) weight = 2
    if (inRequirements) weight = Math.max(weight, 2)
    if (inRequirements && n >= 2) weight = 3
    if (SOFT_SKILLS.has(canonical)) weight = Math.min(weight, 2)
    found.set(canonical, {
      term: canonical,
      weight,
      found: false,
      where: [],
      kind: kindOf(canonical),
      raw: n,
    })
  }

  // 2. Certifications.
  for (const cert of CERT_PATTERNS) {
    if (!containsTerm(text, cert)) continue
    const label = cert.toUpperCase().length <= 12 ? cert.toUpperCase() : titleCase(cert)
    if (found.has(label)) continue
    found.set(label, { term: label, weight: 2, found: false, where: [], kind: 'cert', raw: 1 })
  }

  // 3. Frequent domain phrases the taxonomy does not already cover.
  const covered = new Set<string>()
  for (const hit of found.values()) {
    covered.add(hit.term.toLowerCase())
    for (const a of SKILL_TAXONOMY[hit.term] || []) covered.add(a)
  }

  // Only multi-word phrases: single words out of a job posting are almost all noise.
  const tokens = text.match(/[a-z][a-z0-9+#.\-/]{1,}/g) || []
  const phraseCount = new Map<string, number>()
  const titleTokens = new Set(normalise(extractJobTitle(jd)).split(/[^a-z0-9+#]+/).filter(Boolean))

  for (let i = 0; i < tokens.length - 1; i++) {
    const w1 = tokens[i]
    const w2 = tokens[i + 1]
    if (STOPWORDS.has(w1) || STOPWORDS.has(w2)) continue
    if (w1.length < 3 || w2.length < 3) continue
    // Skip fragments of the job title — title alignment is scored separately.
    if (titleTokens.has(w1) && titleTokens.has(w2)) continue
    const bi = `${w1} ${w2}`
    phraseCount.set(bi, (phraseCount.get(bi) || 0) + 1)
  }

  // Drop anything the taxonomy already represents, in either direction.
  const coveredList = [...covered]
  const isRedundant = (p: string) => coveredList.some((a) => a.includes(p) || p.includes(a))

  const extras = [...phraseCount.entries()]
    .filter(([p, c]) => c >= 2 && !isRedundant(p))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxPhrases)

  for (const [phrase, count] of extras) {
    const label = titleCase(phrase)
    if (found.has(label)) continue
    const inReq = containsTerm(requirementText, phrase)
    found.set(label, {
      term: label,
      weight: inReq && count >= 3 ? 2 : 1,
      found: false,
      where: [],
      kind: 'other',
      raw: count,
    })
  }

  return [...found.values()]
    .sort((a, b) => b.weight - a.weight || b.raw - a.raw || a.term.localeCompare(b.term))
    .map(({ raw, ...hit }) => hit)
}

/** Mark which extracted keywords appear in the resume, and where. */
export function matchKeywords(keywords: KeywordHit[], resume: Resume): KeywordHit[] {
  const sections = resumeSections(resume)
  return keywords.map((kw) => {
    const aliases = [kw.term.toLowerCase(), ...(SKILL_TAXONOMY[kw.term] || [])]
    const where: string[] = []
    for (const s of sections) {
      if (!s.text.trim()) continue
      if (aliases.some((a) => containsTerm(s.text, a))) where.push(s.where)
    }
    return { ...kw, found: where.length > 0, where }
  })
}

function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Suggest a skills-group label for a keyword so auto-add lands somewhere sensible. */
export function groupForKeyword(kw: KeywordHit): string {
  switch (kw.kind) {
    case 'soft':
      return 'Core Competencies'
    case 'tool':
      return 'Tools & Platforms'
    case 'cert':
      return 'Certifications'
    default:
      return 'Technical Skills'
  }
}
