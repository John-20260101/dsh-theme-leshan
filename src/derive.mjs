/**
 * Token derivation: six colour inputs per appearance -> the 119 alias tokens
 * the Web shell reads.
 *
 * The rules are written as roles rather than as literal colours, so every skin
 * inherits the same contrast behaviour: body ink is checked against the page,
 * accent text against the page, button labels against their fill, and anything
 * that lands under a caption threshold is nudged instead of shipped as-is.
 */
import { alpha, contrast, darken, ensureContrast, flatten, lighten, mix } from './color.mjs'
import { TOKEN_NAMES } from './tokens.mjs'

/** @typedef {import('./skins.mjs').Palette} Palette */

/**
 * Derive the alias-token table for one appearance.
 * @param {Palette} palette
 * @param {{ dark: boolean, signature?: string }} options
 * @returns {Record<string, string>}
 */
export function deriveTokens(palette, options) {
  const dark = options.dark
  const signature = options.signature ?? 'plain'
  const { bg, plate, ink, muted, accent, onAccent, danger, success, warn } = palette

  // Harden the hairlines on the ink-and-paper skin: no shadow can compensate
  // for a border that disappears into white.
  const lineScale = (signature === 'paper' ? 1.45 : 1) * (dark ? 1.2 : 1)
  // The ink-and-paper skin has no hue to carry state, so its interaction tints
  // work harder: the same alpha that reads as a wash on a coloured skin reads
  // as nothing against #FAFAF8.
  const tint = signature === 'paper' ? 1.6 : 1

  // Text roles: the two the shell uses for body copy are guaranteed, the rest
  // are progressively quieter but never fully invisible.
  const primary = ensureContrast(ink, bg, 7)
  const secondary = ensureContrast(muted, bg, 4.5)
  const tertiary = ensureContrast(mix(muted, bg, 0.18), bg, 3)
  const caption = ensureContrast(mix(muted, bg, 0.34), bg, 3)
  const dimmed = mix(bg, ink, 0.22)

  // Accent roles: the hue is used as text (links, active nav) and as a fill
  // (primary button). Both need their own guarantee.
  const accentFill = ensureContrast(accent, bg, 3)
  const accentText = ensureContrast(accent, bg, 4.5)
  const accentHover = dark ? lighten(accentFill, 0.08) : darken(accentFill, 0.07)
  const onAccentSafe = ensureContrast(onAccent, accentFill, 4.5)

  // State roles.
  const error = ensureContrast(danger, bg, 3)
  const ok = ensureContrast(success, bg, 3)
  const warning = ensureContrast(warn, bg, 3)

  const layer2 = plate
  const layer3 = dark ? mix(plate, '#ffffff', 0.055) : mix(plate, '#000000', 0.028)
  const overlay = dark ? mix(plate, '#ffffff', 0.075) : mix(plate, '#000000', 0.04)
  const subtle = (amount) => mix(bg, ink, amount)
  const stroke = (amount) => alpha(ink, Math.min(0.9, amount * lineScale))

  const tooltipBg = dark ? mix(plate, '#ffffff', 0.07) : ink

  /** @type {Record<string, string>} */
  const tokens = {
    '--dsw-alias-bg-base': bg,
    '--dsw-alias-bg-layer-1': bg,
    '--dsw-alias-bg-layer-2': layer2,
    '--dsw-alias-bg-layer-3': layer3,
    '--dsw-alias-bg-overlay': overlay,
    '--dsw-alias-bg-module-platform': layer2,
    '--dsw-alias-bg-multi-select': alpha(accentText, 0.12 * tint),
    '--dsw-alias-bg-skeleton': stroke(dark ? 0.1 : 0.07),
    '--dsw-alias-bg-document-preview': dark ? darken(bg, 0.03) : layer3,
    '--dsw-alias-bg-document-selection': alpha(accentText, 0.35),
    '--dsw-alias-bg-mask-1': alpha('#000000', dark ? 0.55 : 0.32),
    '--dsw-alias-bg-mask-2': alpha('#000000', dark ? 0.24 : 0.14),
    '--dsw-alias-bg-mask-3': alpha('#000000', dark ? 0.7 : 0.3),
    '--dsw-alias-bg-mask-photo': alpha('#000000', 0.88),
    '--dsw-alias-bg-mask-drop': alpha(layer2, dark ? 0.78 : 0.72),

    '--dsw-alias-label-primary': primary,
    '--dsw-alias-label-primary-bluish': mix(primary, accentText, 0.18),
    '--dsw-alias-label-primary-dimmed': mix(primary, bg, 0.12),
    '--dsw-alias-label-primary-foreground': onAccentSafe,
    '--dsw-alias-label-primary-inverted': onAccentSafe,
    '--dsw-alias-label-secondary': secondary,
    '--dsw-alias-label-tertiary': tertiary,
    '--dsw-alias-label-caption': caption,
    '--dsw-alias-label-dimmed': dimmed,
    '--dsw-alias-label-document-preview': secondary,
    '--dsw-alias-label-deep-diving': accentText,
    '--dsw-alias-label-deep-diving-shimmer': alpha(accentText, 0.5),
    '--dsw-alias-label-shimmer': alpha(dark ? '#ffffff' : '#000000', 0.3),
    '--dsw-alias-menu-icon': mix(primary, accentText, 0.12),

    '--dsw-alias-border-l1': stroke(0.07),
    '--dsw-alias-border-l2': stroke(0.11),
    '--dsw-alias-border-l2-darkmode-thin': stroke(0.1),
    '--dsw-alias-border-l3': stroke(0.16),
    '--dsw-alias-border-l4': stroke(0.24),
    '--dsw-alias-border-inverted': alpha(dark ? '#ffffff' : '#000000', 0.06),
    '--dsw-alias-border-inverted2': alpha(dark ? '#ffffff' : '#000000', 0.09),

    '--dsw-alias-brand-primary': primary,
    '--dsw-alias-brand-primary-invert': bg,
    '--dsw-alias-brand-primary-new-colorprimary-new-color': accentText,
    '--dsw-alias-brand-text': primary,
    '--dsw-alias-link': accentText,

    '--dsw-alias-state-business-primary': accentText,
    '--dsw-alias-state-business-tertiary': alpha(accentText, (dark ? 0.18 : 0.11) * tint),
    '--dsw-alias-state-error-primary': error,
    '--dsw-alias-state-error-secondary': mix(error, bg, 0.35),
    '--dsw-alias-state-success-primary': ok,
    '--dsw-alias-state-success-secondary': mix(ok, bg, 0.35),
    '--dsw-alias-state-success-tertiary': alpha(ok, dark ? 0.18 : 0.11),
    '--dsw-alias-state-warn-label': warning,
    '--dsw-alias-state-warn-primary': warning,
    '--dsw-alias-state-warn-secondary': mix(warning, bg, 0.32),
    '--dsw-alias-state-warn-tertiary': alpha(warning, dark ? 0.18 : 0.11),
    '--dsw-alias-state-idle-primary': mix(secondary, bg, 0.5),

    '--dsw-alias-interactive-bg-hover': alpha(accentText, (dark ? 0.12 : 0.065) * tint),
    '--dsw-alias-interactive-bg-active': alpha(accentText, (dark ? 0.19 : 0.11) * tint),
    '--dsw-alias-interactive-bg-hover-accent': alpha(accentText, (dark ? 0.24 : 0.15) * tint),
    '--dsw-alias-interactive-bg-hover-danger': alpha(error, dark ? 0.16 : 0.07),
    '--dsw-alias-interactive-bg-hover-solid': layer3,

    '--dsw-alias-button-contrast-fill': primary,
    '--dsw-alias-button-elevated-fill': layer2,
    '--dsw-alias-button-floating-fill': layer2,
    '--dsw-alias-button-floating-hover': layer3,
    '--dsw-alias-button-ghost-active-border': stroke(0.26),
    '--dsw-alias-button-ghost-active-fill': alpha(ink, 0.07),
    '--dsw-alias-button-ghost-active-hover': alpha(ink, 0.1),
    '--dsw-alias-button-info-fill': accentFill,
    '--dsw-alias-button-info-hover': accentHover,
    '--dsw-alias-button-primary-fill': accentFill,
    '--dsw-alias-button-primary-hover': accentHover,
    '--dsw-alias-button-primary-dimmed': alpha(accentFill, (dark ? 0.24 : 0.14) * tint),
    '--dsw-alias-button-tool-bar-fill': alpha(ink, dark ? 0.5 : 0.58),
    '--dsw-alias-button-tool-bar-fill-invisible': alpha(ink, dark ? 0.22 : 0.28),
    '--dsw-alias-button-tool-bar-hover': alpha(ink, dark ? 0.62 : 0.7),

    '--dsw-alias-markdown-citation': subtle(0.045),
    '--dsw-alias-markdown-code-block': subtle(0.055),
    '--dsw-alias-markdown-code-block-banner': subtle(0.03),
    '--dsw-alias-markdown-code-segment-selected': layer2,
    '--dsw-alias-markdown-code-segment-unselected': subtle(0.04),
    '--dsw-alias-markdown-inline-code': subtle(0.075),
    '--dsw-alias-markdown-placeholder': ensureContrast(mix(muted, bg, 0.5), bg, 3),
    '--dsw-alias-markdown-tag': subtle(0.065),

    '--dsw-alias-turn-trigger-bg': subtle(0.05),
    '--dsw-alias-turn-trigger-bg-hover': alpha(ink, 0.08),

    '--dsw-alias-scrollbar-bg-l1': alpha(ink, 0.16),
    '--dsw-alias-scrollbar-bg-l2': alpha(ink, 0.22),
    '--dsw-alias-scrollbar-hover-l1': alpha(ink, 0.26),
    '--dsw-alias-scrollbar-hover-l2': alpha(ink, 0.34),

    '--dsw-alias-code-diff-added': alpha(ok, dark ? 0.16 : 0.12),
    '--dsw-alias-code-diff-deleted': alpha(error, dark ? 0.14 : 0.1),
    '--dsw-alias-file-diff-added-bg': alpha(ok, dark ? 0.18 : 0.12),
    '--dsw-alias-file-diff-added-gutter': alpha(ok, dark ? 0.1 : 0.07),
    '--dsw-alias-file-diff-added-marker': ok,
    '--dsw-alias-file-diff-deleted-bg': alpha(error, dark ? 0.16 : 0.1),
    '--dsw-alias-file-diff-deleted-gutter': alpha(error, dark ? 0.09 : 0.06),
    '--dsw-alias-file-diff-deleted-marker': error,

    '--dsw-alias-switch-thumb': dark ? mix(plate, '#ffffff', 0.55) : '#ffffff',
    '--dsw-alias-toast-bg': primary,
    '--dsw-alias-toast-label': bg,
    '--dsw-alias-tooltip-bg': tooltipBg,
    '--dsw-alias-tooltip-key-bg': mix(tooltipBg, '#ffffff', 0.14),

    '--dsw-alias-settings-card-fill': layer2,
    '--dsw-alias-settings-card-stroke': stroke(0.12),
    '--dsw-alias-onboarding-accent': accentText,
    '--dsw-alias-onboarding-card-fill': layer2,
    '--dsw-alias-onboarding-checkbox-border': stroke(0.28),
    '--dsw-alias-onboarding-secondary-fill': layer3,

    '--dsw-alias-menu-group-header-fill': alpha(layer2, 0.94),
    '--dsw-menu-surface-fill': alpha(layer2, 0.94),

    '--dsw-specific-menu': alpha(layer2, 0.97),
    '--dsw-specific-selector': layer3,
    '--dsw-specific-sidebar-fill': subtle(0.025),
    '--dsw-specific-sidebar-nav-item-active': alpha(accentText, (dark ? 0.16 : 0.1) * tint),
    '--dsw-specific-sidebar-nav-item-hover': alpha(accentText, (dark ? 0.1 : 0.06) * tint),
    '--dsw-specific-sidebar-nav-item-active-accent': accentText,
    '--dsw-specific-input-major': layer2,
    '--dsw-specific-login-input': layer3,
    '--dsw-specific-bubble': mix(layer2, accentText, 0.04),
    '--dsw-specific-bubble-highlight': alpha(accentText, (dark ? 0.14 : 0.1) * tint),
    '--dsw-specific-tip': layer3,
  }

  // Wallpaper skins: the shell paints photographs on <body>, so the panels
  // above it turn into frosted plates. Alpha is kept high enough that measured
  // contrast survives the photograph underneath.
  if (options.glass === true) {
    const glass = {
      '--dsw-alias-bg-layer-1': 0.74,
      '--dsw-alias-bg-layer-2': 0.8,
      '--dsw-alias-bg-layer-3': 0.84,
      '--dsw-alias-bg-overlay': 0.86,
      '--dsw-alias-bg-module-platform': 0.82,
      '--dsw-alias-bg-multi-select': 0.88,
      '--dsw-alias-bg-document-preview': 0.9,
      '--dsw-alias-settings-card-fill': 0.82,
      '--dsw-alias-button-elevated-fill': 0.88,
      '--dsw-alias-button-floating-fill': 0.88,
      '--dsw-alias-markdown-code-block': 0.84,
      '--dsw-alias-markdown-code-block-banner': 0.78,
      '--dsw-alias-menu-group-header-fill': 0.9,
      '--dsw-menu-surface-fill': 0.94,
      '--dsw-specific-menu': 0.94,
      '--dsw-specific-selector': 0.88,
      '--dsw-specific-sidebar-fill': 0.34,
      '--dsw-specific-input-major': 0.84,
      '--dsw-specific-login-input': 0.78,
      '--dsw-specific-bubble': 0.78,
      '--dsw-specific-bubble-highlight': 0.84,
      '--dsw-specific-tip': 0.88,
    }
    for (const [name, value] of Object.entries(glass)) {
      const current = tokens[name]
      if (current !== undefined && !current.startsWith('rgba')) tokens[name] = alpha(current, value)
    }
  }

  // The list is the contract: never silently drop a token the shell reads.
  for (const name of TOKEN_NAMES) {
    if (!(name in tokens)) throw new Error(`deriveTokens: missing ${name}`)
  }
  for (const name of Object.keys(tokens)) {
    if (!TOKEN_NAMES.includes(name)) throw new Error(`deriveTokens: unknown token ${name}`)
  }
  return tokens
}

/** Derive both appearances of a skin. */
export function deriveSkin(skin) {
  return {
    light: deriveTokens(skin.light, { dark: false, signature: skin.signature, glass: skin.wallpaper !== undefined }),
    dark: deriveTokens(skin.dark, { dark: true, signature: skin.signature, glass: skin.wallpaper !== undefined }),
  }
}

/** The measured numbers printed by `pnpm verify` and the theme document. */
export function contrastReport(skin) {
  const rows = []
  for (const mode of ['light', 'dark']) {
    const palette = skin[mode]
    const tokens = deriveTokens(palette, {
      dark: mode === 'dark',
      signature: skin.signature,
      glass: skin.wallpaper !== undefined,
    })
    rows.push({
      mode,
      body: contrast(tokens['--dsw-alias-label-primary'], palette.bg),
      secondary: contrast(tokens['--dsw-alias-label-secondary'], palette.bg),
      accentText: contrast(tokens['--dsw-alias-state-business-primary'], palette.bg),
      buttonLabel: contrast(
        tokens['--dsw-alias-label-primary-foreground'],
        tokens['--dsw-alias-button-primary-fill'],
      ),
      border: contrast(flatten(tokens['--dsw-alias-border-l3'], palette.bg), palette.bg),
    })
  }
  return rows
}
