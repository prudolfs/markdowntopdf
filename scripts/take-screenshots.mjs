import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000'
const distDir = path.resolve('.dist')
const viewport = { width: 1440, height: 900 }

await fs.mkdir(distDir, { recursive: true })

let counter = 1
const shots = []

const waitForUI = async (page) => {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(250)
}

const nextShotPath = () =>
  path.join(distDir, `img_${String(counter).padStart(3, '0')}.jpeg`)

const snap = async (page, label) => {
  const filePath = nextShotPath()
  await page.screenshot({
    path: filePath,
    type: 'jpeg',
    quality: 80,
    fullPage: true,
  })
  shots.push({ file: path.basename(filePath), label })
  counter += 1
}

const newPage = async (browser) => {
  const context = await browser.newContext({ viewport })
  await context.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  const page = await context.newPage()
  return { context, page }
}

const runFlow = async (browser, label, fn) => {
  const { context, page } = await newPage(browser)
  try {
    await fn(page)
    await snap(page, label)
  } finally {
    await context.close()
  }
}

const goEditor = async (page) => {
  await page.goto(`${baseURL}/editor`)
  await page.locator('textarea').waitFor()
  await waitForUI(page)
}

const goHome = async (page) => {
  await page.goto(`${baseURL}/`)
  await page.getByRole('heading', { name: 'Markdown to PDF' }).waitFor()
  await waitForUI(page)
}

const saveDocument = async (page, name, content) => {
  const editor = page.locator('textarea')
  await editor.fill(content)
  await page.getByRole('button', { name: 'Save document' }).click()
  await page.getByPlaceholder('Document name').fill(name)
  await page
    .locator('[data-editor-popover]', { hasText: 'Save document' })
    .getByRole('button', { name: 'Save' })
    .click()
  await waitForUI(page)
}

const openLoadPopover = async (page) => {
  await page.getByRole('button', { name: 'Load document' }).click()
  await page
    .locator('[data-editor-popover]', { hasText: 'Load document' })
    .waitFor()
  await waitForUI(page)
}

const browser = await chromium.launch()

try {
  await runFlow(browser, 'home', async (page) => {
    await goHome(page)
  })

  await runFlow(browser, 'editor-default', async (page) => {
    await goEditor(page)
  })

  await runFlow(browser, 'save-load', async (page) => {
    await goEditor(page)
    await saveDocument(page, 'My Doc', 'Saved content A')
    await page.locator('textarea').fill('Different content')
    await openLoadPopover(page)
    await page
      .locator('[data-editor-popover]', { hasText: 'Load document' })
      .getByRole('button', { name: /My Doc/ })
      .first()
      .click()
    await waitForUI(page)
  })

  await runFlow(browser, 'emoji-insert', async (page) => {
    await goEditor(page)
    const editor = page.locator('textarea')
    await editor.fill('Hello ')
    await page.getByRole('button', { name: 'Toggle emoji picker' }).click()
    await page.getByRole('button', { name: '😀' }).click()
    await waitForUI(page)
  })

  await runFlow(browser, 'markdown-insert', async (page) => {
    await goEditor(page)
    await page.getByRole('button', { name: 'Toggle markdown picker' }).click()
    await page.getByRole('button', { name: 'Bold Insert' }).click()
    await waitForUI(page)
  })

  await runFlow(browser, 'preview-update', async (page) => {
    await goEditor(page)
    await page.locator('textarea').fill('Preview Unique 123')
    await page.locator('article').getByText('Preview Unique 123').waitFor()
    await waitForUI(page)
  })

  await runFlow(browser, 'load-empty', async (page) => {
    await goEditor(page)
    await openLoadPopover(page)
  })

  await runFlow(browser, 'export-error', async (page) => {
    await page.route('**/export-pdf', (route) =>
      route.fulfill({ status: 500, body: 'PDF export failed' }),
    )
    await goEditor(page)
    await page.getByRole('button', { name: 'Download' }).click()
    await page.getByText('PDF export failed').waitFor()
    await waitForUI(page)
  })

  await runFlow(browser, 'delete-doc', async (page) => {
    await goEditor(page)
    await saveDocument(page, 'Temp Doc', 'Doc to delete')
    await openLoadPopover(page)
    await page
      .locator('[data-editor-popover]', { hasText: 'Load document' })
      .getByRole('button', { name: 'Select Temp Doc', exact: true })
      .click()
    await page
      .locator('[data-editor-popover]', { hasText: 'Load document' })
      .getByRole('button', { name: 'Delete selected documents' })
      .click()
    await page
      .locator('[data-editor-popover]', { hasText: 'Load document' })
      .getByRole('button', { name: 'Delete', exact: true })
      .click()
    await openLoadPopover(page)
  })

  await runFlow(browser, 'reset-editor', async (page) => {
    await goEditor(page)
    await page.locator('textarea').fill('Custom content')
    await page.getByRole('button', { name: 'Refresh editor' }).click()
    await page
      .locator('[data-editor-popover]', { hasText: 'Reset editor?' })
      .getByRole('button', { name: 'Reset' })
      .click()
    await waitForUI(page)
  })

  await runFlow(browser, 'delete-multiple', async (page) => {
    await goEditor(page)
    await saveDocument(page, 'Doc A', 'Doc A')
    await saveDocument(page, 'Doc B', 'Doc B')
    await openLoadPopover(page)
    const loadPopover = page.locator('[data-editor-popover]', {
      hasText: 'Load document',
    })
    await loadPopover
      .getByRole('button', { name: 'Select Doc A', exact: true })
      .click()
    await loadPopover
      .getByRole('button', { name: 'Select Doc B', exact: true })
      .click()
    await loadPopover
      .getByRole('button', { name: 'Delete selected documents' })
      .click()
    await loadPopover
      .getByRole('button', { name: 'Delete', exact: true })
      .click()
    await openLoadPopover(page)
  })

  await runFlow(browser, 'cancel-delete', async (page) => {
    await goEditor(page)
    await saveDocument(page, 'Keep Doc', 'Keep me')
    await openLoadPopover(page)
    const loadPopover = page.locator('[data-editor-popover]', {
      hasText: 'Load document',
    })
    await loadPopover
      .getByRole('button', { name: 'Select Keep Doc', exact: true })
      .click()
    await loadPopover
      .getByRole('button', { name: 'Delete selected documents' })
      .click()
    await loadPopover.getByRole('button', { name: 'Cancel' }).click()
    await waitForUI(page)
  })

  await runFlow(browser, 'theme-toggle', async (page) => {
    await goEditor(page)
    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.waitForFunction(() =>
      document.documentElement.classList.contains('dark'),
    )
    await waitForUI(page)
  })
} finally {
  await browser.close()
}

console.log('Saved screenshots:')
for (const shot of shots) {
  console.log(`${shot.file} - ${shot.label}`)
}
