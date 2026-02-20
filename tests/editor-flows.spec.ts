import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-cleared')) {
      localStorage.clear()
      sessionStorage.setItem('e2e-cleared', '1')
    }
  })
})

test('saves and loads a document', async ({ page }) => {
  await page.goto('/editor')

  const editor = page.locator('textarea')
  await editor.click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.press('Backspace')
  await editor.type('Saved content A')

  await page.getByRole('button', { name: 'Save document' }).click()
  await page.getByPlaceholder('Document name').fill('My Doc')
  await page
    .locator('[data-editor-popover]', { hasText: 'Save document' })
    .getByRole('button', { name: 'Save' })
    .click()

  await editor.click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.press('Backspace')
  await editor.type('Different content')

  await page.getByRole('button', { name: 'Load document' }).click()
  await page
    .locator('[data-editor-popover]', { hasText: 'Load document' })
    .getByRole('button', { name: /My Doc/ })
    .first()
    .click()

  await expect(editor).toHaveValue('Saved content A')
})

test('inserts an emoji into the editor', async ({ page }) => {
  await page.goto('/editor')

  const editor = page.locator('textarea')
  await editor.click()
  await editor.fill('Hello ')

  await page.getByRole('button', { name: 'Toggle emoji picker' }).click()
  await page.getByRole('button', { name: '😀' }).click()

  await expect(editor).toHaveValue('Hello 😀')
})

test('inserts markdown snippet into the editor', async ({ page }) => {
  await page.goto('/editor')

  const editor = page.locator('textarea')
  await editor.click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.press('Backspace')

  await page.getByRole('button', { name: 'Toggle markdown picker' }).click()
  await page.getByRole('button', { name: 'Bold Insert' }).click()

  await expect(editor).toHaveValue(/\*\*bold\*\*/)
})

test('updates the preview when editing', async ({ page }) => {
  await page.goto('/editor')

  const editor = page.locator('textarea')
  await editor.fill('Preview Unique 123')

  await expect(page.locator('article')).toContainText('Preview Unique 123')
})

test('shows empty state for load when no saved documents exist', async ({
  page,
}) => {
  await page.goto('/editor')

  await page.getByRole('button', { name: 'Load document' }).click()
  await expect(
    page
      .locator('[data-editor-popover]', { hasText: 'Load document' })
      .getByText('No saved documents.'),
  ).toBeVisible()
})

test('shows export error when PDF download fails', async ({ page }) => {
  await page.route('**/export-pdf', (route) =>
    route.fulfill({ status: 500, body: 'PDF export failed' }),
  )

  await page.goto('/editor')
  await page.getByRole('button', { name: 'Download' }).click()

  await expect(page.getByText('PDF export failed')).toBeVisible()
})

test('deletes a saved document from load list', async ({ page }) => {
  await page.goto('/editor')

  const editor = page.locator('textarea')
  await editor.click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.press('Backspace')
  await editor.type('Doc to delete')

  await page.getByRole('button', { name: 'Save document' }).click()
  await page.getByPlaceholder('Document name').fill('Temp Doc')
  await page
    .locator('[data-editor-popover]', { hasText: 'Save document' })
    .getByRole('button', { name: 'Save' })
    .click()

  await page.getByRole('button', { name: 'Load document' }).click()
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

  await page.getByRole('button', { name: 'Load document' }).click()
  await expect(
    page
      .locator('[data-editor-popover]', { hasText: 'Load document' })
      .getByText('No saved documents.'),
  ).toBeVisible()
})

test('resets the editor to default markdown', async ({ page }) => {
  await page.goto('/editor')

  const editor = page.locator('textarea')
  await editor.click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.press('Backspace')
  await editor.type('Custom content')

  await page.getByRole('button', { name: 'Refresh editor' }).click()
  await page
    .locator('[data-editor-popover]', { hasText: 'Reset editor?' })
    .getByRole('button', { name: 'Reset' })
    .click()

  await expect(editor).toHaveValue(/# Markdown to PDF/)
})

test('deletes multiple saved documents at once', async ({ page }) => {
  await page.goto('/editor')

  const editor = page.locator('textarea')
  await editor.click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.press('Backspace')
  await editor.type('Doc A')

  await page.getByRole('button', { name: 'Save document' }).click()
  await page.getByPlaceholder('Document name').fill('Doc A')
  await page
    .locator('[data-editor-popover]', { hasText: 'Save document' })
    .getByRole('button', { name: 'Save' })
    .click()

  await editor.click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.press('Backspace')
  await editor.type('Doc B')

  await page.getByRole('button', { name: 'Save document' }).click()
  await page.getByPlaceholder('Document name').fill('Doc B')
  await page
    .locator('[data-editor-popover]', { hasText: 'Save document' })
    .getByRole('button', { name: 'Save' })
    .click()

  await page.getByRole('button', { name: 'Load document' }).click()
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
  await loadPopover.getByRole('button', { name: 'Delete', exact: true }).click()

  await page.getByRole('button', { name: 'Load document' }).click()
  await expect(
    page
      .locator('[data-editor-popover]', { hasText: 'Load document' })
      .getByText('No saved documents.'),
  ).toBeVisible()
})

test('cancel delete keeps selected documents', async ({ page }) => {
  await page.goto('/editor')

  const editor = page.locator('textarea')
  await editor.click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.press('Backspace')
  await editor.type('Keep me')

  await page.getByRole('button', { name: 'Save document' }).click()
  await page.getByPlaceholder('Document name').fill('Keep Doc')
  await page
    .locator('[data-editor-popover]', { hasText: 'Save document' })
    .getByRole('button', { name: 'Save' })
    .click()

  await page.getByRole('button', { name: 'Load document' }).click()
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

  await expect(loadPopover.getByText('Keep Doc')).toBeVisible()
})

test('theme toggle persists across reload', async ({ page }) => {
  await page.goto('/editor')

  await page.getByRole('button', { name: 'Toggle theme' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})
