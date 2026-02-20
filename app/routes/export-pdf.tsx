import type { ActionFunctionArgs } from '@react-router/node'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkdownRenderer } from '~/components/markdown-renderer'
import {
  DEFAULT_PDF_THEME,
  PDF_THEMES,
  type PdfThemeId,
} from '~/components/markdown-themes'

const PAGE_SIZES = {
  a4: { label: 'A4', width: 210, height: 297, format: 'A4' },
  letter: { label: 'Letter', width: 216, height: 279, format: 'Letter' },
  legal: { label: 'Legal', width: 216, height: 356, format: 'Legal' },
  a5: { label: 'A5', width: 148, height: 210, format: 'A5' },
} as const

type PageSize = keyof typeof PAGE_SIZES

function buildHtml(
  markdown: string,
  pageSize: PageSize,
  margin: number,
  themeId: PdfThemeId,
) {
  const theme = PDF_THEMES[themeId]
  const fontLinks = [
    'https://fonts.googleapis.com/css2?family=Sora:wght@100..800&display=swap',
    'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
    'https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@200..900&display=swap',
    'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&display=swap',
  ]
  const content = renderToStaticMarkup(
    <div
      style={{
        fontFamily: theme.fontFamily,
        color: theme.textColor,
      }}
    >
      <article style={{ maxWidth: 'none' }}>
        <MarkdownRenderer markdown={markdown} themeId={themeId} />
      </article>
    </div>,
  )
  const head = [
    '<meta charSet="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />',
    ...fontLinks.map((href) => `<link rel="stylesheet" href="${href}" />`),
    `<style>
      @page { size: ${PAGE_SIZES[pageSize].format}; margin: ${margin}mm; }
      html, body { margin: 0; padding: 0; background: ${theme.pageBg}; }
      *, *::before, *::after { box-sizing: border-box; }
    </style>`,
  ].join('\n    ')

  return [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    `    ${head}`,
    '  </head>',
    '  <body>',
    `    ${content}`,
    '  </body>',
    '</html>',
  ].join('\n')
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let payload: {
    markdown?: string
    pageSize?: PageSize
    margin?: number
    filename?: string
    theme?: PdfThemeId
  }

  try {
    payload = await request.json()
  } catch (error) {
    console.error('Failed to parse export payload', error)
    return new Response('Invalid request body.', { status: 400 })
  }

  const markdown = payload.markdown ?? ''
  const pageSize = payload.pageSize ?? 'a4'
  const margin = Number.isFinite(payload.margin) ? payload.margin : 16
  const themeId = payload.theme ?? DEFAULT_PDF_THEME
  const filename =
    payload.filename?.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'document'

  if (!PAGE_SIZES[pageSize]) {
    return new Response('Unsupported page size.', { status: 400 })
  }
  if (!PDF_THEMES[themeId]) {
    return new Response('Unsupported theme.', { status: 400 })
  }

  try {
    const useLocalPlaywright =
      process.env.PLAYWRIGHT_USE_LOCAL === '1' ||
      process.env.NODE_ENV !== 'production'
    const browser = useLocalPlaywright
      ? await launchLocalChromium()
      : await launchSparticuzChromium()
    try {
      const page = await browser.newPage()
      const html = buildHtml(markdown, pageSize, margin, themeId)
      await page.setContent(html, { waitUntil: 'load' })
      const pdf = await page.pdf({
        format: PAGE_SIZES[pageSize].format,
        printBackground: true,
        margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      })

      return new Response(pdf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
          'Cache-Control': 'no-store',
        },
      })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error('PDF export failed', error)
    return new Response('PDF export failed.', { status: 500 })
  }
}

async function launchLocalChromium() {
  const { chromium: playwrightChromium } = await import('playwright')
  return playwrightChromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}

async function launchSparticuzChromium() {
  if (process.env.VERCEL) {
    process.env.AWS_LAMBDA_JS_RUNTIME ??= 'nodejs20.x'
  }
  const { default: chromium } = await import('@sparticuz/chromium')
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    (await chromium.executablePath())
  if (!executablePath) {
    throw new Error('Chromium executable path not found.')
  }
  console.info('PDF export: using Sparticuz Chromium', {
    executablePath,
    argsCount: chromium.args.length,
  })
  const { chromium: playwrightChromium } = await import('playwright-core')
  return playwrightChromium.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  })
}
