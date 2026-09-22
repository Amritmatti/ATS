import type { Resume } from '../types'

/* ------------------------------------------------------------------ plain text (.txt) */

export function resumeToText(r: Resume): string {
  const out: string[] = []
  const line = (s = '') => out.push(s)
  const heading = (s: string) => {
    line()
    line(s.toUpperCase())
  }

  line(r.contact.fullName)
  if (r.contact.headline) line(r.contact.headline)
  line(
    [r.contact.location, r.contact.phone, r.contact.email, r.contact.linkedin, r.contact.website]
      .filter(Boolean)
      .join(' | '),
  )

  if (r.summary.trim()) {
    heading('Professional Summary')
    line(r.summary.trim())
  }

  if (r.experience.length) {
    heading('Work Experience')
    for (const e of r.experience) {
      line()
      line(`${e.title}${e.company ? `, ${e.company}` : ''}${e.location ? `, ${e.location}` : ''}`)
      line(`${e.start}${e.start ? ' - ' : ''}${e.current ? 'Present' : e.end}`)
      for (const b of e.bullets) if (b.text.trim()) line(`- ${b.text.trim()}`)
    }
  }

  if (r.skills.some((g) => g.items.length)) {
    heading('Skills')
    for (const g of r.skills) if (g.items.length) line(`${g.label}: ${g.items.join(', ')}`)
  }

  if (r.projects.length) {
    heading('Projects')
    for (const p of r.projects) {
      line()
      line([p.name, p.role, p.link].filter(Boolean).join(' | '))
      for (const b of p.bullets) if (b.text.trim()) line(`- ${b.text.trim()}`)
    }
  }

  if (r.education.length) {
    heading('Education')
    for (const e of r.education) {
      line()
      line([[e.degree, e.field].filter(Boolean).join(' '), e.school, e.location].filter(Boolean).join(', '))
      const dates = [e.start, e.end].filter(Boolean).join(' - ')
      if (dates) line(dates)
      if (e.detail) line(e.detail)
    }
  }

  if (r.certifications.length) {
    heading('Certifications')
    for (const c of r.certifications)
      line(`- ${[c.name, c.issuer, c.date].filter(Boolean).join(', ')}`)
  }

  return out.join('\n')
}

/* ------------------------------------------------------------------ Word (.docx) */

export async function resumeToDocxBlob(r: Resume): Promise<Blob> {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Packer,
    Paragraph,
    TextRun,
  } = await import('docx')

  const FONT = 'Calibri'
  const body = (text: string, opts: { bold?: boolean; size?: number; align?: any; spacing?: any } = {}) =>
    new Paragraph({
      alignment: opts.align,
      spacing: opts.spacing ?? { after: 40 },
      children: [new TextRun({ text, bold: opts.bold, font: FONT, size: opts.size ?? 21 })],
    })

  const sectionHeading = (text: string) =>
    new Paragraph({
      spacing: { before: 220, after: 90 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999', space: 2 } },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: 22, color: '1a1a1a' })],
    })

  const bullet = (text: string) =>
    new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 60 },
      children: [new TextRun({ text, font: FONT, size: 21 })],
    })

  const children: any[] = []

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: r.contact.fullName, bold: true, font: FONT, size: 32 })],
    }),
  )
  if (r.contact.headline)
    children.push(body(r.contact.headline, { align: AlignmentType.CENTER, size: 22, bold: true }))
  children.push(
    body(
      [r.contact.location, r.contact.phone, r.contact.email, r.contact.linkedin, r.contact.website]
        .filter(Boolean)
        .join(' | '),
      { align: AlignmentType.CENTER, size: 19, spacing: { after: 120 } },
    ),
  )

  if (r.summary.trim()) {
    children.push(sectionHeading('Professional Summary'))
    children.push(body(r.summary.trim()))
  }

  if (r.experience.length) {
    children.push(sectionHeading('Work Experience'))
    for (const e of r.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 0 },
          children: [
            new TextRun({ text: e.title, bold: true, font: FONT, size: 22 }),
            new TextRun({ text: e.company ? `, ${e.company}` : '', font: FONT, size: 22 }),
          ],
        }),
      )
      children.push(
        body(
          [`${e.start}${e.start ? ' - ' : ''}${e.current ? 'Present' : e.end}`, e.location].filter(Boolean).join(' | '),
          { size: 19 },
        ),
      )
      for (const b of e.bullets) if (b.text.trim()) children.push(bullet(b.text.trim()))
    }
  }

  if (r.skills.some((g) => g.items.length)) {
    children.push(sectionHeading('Skills'))
    for (const g of r.skills) {
      if (!g.items.length) continue
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${g.label}: `, bold: true, font: FONT, size: 21 }),
            new TextRun({ text: g.items.join(', '), font: FONT, size: 21 }),
          ],
        }),
      )
    }
  }

  if (r.projects.length) {
    children.push(sectionHeading('Projects'))
    for (const p of r.projects) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 0 },
          children: [
            new TextRun({ text: p.name, bold: true, font: FONT, size: 22 }),
            new TextRun({ text: [p.role, p.link].filter(Boolean).length ? ` | ${[p.role, p.link].filter(Boolean).join(' | ')}` : '', font: FONT, size: 20 }),
          ],
        }),
      )
      for (const b of p.bullets) if (b.text.trim()) children.push(bullet(b.text.trim()))
    }
  }

  if (r.education.length) {
    children.push(sectionHeading('Education'))
    for (const e of r.education) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 0 },
          children: [
            new TextRun({ text: [[e.degree, e.field].filter(Boolean).join(' '), e.school].filter(Boolean).join(', '), bold: true, font: FONT, size: 21 }),
          ],
        }),
      )
      const meta = [[e.start, e.end].filter(Boolean).join(' - '), e.location].filter(Boolean).join(' | ')
      if (meta) children.push(body(meta, { size: 19 }))
      if (e.detail) children.push(body(e.detail, { size: 20 }))
    }
  }

  if (r.certifications.length) {
    children.push(sectionHeading('Certifications'))
    for (const c of r.certifications)
      children.push(bullet([c.name, c.issuer, c.date].filter(Boolean).join(', ')))
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children,
      },
    ],
  })

  return Packer.toBlob(doc)
}

/* ------------------------------------------------------------------ helpers */

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function safeFilename(r: Resume, ext: string): string {
  const name = (r.contact.fullName || 'Resume').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')
  const role = (r.targetRole || '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')
  return [name, role, 'Resume'].filter(Boolean).join('_').replace(/_Resume_Resume$/, '_Resume') + ext
}
