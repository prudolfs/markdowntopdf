import fs from 'node:fs/promises'

const mode = process.argv[2]
if (!mode || (mode !== 'gif' && mode !== 'mp4')) {
  throw new Error('Usage: node scripts/update-readme-preview.mjs <gif|mp4>')
}

const mediaLine =
  mode === 'gif'
    ? '![Animated preview](preview.gif)'
    : '<video src="preview.mp4" autoplay loop muted playsinline></video>'

const readmePath = new URL('../README.md', import.meta.url)
const content = await fs.readFile(readmePath, 'utf8')

const lines = content.split('\n')
const titleIndex = lines.findIndex(
  (line) => line.trim() === '# Markdown to PDF',
)
if (titleIndex === -1) {
  throw new Error('README.md title not found.')
}

const updated = [...lines]

if (updated[titleIndex + 1]?.trim() === '') {
  if (updated[titleIndex + 2]) {
    updated[titleIndex + 2] = mediaLine
  } else {
    updated.splice(titleIndex + 2, 0, mediaLine)
  }
} else {
  updated.splice(titleIndex + 1, 0, '', mediaLine)
}

await fs.writeFile(readmePath, `${updated.join('\n')}\n`)
console.log(`README.md updated with ${mode} preview`)
