import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_PDF_THEME,
  type PdfThemeId,
} from '~/components/markdown-themes'

export const DEFAULT_MARKDOWN = `# Markdown to PDF

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

type EditorState = {
  markdown: string
  setMarkdown: (markdown: string) => void
  resetMarkdown: () => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  exportTheme: PdfThemeId
  setExportTheme: (theme: PdfThemeId) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      markdown: DEFAULT_MARKDOWN,
      setMarkdown: (markdown) => set({ markdown }),
      resetMarkdown: () => set({ markdown: DEFAULT_MARKDOWN }),
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      exportTheme: DEFAULT_PDF_THEME,
      setExportTheme: (theme) => set({ exportTheme: theme }),
    }),
    {
      name: 'markdown-editor',
      partialize: (state) => ({
        markdown: state.markdown,
        theme: state.theme,
        exportTheme: state.exportTheme,
      }),
    },
  ),
)
