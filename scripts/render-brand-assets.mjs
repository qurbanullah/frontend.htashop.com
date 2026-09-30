// Renders the app-icon and splash sources into assets/ from the brand mark.
//
// Run with: npm run assets:render
//
// The brand mark (public/logo-green.svg) fills its own square canvas almost
// edge-to-edge, which is wrong for a launcher icon: iOS rounds the corners and
// Android's adaptive mask crops up to a third of the canvas, so the mark is inset
// here instead of being guessed at by the asset generator.

import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const SOURCE = 'public/logo-green.svg'
const OUT = 'assets'

/** Matches capacitor.config.json → SplashScreen.backgroundColor and the PWA theme. */
const BRAND_BACKGROUND = '#111827'

const ICON_SIZE = 1024
const SPLASH_SIZE = 2732

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }

/** The mark, rendered at `size` px on a transparent square canvas. */
function renderMark(size) {
  return sharp(SOURCE, { density: 384 })
    .resize(size, size, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer()
}

/** A square canvas of `size`, painted with `background`, with the mark centred on it. */
async function writeLayer(size, background, markScale, filename) {
  const image = sharp({ create: { width: size, height: size, channels: 4, background } })

  // A scale of 0 means "no mark": a plain background layer.
  if (markScale > 0) {
    const mark = await renderMark(Math.round(size * markScale))
    image.composite([{ input: mark, gravity: 'center' }])
  }

  // An opaque layer must not carry an alpha channel: App Store Connect rejects an
  // app icon that "contains an alpha channel", even when nothing is see-through.
  const opaque = background !== TRANSPARENT
  const output = opaque
    ? image.flatten({ background: BRAND_BACKGROUND }).removeAlpha()
    : image

  await output.png({ compressionLevel: 9 }).toFile(`${OUT}/${filename}`)
}

await mkdir(OUT, { recursive: true })

// iOS masks the icon's corners and Android's legacy launcher draws it square, so the
// tile is fully opaque with the mark inset for breathing room.
await writeLayer(ICON_SIZE, BRAND_BACKGROUND, 0.72, 'icon-only.png')

// Android adaptive icon layers: the launcher crops the foreground to the central
// ~66%, so the mark stays inside that safe zone. Scaling it to match the iOS tile
// (where the mark covers ~72% of the icon) keeps the two platforms looking alike.
// The background is a plain colour — Android draws it behind the foreground and the
// mask crops it.
await writeLayer(ICON_SIZE, TRANSPARENT, 0.72, 'icon-foreground.png')
await writeLayer(ICON_SIZE, BRAND_BACKGROUND, 0, 'icon-background.png')

// Splash: a centre-cropped square that fills the screen, with the mark sized to land
// at roughly a quarter of the screen width on a phone.
await writeLayer(SPLASH_SIZE, BRAND_BACKGROUND, 0.22, 'splash.png')

console.log('wrote assets/icon-only.png, icon-foreground.png, icon-background.png, splash.png')
