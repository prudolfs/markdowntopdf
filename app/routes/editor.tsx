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
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const lineNumbersRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)

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

  const handleDownload = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0d12] dark:text-slate-100">
      <header className="print:hidden">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 via-emerald-400 to-yellow-300" />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Markdown Studio
              </p>
              <h1 className="text-xl font-semibold">Markdown to PDF</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              href="/"
            >
              Welcome
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white dark:text-slate-900"
            >
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 pb-10 md:flex-row">
        <section className="flex min-h-[70vh] flex-1 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
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

        <section className="flex min-h-[70vh] flex-1 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 text-sm font-medium uppercase tracking-[0.25em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Preview
            <span className="text-xs font-normal tracking-[0.2em]">PDF Ready</span>
          </div>
          <div className="preview-shell">
            <article
              className="markdown"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: rendered }}
            />
          </div>
        </section>
      </main>
    </div>
  )
}
