/**
 * Colour math for the Leshan theme engine.
 *
 * Everything the engine emits is plain CSS: hex for opaque roles and `rgba()`
 * for translucent ones, so a token can be consumed directly by the shell's
 * stylesheets without a runtime colour parser on the browser side.
 */

/** Parse `#rgb`, `#rrggbb` or `#rrggbbaa` into `{ r, g, b, a }` (0-255, a 0-1). */
export function parse(input) {
  const value = String(input).trim()
  if (value.startsWith('rgba') || value.startsWith('rgb')) {
    const numbers = value.replace(/[^0-9.,]/g, '').split(',').map(Number)
    return { r: numbers[0] ?? 0, g: numbers[1] ?? 0, b: numbers[2] ?? 0, a: numbers[3] ?? 1 }
  }
  let hex = value.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  const int = Number.parseInt(hex.slice(0, 6), 16)
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
    a: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
  }
}

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
const hex2 = (n) => clamp(n).toString(16).padStart(2, '0')

/** `{ r, g, b }` -> `#rrggbb`. */
export function toHex({ r, g, b }) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`
}

/** Linear interpolation between two colours; `t=0` returns `a`, `t=1` returns `b`. */
export function mix(a, b, t) {
  const x = parse(a)
  const y = parse(b)
  return toHex({
    r: x.r + (y.r - x.r) * t,
    g: x.g + (y.g - x.g) * t,
    b: x.b + (y.b - x.b) * t,
  })
}

/** The same colour at `alpha` (0-1) opacity, as an `rgba()` string. */
export function alpha(color, value) {
  const c = parse(color)
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${Number(value.toFixed(3))})`
}

/** Move a colour toward white (`amount > 0`). */
export function lighten(color, amount) {
  return mix(color, '#ffffff', amount)
}

/** Move a colour toward black (`amount > 0`). */
export function darken(color, amount) {
  return mix(color, '#000000', amount)
}

/**
 * Composite a translucent colour over an opaque one, so contrast can be
 * measured on what the eye actually receives (hairlines are all rgba).
 */
export function flatten(color, background) {
  const fg = parse(color)
  if (fg.a >= 1) return toHex(fg)
  const back = parse(background)
  return toHex({
    r: fg.r * fg.a + back.r * (1 - fg.a),
    g: fg.g * fg.a + back.g * (1 - fg.a),
    b: fg.b * fg.a + back.b * (1 - fg.a),
  })
}

/** WCAG 2.x relative luminance. */
export function luminance(color) {
  const { r, g, b } = parse(color)
  const channel = (n) => {
    const s = n / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio, always >= 1. */
export function contrast(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * Nudge `foreground` toward white or black until it clears `minimum` against
 * `background`. Used for accent and on-accent roles, so a skin can name a
 * pleasant hue and still stay readable once it becomes a button fill.
 */
export function ensureContrast(foreground, background, minimum) {
  if (contrast(foreground, background) >= minimum) return foreground
  const toward = luminance(background) > 0.45 ? '#000000' : '#ffffff'
  let result = foreground
  for (let step = 1; step <= 20; step += 1) {
    result = mix(foreground, toward, step * 0.05)
    if (contrast(result, background) >= minimum) return result
  }
  return result
}

/** `#RRGGBB` + `#RRGGBB` -> gradient CSS for the skin rail and docs. */
export function gradient(a, b, angle = 135) {
  return `linear-gradient(${angle}deg, ${a} 0%, ${b} 100%)`
}
