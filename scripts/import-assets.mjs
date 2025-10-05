#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, extname, relative, sep } from 'node:path'
import { optimize } from 'svgo'

const [,, inputParam, outputParam] = process.argv
const inputDir = inputParam || 'assets'
const outputPath = outputParam || 'src/shapes/assets.json'

async function main() {
  const files = await collectSvgFiles(inputDir)
  if (files.length === 0) {
    console.error(`[import-assets] No SVG files found in ${inputDir}`)
    process.exit(1)
  }

  const assets = {}

  for (const filePath of files) {
    const svg = await readFile(filePath, 'utf8')
    const optimized = optimize(svg, {
      multipass: true,
      plugins: [
        'convertStyleToAttrs',
        'cleanupAttrs',
        { name: 'removeAttrs', params: { attrs: ['fill', 'stroke', 'style', 'class', 'data-name', 'opacity'] } },
        'removeUselessStrokeAndFill',
        'removeDimensions',
        'mergePaths',
        'convertPathData',
        'convertShapeToPath'
      ]
    })

    if ('error' in optimized) {
      console.error(`[import-assets] Failed to optimize ${filePath}: ${optimized.error}`)
      continue
    }

    const viewBoxMatch = optimized.data.match(/viewBox="([^"]+)"/)
    if (!viewBoxMatch) {
      console.warn(`[import-assets] Skipping ${filePath} – missing viewBox`)
      continue
    }

    const pathMatches = [...optimized.data.matchAll(/<path[^>]*d="([^"]+)"/g)]
    if (pathMatches.length === 0) {
      console.warn(`[import-assets] Skipping ${filePath} – no path data after optimisation`)
      continue
    }

    const key = formatKey(relative(inputDir, filePath))
    assets[key] = {
      viewBox: viewBoxMatch[1].trim(),
      d: pathMatches.map((match) => match[1]).join(' ')
    }
  }

  const sortedKeys = Object.keys(assets).sort()
  const sorted = {}
  for (const key of sortedKeys) {
    sorted[key] = assets[key]
  }

  await writeFile(outputPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
  console.log(`[import-assets] Wrote ${sortedKeys.length} assets to ${outputPath}`)
}

async function collectSvgFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectSvgFiles(entryPath))
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.svg') {
      files.push(entryPath)
    }
  }

  return files
}

function formatKey(relPath) {
  const withoutExt = relPath.replace(/\.svg$/i, '')
  const parts = withoutExt.split(sep)
  return parts
    .map((segment) => segment
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((token, index) => index === 0 ? token.toLowerCase() : token.charAt(0).toUpperCase() + token.slice(1))
      .join('')
    )
    .join('/')
}

main().catch((error) => {
  console.error('[import-assets] Unhandled error', error)
  process.exit(1)
})
