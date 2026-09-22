import type {
  CategoryScore,
  KeywordHit,
  Recommendation,
  Resume,
  ScoreResult,
  Severity,
} from '../types'
import {
  ALL_ACTION_VERBS,
  BUZZWORDS,
  FIRST_PERSON,
  OPENER_REPLACEMENTS,
  WEAK_OPENERS,
} from './vocab'
import { extractJobTitle, extractKeywords, matchKeywords, normalise, resumeText } from './keywords'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const PHONE_RE = /^[+()\d][\d\s().+-]{6,}$/
const URL_ISH = /(linkedin\.com|github\.com|[a-z0-9-]+\.[a-z]{2,})/i

const QUANTIFIED_RE = new RegExp(
  [
    '\\d+(\\.\\d+)?\\s*%',
    '[$£€₹]\\s?\\d',
    '\\b\\d+(\\.\\d+)?\\s*(k|m|bn|b|mm)\\b',
    '\\b\\d+(\\.\\d+)?\\s*x\\b',
    '\\b\\d{2,}\\b',
    '\\b\\d+\\s+(users?|customers?|clients?|projects?|people|engineers?|developers?|hours?|days?|weeks?|months?|teams?|countries|regions?|reports?|tickets?|leads?|accounts?|stores?|records?|servers?|apis?|releases?|deals?|campaigns?|models?|pipelines?|sites?|vendors?|students?|patients?)\\b',
  ].join('|'),
  'i',
)

const DATE_FORMATS: { id: string; label: string; re: RegExp }[] = [
  { id: 'mon-year', label: 'Mon YYYY (Jan 2024)', re: /^[a-z]{3,9}\.?\s+\d{4}$/i },
  { id: 'num-slash', label: 'MM/YYYY (01/2024)', re: /^\d{1,2}\/\d{4}$/ },
  { id: 'num-dash', label: 'YYYY-MM (2024-01)', re: /^\d{4}-\d{1,2}$/ },
  { id: 'year', label: 'YYYY (2024)', re: /^\d{4}$/ },
]

function detectDateFormat(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  if (/^(present|current|ongoing)$/i.test(v)) return 'present'
  for (const f of DATE_FORMATS) if (f.re.test(v)) return f.id
  return 'unknown'
}

export interface BulletInfo {
  text: string
  words: number
  startsWithVerb: boolean
  quantified: boolean
  weakOpener: string | null
  firstPerson: boolean
  buzzword: string | null
  owner: string
  section: string
}

function analyseBullets(resume: Resume): BulletInfo[] {
  const out: BulletInfo[] = []
  const push = (text: string, owner: string, section: string) => {
    const clean = text.trim()
    if (!clean) return
    const lower = normalise(clean)
    const firstWord = (clean.match(/^[A-Za-z'-]+/) || [''])[0].toLowerCase()
    out.push({
      text: clean,
      words: clean.split(/\s+/).filter(Boolean).length,
      startsWithVerb: ALL_ACTION_VERBS.has(firstWord),
      quantified: QUANTIFIED_RE.test(clean),
      weakOpener: WEAK_OPENERS.find((w) => lower.startsWith(w) || lower.includes(` ${w}`)) ?? null,
      firstPerson: FIRST_PERSON.some((p) => new RegExp(`(^|\\s)${p}(\\s|$|,|\\.)`, 'i').test(clean)),
      buzzword: BUZZWORDS.find((b) => lower.includes(b)) ?? null,
      owner,
      section,
    })
  }
  for (const e of resume.experience) {
    for (const b of e.bullets) push(b.text, `${e.title || 'Role'} @ ${e.company || 'Company'}`, 'experience')
  }
  for (const p of resume.projects) {
    for (const b of p.bullets) push(b.text, p.name || 'Project', 'projects')
  }
  return out
}

function countWords(resume: Resume): number {
  return resumeText(resume).split(/\s+/).filter(Boolean).length
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : n / d
}

function sev(ratio: number): Severity {
  if (ratio >= 0.95) return 'pass'
  if (ratio >= 0.75) return 'low'
  if (ratio >= 0.5) return 'medium'
  if (ratio >= 0.25) return 'high'
  return 'critical'
}

export function scoreResume(resume: Resume, jobDescription: string): ScoreResult {
  const recs: Recommendation[] = []
  const bullets = analyseBullets(resume)
  const words = countWords(resume)
  const add = (r: Recommendation) => recs.push(r)

  /* ---------------------------------------------------------------- 1. PARSEABILITY (20) */
  let parse = 0
  const c = resume.contact

  if (c.fullName.trim().split(/\s+/).length >= 2) parse += 3
  else
    add({
      id: 'contact-name',
      category: 'parseability',
      severity: 'critical',
      title: 'Add your full name',
      detail:
        'Applicant tracking systems build the candidate record from the name at the top of the document. A missing or single-word name often creates a blank or duplicated profile.',
      impact: 3,
      section: 'contact',
    })

  if (EMAIL_RE.test(c.email.trim())) parse += 4
  else
    add({
      id: 'contact-email',
      category: 'parseability',
      severity: 'critical',
      title: c.email.trim() ? 'Email address looks malformed' : 'Add a professional email address',
      detail:
        'Email is the primary key most ATS platforms use to de-duplicate and contact applicants. Use a plain firstname.lastname style address with no formatting or hyperlink styling.',
      impact: 4,
      section: 'contact',
    })

  if (PHONE_RE.test(c.phone.trim())) parse += 3
  else
    add({
      id: 'contact-phone',
      category: 'parseability',
      severity: c.phone.trim() ? 'medium' : 'high',
      title: c.phone.trim() ? 'Phone number format may not parse' : 'Add a phone number',
      detail:
        'Write the number in digits with an optional country code, e.g. +44 7700 900123 or (555) 123-4567. Avoid words, extensions in brackets, or unicode separators.',
      impact: 3,
      section: 'contact',
    })

  if (c.location.trim()) parse += 2
  else
    add({
      id: 'contact-location',
      category: 'parseability',
      severity: 'medium',
      title: 'Add a city and country',
      detail:
        'Recruiters filter candidate searches by location. "City, Country" (or "City, State") is enough — a full street address is not needed and can hurt privacy.',
      impact: 2,
      section: 'contact',
    })

  const hasLink = URL_ISH.test(c.linkedin) || URL_ISH.test(c.website)
  if (hasLink) parse += 2
  else
    add({
      id: 'contact-link',
      category: 'parseability',
      severity: 'low',
      title: 'Add a LinkedIn or portfolio URL',
      detail:
        'Write the URL as plain text (linkedin.com/in/yourname). Many parsers drop hyperlinked display text such as "My LinkedIn" entirely.',
      impact: 2,
      section: 'contact',
    })

  const hasExperience = resume.experience.length > 0
  const hasEducation = resume.education.length > 0
  const hasSkills = resume.skills.some((g) => g.items.length > 0)
  const sectionCount = [hasExperience, hasEducation, hasSkills].filter(Boolean).length
  parse += sectionCount
  if (sectionCount < 3)
    add({
      id: 'missing-sections',
      category: 'parseability',
      severity: sectionCount <= 1 ? 'critical' : 'high',
      title: 'Add the standard resume sections',
      detail: `Experience, Education and Skills are the three sections every parser looks for. Missing: ${[
        !hasExperience && 'Work Experience',
        !hasEducation && 'Education',
        !hasSkills && 'Skills',
      ]
        .filter(Boolean)
        .join(', ')}.`,
      impact: 3 - sectionCount,
      section: !hasExperience ? 'experience' : !hasSkills ? 'skills' : 'education',
    })

  const allText = resumeText(resume)
  const oddChars = allText.match(/[^\x00-\x7F -ɏ]/g) || []
  const uniqueOdd = [...new Set(oddChars)].slice(0, 8)
  if (uniqueOdd.length === 0) parse += 3
  else
    add({
      id: 'odd-characters',
      category: 'parseability',
      severity: 'medium',
      title: 'Remove symbols that parsers mangle',
      detail: `Found characters that frequently break text extraction: ${uniqueOdd.join(' ')}. Replace emoji, decorative bullets and box-drawing glyphs with plain text.`,
      impact: 3,
      section: 'experience',
    })

  const hasTables = /\t{2,}/.test(allText)
  if (!hasTables) parse += 3
  else
    add({
      id: 'tabbed-layout',
      category: 'parseability',
      severity: 'high',
      title: 'Remove tab-aligned columns',
      detail:
        'Multiple consecutive tabs usually come from a pasted table or multi-column layout. ATS parsers read tables left-to-right across columns and scramble the result.',
      impact: 3,
      section: 'experience',
    })

  /* ---------------------------------------------------------------- 2. KEYWORDS (30) */
  const jdProvided = jobDescription.trim().length > 60
  let rawKeywords = jdProvided ? extractKeywords(jobDescription) : []
  let keywords: KeywordHit[] = jdProvided ? matchKeywords(rawKeywords, resume) : []
  let keywordScore = 0
  let matchRate = 0

  if (jdProvided && keywords.length) {
    const totalWeight = keywords.reduce((s, k) => s + k.weight, 0)
    const hitWeight = keywords.filter((k) => k.found).reduce((s, k) => s + k.weight, 0)
    matchRate = hitWeight / totalWeight
    keywordScore = Math.round(Math.min(1, matchRate / 0.85) * 26)

    // Job title alignment is worth the last 4 points.
    const jdTitle = extractJobTitle(jobDescription)
    const titleWords = normalise(jdTitle)
      .split(/[^a-z0-9+#]+/)
      .filter((w) => w.length > 3)
    const mine = normalise(`${resume.targetRole} ${resume.contact.headline} ${resume.experience.map((e) => e.title).join(' ')}`)
    const titleHit = titleWords.length > 0 && titleWords.filter((w) => mine.includes(w)).length / titleWords.length >= 0.5
    if (titleHit) keywordScore += 4
    else if (jdTitle)
      add({
        id: 'title-alignment',
        category: 'keywords',
        severity: 'high',
        title: `Mirror the job title "${jdTitle}"`,
        detail:
          'Recruiters search by job title, and many ATS relevance models weight the headline heavily. Put the exact posted title in your headline (and in a recent role title if it is honest to do so).',
        impact: 4,
        section: 'contact',
        fix: { label: 'Use as headline', kind: 'set-headline', payload: jdTitle },
      })

    const missing = keywords.filter((k) => !k.found).sort((a, b) => b.weight - a.weight)
    const missingCore = missing.filter((k) => k.weight === 3)
    const missingImportant = missing.filter((k) => k.weight === 2)

    if (missingCore.length)
      add({
        id: 'missing-core-keywords',
        category: 'keywords',
        severity: 'critical',
        title: `${missingCore.length} core requirement keyword${missingCore.length > 1 ? 's are' : ' is'} missing`,
        detail:
          'These terms appear in the requirements section of the posting and repeat more than once — they are almost certainly on the recruiter\'s screening list. Add the ones you genuinely have, worded exactly as the posting words them.',
        impact: Math.min(12, missingCore.length * 3),
        section: 'skills',
        examples: missingCore.slice(0, 10).map((k) => k.term),
        fix: { label: 'Add to Skills', kind: 'add-keywords', payload: missingCore.slice(0, 10).map((k) => k.term) },
      })

    if (missingImportant.length)
      add({
        id: 'missing-important-keywords',
        category: 'keywords',
        severity: 'high',
        title: `${missingImportant.length} supporting keyword${missingImportant.length > 1 ? 's' : ''} not found`,
        detail:
          'Secondary terms from the posting. Each one you can honestly claim raises your keyword density and your ranking against other applicants.',
        impact: Math.min(8, missingImportant.length * 2),
        section: 'skills',
        examples: missingImportant.slice(0, 12).map((k) => k.term),
        fix: { label: 'Add to Skills', kind: 'add-keywords', payload: missingImportant.slice(0, 12).map((k) => k.term) },
      })

    // Keywords only in the Skills list look like keyword stuffing.
    const skillsOnly = keywords.filter(
      (k) => k.found && k.where.length === 1 && k.where[0] === 'Skills' && k.weight >= 2,
    )
    if (skillsOnly.length >= 3)
      add({
        id: 'skills-only-keywords',
        category: 'keywords',
        severity: 'medium',
        title: 'Back up listed skills in your experience bullets',
        detail:
          'These high-value keywords appear only in your Skills list. Human reviewers (and newer semantic ATS ranking) look for evidence of use — work each into a bullet that shows what you did with it and what changed.',
        impact: 0,
        section: 'experience',
        examples: skillsOnly.slice(0, 8).map((k) => k.term),
      })
  } else {
    // No job description: cap keyword credit and explain how to unlock it.
    const skillCount = resume.skills.reduce((s, g) => s + g.items.length, 0)
    keywordScore = Math.min(18, Math.round(skillCount * 1.2))
    add({
      id: 'no-jd',
      category: 'keywords',
      severity: 'critical',
      title: 'Paste the job description to unlock keyword scoring',
      detail:
        'ATS ranking is relative to one posting, not absolute. With the target job description we extract its weighted keywords, show exactly which ones are missing from your resume, and score the match. Until then this category is capped at 18/30.',
      impact: 30 - keywordScore,
      section: 'jd',
    })
  }

  /* ---------------------------------------------------------------- 3. IMPACT & CONTENT (25) */
  let impact = 0
  const nb = bullets.length
  const verbRatio = pct(bullets.filter((b) => b.startsWithVerb).length, nb)
  const quantRatio = pct(bullets.filter((b) => b.quantified).length, nb)

  if (nb === 0) {
    add({
      id: 'no-bullets',
      category: 'impact',
      severity: 'critical',
      title: 'Add achievement bullets to your roles',
      detail:
        'A role with no bullets gives the parser nothing to index and the reader nothing to evaluate. Aim for 3-5 bullets per recent role, each one an outcome rather than a duty.',
      impact: 25,
      section: 'experience',
    })
  } else {
    impact += Math.round(verbRatio * 8)
    if (verbRatio < 0.9) {
      const offenders = bullets.filter((b) => !b.startsWithVerb).slice(0, 5)
      add({
        id: 'action-verbs',
        category: 'impact',
        severity: sev(verbRatio),
        title: `${Math.round((1 - verbRatio) * nb)} bullet${Math.round((1 - verbRatio) * nb) === 1 ? '' : 's'} do not start with a strong action verb`,
        detail:
          'Start every bullet with a past-tense achievement verb (Led, Built, Reduced, Delivered). It front-loads the scannable signal and avoids the passive phrasing that reads as a job description.',
        impact: Math.round((1 - verbRatio) * 8),
        section: 'experience',
        examples: offenders.map((b) => `${b.owner}: "${truncate(b.text, 90)}"`),
      })
    }

    impact += Math.round(quantRatio * 9)
    if (quantRatio < 0.6) {
      add({
        id: 'quantify',
        category: 'impact',
        severity: sev(quantRatio / 0.6),
        title: `Only ${Math.round(quantRatio * 100)}% of your bullets contain a number`,
        detail:
          'Aim for at least 60%. Quantify scale (users, revenue, records, team size), change (%, time saved, cost cut) or volume (per week/month). If you do not have exact figures, a defensible estimate or range is far better than none.',
        impact: Math.round((0.6 - quantRatio) * 9 / 0.6),
        section: 'experience',
        examples: [
          'Reduced deployment time from 45 minutes to 6 minutes (-87%) across 30 services',
          'Grew qualified pipeline 2.4x to £4.1M in 3 quarters',
          'Cut month-end close from 9 days to 4, supporting 12 entities',
        ],
      })
    }

    const avgWords = bullets.reduce((s, b) => s + b.words, 0) / nb
    const tooLong = bullets.filter((b) => b.words > 34)
    const tooShort = bullets.filter((b) => b.words < 7)
    if (tooLong.length === 0 && tooShort.length === 0) impact += 4
    else {
      impact += Math.max(0, 4 - tooLong.length - tooShort.length)
      add({
        id: 'bullet-length',
        category: 'impact',
        severity: 'medium',
        title: `${tooLong.length + tooShort.length} bullet${tooLong.length + tooShort.length === 1 ? ' is' : 's are'} outside the 8-32 word sweet spot`,
        detail: `Average bullet length is ${avgWords.toFixed(0)} words. Long bullets get skimmed past; very short ones carry no evidence. One bullet = one accomplishment, with the result in it.`,
        impact: Math.min(4, tooLong.length + tooShort.length),
        section: 'experience',
        examples: [...tooLong, ...tooShort].slice(0, 4).map((b) => `${b.words} words — "${truncate(b.text, 80)}"`),
      })
    }

    const weak = bullets.filter((b) => b.weakOpener)
    if (weak.length === 0) impact += 2
    else
      add({
        id: 'weak-openers',
        category: 'impact',
        severity: 'high',
        title: `${weak.length} bullet${weak.length === 1 ? ' uses' : 's use'} duty language`,
        detail:
          'Phrases like "responsible for" or "helped with" describe the job, not your contribution. Swap in an ownership verb and say what changed as a result.',
        impact: 2,
        section: 'experience',
        examples: weak.slice(0, 5).map((b) => {
          const alt = OPENER_REPLACEMENTS[b.weakOpener!] || ['Led', 'Delivered']
          return `"${truncate(b.text, 70)}" → try ${alt.slice(0, 3).join(' / ')}`
        }),
      })

    const sloppy = bullets.filter((b) => b.firstPerson || b.buzzword)
    if (sloppy.length === 0) impact += 2
    else
      add({
        id: 'tone',
        category: 'impact',
        severity: 'medium',
        title: `${sloppy.length} bullet${sloppy.length === 1 ? ' contains' : 's contain'} pronouns or filler buzzwords`,
        detail:
          'Resumes are written in implied first person — drop "I", "we" and "my". Cut unverifiable filler ("team player", "results-driven", "passionate about") and replace it with evidence.',
        impact: 2,
        section: 'experience',
        examples: sloppy.slice(0, 4).map((b) => `${b.owner}: "${truncate(b.text, 80)}"`),
      })
  }

  /* ---------------------------------------------------------------- 4. COMPLETENESS (15) */
  let complete = 0
  const summaryWords = resume.summary.trim().split(/\s+/).filter(Boolean).length
  if (summaryWords >= 30 && summaryWords <= 90) complete += 3
  else {
    complete += summaryWords > 0 ? 1 : 0
    add({
      id: 'summary',
      category: 'completeness',
      severity: summaryWords === 0 ? 'high' : 'low',
      title: summaryWords === 0 ? 'Add a professional summary' : `Summary is ${summaryWords} words — aim for 30-90`,
      detail:
        'A 3-4 line summary is the highest-density place to state your title, years of experience, domain and two or three headline keywords. Write it for the target role, not as a generic objective.',
      impact: summaryWords === 0 ? 3 : 2,
      section: 'summary',
      examples: [
        'Senior Data Engineer with 8 years building batch and streaming pipelines on AWS. Owns platforms serving 400+ analysts; cut pipeline cost 38% and SLA breaches to near zero. Strong in Python, Spark, dbt and Airflow.',
      ],
    })
  }

  const rolesWithDates = resume.experience.filter((e) => e.start.trim() && (e.current || e.end.trim()))
  if (hasExperience && rolesWithDates.length === resume.experience.length) complete += 3
  else {
    complete += hasExperience ? 1 : 0
    if (hasExperience)
      add({
        id: 'missing-dates',
        category: 'completeness',
        severity: 'high',
        title: `${resume.experience.length - rolesWithDates.length} role${resume.experience.length - rolesWithDates.length === 1 ? ' is' : 's are'} missing dates`,
        detail:
          'ATS platforms compute total years of experience from start and end dates. A role with no dates is often discarded from that calculation, which can drop you below a minimum-experience filter.',
        impact: 2,
        section: 'experience',
      })
  }

  const bulletCounts = resume.experience.map((e) => e.bullets.filter((b) => b.text.trim()).length)
  const thinRoles = resume.experience.filter((e, i) => i < 2 && bulletCounts[i] < 3)
  if (thinRoles.length === 0) complete += 2
  else
    add({
      id: 'thin-roles',
      category: 'completeness',
      severity: 'medium',
      title: 'Recent roles need more depth',
      detail:
        'Your two most recent roles carry the most weight. Give each 3-5 bullets; older roles can drop to 1-2 or be summarised in one line.',
      impact: 2,
      section: 'experience',
      examples: thinRoles.map((e) => `${e.title || 'Role'} @ ${e.company || 'Company'}`),
    })

  if (hasEducation) complete += 2
  else
    add({
      id: 'education',
      category: 'completeness',
      severity: 'medium',
      title: 'Add an education entry',
      detail:
        'Even when a degree is not required, most ATS schemas have an education object and some screening rules check it is populated. Include the qualification, institution and year.',
      impact: 2,
      section: 'education',
    })

  const skillCount = resume.skills.reduce((s, g) => s + g.items.length, 0)
  if (skillCount >= 10) complete += 3
  else {
    complete += Math.round((skillCount / 10) * 3)
    add({
      id: 'skills-count',
      category: 'completeness',
      severity: skillCount < 5 ? 'high' : 'low',
      title: `Only ${skillCount} skill${skillCount === 1 ? '' : 's'} listed`,
      detail:
        'List 12-20 concrete, searchable skills grouped by type. Favour nouns a recruiter would type into a search box, and drop generic entries like "Microsoft Office" unless the posting asks for them.',
      impact: 3 - Math.round((skillCount / 10) * 3),
      section: 'skills',
    })
  }

  if (resume.targetRole.trim()) complete += 1
  else
    add({
      id: 'target-role',
      category: 'completeness',
      severity: 'low',
      title: 'Set a target role',
      detail: 'Naming the role you are applying for lets this tool tailor scoring and keeps the resume focused on one audience.',
      impact: 1,
      section: 'contact',
    })

  if (resume.certifications.length > 0 || resume.projects.length > 0) complete += 1
  else
    add({
      id: 'extras',
      category: 'completeness',
      severity: 'low',
      title: 'Add certifications or projects',
      detail:
        'A certifications or projects section is extra searchable surface area and is where career changers demonstrate current, relevant skills.',
      impact: 1,
      section: 'certifications',
    })

  /* ---------------------------------------------------------------- 5. FORMAT & LENGTH (10) */
  let format = 0
  const pages = estimatePages(resume)

  if (words >= 400 && words <= 900) format += 3
  else {
    format += 1
    add({
      id: 'word-count',
      category: 'format',
      severity: words < 250 ? 'high' : 'medium',
      title: `Resume is ${words} words — target 400-900`,
      detail:
        words < 400
          ? 'Thin resumes rank poorly because there is little text to match against. Add achievement bullets and a fuller skills list before adding new sections.'
          : 'Long resumes dilute keyword density and rarely get read past page two. Cut duties, older roles and anything not relevant to the target job.',
      impact: 2,
      section: 'experience',
    })
  }

  if (pages <= 2) format += 3
  else {
    add({
      id: 'page-count',
      category: 'format',
      severity: 'medium',
      title: `Estimated ${pages} pages`,
      detail:
        'Keep to one page under 10 years of experience, two pages above. Trim roles older than 10-15 years to a single "Earlier Experience" line.',
      impact: 3,
      section: 'experience',
    })
  }

  const dateValues = [
    ...resume.experience.flatMap((e) => [e.start, e.current ? '' : e.end]),
    ...resume.education.flatMap((e) => [e.start, e.end]),
  ].filter((v) => v.trim())
  const formats = new Set(dateValues.map(detectDateFormat).filter((f): f is string => !!f && f !== 'present'))
  if (formats.size <= 1) format += 2
  else
    add({
      id: 'date-consistency',
      category: 'format',
      severity: 'medium',
      title: 'Date formats are inconsistent',
      detail: `Found ${formats.size} different date styles. Pick one — "Mon YYYY" (Jan 2024) parses most reliably — and use it everywhere including Present.`,
      impact: 2,
      section: 'experience',
    })

  const unknownDates = dateValues.filter((v) => detectDateFormat(v) === 'unknown')
  if (unknownDates.length === 0) format += 2
  else
    add({
      id: 'date-format',
      category: 'format',
      severity: 'high',
      title: `${unknownDates.length} date${unknownDates.length === 1 ? '' : 's'} in an unrecognised format`,
      detail: `Values like ${unknownDates.slice(0, 3).map((d) => `"${d}"`).join(', ')} will not parse into a date field. Use Mon YYYY, MM/YYYY or YYYY.`,
      impact: 2,
      section: 'experience',
    })

  /* ---------------------------------------------------------------- Totals */
  const categories: CategoryScore[] = [
    {
      id: 'parseability',
      label: 'Parseability',
      score: clamp(parse, 0, 20),
      max: 20,
      blurb: 'Can the ATS read your contact details and sections?',
    },
    {
      id: 'keywords',
      label: 'Keyword Match',
      score: clamp(keywordScore, 0, 30),
      max: 30,
      blurb: 'How closely you match the target job description.',
    },
    {
      id: 'impact',
      label: 'Impact & Content',
      score: clamp(impact, 0, 25),
      max: 25,
      blurb: 'Achievement-led, quantified, recruiter-friendly writing.',
    },
    {
      id: 'completeness',
      label: 'Completeness',
      score: clamp(complete, 0, 15),
      max: 15,
      blurb: 'Every field an ATS profile expects is populated.',
    },
    {
      id: 'format',
      label: 'Format & Length',
      score: clamp(format, 0, 10),
      max: 10,
      blurb: 'Length, page count and date consistency.',
    },
  ]

  const total = clamp(
    categories.reduce((s, c) => s + c.score, 0),
    0,
    100,
  )

  recs.sort((a, b) => b.impact - a.impact || severityRank(a.severity) - severityRank(b.severity))

  return {
    total,
    grade: gradeFor(total),
    categories,
    recommendations: recs,
    keywords,
    stats: {
      words,
      bullets: nb,
      quantifiedBullets: bullets.filter((b) => b.quantified).length,
      actionVerbBullets: bullets.filter((b) => b.startsWithVerb).length,
      pages,
      avgBulletWords: nb ? Math.round(bullets.reduce((s, b) => s + b.words, 0) / nb) : 0,
      matchRate,
    },
  }
}

export function estimatePages(resume: Resume): number {
  // Rough line model matching the preview template at 10.5pt / A4.
  let lines = 6 // header block
  if (resume.summary.trim()) lines += 3 + Math.ceil(resume.summary.length / 110)
  for (const e of resume.experience) {
    lines += 3
    for (const b of e.bullets) lines += Math.max(1, Math.ceil(b.text.length / 105))
  }
  for (const p of resume.projects) {
    lines += 2
    for (const b of p.bullets) lines += Math.max(1, Math.ceil(b.text.length / 105))
  }
  if (resume.skills.length) lines += 2 + resume.skills.reduce((s, g) => s + Math.max(1, Math.ceil(g.items.join(', ').length / 95)), 0)
  if (resume.education.length) lines += 2 + resume.education.length * 2
  if (resume.certifications.length) lines += 2 + resume.certifications.length
  return Math.max(1, Math.ceil(lines / 48))
}

function severityRank(s: Severity): number {
  return ['critical', 'high', 'medium', 'low', 'pass'].indexOf(s)
}

function gradeFor(total: number): string {
  if (total >= 90) return 'Excellent'
  if (total >= 80) return 'Strong'
  if (total >= 70) return 'Good'
  if (total >= 55) return 'Needs work'
  if (total >= 40) return 'Weak'
  return 'At risk'
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`
}
