import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorPanel } from '../components/editor-panel'
import { PreviewPanel } from '../components/preview-panel'
import { AppHeader } from '../components/app-header'
import type { Route } from './+types/editor'
import { useEditorStore } from '../stores/editor-store'

const PAGE_SIZES = {
  a4: { label: 'A4', width: 210, height: 297 },
  letter: { label: 'Letter', width: 216, height: 279 },
  legal: { label: 'Legal', width: 216, height: 356 },
  a5: { label: 'A5', width: 148, height: 210 },
} as const

type PageSize = keyof typeof PAGE_SIZES

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Markdown to PDF Editor' },
    {
      name: 'description',
      content: 'Realtime Markdown editor and PDF export.',
    },
  ]
}

export default function Editor() {
  const markdown = useEditorStore((state) => state.markdown)
  const setMarkdown = useEditorStore((state) => state.setMarkdown)
  const resetMarkdown = useEditorStore((state) => state.resetMarkdown)
  const theme = useEditorStore((state) => state.theme)
  const setTheme = useEditorStore((state) => state.setTheme)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filename, setFilename] = useState('document')
  const [pageSize, setPageSize] = useState<PageSize>('a4')
  const [margin, setMargin] = useState(16)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [markdownOpen, setMarkdownOpen] = useState(false)
  const [refreshOpen, setRefreshOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [loadOpen, setLoadOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [savedDocs, setSavedDocs] = useState<
    Array<{ name: string; updatedAt: string; markdown: string }>
  >([])
  const lineNumbersRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const previewViewportRef = useRef<HTMLDivElement | null>(null)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null)
  const [settingsPosition, setSettingsPosition] = useState<{
    top: number
    left: number
    pointerLeft: number
  } | null>(null)
  const pageConfig = PAGE_SIZES[pageSize]
  const pxPerMm = 96 / 25.4
  const pageWidthPx = Math.round(pageConfig.width * pxPerMm)
  const pageHeightPx = Math.round(pageConfig.height * pxPerMm)
  const marginPx = Math.round(margin * pxPerMm)

  const insertAtCursor = (value: string, cursorOffset = 0) => {
    const editor = editorRef.current
    if (!editor) return
    const start = editor.selectionStart ?? editor.value.length
    const end = editor.selectionEnd ?? start
    const nextValue = `${editor.value.slice(0, start)}${value}${editor.value.slice(end)}`
    setMarkdown(nextValue)
    requestAnimationFrame(() => {
      editor.focus()
      const nextPos = Math.max(0, start + value.length + cursorOffset)
      editor.setSelectionRange(nextPos, nextPos)
    })
  }

  useEffect(() => {
    const stored = window.localStorage.getItem('markdown-editor')
    if (stored) return
    const prefersDark = window.matchMedia?.(
      '(prefers-color-scheme: dark)',
    ).matches
    setTheme(prefersDark ? 'dark' : 'light')
  }, [setTheme])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    if (
      !settingsOpen &&
      !emojiOpen &&
      !markdownOpen &&
      !refreshOpen &&
      !saveOpen &&
      !loadOpen &&
      !deleteOpen
    )
      return

    const updatePosition = () => {
      const button = settingsButtonRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      const panelWidth = 288
      const gap = 12
      const minLeft = 12
      const maxLeft = window.innerWidth - panelWidth - 12
      const centerLeft = rect.left + rect.width / 2 - panelWidth / 2
      const left = Math.min(Math.max(centerLeft, minLeft), maxLeft)
      const top = rect.bottom + gap
      const pointerLeft = rect.left + rect.width / 2 - left
      setSettingsPosition({ top, left, pointerLeft })
    }

    if (settingsOpen) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (
        settingsRef.current?.contains(target) ||
        settingsButtonRef.current?.contains(target)
      ) {
        return
      }
      const toolbar = document.querySelector('[data-editor-toolbar]')
      if (toolbar?.contains(target)) return
      const popover = document.querySelector('[data-editor-popover]')
      if (popover?.contains(target)) return
      setSettingsOpen(false)
      setEmojiOpen(false)
      setMarkdownOpen(false)
      setRefreshOpen(false)
      setSaveOpen(false)
      setLoadOpen(false)
      setDeleteOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      if (settingsOpen) {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
  }, [
    settingsOpen,
    emojiOpen,
    markdownOpen,
    refreshOpen,
    saveOpen,
    loadOpen,
    deleteOpen,
  ])

  const lines = markdown.split('\n').length

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem('markdown-saves')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Array<{
        name: string
        updatedAt: string
        markdown: string
      }>
      setSavedDocs(parsed)
    } catch {
      setSavedDocs([])
    }
  }, [])

  const saveMarkdown = () => {
    if (typeof window === 'undefined') return
    const trimmed = saveName.trim()
    if (!trimmed) return
    const next = [
      ...savedDocs.filter((doc) => doc.name !== trimmed),
      {
        name: trimmed,
        updatedAt: new Date().toLocaleDateString(),
        markdown,
      },
    ].sort((a, b) => a.name.localeCompare(b.name))
    window.localStorage.setItem('markdown-saves', JSON.stringify(next))
    setSavedDocs(next)
    setSaveName('')
  }

  const loadMarkdown = (name: string) => {
    const doc = savedDocs.find((item) => item.name === name)
    if (!doc) return
    setMarkdown(doc.markdown)
  }

  const deleteSelectedDocs = (names: string[]) => {
    if (typeof window === 'undefined') return
    const next = savedDocs.filter((doc) => !names.includes(doc.name))
    window.localStorage.setItem('markdown-saves', JSON.stringify(next))
    setSavedDocs(next)
  }

  const handleScroll = () => {
    if (!lineNumbersRef.current || !editorRef.current) return
    lineNumbersRef.current.scrollTop = editorRef.current.scrollTop
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleDownload = async () => {
    if (isExporting) return
    setExportError(null)
    const safeName =
      filename.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'document'

    const viewport = previewViewportRef.current
    const previousScroll = viewport?.scrollTop ?? 0
    setIsExporting(true)
    try {
      const response = await fetch('/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown,
          pageSize,
          margin,
          filename: safeName,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'PDF export failed.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${safeName}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'PDF export failed.'
      console.error('PDF export failed', error)
      setExportError(message)
    } finally {
      setIsExporting(false)
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTop = previousScroll
        })
      }
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
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 dark:bg-white dark:text-[#0f172a]"
                >
                  {isExporting ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#334155] bg-[#1f2937] text-white dark:border-[#e2e8f0] dark:bg-white dark:text-[#0f172a]">
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          opacity="0.25"
                        />
                        <path
                          d="M21 12a9 9 0 0 0-9-9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  ) : (
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
                  )}
                  {isExporting ? 'Exporting' : 'Download'}
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
            className="fixed z-50 w-72 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_30px_70px_rgba(15,23,42,0.2)] dark:border-[#1e293b] dark:bg-[#0f172a] dark:shadow-[0_30px_70px_rgba(2,6,23,0.6)]"
            style={
              settingsPosition
                ? {
                    top: settingsPosition.top,
                    left: settingsPosition.left,
                  }
                : undefined
            }
          >
            {settingsPosition ? (
              <span
                aria-hidden="true"
                className="absolute -top-2 h-4 w-4 rotate-45 border border-[#e2e8f0] bg-white dark:border-[#1e293b] dark:bg-[#0f172a]"
                style={{ left: settingsPosition.pointerLeft - 8 }}
              />
            ) : null}
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
          <EditorPanel
            markdown={markdown}
            lines={lines}
            emojiOpen={emojiOpen}
            markdownOpen={markdownOpen}
            refreshOpen={refreshOpen}
            saveOpen={saveOpen}
            loadOpen={loadOpen}
            deleteOpen={deleteOpen}
            savedDocs={savedDocs.map((doc) => ({
              name: doc.name,
              updatedAt: doc.updatedAt,
            }))}
            saveName={saveName}
            editorRef={editorRef}
            lineNumbersRef={lineNumbersRef}
            onScroll={handleScroll}
            onMarkdownChange={setMarkdown}
            onEmojiToggle={() => {
              setEmojiOpen((prev) => !prev)
              setMarkdownOpen(false)
              setSaveOpen(false)
              setLoadOpen(false)
              setRefreshOpen(false)
            }}
            onMarkdownToggle={() => {
              setMarkdownOpen((prev) => !prev)
              setEmojiOpen(false)
              setSaveOpen(false)
              setLoadOpen(false)
              setRefreshOpen(false)
            }}
            onEmojiSelect={(emoji) => insertAtCursor(emoji)}
            onMarkdownInsert={(value, cursorOffset) =>
              insertAtCursor(value, cursorOffset ?? 0)
            }
            onEmojiClose={() => setEmojiOpen(false)}
            onMarkdownClose={() => setMarkdownOpen(false)}
            onRefreshToggle={() => {
              setRefreshOpen((prev) => !prev)
              setEmojiOpen(false)
              setMarkdownOpen(false)
              setSaveOpen(false)
              setLoadOpen(false)
              setDeleteOpen(false)
            }}
            onRefreshClose={() => setRefreshOpen(false)}
            onRefreshConfirm={() => {
              resetMarkdown()
              useEditorStore.persist.clearStorage()
              setRefreshOpen(false)
            }}
            onSaveToggle={() => {
              setSaveOpen((prev) => !prev)
              setLoadOpen(false)
              setEmojiOpen(false)
              setMarkdownOpen(false)
              setRefreshOpen(false)
              setDeleteOpen(false)
            }}
            onSaveClose={() => setSaveOpen(false)}
            onSaveNameChange={setSaveName}
            onSaveConfirm={() => {
              saveMarkdown()
              setSaveOpen(false)
            }}
            onLoadToggle={() => {
              setLoadOpen((prev) => !prev)
              setSaveOpen(false)
              setEmojiOpen(false)
              setMarkdownOpen(false)
              setRefreshOpen(false)
              setDeleteOpen(false)
            }}
            onLoadClose={() => {
              setLoadOpen(false)
              setDeleteOpen(false)
            }}
            onLoadSelect={(name) => loadMarkdown(name)}
            onDeleteToggle={() => setDeleteOpen((prev) => !prev)}
            onDeleteClose={() => setDeleteOpen(false)}
            onDeleteConfirm={(names) => {
              deleteSelectedDocs(names)
              setDeleteOpen(false)
              setLoadOpen(false)
            }}
          />

          <PreviewPanel
            markdown={markdown}
            previewViewportRef={previewViewportRef}
            pageWidthPx={pageWidthPx}
            pageHeightPx={pageHeightPx}
            marginPx={marginPx}
          />
        </main>
      </div>
    </div>
  )
}
