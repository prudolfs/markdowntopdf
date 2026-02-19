import type { ActionFunctionArgs } from '@react-router/node'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkdownRenderer } from '../components/markdown-renderer'

const PAGE_SIZES = {
  a4: { label: 'A4', width: 210, height: 297, format: 'A4' },
} as const

type PageSize = keyof typeof PAGE_SIZES

function buildHtml(markdown: string, pageSize: PageSize, margin: number) {
  const content = renderToStaticMarkup(
    <div
      style={{
        fontFamily:
          '"Sora", "Segoe UI", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif',
        color: '#0f172a',
      }}
    >
      <article style={{ maxWidth: 'none' }}>
        <MarkdownRenderer markdown={markdown} />
      </article>
    </div>,
  )

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@100..800&family=Source+Code+Pro:wght@400;600&display=swap" />
    <style>
      @page { size: ${PAGE_SIZES[pageSize].format}; margin: ${margin}mm; }
      html, body { margin: 0; padding: 0; background: #ffffff; }
      *, *::before, *::after { box-sizing: border-box; }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`
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
  const filename =
    payload.filename?.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'document'

  if (!PAGE_SIZES[pageSize]) {
    return new Response('Unsupported page size.', { status: 400 })
  }

  try {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    try {
      const page = await browser.newPage()
      const html = buildHtml(markdown, pageSize, margin)
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
