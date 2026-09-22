import React, { useState } from 'react'
import type { KeywordHit, ScoreResult } from '../types'
import { extractJobTitle } from '../lib/keywords'
import { SAMPLE_JD } from '../lib/sample'

const GROUPS: { weight: number; label: string; note: string }[] = [
  { weight: 3, label: 'Core requirements', note: 'Repeated in the requirements section — highest ranking weight.' },
  { weight: 2, label: 'Important', note: 'Named in requirements or repeated across the posting.' },
  { weight: 1, label: 'Nice to have', note: 'Mentioned once, in passing.' },
]

export default function JobMatch({
  jd,
  onJdChange,
  score,
  onAddKeyword,
}: {
  jd: string
  onJdChange: (v: string) => void
  score: ScoreResult
  onAddKeyword: (kw: KeywordHit) => void
}) {
  const [onlyMissing, setOnlyMissing] = useState(false)
  const title = extractJobTitle(jd)
  const matched = score.keywords.filter((k) => k.found).length
  const total = score.keywords.length

  return (
    <div className="pane-inner" id="sec-jd">
      <div className="field">
        <label>Target job description</label>
        <textarea
          rows={12}
          value={jd}
          placeholder="Paste the full job posting here — responsibilities and requirements included. Keyword scoring, gap analysis and title matching all run off this text."
          onChange={(e) => onJdChange(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={() => onJdChange(SAMPLE_JD)}>
          Load sample posting
        </button>
        <button className="btn btn-sm" onClick={() => onJdChange('')} disabled={!jd}>
          Clear
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: 'var(--text-3)', alignSelf: 'center' }}>
          {jd.trim().split(/\s+/).filter(Boolean).length} words
        </span>
      </div>

      {total === 0 ? (
        <div className="empty-state">
          <b>No posting analysed yet</b>
          Paste a job description above to see which of its keywords your resume already covers — and which are missing.
        </div>
      ) : (
        <>
          <div className="card">
            {title && (
              <div style={{ fontSize: 12.5, marginBottom: 8 }}>
                Detected title: <b>{title}</b>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <b style={{ fontSize: 20, letterSpacing: '-0.02em' }}>{Math.round(score.stats.matchRate * 100)}%</b>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>weighted keyword match</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {matched} of {total} terms
              </span>
            </div>
            <div className="match-bar">
              <i style={{ width: `${score.stats.matchRate * 100}%` }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
              Weighted by how central each term is to the posting. 85%+ is a strong match; below 50% you are likely
              screened out before a human reads it.
            </div>
          </div>

          <div className="kw-legend">
            <span>
              <i style={{ background: 'var(--ok)' }} />
              on your resume
            </span>
            <span>
              <i style={{ background: 'var(--bad)' }} />
              missing — click + to add
            </span>
            <label className="checkbox" style={{ marginLeft: 'auto' }}>
              <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
              Only show missing
            </label>
          </div>

          {GROUPS.map((g) => {
            const list = score.keywords.filter((k) => k.weight === g.weight && (!onlyMissing || !k.found))
            if (!list.length) return null
            return (
              <div className="kw-group" key={g.weight}>
                <h4>
                  {g.label} · {list.filter((k) => k.found).length}/{score.keywords.filter((k) => k.weight === g.weight).length}
                </h4>
                <div className="kw-list">
                  {list.map((k) => (
                    <span
                      className={`kw ${k.found ? 'found' : 'missing'}`}
                      key={k.term}
                      title={k.found ? `Found in: ${k.where.join(', ')}` : `Not found in your resume (${k.kind})`}
                    >
                      {k.term}
                      {!k.found && (
                        <button type="button" onClick={() => onAddKeyword(k)} title="Add to skills">
                          +
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 5 }}>{g.note}</div>
              </div>
            )
          })}

          <div className="callout warn" style={{ marginTop: 14 }}>
            Only add keywords you can genuinely back up. Recruiters screen for evidence in the interview, and keyword
            stuffing is visible to both humans and modern semantic ranking.
          </div>
        </>
      )}
    </div>
  )
}
