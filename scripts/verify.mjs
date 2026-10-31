#!/usr/bin/env node
/**
 * Contrast gate for the Leshan palettes.
 *
 * The theme document quotes these numbers, so the same script that prints them
 * also fails CI when a palette drifts below the floor it advertises:
 *   body >= 7.0 (WCAG AAA body text), secondary >= 4.5, accent text >= 3.0,
 *   primary-button label >= 4.5.
 */
import { SKINS } from '../src/skins.mjs'
import { contrastReport, deriveSkin } from '../src/derive.mjs'

const FLOORS = { body: 7, secondary: 4.5, accentText: 3, buttonLabel: 4.5 }

let failed = false
const rows = []
for (const skin of SKINS) {
  deriveSkin(skin) // throws on a missing / unknown token
  for (const row of contrastReport(skin)) {
    for (const [key, floor] of Object.entries(FLOORS)) {
      if (row[key] < floor) {
        failed = true
        console.error(`FAIL ${skin.id}/${row.mode} ${key}=${row[key].toFixed(2)} < ${floor}`)
      }
    }
    rows.push({ skin: `${skin.id}/${row.mode}`, ...row })
  }
}

const fmt = (n) => n.toFixed(2).padStart(5)
console.log('skin/mode'.padEnd(26), 'body  sec  accent button border')
for (const row of rows) {
  console.log(
    row.skin.padEnd(26),
    fmt(row.body), fmt(row.secondary), fmt(row.accentText).padStart(6),
    fmt(row.buttonLabel).padStart(6), fmt(row.border).padStart(6),
  )
}

if (failed) process.exit(1)
console.log(`\nOK — ${SKINS.length} skins × 2 appearances, all floors met.`)
