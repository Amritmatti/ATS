import React, { useMemo } from 'react'
import type { KeywordHit, Resume } from '../types'
import { SKILL_TAXONOMY } from '../lib/vocab'

function buildHighlighter(keywords: KeywordHit[], enabled: boolean) {
  if (!enabled) return null
  const terms = keywords
    .filter((k) => k.found)
    .flatMap((k) => [k.term, ...(SKILL_TAXONOMY[k.term] || [])])
    .filter((t) => t.length >= 2)
    .sort((a, b) => b.length - a.length)
  if (!terms.length) return null
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`(?<![a-z0-9])(${escaped.join('|')})(?![a-z0-9])`, 'gi')
}

function Highlight({ text, re }: { text: string; re: RegExp | null }) {
  if (!re || !text) return <>{text}</>
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i}>{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  )
}

export default function Preview({
  resume: r,
  keywords,
  highlight,
  pageBreakAt,
}: {
  resume: Resume
  keywords: KeywordHit[]
  highlight: boolean
  pageBreakAt: number | null
}) {
  const re = useMemo(() => buildHighlighter(keywords, highlight), [keywords, highlight])
  const contactLine = [r.contact.location, r.contact.phone, r.contact.email, r.contact.linkedin, r.contact.website]
    .filter(Boolean)
    .join('  |  ')

  const hasSkills = r.skills.some((g) => g.items.length)

  return (
    <div className="paper-wrap">
      <div className="paper" style={pageBreakAt ? { position: 'relative' } : undefined}>
        <h1>{r.contact.fullName || <span className="p-empty">Your Name</span>}</h1>
        {r.contact.headline && <div className="p-headline">{r.contact.headline}</div>}
        <div className="p-contact">{contactLine || <span className="p-empty">email  |  phone  |  city</span>}</div>

        {r.summary.trim() && (
          <>
            <h2>Professional Summary</h2>
            <div>
              <Highlight text={r.summary.trim()} re={re} />
            </div>
          </>
        )}

        {r.experience.length > 0 && (
          <>
            <h2>Work Experience</h2>
            {r.experience.map((e) => (
              <div key={e.id}>
                <div className="p-role">
                  <div>
                    <strong>{e.title || <span className="p-empty">Job title</span>}</strong>
                    {e.company && <span>, {e.company}</span>}
                  </div>
                  <div className="p-dates">
                    {e.start}
                    {(e.start || e.end || e.current) && ' – '}
                    {e.current ? 'Present' : e.end}
                  </div>
                </div>
                {e.location && <div className="p-sub">{e.location}</div>}
                {e.bullets.some((b) => b.text.trim()) && (
                  <ul>
                    {e.bullets
                      .filter((b) => b.text.trim())
                      .map((b) => (
                        <li key={b.id}>
                          <Highlight text={b.text.trim()} re={re} />
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}

        {hasSkills && (
          <>
            <h2>Skills</h2>
            {r.skills
              .filter((g) => g.items.length)
              .map((g) => (
                <div className="p-skill-line" key={g.id}>
                  <strong>{g.label}:</strong> <Highlight text={g.items.join(', ')} re={re} />
                </div>
              ))}
          </>
        )}

        {r.projects.length > 0 && (
          <>
            <h2>Projects</h2>
            {r.projects.map((p) => (
              <div key={p.id}>
                <div className="p-role">
                  <div>
                    <strong>{p.name}</strong>
                    {p.role && <span>, {p.role}</span>}
                  </div>
                  {p.link && <div className="p-dates">{p.link}</div>}
                </div>
                {p.bullets.some((b) => b.text.trim()) && (
                  <ul>
                    {p.bullets
                      .filter((b) => b.text.trim())
                      .map((b) => (
                        <li key={b.id}>
                          <Highlight text={b.text.trim()} re={re} />
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}

        {r.education.length > 0 && (
          <>
            <h2>Education</h2>
            {r.education.map((e) => (
              <div key={e.id}>
                <div className="p-role">
                  <div>
                    <strong>{[e.degree, e.field].filter(Boolean).join(' ') || <span className="p-empty">Qualification</span>}</strong>
                    {e.school && <span>, {e.school}</span>}
                  </div>
                  <div className="p-dates">{[e.start, e.end].filter(Boolean).join(' – ')}</div>
                </div>
                {(e.location || e.detail) && <div className="p-sub">{[e.location, e.detail].filter(Boolean).join(' — ')}</div>}
              </div>
            ))}
          </>
        )}

        {r.certifications.length > 0 && (
          <>
            <h2>Certifications</h2>
            <ul>
              {r.certifications.map((c) => (
                <li key={c.id}>
                  <Highlight text={[c.name, c.issuer, c.date].filter(Boolean).join(', ')} re={re} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
