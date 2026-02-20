export type PdfThemeId = 'document' | 'clean' | 'academic'

export type PdfTheme = {
  id: PdfThemeId
  label: string
  fontFamily: string
  monoFontFamily: string
  textColor: string
  headingColor: string
  linkColor: string
  mutedText: string
  codeBg: string
  codeText: string
  quoteBorder: string
  quoteBg: string
  ruleColor: string
  pageBg: string
  pageBorder: string
}

export const PDF_THEMES: Record<PdfThemeId, PdfTheme> = {
  document: {
    id: 'document',
    label: 'Document',
    fontFamily:
      '"Sora", "Segoe UI", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif',
    monoFontFamily:
      '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    textColor: '#1f2937',
    headingColor: '#0f172a',
    linkColor: '#0ea5e9',
    mutedText: '#475569',
    codeBg: '#f1f5f9',
    codeText: '#0f172a',
    quoteBorder: '#38bdf8',
    quoteBg: '#f0f9ff',
    ruleColor: '#e2e8f0',
    pageBg: '#ffffff',
    pageBorder: '#e2e8f0',
  },
  clean: {
    id: 'clean',
    label: 'Clean',
    fontFamily:
      '"Inter", "Segoe UI", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif',
    monoFontFamily:
      '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    textColor: '#0f172a',
    headingColor: '#0f172a',
    linkColor: '#2563eb',
    mutedText: '#475569',
    codeBg: '#eef2ff',
    codeText: '#1e1b4b',
    quoteBorder: '#60a5fa',
    quoteBg: '#eff6ff',
    ruleColor: '#e2e8f0',
    pageBg: '#ffffff',
    pageBorder: '#e5e7eb',
  },
  academic: {
    id: 'academic',
    label: 'Academic',
    fontFamily: '"Source Serif 4", "Times New Roman", ui-serif, Georgia, serif',
    monoFontFamily:
      '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    textColor: '#1f2937',
    headingColor: '#111827',
    linkColor: '#1d4ed8',
    mutedText: '#4b5563',
    codeBg: '#f3f4f6',
    codeText: '#111827',
    quoteBorder: '#93c5fd',
    quoteBg: '#f8fafc',
    ruleColor: '#e5e7eb',
    pageBg: '#ffffff',
    pageBorder: '#d1d5db',
  },
}

export const DEFAULT_PDF_THEME: PdfThemeId = 'document'
