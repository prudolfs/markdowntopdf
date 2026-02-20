import fs from 'node:fs/promises'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import GIFEncoder from 'gif-encoder-2'

const distDir = path.resolve('.dist')
const outputPath = path.resolve('preview.gif')

const crossfadeSteps = Number(process.env.CROSSFADE_STEPS ?? '24')
const holdFrames = Number(process.env.HOLD_FRAMES ?? '1')
const frameDelayMs = Number(process.env.FRAME_DELAY_MS ?? '80')
const scale = Number(process.env.GIF_SCALE ?? '0.5')
const quality = Number(process.env.GIF_QUALITY ?? '20')
const frameStride = Math.max(1, Number(process.env.FRAME_STRIDE ?? '1'))

const files = (await fs.readdir(distDir))
  .filter((file) => /^img_\d+\.jpe?g$/i.test(file))
  .sort()
  .filter((_, index) => index % frameStride === 0)

if (files.length < 2) {
  throw new Error('Need at least 2 screenshots in .dist to build anim.gif.')
}

const firstImage = await loadImage(path.join(distDir, files[0]))
const width = Math.max(1, Math.round(firstImage.width * scale))
const height = Math.max(1, Math.round(firstImage.height * scale))
const canvas = createCanvas(width, height)
const ctx = canvas.getContext('2d')

const encoder = new GIFEncoder(width, height)
encoder.setRepeat(0)
encoder.setDelay(frameDelayMs)
encoder.setQuality(quality)
encoder.start()

const drawFrame = (base, next, alpha) => {
  ctx.clearRect(0, 0, width, height)
  ctx.globalAlpha = 1
  ctx.drawImage(base, 0, 0, width, height)
  if (next && alpha > 0) {
    ctx.globalAlpha = alpha
    ctx.drawImage(next, 0, 0, width, height)
  }
  ctx.globalAlpha = 1
  encoder.addFrame(ctx)
}

const images = await Promise.all(
  files.map((file) => loadImage(path.join(distDir, file))),
)

for (let i = 0; i < images.length - 1; i += 1) {
  const current = images[i]
  const next = images[i + 1]

  if (i === 0) {
    for (let h = 0; h < holdFrames; h += 1) {
      drawFrame(current, null, 0)
    }
  }

  for (let step = 1; step <= crossfadeSteps; step += 1) {
    const alpha = step / crossfadeSteps
    drawFrame(current, next, alpha)
  }
}

const last = images.at(-1)
if (last) {
  for (let h = 0; h < holdFrames; h += 1) {
    drawFrame(last, null, 0)
  }
}

encoder.finish()

await fs.writeFile(outputPath, encoder.out.getData())
console.log(`Saved ${outputPath}`)
