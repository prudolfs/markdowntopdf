import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

type EmojiPickerProps = {
  open: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
}

type MarkdownPickerProps = {
  open: boolean
  onClose: () => void
  onInsert: (value: string, cursorOffset?: number) => void
}

const EMOJI_COLUMNS = 8

const EMOJI_OPTIONS = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😅',
  '😂',
  '🤣',
  '😊',
  '😇',
  '🙂',
  '😉',
  '😍',
  '😘',
  '😋',
  '😎',
  '🤩',
  '🤗',
  '🤔',
  '🤫',
  '🤯',
  '😴',
  '😮',
  '😢',
  '😭',
  '😡',
  '🤮',
  '👍',
  '👎',
  '👏',
  '🙏',
  '💪',
  '🤝',
  '🙌',
  '🤘',
  '🫶',
  '✅',
  '☑️',
  '❗️',
  '‼️',
  '❓',
  '✨',
  '🔥',
  '⚡️',
  '💡',
  '📌',
  '📍',
  '🧭',
  '📝',
  '✍️',
  '📎',
  '🖇️',
  '🔗',
  '📣',
  '📢',
  '🎯',
  '🧪',
  '🧠',
  '🧩',
  '🧵',
  '🪄',
  '🚀',
  '🛠️',
  '💬',
  '📊',
  '📈',
  '🧾',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🖤',
  '🤍',
  '🤎',
  '🎉',
  '🥳',
  '🤓',
  '🧐',
  '🫡',
  '🫠',
  '🤷',
  '🤦',
  '👀',
  '💀',
  '🙃',
  '😬',
  '😵‍💫',
  '🤠',
  '🫨',
  '🧡',
  '💫',
  '🌟',
  '⭐️',
]

const MARKDOWN_OPTIONS = [
  { label: 'Heading 1', value: '\n# Heading 1\n', cursorOffset: -1 },
  { label: 'Heading 2', value: '\n## Heading 2\n', cursorOffset: -1 },
  { label: 'Heading 3', value: '\n### Heading 3\n', cursorOffset: -1 },
  { label: 'Heading 4', value: '\n#### Heading 4\n', cursorOffset: -1 },
  { label: 'Heading 5', value: '\n##### Heading 5\n', cursorOffset: -1 },
  { label: 'Heading 6', value: '\n###### Heading 6\n', cursorOffset: -1 },
  { label: 'Bold', value: '**bold**', cursorOffset: -2 },
  { label: 'Italic', value: '*italic*', cursorOffset: -1 },
  { label: 'Bold + Italic', value: '***bold italic***', cursorOffset: -3 },
  { label: 'Inline Code', value: '`code`', cursorOffset: -1 },
  { label: 'Code Block', value: '\n```ts\ncode\n```\n', cursorOffset: -5 },
  { label: 'Quote', value: '\n> Quote\n', cursorOffset: 0 },
  { label: 'Bulleted List', value: '\n- Item 1\n- Item 2\n', cursorOffset: 0 },
  {
    label: 'Numbered List',
    value: '\n1. Item 1\n2. Item 2\n',
    cursorOffset: 0,
  },
  { label: 'Task List', value: '\n- [ ] Task\n- [x] Done\n', cursorOffset: 0 },
  { label: 'Link', value: '[text](url)', cursorOffset: -4 },
  { label: 'Image', value: '![alt](url)', cursorOffset: -4 },
  { label: 'Divider', value: '\n---\n', cursorOffset: 0 },
  {
    label: 'Table',
    value: '\n| Head | Head |\n| --- | --- |\n| Cell | Cell |\n',
    cursorOffset: 0,
  },
]

function EmojiPicker({ open, onClose, onSelect }: EmojiPickerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const rowCount = Math.ceil(EMOJI_OPTIONS.length / EMOJI_COLUMNS)
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 44,
    overscan: 4,
  })

  if (!open) return null

  return (
    <div className="absolute bottom-12 left-4 z-10 w-72 rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-[0_20px_45px_rgba(15,23,42,0.2)] dark:border-[#1e293b] dark:bg-[#0f172a]">
      <span
        aria-hidden="true"
        className="absolute -top-2 left-6 h-4 w-4 rotate-45 border border-[#e2e8f0] bg-white dark:border-[#1e293b] dark:bg-[#0f172a]"
      />
      <div className="flex items-center justify-between">
        <p className="text-[#94a3b8] text-[10px] uppercase tracking-[0.2em]">
          Emoji
        </p>
        <button
          type="button"
          onClick={onClose}
          className="font-semibold text-[#0ea5e9] text-[11px]"
        >
          Done
        </button>
      </div>
      <div ref={scrollRef} className="mt-3 h-48 overflow-auto pr-1">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((row) => {
            const start = row.index * EMOJI_COLUMNS
            const rowEmojis = EMOJI_OPTIONS.slice(start, start + EMOJI_COLUMNS)
            return (
              <div
                key={row.key}
                className="absolute right-0 left-0 grid grid-cols-8 gap-2 text-lg"
                style={{ transform: `translateY(${row.start}px)` }}
              >
                {rowEmojis.map((emoji, index) => (
                  <button
                    key={`${emoji}-${start + index}`}
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f8fafc] shadow-sm transition hover:-translate-y-0.5 dark:bg-[#020617]"
                    onClick={() => {
                      onSelect(emoji)
                      onClose()
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MarkdownPicker({ open, onClose, onInsert }: MarkdownPickerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const rows = useMemo(
    () => [
      { type: 'label' as const, label: 'Basics' },
      ...MARKDOWN_OPTIONS.slice(0, 6).map((item) => ({
        type: 'item' as const,
        item,
      })),
      { type: 'label' as const, label: 'Blocks' },
      ...MARKDOWN_OPTIONS.slice(6, 12).map((item) => ({
        type: 'item' as const,
        item,
      })),
      { type: 'label' as const, label: 'Media' },
      ...MARKDOWN_OPTIONS.slice(12).map((item) => ({
        type: 'item' as const,
        item,
      })),
    ],
    [],
  )
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (rows[index]?.type === 'label' ? 22 : 42),
    overscan: 6,
  })

  if (!open) return null

  return (
    <div className="absolute bottom-12 left-4 z-10 w-72 rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-[0_20px_45px_rgba(15,23,42,0.2)] dark:border-[#1e293b] dark:bg-[#0f172a]">
      <span
        aria-hidden="true"
        className="absolute -top-2 left-16 h-4 w-4 rotate-45 border border-[#e2e8f0] bg-white dark:border-[#1e293b] dark:bg-[#0f172a]"
      />
      <div className="flex items-center justify-between">
        <p className="text-[#94a3b8] text-[10px] uppercase tracking-[0.2em]">
          Markdown
        </p>
        <button
          type="button"
          onClick={onClose}
          className="font-semibold text-[#0ea5e9] text-[11px]"
        >
          Done
        </button>
      </div>
      <div ref={scrollRef} className="mt-3 h-64 overflow-auto pr-1">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((row) => {
            const rowData = rows[row.index]
            if (!rowData) return null
            return (
              <div
                key={row.key}
                className="absolute right-0 left-0"
                style={{ transform: `translateY(${row.start}px)` }}
              >
                {rowData.type === 'label' ? (
                  <p className="text-[#cbd5e1] text-[10px] uppercase tracking-[0.2em]">
                    {rowData.label}
                  </p>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-left font-semibold text-[#0f172a] text-xs shadow-sm transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:bg-[#020617] dark:text-[#e2e8f0]"
                    onClick={() => {
                      onInsert(rowData.item.value, rowData.item.cursorOffset)
                      onClose()
                    }}
                  >
                    <span>{rowData.item.label}</span>
                    <span className="text-[#94a3b8] text-[10px]">Insert</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export type EditorToolbarProps = {
  emojiOpen: boolean
  markdownOpen: boolean
  onEmojiToggle: () => void
  onMarkdownToggle: () => void
  onEmojiSelect: (emoji: string) => void
  onMarkdownInsert: (value: string, cursorOffset?: number) => void
  onEmojiClose: () => void
  onMarkdownClose: () => void
}

export function EditorToolbar({
  emojiOpen,
  markdownOpen,
  onEmojiToggle,
  onMarkdownToggle,
  onEmojiSelect,
  onMarkdownInsert,
  onEmojiClose,
  onMarkdownClose,
}: EditorToolbarProps) {
  return (
    <div
      className="relative flex items-center gap-2 rounded-b-3xl border-[#e2e8f0] border-t bg-white px-4 py-3 text-[#475569] text-xs dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#cbd5e1]"
      data-editor-toolbar
    >
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-lg transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
        onClick={onEmojiToggle}
        aria-label="Toggle emoji picker"
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
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 10.5h.01" />
          <path d="M15.5 10.5h.01" />
          <path d="M8 15s1.5 2 4 2 4-2 4-2" />
        </svg>
      </button>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-lg transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
        onClick={onMarkdownToggle}
        aria-label="Toggle markdown picker"
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
          <path d="M4 7h10a4 4 0 0 1 0 8H9" />
          <path d="M9 7v12" />
          <path d="M14 7v12" />
        </svg>
      </button>

      <EmojiPicker
        open={emojiOpen}
        onClose={onEmojiClose}
        onSelect={onEmojiSelect}
      />
      <MarkdownPicker
        open={markdownOpen}
        onClose={onMarkdownClose}
        onInsert={onMarkdownInsert}
      />
    </div>
  )
}
