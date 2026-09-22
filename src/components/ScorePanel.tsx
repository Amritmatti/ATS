import React, { useState } from 'react'
import type { Recommendation, ScoreResult } from '../types'
import { Ring } from './ui'

const SECTION_ANCHOR: Record<string, string> = {
  contact: 'sec-contact',
  summary: 'sec-summary',
  experience: 'sec-experience',
  skills: 'sec-skills',
  projects: 'sec-projects',
  education: 'sec-education',
  certifications: 'sec-certifications',
}

function meterColor(ratio: number) {
  if (ratio >= 0.8) return 'var(--ok)'
  if (ratio >= 0.55) return 'var(--warn)'
  return 'var(--bad)'
}

export default function ScorePanel({
  score,
  onApplyFix,
  onGoToJd,
}: {
  score: ScoreResult
  onApplyFix: (rec: Recommendation) => void
  onGoToJd: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'quick'>('all')

  const recs = score.recommendations.filter((r) => (filter === 'quick' ? r.impact >= 2 : true))
  const potential = Math.min(100, score.total + score.recommendations.reduce((s, r) => s + r.impact, 0))

  const goTo = (rec: Recommendation) => {
    if (rec.section === 'jd') {
      onGoToJd()
      return
    }
    const id = SECTION_ANCHOR[rec.section ?? '']
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pane-inner">
      <div className="ring-wrap" style={{ marginBottom: 16 }}>
        <Ring value={score.total} size={104} stroke={9}>
          <div>
            <b>{score.total}</b>
            <span>/ 100</span>
          </div>
        </Ring>
        <div>
          <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: '-0.01em' }}>{score.grade}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            {potential > score.total ? (
              <>
                Up to <b style={{ color: 'var(--accent)' }}>{potential}</b> if you clear every recommendation.
              </>
            ) : (
              'Everything we check is passing.'
            )}
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <b>{score.stats.words}</b>
          <span>words</span>
        </div>
        <div className="stat">
          <b>{score.stats.pages}</b>
          <span>est. pages</span>
        </div>
        <div className="stat">
          <b>{score.stats.bullets}</b>
          <span>bullets</span>
        </div>
        <div className="stat">
          <b>
            {score.stats.bullets ? Math.round((score.stats.quantifiedBullets / score.stats.bullets) * 100) : 0}%
          </b>
          <span>quantified</span>
        </div>
        <div className="stat">
          <b>{score.stats.bullets ? Math.round((score.stats.actionVerbBullets / score.stats.bullets) * 100) : 0}%</b>
          <span>action verbs</span>
        </div>
        <div className="stat">
          <b>{score.keywords.length ? `${Math.round(score.stats.matchRate * 100)}%` : '—'}</b>
          <span>JD match</span>
        </div>
      </div>

      {score.categories.map((cat) => {
        const ratio = cat.score / cat.max
        return (
          <div className="meter" key={cat.id}>
            <div className="meter-top">
              <b>{cat.label}</b>
              <span className="val">
                {cat.score}/{cat.max}
              </span>
            </div>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${ratio * 100}%`, background: meterColor(ratio) }} />
            </div>
            <div className="meter-blurb">{cat.blurb}</div>
          </div>
        )
      })}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
        <h3 style={{ margin: 0, fontSize: 13.5 }}>
          Recommendations <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({recs.length})</span>
        </h3>
        <div style={{ flex: 1 }} />
        <div className="tabs">
          <button className="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </button>
          <button className="tab" aria-selected={filter === 'quick'} onClick={() => setFilter('quick')}>
            Biggest wins
          </button>
        </div>
      </div>

      {recs.length === 0 && (
        <div className="empty-state">
          <b>Nothing left to fix</b>
          Your resume passes every check in this category filter.
        </div>
      )}

      {recs.map((rec) => (
        <div className={`rec ${rec.severity}`} key={rec.id}>
          <div className="rec-head">
            <h4>{rec.title}</h4>
            <span className={`pill ${rec.severity}`}>{rec.severity}</span>
            {rec.impact > 0 && <span className="pill gain">+{rec.impact}</span>}
          </div>
          <p className="rec-detail">{rec.detail}</p>
          {rec.examples && rec.examples.length > 0 && (
            <div className="rec-examples">
              <div className="ex-label">{rec.id.startsWith('missing') ? 'Missing terms' : 'Examples'}</div>
              {rec.id.startsWith('missing') || rec.id === 'skills-only-keywords' ? (
                <div>{rec.examples.join(' · ')}</div>
              ) : (
                rec.examples.map((ex, i) => <div key={i}>• {ex}</div>)
              )}
            </div>
          )}
          <div className="rec-actions">
            {rec.section && (
              <button className="btn btn-sm" onClick={() => goTo(rec)}>
                Go to {rec.section === 'jd' ? 'job description' : rec.section}
              </button>
            )}
            {rec.fix && (
              <button className="btn btn-sm btn-primary" onClick={() => onApplyFix(rec)}>
                {rec.fix.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
