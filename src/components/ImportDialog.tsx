import React, { useRef, useState } from 'react'
import type { Resume } from '../types'
import { extractText, textToResume } from '../lib/parse'
import { Modal } from './ui'

type Stage = 'pick' | 'busy' | 'review'

export default function ImportDialog({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: (resume: Resume) => void
}) {
  const [stage, setStage] = useState<Stage>('pick')
  const [over, setOver] = useState(false)
  const [text, setText] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState<Resume | null>(null)
  const [pasted, setPasted] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleText = (raw: string, fileWarnings: string[] = []) => {
    const { resume, warnings: w } = textToResume(raw)
    setText(raw)
    setParsed(resume)
    setWarnings([...fileWarnings, ...w])
    setStage('review')
  }

  const handleFile = async (file: File) => {
    setStage('busy')
    setError('')
    try {
      const { text: raw, warnings: w } = await extractText(file)
      handleText(raw, w)
    } catch (e: any) {
      setError(e?.message || 'Could not read that file.')
      setStage('pick')
    }
  }

  const counts = parsed
    ? {
        roles: parsed.experience.length,
        bullets: parsed.experience.reduce((s, e) => s + e.bullets.length, 0),
        skills: parsed.skills.reduce((s, g) => s + g.items.length, 0),
        education: parsed.education.length,
        certs: parsed.certifications.length,
      }
    : null

  return (
    <Modal
      title="Import an existing resume"
      onClose={onClose}
      footer={
        stage === 'review' ? (
          <>
            <button className="btn" onClick={() => setStage('pick')}>
              Back
            </button>
            <button className="btn btn-primary" onClick={() => parsed && onImport(parsed)}>
              Import into editor
            </button>
          </>
        ) : (
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
        )
      }
    >
      {stage === 'pick' && (
        <>
          <div className="callout info">
            We extract text the same way an ATS does, then rebuild the structure. Whatever shows below is roughly what a
            parser sees — if it looks wrong, that is the problem to fix.
          </div>

          <div
            className={`dropzone${over ? ' over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(false)
              const f = e.dataTransfer.files?.[0]
              if (f) handleFile(f)
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>⬆</div>
            <b>Drop a PDF, DOCX or TXT here</b>
            <div style={{ fontSize: 12, marginTop: 4 }}>or click to browse</div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {error && <div className="callout warn" style={{ marginTop: 12 }}>{error}</div>}

          <div style={{ marginTop: 18 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)' }}>Or paste resume text</label>
            <textarea
              rows={6}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="Paste the full text of your resume…"
              style={{ marginTop: 5 }}
            />
            <button className="btn btn-sm" style={{ marginTop: 8 }} disabled={pasted.trim().length < 50} onClick={() => handleText(pasted)}>
              Parse pasted text
            </button>
          </div>
        </>
      )}

      {stage === 'busy' && <div className="empty-state">Extracting text…</div>}

      {stage === 'review' && parsed && counts && (
        <>
          {warnings.length > 0 ? (
            <div className="callout warn">
              <b>{warnings.length} parsing issue{warnings.length === 1 ? '' : 's'} an ATS would also hit</b>
              <ul>
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="callout ok">Clean extraction — no structural parsing problems detected.</div>
          )}

          <div className="stats" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div className="stat">
              <b>{counts.roles}</b>
              <span>roles</span>
            </div>
            <div className="stat">
              <b>{counts.bullets}</b>
              <span>bullets</span>
            </div>
            <div className="stat">
              <b>{counts.skills}</b>
              <span>skills</span>
            </div>
            <div className="stat">
              <b>{counts.education}</b>
              <span>education</span>
            </div>
            <div className="stat">
              <b>{counts.certs}</b>
              <span>certs</span>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
            Detected: <b>{parsed.contact.fullName || 'no name'}</b> · {parsed.contact.email || 'no email'} ·{' '}
            {parsed.contact.phone || 'no phone'}
          </div>

          <details>
            <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-2)', margin: '10px 0 6px' }}>
              Show raw extracted text ({text.length.toLocaleString()} characters)
            </summary>
            <div className="raw-text">{text || '(nothing extracted)'}</div>
          </details>

          <div className="callout info" style={{ marginTop: 12 }}>
            Importing replaces the current resume in the editor. Parsing is heuristic — check the roles, dates and skills
            after import.
          </div>
        </>
      )}
    </Modal>
  )
}
