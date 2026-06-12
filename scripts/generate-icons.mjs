// Rasterize the SVG icon source into the PNG sizes Chrome needs.
// Run with: pnpm icons
import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "..")
const src = resolve(root, "assets/icon/icon.svg")
const outDir = resolve(root, "public/icons")
const sizes = [16, 32, 48, 128]

const svg = await readFile(src)

await Promise.all(
  sizes.map((size) =>
    sharp(svg, { density: 384 })
      .resize(size, size)
      .png()
      .toFile(resolve(outDir, `icon-${size}.png`))
  )
)

console.log(`Generated ${sizes.length} icons → public/icons/`)
