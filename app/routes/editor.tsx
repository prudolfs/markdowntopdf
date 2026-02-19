import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader } from '../components/app-header'
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

const MARKDOWN_CLASSES = {
  h1: 'text-3xl font-semibold text-slate-900',
  h2: 'text-2xl font-semibold text-slate-900',
  h3: 'text-xl font-semibold text-slate-900',
  h4: 'text-lg font-semibold text-slate-900',
  h5: 'text-base font-semibold text-slate-900',
  h6: 'text-sm font-semibold text-slate-900',
  p: 'mt-3 text-slate-700',
  ul: 'mt-3 list-disc pl-5 text-slate-700',
  ol: 'mt-3 list-decimal pl-5 text-slate-700',
  li: 'mt-1',
  a: 'text-sky-500 underline underline-offset-4',
  code: 'rounded-md bg-slate-100 px-2 py-0.5 text-[0.95em]',
  pre: 'mt-4 rounded-2xl bg-slate-900 p-4 text-slate-100 overflow-auto',
  blockquote:
    'mt-4 border-l-4 border-sky-400 bg-sky-50/80 px-4 py-3 text-slate-700',
  hr: 'my-6 border-t border-slate-200',
} as const

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
    return `<a class="${MARKDOWN_CLASSES.a}" href="${safeUrl}" target="_blank" rel="noreferrer">${label}</a>`
  })

  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  formatted = formatted.replace(
    /`([^`]+)`/g,
    `<code class="${MARKDOWN_CLASSES.code}">$1</code>`,
  )

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
      parts.push(`<ul class="${MARKDOWN_CLASSES.ul}">${listBuffer.join('')}</ul>`)
      listBuffer = []
    }
  }

  const flushOrderedList = () => {
    if (orderedListBuffer.length > 0) {
      parts.push(
        `<ol class="${MARKDOWN_CLASSES.ol}">${orderedListBuffer.join('')}</ol>`,
      )
      orderedListBuffer = []
    }
  }

  const flushQuote = () => {
    if (quoteBuffer.length > 0) {
      parts.push(
        `<blockquote class="${MARKDOWN_CLASSES.blockquote}">${quoteBuffer.join('<br />')}</blockquote>`,
      )
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
        parts.push(
          `<pre class="${MARKDOWN_CLASSES.pre}"><code class="${langClass.trim()}">${code}</code></pre>`,
        )
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
      parts.push(`<hr class="${MARKDOWN_CLASSES.hr}" />`)
      continue
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (headingMatch) {
      flushList()
      flushOrderedList()
      flushQuote()
      const level = headingMatch[1].length
      const levelClass =
        MARKDOWN_CLASSES[`h${level}` as keyof typeof MARKDOWN_CLASSES] ??
        MARKDOWN_CLASSES.h3
      parts.push(
        `<h${level} class="${levelClass}">${formatInline(headingMatch[2])}</h${level}>`,
      )
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
      listBuffer.push(
        `<li class="${MARKDOWN_CLASSES.li}">${formatInline(unorderedMatch[1])}</li>`,
      )
      continue
    }

    const orderedMatch = /^\d+\.\s+(.*)$/.exec(trimmed)
    if (orderedMatch) {
      flushList()
      flushQuote()
      orderedListBuffer.push(
        `<li class="${MARKDOWN_CLASSES.li}">${formatInline(orderedMatch[1])}</li>`,
      )
      continue
    }

    flushList()
    flushOrderedList()
    flushQuote()
    parts.push(`<p class="${MARKDOWN_CLASSES.p}">${formatInline(trimmed)}</p>`)
  }

  if (inCodeBlock) {
    const code = escapeHtml(codeLines.join('\n'))
    const langClass = codeFence ? ` language-${codeFence}` : ''
    parts.push(
      `<pre class="${MARKDOWN_CLASSES.pre}"><code class="${langClass.trim()}">${code}</code></pre>`,
    )
  }

  flushList()
  flushOrderedList()
  flushQuote()

  return parts.join('\n')
}

export default function Editor() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
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
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.25),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(167,139,250,0.25),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.2)_1px,transparent_1px)] bg-[size:52px_52px] opacity-30 dark:bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]" />

      <div className="relative flex min-h-screen w-full flex-col">
        <div className="print:hidden w-full pt-0">
          <AppHeader
            subtitle="Markdown Studio"
            title="Markdown to PDF"
            backHref="/"
            actions={
              <>
                <button
                  type="button"
                  onClick={() => setSettingsOpen((prev) => !prev)}
                  aria-label="Toggle settings"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-900 shadow-lg transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.54V21a2 2 0 1 1-4 0v-.07a1.7 1.7 0 0 0-1-1.54 1.7 1.7 0 0 0-1.87.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.54-1H3a2 2 0 1 1 0-4h.07a1.7 1.7 0 0 0 1.54-1 1.7 1.7 0 0 0-.34-1.87l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.54V3a2 2 0 1 1 4 0v.07a1.7 1.7 0 0 0 1 1.54 1.7 1.7 0 0 0 1.87-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05a1.7 1.7 0 0 0-.34 1.87V9c0 .66.39 1.26 1 1.54.3.14.64.21.99.21H21a2 2 0 1 1 0 4h-.07a1.7 1.7 0 0 0-1.54 1z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-900 shadow-lg transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  {theme === 'dark' ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="M4.93 4.93l1.41 1.41" />
                      <path d="M17.66 17.66l1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="M6.34 17.66l-1.41 1.41" />
                      <path d="M19.07 4.93l-1.41 1.41" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-900"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white dark:bg-slate-900/10 dark:text-slate-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M7.5 16h9" />
                      <path d="M7.5 12.5h4.5" />
                    </svg>
                  </span>
                  Download
                </button>
              </>
            }
          />
        </div>

        {settingsOpen && (
          <aside className="absolute right-6 top-28 z-10 w-72 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_30px_70px_rgba(15,23,42,0.2)] dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[0_30px_70px_rgba(2,6,23,0.6)]">
            <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Document settings
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="filename" className="text-xs text-slate-500 dark:text-slate-400">
                  Filename
                </label>
                <input
                  id="filename"
                  value={filename}
                  onChange={(event) => setFilename(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
                <p className="mt-1 text-[11px] text-slate-500">Saved as a PDF file.</p>
              </div>
              <div>
                <label htmlFor="page-size" className="text-xs text-slate-500 dark:text-slate-400">
                  Page size
                </label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(event) => setPageSize(event.target.value as PageSize)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  {Object.entries(PAGE_SIZES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="margin" className="text-xs text-slate-500 dark:text-slate-400">
                  Margins ({margin}mm)
                </label>
                <input
                  id="margin"
                  type="range"
                  min={6}
                  max={30}
                  value={margin}
                  onChange={(event) => setMargin(Number(event.target.value))}
                  className="mt-3 w-full"
                />
                <p className="mt-1 text-[11px] text-slate-500">Applied on every page.</p>
              </div>
            </div>
          </aside>
        )}

        <main className="mx-auto mt-6 grid w-full max-w-[1400px] gap-6 px-6 pb-10 md:grid-cols-2">
          <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-[0_26px_60px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_26px_60px_rgba(2,6,23,0.6)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 text-xs uppercase tracking-[0.25em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Editor
              <span className="text-[10px] font-normal tracking-[0.2em]">Realtime</span>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-[56px_1fr]" style={{ fontFamily: 'var(--font-mono)' }}>
              <div
                ref={lineNumbersRef}
                className="overflow-hidden border-r border-slate-200 bg-slate-100 py-4 text-right text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/80"
              >
                {Array.from({ length: lines }, (_, index) => (
                  <span key={index} className="block px-4 leading-7">
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
                className="h-full w-full resize-none bg-white px-6 py-4 text-sm leading-7 text-slate-900 outline-none selection:bg-amber-400/40 dark:bg-slate-950/80 dark:text-slate-100"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </section>

          <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-[0_26px_60px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_26px_60px_rgba(2,6,23,0.6)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 text-xs uppercase tracking-[0.25em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Preview
              <span className="text-[10px] font-normal tracking-[0.2em]">PDF Ready</span>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-6 dark:bg-white/5">
              <div ref={previewRef} className="rounded-2xl bg-white p-6 text-slate-900 shadow-[0_18px_35px_rgba(15,23,42,0.18)]">
                <article
                  className="max-w-none"
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
