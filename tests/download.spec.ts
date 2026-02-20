import fs from 'node:fs'
import { expect, test } from '@playwright/test'

test('downloads a PDF from the editor', async ({ page }) => {
  await page.goto('/editor')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download/i }).click(),
  ])

  const filename = download.suggestedFilename()
  expect(filename).toMatch(/\.pdf$/)

  const path = await download.path()
  expect(path).toBeTruthy()
  if (path) {
    const stats = fs.statSync(path)
    expect(stats.size).toBeGreaterThan(1_000)
  }
})
