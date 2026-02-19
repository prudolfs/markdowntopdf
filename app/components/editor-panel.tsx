import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { EditorToolbar } from './editor-toolbar'

type EditorPanelProps = {
  markdown: string
  lines: number
  emojiOpen: boolean
  markdownOpen: boolean
  editorRef: RefObject<HTMLTextAreaElement | null>
  lineNumbersRef: RefObject<HTMLDivElement | null>
  refreshOpen: boolean
  saveOpen: boolean
  loadOpen: boolean
  deleteOpen: boolean
  savedDocs: Array<{ name: string; updatedAt: string }>
  saveName: string
  onScroll: () => void
  onMarkdownChange: (value: string) => void
  onEmojiToggle: () => void
  onMarkdownToggle: () => void
  onEmojiSelect: (emoji: string) => void
  onMarkdownInsert: (value: string, cursorOffset?: number) => void
  onEmojiClose: () => void
  onMarkdownClose: () => void
  onRefreshToggle: () => void
  onRefreshConfirm: () => void
  onRefreshClose: () => void
  onSaveToggle: () => void
  onSaveClose: () => void
  onSaveNameChange: (value: string) => void
  onSaveConfirm: () => void
  onLoadToggle: () => void
  onLoadClose: () => void
  onLoadSelect: (name: string) => void
  onDeleteToggle: () => void
  onDeleteClose: () => void
  onDeleteConfirm: (names: string[]) => void
}

export function EditorPanel({
  markdown,
  lines,
  emojiOpen,
  markdownOpen,
  editorRef,
  lineNumbersRef,
  refreshOpen,
  saveOpen,
  loadOpen,
  deleteOpen,
  savedDocs,
  saveName,
  onScroll,
  onMarkdownChange,
  onEmojiToggle,
  onMarkdownToggle,
  onEmojiSelect,
  onMarkdownInsert,
  onEmojiClose,
  onMarkdownClose,
  onRefreshToggle,
  onRefreshConfirm,
  onRefreshClose,
  onSaveToggle,
  onSaveClose,
  onSaveNameChange,
  onSaveConfirm,
  onLoadToggle,
  onLoadClose,
  onLoadSelect,
  onDeleteToggle,
  onDeleteClose,
  onDeleteConfirm,
}: EditorPanelProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const loadScrollRef = useRef<HTMLDivElement | null>(null)
  const loadButtonRef = useRef<HTMLButtonElement | null>(null)
  const saveButtonRef = useRef<HTMLButtonElement | null>(null)
  const refreshButtonRef = useRef<HTMLButtonElement | null>(null)
  const loadVirtualizer = useVirtualizer({
    count: savedDocs.length,
    getScrollElement: () => loadScrollRef.current,
    estimateSize: () => 36,
    overscan: 6,
  })

  const toggleDocSelection = (name: string) => {
    setSelectedDocs((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    )
  }

  const clearSelection = () => {
    setSelectedDocs([])
  }

  useEffect(() => {
    if (!loadOpen) {
      clearSelection()
    }
  }, [loadOpen])

  useEffect(() => {
    if (!saveOpen && !loadOpen && !refreshOpen) return
  }, [saveOpen, loadOpen, refreshOpen])

  return (
    <section className="relative flex h-[calc(100vh-220px)] flex-col overflow-visible rounded-3xl border border-[#e2e8f0] bg-white shadow-[0_26px_60px_rgba(15,23,42,0.18)] backdrop-blur dark:border-[#1e293b] dark:bg-[#0f172a] dark:shadow-[0_26px_60px_rgba(2,6,23,0.6)]">
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
          onChange={(event) => onMarkdownChange(event.target.value)}
          onScroll={onScroll}
          spellCheck={false}
          className="h-full w-full resize-none bg-white px-6 py-4 text-sm leading-7 text-[#0f172a] outline-none selection:bg-sky-200 selection:text-slate-900 dark:bg-[#020617] dark:text-[#f1f5f9]"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>
      <div className="relative overflow-visible" data-editor-toolbar>
        <EditorToolbar
          emojiOpen={emojiOpen}
          markdownOpen={markdownOpen}
          onEmojiToggle={onEmojiToggle}
          onMarkdownToggle={onMarkdownToggle}
          onEmojiSelect={onEmojiSelect}
          onMarkdownInsert={onMarkdownInsert}
          onEmojiClose={onEmojiClose}
          onMarkdownClose={onMarkdownClose}
        />
        <div className="absolute right-4 top-3 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-lg transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
            onClick={onLoadToggle}
            aria-label="Load document"
            ref={loadButtonRef}
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
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-lg transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
            onClick={onSaveToggle}
            aria-label="Save document"
            ref={saveButtonRef}
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
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M17 21v-8H7v8" />
              <path d="M7 3v5h8" />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-lg transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
            onClick={onRefreshToggle}
            aria-label="Refresh editor"
            ref={refreshButtonRef}
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
              <path d="M21 12a9 9 0 1 1-3.3-7" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
        </div>
        {saveOpen ? (
          <div
            className="absolute bottom-14 right-4 z-50 w-80 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_20px_45px_rgba(15,23,42,0.2)] dark:border-[#1e293b] dark:bg-[#0f172a]"
            data-editor-popover
          >
            <span
              aria-hidden="true"
              className="absolute -bottom-2 right-14 h-4 w-4 rotate-45 border border-[#e2e8f0] bg-white dark:border-[#1e293b] dark:bg-[#0f172a]"
            />
            <p className="text-xs font-semibold text-[#0f172a] dark:text-[#f1f5f9]">
              Save document
            </p>
            <input
              value={saveName}
              onChange={(event) => onSaveNameChange(event.target.value)}
              placeholder="Document name"
              className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs text-[#0f172a] dark:border-[#1e293b] dark:bg-[#020617] dark:text-[#f1f5f9]"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-[#e2e8f0] px-4 py-2 text-[11px] font-semibold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:text-[#f1f5f9]"
                onClick={onSaveClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#0f172a] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_20px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 dark:bg-white dark:text-[#0f172a]"
                onClick={onSaveConfirm}
              >
                Save
              </button>
            </div>
          </div>
        ) : null}
        {loadOpen ? (
          <div
            className="absolute bottom-14 right-4 z-50 w-80 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_20px_45px_rgba(15,23,42,0.2)] dark:border-[#1e293b] dark:bg-[#0f172a]"
            data-editor-popover
          >
            <span
              aria-hidden="true"
              className="absolute -bottom-2 right-24 h-4 w-4 rotate-45 border border-[#e2e8f0] bg-white dark:border-[#1e293b] dark:bg-[#0f172a]"
            />
            <div className="flex items-center justify-between pr-4">
              <p className="text-xs font-semibold text-[#0f172a] dark:text-[#f1f5f9]">
                Load document
              </p>
              {selectedDocs.length > 0 ? (
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 text-rose-500 transition hover:-translate-y-0.5"
                  onClick={onDeleteToggle}
                  aria-label="Delete selected documents"
                >
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
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M6 6l1 14h10l1-14" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              ) : null}
            </div>
            <div
              ref={loadScrollRef}
              className="mt-3 h-56 overflow-auto rounded-xl border border-[#e2e8f0] bg-white p-1 pr-3 dark:border-[#1e293b] dark:bg-[#020617]"
            >
              {savedDocs.length === 0 ? (
                <p className="px-2 py-3 text-xs text-[#94a3b8]">
                  No saved documents.
                </p>
              ) : (
                <div
                  style={{
                    height: `${loadVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                  }}
                >
                  {loadVirtualizer.getVirtualItems().map((row) => {
                    const doc = savedDocs[row.index]
                    if (!doc) return null
                    const selected = selectedDocs.includes(doc.name)
                    return (
                      <button
                        key={doc.name}
                        type="button"
                        className="absolute left-0 right-0 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold text-[#0f172a] hover:bg-[#f1f5f9] dark:text-[#f1f5f9] dark:hover:bg-[#111827]"
                        style={{ transform: `translateY(${row.start}px)` }}
                        onClick={() => {
                          onLoadSelect(doc.name)
                          onLoadClose()
                          clearSelection()
                        }}
                      >
                        <span>{doc.name}</span>
                        <span className="flex items-center gap-2 text-[10px] text-[#94a3b8]">
                          <button
                            type="button"
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border ${
                              selected
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-[#cbd5f5] text-[#94a3b8]'
                            }`}
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleDocSelection(doc.name)
                            }}
                            aria-label={`Select ${doc.name}`}
                          >
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
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M6 6l1 14h10l1-14" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            {deleteOpen ? (
              <div className="absolute inset-3 z-30 flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/95 p-4 text-[11px] text-rose-700 backdrop-blur">
                <div className="w-full">
                  <p className="text-sm font-semibold">
                    Delete selected documents?
                  </p>
                  <p className="mt-1">This action cannot be undone.</p>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-rose-200 px-4 py-2 text-[11px] font-semibold text-rose-700 shadow-sm transition hover:-translate-y-0.5"
                      onClick={() => {
                        onDeleteClose()
                        clearSelection()
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-rose-500 px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_20px_rgba(244,63,94,0.25)] transition hover:-translate-y-0.5"
                      onClick={() => {
                        onDeleteConfirm(selectedDocs)
                        clearSelection()
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {refreshOpen ? (
          <div
            className="absolute bottom-14 right-4 z-50 w-80 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_20px_45px_rgba(15,23,42,0.2)] dark:border-[#1e293b] dark:bg-[#0f172a]"
            data-editor-popover
          >
            <span
              aria-hidden="true"
              className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 border border-[#e2e8f0] bg-white dark:border-[#1e293b] dark:bg-[#0f172a]"
            />
            <p className="text-xs font-semibold text-[#0f172a] dark:text-[#f1f5f9]">
              Reset editor?
            </p>
            <p className="mt-1 text-[11px] text-[#64748b] dark:text-[#94a3b8]">
              This will restore the default markdown.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-[#e2e8f0] px-4 py-2 text-[11px] font-semibold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:text-[#f1f5f9]"
                onClick={onRefreshClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#0f172a] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_10px_20px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 dark:bg-white dark:text-[#0f172a]"
                onClick={onRefreshConfirm}
              >
                Reset
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
