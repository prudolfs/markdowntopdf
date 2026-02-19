import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Route } from './+types/editor'

const DEFAULT_MARKDOWN = `# Markdown to PDF

Write Markdown on the left. See a live preview on the right.

## Quick tips
- **Bold** and *italic*
- Inline \`code\`
- Links: [React Router](https://reactrouter.com)
- Quotes:
  > This preview updates as you type.

## Code block
\`\`\`ts
type Document = {
  title: string
  updatedAt: string
}
\`\`\`

## Checklist
1. Draft the content
2. Review the preview
3. Download as PDF
`

const PAGE_SIZES = {
  a4: { label: 'A4', width: 210, height: 297 },
  letter: { label: 'Letter', width: 216, height: 279 },
} as const

type PageSize = keyof typeof PAGE_SIZES

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Markdown to PDF Editor' },
    { name: 'description', content: 'Realtime Markdown editor and PDF export.' },
  ]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitizeUrl(value: string) {
  const trimmed = value.trim()
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('#')
  ) {
    return trimmed
  }
  return '#'
}

function formatInline(text: string) {
  let formatted = escapeHtml(text)

  formatted = formatted.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_, label, url) => {
    const safeUrl = sanitizeUrl(url)
    return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${label}</a>`
  })

  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>')

  return formatted
}

function renderMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const parts: string[] = []
  let inCodeBlock = false
  let codeFence = ''
  let codeLines: string[] = []
  let listBuffer: string[] = []
  let orderedListBuffer: string[] = []
  let quoteBuffer: string[] = []

  const flushList = () => {
    if (listBuffer.length > 0) {
      parts.push(`<ul>${listBuffer.join('')}</ul>`)
      listBuffer = []
    }
  }

  const flushOrderedList = () => {
    if (orderedListBuffer.length > 0) {
      parts.push(`<ol>${orderedListBuffer.join('')}</ol>`)
      orderedListBuffer = []
    }
  }

  const flushQuote = () => {
    if (quoteBuffer.length > 0) {
      parts.push(`<blockquote>${quoteBuffer.join('<br />')}</blockquote>`)
      quoteBuffer = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ')

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeFence = line.slice(3).trim()
        codeLines = []
        flushList()
        flushOrderedList()
        flushQuote()
      } else {
        const code = escapeHtml(codeLines.join('\n'))
        const langClass = codeFence ? ` language-${codeFence}` : ''
        parts.push(`<pre><code class="${langClass.trim()}">${code}</code></pre>`)
        inCodeBlock = false
        codeFence = ''
        codeLines = []
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(rawLine)
      continue
    }

    const trimmed = line.trim()

    if (trimmed === '') {
      flushList()
      flushOrderedList()
      flushQuote()
      continue
    }

    if (trimmed === '---') {
      flushList()
      flushOrderedList()
      flushQuote()
      parts.push('<hr />')
      continue
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (headingMatch) {
      flushList()
      flushOrderedList()
      flushQuote()
      const level = headingMatch[1].length
      parts.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`)
      continue
    }

    const quoteMatch = /^>\s?(.*)$/.exec(trimmed)
    if (quoteMatch) {
      flushList()
      flushOrderedList()
      quoteBuffer.push(formatInline(quoteMatch[1]))
      continue
    }

    const unorderedMatch = /^[-*+]\s+(.*)$/.exec(trimmed)
    if (unorderedMatch) {
      flushOrderedList()
      flushQuote()
      listBuffer.push(`<li>${formatInline(unorderedMatch[1])}</li>`)
      continue
    }

    const orderedMatch = /^\d+\.\s+(.*)$/.exec(trimmed)
    if (orderedMatch) {
      flushList()
      flushQuote()
      orderedListBuffer.push(`<li>${formatInline(orderedMatch[1])}</li>`)
      continue
    }

    flushList()
    flushOrderedList()
    flushQuote()
    parts.push(`<p>${formatInline(trimmed)}</p>`)
  }

  if (inCodeBlock) {
    const code = escapeHtml(codeLines.join('\n'))
    const langClass = codeFence ? ` language-${codeFence}` : ''
    parts.push(`<pre><code class="${langClass.trim()}">${code}</code></pre>`)
  }

  flushList()
  flushOrderedList()
  flushQuote()

  return parts.join('\n')
}

export default function Editor() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filename, setFilename] = useState('document')
  const [pageSize, setPageSize] = useState<PageSize>('a4')
  const [margin, setMargin] = useState(16)
  const [isExporting, setIsExporting] = useState(false)
  const lineNumbersRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
      return
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const rendered = useMemo(() => renderMarkdown(markdown), [markdown])
  const lines = markdown.split('\n').length

  const handleScroll = () => {
    if (!lineNumbersRef.current || !editorRef.current) return
    lineNumbersRef.current.scrollTop = editorRef.current.scrollTop
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const handleDownload = async () => {
    if (!previewRef.current) return
    const size = PAGE_SIZES[pageSize]
    const safeName = filename.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'document'
    const pxPerMm = 96 / 25.4
    const targetWidthPx = Math.round((size.width - margin * 2) * pxPerMm)

    setIsExporting(true)
    await new Promise((resolve) => setTimeout(resolve, 50))

    const target = previewRef.current
    const exportRoot = document.createElement('div')
    exportRoot.style.position = 'fixed'
    exportRoot.style.left = '-10000px'
    exportRoot.style.top = '0'
    exportRoot.style.width = `${targetWidthPx}px`
    exportRoot.style.padding = '0'
    exportRoot.style.background = '#ffffff'
    exportRoot.style.zIndex = '-1'

    const clone = target.cloneNode(true) as HTMLElement
    clone.style.width = `${targetWidthPx}px`
    clone.style.padding = '0px'

    exportRoot.appendChild(clone)
    document.body.appendChild(exportRoot)

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: '#ffffff',
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    })
    document.body.removeChild(exportRoot)

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [size.width, size.height],
    })

    const pageWidth = size.width - margin * 2
    const pageHeight = size.height - margin * 2
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = pageWidth / imgWidth
    const scaledHeight = imgHeight * ratio

    let position = 0
    let remaining = scaledHeight

    while (remaining > 0) {
      const y = margin - position
      pdf.addImage(imgData, 'PNG', margin, y, pageWidth, scaledHeight, undefined, 'FAST')
      remaining -= pageHeight
      position += pageHeight
      if (remaining > 0) {
        pdf.addPage()
      }
    }

    pdf.save(`${safeName}.pdf`)
    setIsExporting(false)
  }

  return (
    <div className={`app-shell ${isExporting ? 'exporting' : ''}`}>
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-6">
        <header className="topbar fade-in">
          <div className="brand-chip">
            <span className="brand-dot" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Markdown Studio
              </p>
              <h1 className="text-lg font-semibold">Markdown to PDF</h1>
            </div>
          </div>
          <div className="action-row">
            <a className="action-btn-ghost" href="/">
              Welcome
            </a>
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className="action-btn-ghost"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="action-btn-ghost"
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button type="button" onClick={handleDownload} className="action-btn">
              Export PDF
            </button>
          </div>
        </header>

        {settingsOpen && (
          <aside className="drawer fade-in" aria-label="Document settings">
            <h3>Document settings</h3>
            <div className="field">
              <label htmlFor="filename">Filename</label>
              <input
                id="filename"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
              />
              <p className="hint">Saved as a PDF file.</p>
            </div>
            <div className="field">
              <label htmlFor="page-size">Page size</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(event) => setPageSize(event.target.value as PageSize)}
              >
                {Object.entries(PAGE_SIZES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="margin">Margins ({margin}mm)</label>
              <input
                id="margin"
                type="range"
                min={6}
                max={30}
                value={margin}
                onChange={(event) => setMargin(Number(event.target.value))}
              />
              <p className="hint">Applied on every page.</p>
            </div>
          </aside>
        )}

        <main className="relative grid gap-6 md:grid-cols-2">
          <section className="panel fade-in delay-1 min-h-[70vh]">
            <div className="panel-header">
              Editor
              <span className="text-xs font-normal tracking-[0.2em]">Realtime</span>
            </div>
            <div className="editor-shell">
              <div ref={lineNumbersRef} className="editor-lines">
                {Array.from({ length: lines }, (_, index) => (
                  <span key={index} className="editor-line">
                    {index + 1}
                  </span>
                ))}
              </div>
              <textarea
                ref={editorRef}
                value={markdown}
                onChange={(event) => setMarkdown(event.target.value)}
                onScroll={handleScroll}
                spellCheck={false}
                className="editor-input"
              />
            </div>
          </section>

          <section className="panel fade-in delay-2 min-h-[70vh]">
            <div className="panel-header">
              Preview
              <span className="text-xs font-normal tracking-[0.2em]">PDF Ready</span>
            </div>
            <div className="preview-shell">
              <div ref={previewRef} className="export-surface">
                <article
                  className="markdown"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: rendered }}
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
