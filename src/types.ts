export interface Contact {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  linkedin: string
  website: string
}

export interface Bullet {
  id: string
  text: string
}

export interface Experience {
  id: string
  title: string
  company: string
  location: string
  start: string
  end: string
  current: boolean
  bullets: Bullet[]
}

export interface Education {
  id: string
  degree: string
  field: string
  school: string
  location: string
  start: string
  end: string
  detail: string
}

export interface Project {
  id: string
  name: string
  role: string
  link: string
  start: string
  end: string
  bullets: Bullet[]
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  credentialId: string
}

export interface SkillGroup {
  id: string
  label: string
  items: string[]
}

export interface Resume {
  contact: Contact
  summary: string
  experience: Experience[]
  education: Education[]
  skills: SkillGroup[]
  projects: Project[]
  certifications: Certification[]
  targetRole: string
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'pass'

export type CategoryId =
  | 'parseability'
  | 'keywords'
  | 'impact'
  | 'completeness'
  | 'format'

export interface Recommendation {
  id: string
  category: CategoryId
  severity: Severity
  title: string
  detail: string
  /** points recoverable by fixing this */
  impact: number
  /** where in the editor to go */
  section?: string
  /** optional one-click fix */
  fix?: { label: string; kind: string; payload?: unknown }
  examples?: string[]
}

export interface CategoryScore {
  id: CategoryId
  label: string
  score: number
  max: number
  blurb: string
}

export interface KeywordHit {
  term: string
  weight: number
  found: boolean
  /** where it was found */
  where: string[]
  kind: 'hard' | 'tool' | 'soft' | 'cert' | 'title' | 'other'
}

export interface ScoreResult {
  total: number
  grade: string
  categories: CategoryScore[]
  recommendations: Recommendation[]
  keywords: KeywordHit[]
  stats: {
    words: number
    bullets: number
    quantifiedBullets: number
    actionVerbBullets: number
    pages: number
    avgBulletWords: number
    matchRate: number
  }
}
