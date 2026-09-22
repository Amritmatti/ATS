import React from 'react'
import type { Resume } from '../types'
import { Area, Text, TagEditor } from './ui'
import { uid } from '../lib/sample'
import { ALL_ACTION_VERBS } from '../lib/vocab'

type Patch = (fn: (draft: Resume) => void) => void

const QUANT = /\d/

function bulletFlags(text: string) {
  const first = (text.trim().match(/^[A-Za-z'-]+/) || [''])[0].toLowerCase()
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return {
    verb: ALL_ACTION_VERBS.has(first),
    number: QUANT.test(text),
    length: words >= 8 && words <= 32,
    words,
  }
}

function BulletFlags({ text }: { text: string }) {
  const f = bulletFlags(text)
  if (!text.trim()) return <div className="bullet-flags" />
  return (
    <div className="bullet-flags">
      <span className={`flag ${f.verb ? 'on' : 'off'}`} title={f.verb ? 'Starts with a strong action verb' : 'Start with an action verb (Led, Built, Reduced…)'}>
        V
      </span>
      <span className={`flag ${f.number ? 'on' : 'off'}`} title={f.number ? 'Contains a metric' : 'No number — quantify the result'}>
        #
      </span>
      <span className={`flag ${f.length ? 'on' : 'off'}`} title={`${f.words} words — aim for 8-32`}>
        {f.words}
      </span>
    </div>
  )
}

export default function Editor({
  resume,
  patch,
  matchedSkill,
}: {
  resume: Resume
  patch: Patch
  matchedSkill: (s: string) => boolean
}) {
  const c = resume.contact

  return (
    <div className="pane-inner">
      {/* ---------------------------------------------------------- target + contact */}
      <div className="section-block" id="sec-contact">
        <h2>Target &amp; Contact</h2>
        <div className="card">
          <Text
            label="Target role"
            value={resume.targetRole}
            onChange={(v) => patch((d) => void (d.targetRole = v))}
            placeholder="Senior Data Engineer"
            hint="Used to tailor scoring. Match the posted job title exactly where you can."
          />
          <div className="grid-2">
            <Text label="Full name" value={c.fullName} onChange={(v) => patch((d) => void (d.contact.fullName = v))} placeholder="Priya Raman" />
            <Text label="Headline" value={c.headline} onChange={(v) => patch((d) => void (d.contact.headline = v))} placeholder="Senior Data Engineer" />
            <Text label="Email" type="email" value={c.email} onChange={(v) => patch((d) => void (d.contact.email = v))} placeholder="name@email.com" />
            <Text label="Phone" type="tel" value={c.phone} onChange={(v) => patch((d) => void (d.contact.phone = v))} placeholder="+44 7700 900123" />
            <Text label="Location" value={c.location} onChange={(v) => patch((d) => void (d.contact.location = v))} placeholder="London, United Kingdom" />
            <Text label="LinkedIn" value={c.linkedin} onChange={(v) => patch((d) => void (d.contact.linkedin = v))} placeholder="linkedin.com/in/yourname" />
          </div>
          <Text
            label="Website / portfolio"
            value={c.website}
            onChange={(v) => patch((d) => void (d.contact.website = v))}
            placeholder="github.com/yourname"
            hint="Plain text URLs only — parsers often drop hyperlinked display text."
          />
        </div>
      </div>

      {/* ---------------------------------------------------------- summary */}
      <div className="section-block" id="sec-summary">
        <h2>Professional Summary</h2>
        <div className="card">
          <Area
            label="Summary"
            rows={5}
            value={resume.summary}
            onChange={(v) => patch((d) => void (d.summary = v))}
            placeholder="3-4 lines: title, years of experience, domain, two or three headline achievements with numbers."
            hint={`${resume.summary.trim().split(/\s+/).filter(Boolean).length} words — target 30-90.`}
          />
        </div>
      </div>

      {/* ---------------------------------------------------------- experience */}
      <div className="section-block" id="sec-experience">
        <h2>Work Experience</h2>
        {resume.experience.map((e, i) => (
          <div className="card" key={e.id}>
            <div className="card-head">
              <h3>{e.title || e.company || `Role ${i + 1}`}</h3>
              <div className="spacer" />
              <button
                className="btn btn-sm btn-ghost"
                disabled={i === 0}
                title="Move up"
                onClick={() =>
                  patch((d) => {
                    const arr = d.experience
                    ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
                  })
                }
              >
                ↑
              </button>
              <button
                className="btn btn-sm btn-ghost"
                disabled={i === resume.experience.length - 1}
                title="Move down"
                onClick={() =>
                  patch((d) => {
                    const arr = d.experience
                    ;[arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]
                  })
                }
              >
                ↓
              </button>
              <button
                className="btn btn-sm btn-danger btn-ghost"
                onClick={() => patch((d) => void (d.experience = d.experience.filter((x) => x.id !== e.id)))}
              >
                Remove
              </button>
            </div>

            <div className="grid-2">
              <Text label="Job title" value={e.title} onChange={(v) => patch((d) => void (d.experience[i].title = v))} placeholder="Senior Data Engineer" />
              <Text label="Company" value={e.company} onChange={(v) => patch((d) => void (d.experience[i].company = v))} placeholder="Northgate Financial" />
            </div>
            <div className="grid-3">
              <Text label="Location" value={e.location} onChange={(v) => patch((d) => void (d.experience[i].location = v))} placeholder="London, UK" />
              <Text label="Start" value={e.start} onChange={(v) => patch((d) => void (d.experience[i].start = v))} placeholder="Mar 2022" />
              <Text
                label="End"
                value={e.current ? '' : e.end}
                onChange={(v) => patch((d) => void (d.experience[i].end = v))}
                placeholder={e.current ? 'Present' : 'Feb 2024'}
              />
            </div>
            <label className="checkbox" style={{ marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={e.current}
                onChange={(ev) => patch((d) => void (d.experience[i].current = ev.target.checked))}
              />
              I currently work here
            </label>

            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)' }}>Achievement bullets</label>
            <div style={{ marginTop: 6 }}>
              {e.bullets.map((b, bi) => (
                <div className="bullet-row" key={b.id}>
                  <textarea
                    rows={2}
                    value={b.text}
                    placeholder="Verb + what you did + measurable result (e.g. Cut deployment time 87% by automating…)"
                    onChange={(ev) => patch((d) => void (d.experience[i].bullets[bi].text = ev.target.value))}
                  />
                  <BulletFlags text={b.text} />
                  <button
                    className="btn btn-sm btn-ghost btn-danger"
                    title="Delete bullet"
                    onClick={() => patch((d) => void (d.experience[i].bullets = d.experience[i].bullets.filter((x) => x.id !== b.id)))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn btn-sm"
              onClick={() => patch((d) => void d.experience[i].bullets.push({ id: uid(), text: '' }))}
            >
              + Add bullet
            </button>
          </div>
        ))}
        <button
          className="btn"
          onClick={() =>
            patch((d) =>
              void d.experience.push({
                id: uid(),
                title: '',
                company: '',
                location: '',
                start: '',
                end: '',
                current: false,
                bullets: [{ id: uid(), text: '' }],
              }),
            )
          }
        >
          + Add role
        </button>
      </div>

      {/* ---------------------------------------------------------- skills */}
      <div className="section-block" id="sec-skills">
        <h2>Skills</h2>
        {resume.skills.map((g, i) => (
          <div className="card" key={g.id}>
            <div className="card-head">
              <input
                value={g.label}
                onChange={(ev) => patch((d) => void (d.skills[i].label = ev.target.value))}
                style={{ fontWeight: 650, maxWidth: 240 }}
              />
              <div className="spacer" />
              <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{g.items.length} items</span>
              <button
                className="btn btn-sm btn-ghost btn-danger"
                onClick={() => patch((d) => void (d.skills = d.skills.filter((x) => x.id !== g.id)))}
              >
                Remove
              </button>
            </div>
            <TagEditor
              items={g.items}
              highlight={matchedSkill}
              onChange={(items) => patch((d) => void (d.skills[i].items = items))}
            />
          </div>
        ))}
        <button className="btn" onClick={() => patch((d) => void d.skills.push({ id: uid(), label: 'New group', items: [] }))}>
          + Add skill group
        </button>
      </div>

      {/* ---------------------------------------------------------- projects */}
      <div className="section-block" id="sec-projects">
        <h2>Projects</h2>
        {resume.projects.map((p, i) => (
          <div className="card" key={p.id}>
            <div className="card-head">
              <h3>{p.name || `Project ${i + 1}`}</h3>
              <div className="spacer" />
              <button className="btn btn-sm btn-ghost btn-danger" onClick={() => patch((d) => void (d.projects = d.projects.filter((x) => x.id !== p.id)))}>
                Remove
              </button>
            </div>
            <div className="grid-2">
              <Text label="Name" value={p.name} onChange={(v) => patch((d) => void (d.projects[i].name = v))} />
              <Text label="Your role" value={p.role} onChange={(v) => patch((d) => void (d.projects[i].role = v))} placeholder="Creator" />
            </div>
            <Text label="Link" value={p.link} onChange={(v) => patch((d) => void (d.projects[i].link = v))} placeholder="github.com/you/project" />
            {p.bullets.map((b, bi) => (
              <div className="bullet-row" key={b.id}>
                <textarea rows={2} value={b.text} onChange={(ev) => patch((d) => void (d.projects[i].bullets[bi].text = ev.target.value))} />
                <BulletFlags text={b.text} />
                <button
                  className="btn btn-sm btn-ghost btn-danger"
                  onClick={() => patch((d) => void (d.projects[i].bullets = d.projects[i].bullets.filter((x) => x.id !== b.id)))}
                >
                  ×
                </button>
              </div>
            ))}
            <button className="btn btn-sm" onClick={() => patch((d) => void d.projects[i].bullets.push({ id: uid(), text: '' }))}>
              + Add bullet
            </button>
          </div>
        ))}
        <button
          className="btn"
          onClick={() => patch((d) => void d.projects.push({ id: uid(), name: '', role: '', link: '', start: '', end: '', bullets: [{ id: uid(), text: '' }] }))}
        >
          + Add project
        </button>
      </div>

      {/* ---------------------------------------------------------- education */}
      <div className="section-block" id="sec-education">
        <h2>Education</h2>
        {resume.education.map((e, i) => (
          <div className="card" key={e.id}>
            <div className="card-head">
              <h3>{[e.degree, e.field].filter(Boolean).join(' ') || `Education ${i + 1}`}</h3>
              <div className="spacer" />
              <button className="btn btn-sm btn-ghost btn-danger" onClick={() => patch((d) => void (d.education = d.education.filter((x) => x.id !== e.id)))}>
                Remove
              </button>
            </div>
            <div className="grid-2">
              <Text label="Qualification" value={e.degree} onChange={(v) => patch((d) => void (d.education[i].degree = v))} placeholder="MSc" />
              <Text label="Field" value={e.field} onChange={(v) => patch((d) => void (d.education[i].field = v))} placeholder="Computer Science" />
              <Text label="Institution" value={e.school} onChange={(v) => patch((d) => void (d.education[i].school = v))} placeholder="University of Manchester" />
              <Text label="Location" value={e.location} onChange={(v) => patch((d) => void (d.education[i].location = v))} />
              <Text label="Start" value={e.start} onChange={(v) => patch((d) => void (d.education[i].start = v))} placeholder="Sep 2016" />
              <Text label="End" value={e.end} onChange={(v) => patch((d) => void (d.education[i].end = v))} placeholder="Sep 2017" />
            </div>
            <Text label="Detail (optional)" value={e.detail} onChange={(v) => patch((d) => void (d.education[i].detail = v))} placeholder="Distinction. Relevant coursework…" />
          </div>
        ))}
        <button
          className="btn"
          onClick={() => patch((d) => void d.education.push({ id: uid(), degree: '', field: '', school: '', location: '', start: '', end: '', detail: '' }))}
        >
          + Add education
        </button>
      </div>

      {/* ---------------------------------------------------------- certifications */}
      <div className="section-block" id="sec-certifications">
        <h2>Certifications</h2>
        {resume.certifications.map((cert, i) => (
          <div className="card" key={cert.id}>
            <div className="card-head">
              <h3>{cert.name || `Certification ${i + 1}`}</h3>
              <div className="spacer" />
              <button
                className="btn btn-sm btn-ghost btn-danger"
                onClick={() => patch((d) => void (d.certifications = d.certifications.filter((x) => x.id !== cert.id)))}
              >
                Remove
              </button>
            </div>
            <Text label="Name" value={cert.name} onChange={(v) => patch((d) => void (d.certifications[i].name = v))} placeholder="AWS Certified Solutions Architect – Associate" />
            <div className="grid-2">
              <Text label="Issuer" value={cert.issuer} onChange={(v) => patch((d) => void (d.certifications[i].issuer = v))} />
              <Text label="Date" value={cert.date} onChange={(v) => patch((d) => void (d.certifications[i].date = v))} placeholder="Apr 2024" />
            </div>
          </div>
        ))}
        <button
          className="btn"
          onClick={() => patch((d) => void d.certifications.push({ id: uid(), name: '', issuer: '', date: '', credentialId: '' }))}
        >
          + Add certification
        </button>
      </div>
    </div>
  )
}
