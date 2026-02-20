import type { RefObject } from 'react'
import { MarkdownRenderer } from '~/components/markdown-renderer'
import { PDF_THEMES, type PdfThemeId } from '~/components/markdown-themes'

type PreviewPanelProps = {
  markdown: string
  previewViewportRef: RefObject<HTMLDivElement | null>
  pageWidthPx: number
  pageHeightPx: number
  marginPx: number
  themeId: PdfThemeId
}

export function PreviewPanel({
  markdown,
  previewViewportRef,
  pageWidthPx,
  pageHeightPx,
  marginPx,
  themeId,
}: PreviewPanelProps) {
  const theme = PDF_THEMES[themeId]
  return (
    <section className="flex h-[calc(100vh-220px)] flex-col overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0_26px_60px_rgba(15,23,42,0.18)] backdrop-blur dark:border-[#1e293b] dark:bg-[#0f172a] dark:shadow-[0_26px_60px_rgba(2,6,23,0.6)]">
      <div className="flex items-center justify-between border-[#e2e8f0] border-b px-6 py-4 text-[#64748b] text-xs uppercase tracking-[0.25em] dark:border-[#1e293b] dark:text-[#94a3b8]">
        Preview
        <span className="font-normal text-[10px] tracking-[0.2em]">
          PDF Ready
        </span>
      </div>
      <div
        ref={previewViewportRef}
        className="flex-1 overflow-auto overflow-x-hidden bg-[#f1f5f9] p-6 dark:bg-[#0f172a]"
      >
        <div
          className="rounded-2xl shadow-[0_18px_35px_rgba(15,23,42,0.18)]"
          data-preview-page
          style={{
            width: pageWidthPx,
            maxWidth: '100%',
            minHeight: pageHeightPx,
            padding: marginPx,
            border: `1px solid ${theme.pageBorder}`,
            backgroundColor: theme.pageBg,
            color: theme.textColor,
            fontFamily: theme.fontFamily,
          }}
        >
          <article className="max-w-none">
            <MarkdownRenderer markdown={markdown} themeId={themeId} />
          </article>
        </div>
      </div>
    </section>
  )
}
