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
  h1: 'text-3xl font-semibold text-[#0f172a]',
  h2: 'text-2xl font-semibold text-[#0f172a]',
  h3: 'text-xl font-semibold text-[#0f172a]',
  h4: 'text-lg font-semibold text-[#0f172a]',
  h5: 'text-base font-semibold text-[#0f172a]',
  h6: 'text-sm font-semibold text-[#0f172a]',
  p: 'mt-3 text-[#334155]',
  ul: 'mt-3 list-disc pl-5 text-[#334155]',
  ol: 'mt-3 list-decimal pl-5 text-[#334155]',
  li: 'mt-1',
  a: 'text-[#0ea5e9] underline underline-offset-4',
  code: 'rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[0.95em]',
  pre: 'mt-4 rounded-2xl bg-[#0f172a] p-4 text-[#f1f5f9] overflow-auto',
  blockquote:
    'mt-4 border-l-4 border-[#38bdf8] bg-[#f0f9ff] px-4 py-3 text-[#334155]',
  hr: 'my-6 border-t border-[#e2e8f0]',
} as const

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Markdown to PDF Editor' },
    {
      name: 'description',
      content: 'Realtime Markdown editor and PDF export.',
    },
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
      parts.push(
        `<ul class="${MARKDOWN_CLASSES.ul}">${listBuffer.join('')}</ul>`,
      )
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
  const [exportError, setExportError] = useState<string | null>(null)
  const [pdfReady, setPdfReady] = useState<boolean | null>(null)
  const lineNumbersRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
      return
    }
    const prefersDark = window.matchMedia?.(
      '(prefers-color-scheme: dark)',
    ).matches
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

  useEffect(() => {
    if (!settingsOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (settingsRef.current?.contains(target)) return
      if (settingsButtonRef.current?.contains(target)) return
      setSettingsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [settingsOpen])

  useEffect(() => {
    let isMounted = true
    const checkPdf = async () => {
      try {
        await Promise.all([import('html2canvas'), import('jspdf')])
        if (isMounted) setPdfReady(true)
      } catch (error) {
        console.warn('PDF export dependencies missing', error)
        if (isMounted) setPdfReady(false)
      }
    }
    checkPdf()
    return () => {
      isMounted = false
    }
  }, [])

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
    if (isExporting) return
    if (!previewRef.current) return
    setExportError(null)
    const size = PAGE_SIZES[pageSize]
    const safeName =
      filename.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'document'
    const pxPerMm = 96 / 25.4
    const targetWidthPx = Math.round((size.width - margin * 2) * pxPerMm)

    setIsExporting(true)
    try {
      if (pdfReady === false) {
        throw new Error(
          'PDF export dependencies are not installed. Run pnpm install and restart the dev server.',
        )
      }
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

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
      const pixelsPerMm = imgWidth / pageWidth
      const pageHeightPx = Math.floor(pageHeight * pixelsPerMm)

      let offsetY = 0
      while (offsetY < imgHeight) {
        const sliceHeight = Math.min(pageHeightPx, imgHeight - offsetY)
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = imgWidth
        sliceCanvas.height = sliceHeight
        const ctx = sliceCanvas.getContext('2d')
        if (!ctx) break
        ctx.drawImage(
          canvas,
          0,
          offsetY,
          imgWidth,
          sliceHeight,
          0,
          0,
          imgWidth,
          sliceHeight,
        )

        const sliceData = sliceCanvas.toDataURL('image/png', 1.0)
        const sliceHeightMm = sliceHeight / pixelsPerMm
        pdf.addImage(
          sliceData,
          'PNG',
          margin,
          margin,
          pageWidth,
          sliceHeightMm,
          undefined,
          'FAST',
        )

        offsetY += sliceHeight
        if (offsetY < imgHeight) {
          pdf.addPage()
        }
      }

      pdf.save(`${safeName}.pdf`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'PDF export failed.'
      console.error('PDF export failed', error)
      setExportError(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc] text-[#0f172a] dark:bg-[#020617] dark:text-[#f1f5f9]">
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-lg transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
                  ref={settingsButtonRef}
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-lg transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
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
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 dark:bg-white dark:text-[#0f172a]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#334155] bg-[#1f2937] text-white dark:border-[#e2e8f0] dark:bg-white dark:text-[#0f172a]">
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

        {exportError ? (
          <div className="mx-auto mt-4 w-full max-w-[1400px] px-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-[#fb7185] dark:bg-[#4c1d1d] dark:text-rose-200">
              {exportError}
            </div>
          </div>
        ) : null}

        {settingsOpen && (
          <aside
            ref={settingsRef}
            className="absolute right-6 top-28 z-10 w-72 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_30px_70px_rgba(15,23,42,0.2)] dark:border-[#1e293b] dark:bg-[#0f172a] dark:shadow-[0_30px_70px_rgba(2,6,23,0.6)]"
          >
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#64748b] dark:text-[#94a3b8]">
              Document settings
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="filename"
                  className="text-xs text-[#64748b] dark:text-[#94a3b8]"
                >
                  Filename
                </label>
                <input
                  id="filename"
                  value={filename}
                  onChange={(event) => setFilename(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] dark:border-[#1e293b] dark:bg-[#020617] dark:text-[#f1f5f9]"
                />
                <p className="mt-1 text-[11px] text-[#64748b]">
                  Saved as a PDF file.
                </p>
              </div>
              <div>
                <label
                  htmlFor="page-size"
                  className="text-xs text-[#64748b] dark:text-[#94a3b8]"
                >
                  Page size
                </label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(event) =>
                    setPageSize(event.target.value as PageSize)
                  }
                  className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] dark:border-[#1e293b] dark:bg-[#020617] dark:text-[#f1f5f9]"
                >
                  {Object.entries(PAGE_SIZES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="margin"
                  className="text-xs text-[#64748b] dark:text-[#94a3b8]"
                >
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
                <p className="mt-1 text-[11px] text-[#64748b]">
                  Applied on every page.
                </p>
              </div>
            </div>
          </aside>
        )}

        <main className="mx-auto mt-6 grid w-full max-w-[1400px] gap-6 px-6 pb-10 md:grid-cols-2">
          <section className="flex h-[calc(100vh-220px)] flex-col overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0_26px_60px_rgba(15,23,42,0.18)] backdrop-blur dark:border-[#1e293b] dark:bg-[#0f172a] dark:shadow-[0_26px_60px_rgba(2,6,23,0.6)]">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4 text-xs uppercase tracking-[0.25em] text-[#64748b] dark:border-[#1e293b] dark:text-[#94a3b8]">
              Editor
              <span className="text-[10px] font-normal tracking-[0.2em]">
                Realtime
              </span>
            </div>
            <div
              className="grid min-h-0 flex-1 grid-cols-[56px_1fr]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <div
                ref={lineNumbersRef}
                className="overflow-hidden border-r border-[#e2e8f0] bg-[#f1f5f9] py-4 text-right text-xs text-[#64748b] dark:border-[#1e293b] dark:bg-[#020617]"
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
                className="h-full w-full resize-none bg-white px-6 py-4 text-sm leading-7 text-[#0f172a] outline-none selection:bg-[#fbbf24] dark:bg-[#020617] dark:text-[#f1f5f9]"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </section>

          <section className="flex h-[calc(100vh-220px)] flex-col overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0_26px_60px_rgba(15,23,42,0.18)] backdrop-blur dark:border-[#1e293b] dark:bg-[#0f172a] dark:shadow-[0_26px_60px_rgba(2,6,23,0.6)]">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4 text-xs uppercase tracking-[0.25em] text-[#64748b] dark:border-[#1e293b] dark:text-[#94a3b8]">
              Preview
              <span className="text-[10px] font-normal tracking-[0.2em]">
                PDF Ready
              </span>
            </div>
            <div className="flex-1 overflow-auto bg-[#f1f5f9] p-6 dark:bg-white/5">
              <div
                ref={previewRef}
                className="rounded-2xl bg-white p-6 text-[#0f172a] shadow-[0_18px_35px_rgba(15,23,42,0.18)]"
              >
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
