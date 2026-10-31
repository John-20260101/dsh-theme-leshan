#!/usr/bin/env node
/**
 * Asset contract test: every PNG named `<...>-<w>x<h>.png` must actually be
 * that size, and screenshots.json must list existing UI shots only.
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const problems = []

/** Recursively list files under `dir`, relative to ROOT. */
async function walk(dir) {
  const found = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await walk(path)))
    else found.push(path)
  }
  return found
}

const imageSize = async (path) => {
  const buffer = await readFile(path)
  if (buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    // JPEG: walk the marker segments to the first SOFn frame header.
    let offset = 2
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue }
      const marker = buffer[offset + 1]
      const length = buffer.readUInt16BE(offset + 2)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
      }
      offset += 2 + length
    }
  }
  return null
}

const IMAGE = /\.(png|jpe?g)$/i
for (const path of (await walk(join(ROOT, 'assets'))).filter((file) => IMAGE.test(file))) {
  const file = relative(ROOT, path)
  const size = await imageSize(path)
  if (size === null) {
    problems.push(`${file}: not a readable image`)
    continue
  }
  const match = basename(file).match(/-(\d+)x(\d+)\.(?:png|jpe?g)$/i)
  if (match !== null) {
    const [width, height] = [Number(match[1]), Number(match[2])]
    if (size.width !== width || size.height !== height) {
      problems.push(`${file}: named ${width}×${height}, actual ${size.width}×${size.height}`)
    }
  } else if (file.startsWith('assets/screenshots/')) {
    problems.push(`${file}: screenshot name must carry its pixel size`)
  }
}

const listed = JSON.parse(await readFile(join(ROOT, 'screenshots.json'), 'utf8'))
if (!Array.isArray(listed) || listed.length < 1 || listed.length > 8) {
  problems.push('screenshots.json must list 1-8 images')
}
for (const entry of listed) {
  try {
    await stat(join(ROOT, entry))
  } catch (error) {
    problems.push(`screenshots.json: missing ${entry}`)
  }
  if (entry.includes('keyart')) problems.push(`screenshots.json: key art is documentation, not storefront: ${entry}`)
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`assets OK — ${listed.length} storefront shots, sizes match file names`)
