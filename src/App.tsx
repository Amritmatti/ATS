import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeywordHit, Recommendation, Resume } from './types'
import { scoreResume } from './lib/scoring'
import { groupForKeyword } from './lib/keywords'
import { SKILL_TAXONOMY } from './lib/vocab'
import { emptyResume, uid } from './lib/sample'
import { DEFAULT_TEMPLATE, TEMPLATES } from './lib/templates'
import { download, resumeToDocxBlob, resumeToText, safeFilename } from './lib/export'
import Editor from './components/Editor'
import Preview from './components/Preview'
import ScorePanel from './components/ScorePanel'
import JobMatch from './components/JobMatch'
import ImportDialog from './components/ImportDialog'
import { Ring } from './components/ui'

const STORAGE_KEY = 'ats-resume-pro:v1'

type LeftTab = 'editor' | 'job'

function loadState(): { resume: Resume; jd: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.resume?.contact) return null
    return { resume: parsed.resume as Resume, jd: parsed.jd ?? '' }
  } catch {
    return null
  }
}

export default function App() {
  const saved = useMemo(loadState, [])
  const [resume, setResume] = useState<Resume>(() => saved?.resume ?? DEFAULT_TEMPLATE.resume)
  const [jd, setJd] = useState(() => saved?.jd ?? DEFAULT_TEMPLATE.jd)
  const [tab, setTab] = useState<LeftTab>('editor')
  const [highlight, setHighlight] = useState(true)
  const [importing, setImporting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('ats-theme') as 'light' | 'dark') || 'light',
  )
  const toastTimer = useRef<number>()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('ats-theme', theme)
  }, [theme])

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ resume, jd }))
      } catch {
        /* quota or private mode — autosave is a convenience, not a requirement */
      }
    }, 400)
    return () => window.clearTimeout(t)
  }, [resume, jd])

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }, [])

  const patch = useCallback((fn: (draft: Resume) => void) => {
    setResume((prev) => {
      const next: Resume = JSON.parse(JSON.stringify(prev))
      fn(next)
      return next
    })
  }, [])

  const score = useMemo(() => scoreResume(resume, jd), [resume, jd])

  /* ---------------------------------------------------------------- keyword helpers */

  const matchedTerms = useMemo(() => {
    const set = new Set<string>()
    for (const k of score.keywords) {
      set.add(k.term.toLowerCase())
      for (const a of SKILL_TAXONOMY[k.term] || []) set.add(a)
    }
    return set
  }, [score.keywords])

  const matchedSkill = useCallback((s: string) => matchedTerms.has(s.trim().toLowerCase()), [matchedTerms])

  const addKeywords = useCallback(
    (terms: string[], kinds?: Record<string, KeywordHit['kind']>) => {
      const existing = new Set(resume.skills.flatMap((g) => g.items.map((i) => i.toLowerCase())))
      const toAdd = terms.filter((t) => {
        const key = t.toLowerCase()
        if (existing.has(key)) return false
        existing.add(key)
        return true
      })
      if (!toAdd.length) {
        flash('Already on your resume.')
        return
      }
      patch((d) => {
        for (const term of toAdd) {
          const label = kinds?.[term] ? groupForKeyword({ term, kind: kinds[term] } as KeywordHit) : 'Technical Skills'
          let group = d.skills.find((g) => g.label.toLowerCase() === label.toLowerCase())
          if (!group) {
            group = { id: uid(), label, items: [] }
            d.skills.push(group)
          }
          group.items.push(term)
        }
      })
      flash(`Added ${toAdd.length} keyword${toAdd.length === 1 ? '' : 's'} to Skills — now add evidence in your bullets.`)
    },
    [resume, patch, flash],
  )

  const applyFix = useCallback(
    (rec: Recommendation) => {
      if (!rec.fix) return
      if (rec.fix.kind === 'set-headline') {
        const title = String(rec.fix.payload ?? '')
        patch((d) => {
          d.contact.headline = title
          if (!d.targetRole.trim()) d.targetRole = title
        })
        flash(`Headline set to "${title}".`)
      } else if (rec.fix.kind === 'add-keywords') {
        const terms = (rec.fix.payload as string[]) ?? []
        const kinds: Record<string, KeywordHit['kind']> = {}
        for (const k of score.keywords) kinds[k.term] = k.kind
        addKeywords(terms, kinds)
      }
    },
    [patch, flash, addKeywords, score.keywords],
  )

  /* ---------------------------------------------------------------- export */

  const exportDocx = async () => {
    setBusy(true)
    try {
      const blob = await resumeToDocxBlob(resume)
      download(blob, safeFilename(resume, '.docx'))
      flash('Word file downloaded.')
    } catch (e: any) {
      flash(`Export failed: ${e?.message ?? 'unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  const exportTxt = () => {
    download(new Blob([resumeToText(resume)], { type: 'text/plain;charset=utf-8' }), safeFilename(resume, '.txt'))
    flash('Plain-text file downloaded.')
  }

  const exportJson = () => {
    download(
      new Blob([JSON.stringify({ resume, jd }, null, 2)], { type: 'application/json' }),
      safeFilename(resume, '.json'),
    )
    flash('Project file saved.')
  }

  const loadJson = (file: File) => {
    file.text().then((raw) => {
      try {
        const data = JSON.parse(raw)
        if (data?.resume?.contact) {
          setResume(data.resume)
          setJd(data.jd ?? '')
          flash('Project loaded.')
        } else flash('That JSON is not an ATS Resume Pro project file.')
      } catch {
        flash('Could not read that file.')
      }
    })
  }

  const jsonInput = useRef<HTMLInputElement>(null)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>
            ATS Resume Pro
            <small>build · score · optimise</small>
          </span>
        </div>

        <div className="score-chip" title={`${score.grade} — ${score.total}/100`}>
          <Ring value={score.total} size={34} stroke={4} />
          <div>
            <b>{score.total}/100</b>
            <span>{score.grade}</span>
          </div>
        </div>

        <div className="topbar-spacer" />

        <label className="checkbox">
          <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} />
          Highlight matches
        </label>

        <select
          className="btn btn-sm"
          title="Start from a template (replaces the current resume)"
          value=""
          onChange={(e) => {
            const t = TEMPLATES.find((x) => x.id === e.target.value)
            if (!t) return
            if (confirm(`Replace the current resume with the "${t.name}" template?`)) {
              setResume(t.resume)
              setJd(t.jd)
              flash(`Loaded the ${t.name} template.`)
            }
            e.target.value = ''
          }}
        >
          <option value="" disabled>
            Templates
          </option>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <button className="btn btn-sm" onClick={() => setImporting(true)}>
          Import resume
        </button>
        <button className="btn btn-sm" onClick={() => jsonInput.current?.click()}>
          Open project
        </button>
        <input
          ref={jsonInput}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && loadJson(e.target.files[0])}
        />
        <button className="btn btn-sm" onClick={exportJson}>
          Save project
        </button>
        <button className="btn btn-sm" onClick={exportTxt}>
          .txt
        </button>
        <button className="btn btn-sm" onClick={exportDocx} disabled={busy}>
          {busy ? 'Building…' : '.docx'}
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => window.print()}>
          Print / PDF
        </button>
        <button className="btn btn-sm btn-ghost" title="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button
          className="btn btn-sm btn-ghost btn-danger"
          onClick={() => {
            if (confirm('Clear the current resume and start from a blank document?')) {
              setResume(emptyResume())
              flash('Started a blank resume.')
            }
          }}
        >
          New
        </button>
      </header>

      <div className="main">
        <div className="pane">
          <div className="pane-head">
            <div className="tabs">
              <button className="tab" aria-selected={tab === 'editor'} onClick={() => setTab('editor')}>
                Resume editor
              </button>
              <button className="tab" aria-selected={tab === 'job'} onClick={() => setTab('job')}>
                Job match{score.keywords.length ? ` · ${Math.round(score.stats.matchRate * 100)}%` : ''}
              </button>
            </div>
          </div>
          {tab === 'editor' ? (
            <Editor resume={resume} patch={patch} matchedSkill={matchedSkill} />
          ) : (
            <JobMatch
              jd={jd}
              onJdChange={setJd}
              score={score}
              onAddKeyword={(k) => addKeywords([k.term], { [k.term]: k.kind })}
            />
          )}
        </div>

        <div className="pane print-pane">
          <div className="pane-head">
            <h2>ATS-safe preview</h2>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              ~{score.stats.pages} page{score.stats.pages === 1 ? '' : 's'} · {score.stats.words} words
            </span>
          </div>
          <Preview resume={resume} keywords={score.keywords} highlight={highlight} pageBreakAt={null} />
        </div>

        <div className="pane">
          <div className="pane-head">
            <h2>Score &amp; recommendations</h2>
          </div>
          <ScorePanel score={score} onApplyFix={applyFix} onGoToJd={() => setTab('job')} />
        </div>
      </div>

      {importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onImport={(r) => {
            setResume(r)
            setImporting(false)
            setTab('editor')
            flash('Resume imported — review the parsed roles and dates.')
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
