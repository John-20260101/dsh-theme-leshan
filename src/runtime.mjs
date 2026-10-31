/**
 * Browser half of dsh-theme-leshan.
 *
 * Two responsibilities, both reversible:
 *   1. swap the active skin's alias-token layer through `ctx.theme.overrideTokens`,
 *      or — on a shell without the theme service — through a scoped stylesheet;
 *   2. own the skin rail: a small, keyboard-reachable panel that lists the three
 *      photographs, remembers the choice in localStorage and disappears cleanly
 *      when the plugin is unloaded.
 *
 * No host state is written: selection is a browser-local preference, like the
 * shell's own font choice.
 */

const SOURCE = 'dsh-theme-leshan'
const STYLE_ID = 'dsh-theme-leshan/styles'
const KEY_SKIN = 'dsh.theme-leshan.skin'
const KEY_RAIL = 'dsh.theme-leshan.rail'

const read = (key) => {
  try {
    return window.localStorage.getItem(key)
  } catch (error) {
    return null
  }
}

const write = (key, value) => {
  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    /* private mode: the session still works, it just will not be remembered */
  }
}

/**
 * Wallpaper rules. This pack has no abstract material skins: every skin is a
 * photograph, painted on the shell's own body under a scrim whose alpha comes
 * from the active appearance, so the panels can stay frosted.
 *
 * The conversation column is a second seat for the same photograph. The shell
 * paints that column with an opaque `--dsw-alias-bg-base` plate (its conversation
 * root), which hides the body painting; the reading surface therefore gets its
 * own copy of the layer. Both use the same focus, the same `fixed` attachment
 * and the same scrim, so the two paintings line up pixel for pixel across the
 * column edge instead of looking like a second, brighter image.
 */
const SIGNATURE_CSS = `
html[data-dsh-leshan-wallpaper] body,
html[data-dsh-leshan-wallpaper] [data-conversation-region="chat"] {
  /* The skin owns the page painting while a photo skin is active: the shell's
     own backgrounds must not win by load order. */
  background-image:
    linear-gradient(180deg, var(--leshan-scrim-1) 0%, var(--leshan-scrim-2) 100%),
    var(--leshan-wallpaper) !important;
  background-size: cover, cover !important;
  background-position: center center, var(--leshan-focus, center 50%) !important;
  background-attachment: fixed, fixed !important;
  background-repeat: no-repeat, no-repeat !important;
}
html[data-dsh-leshan] ::selection {
  background: var(--dsw-alias-bg-document-selection);
}
html[data-dsh-leshan] :focus-visible {
  outline-color: var(--dsw-alias-state-business-primary);
}
`

/** Scoped fallback used only when the shell exposes no theme service. */
const fallbackCss = (light, dark) => {
  const block = (selector, table) =>
    `${selector} {\n${Object.entries(table).map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}`
  return [
    block('html body:not([data-ds-dark-theme])', light),
    block('html body[data-ds-dark-theme]', dark),
  ].join('\n')
}

/** Build the rail inside a shadow root so no shell rule can reach it. */
function createRail(deps) {
  const host = document.createElement('div')
  host.id = 'dsh-theme-leshan-rail'
  host.setAttribute('data-dsh-leshan-rail', '')

  const root = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = `
    :host { all: initial; }
    .wrap {
      position: fixed; right: 18px; bottom: 18px; z-index: 2147483000;
      font: 500 12px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
        "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: var(--dsw-alias-label-primary, #1c1c1c);
      -webkit-font-smoothing: antialiased;
    }
    .pill {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 12px 8px 9px; border-radius: 999px; cursor: pointer;
      background: var(--dsw-specific-menu, rgba(255,255,255,.94));
      border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12));
      box-shadow: 0 8px 26px rgba(0,0,0,.16), 0 1px 0 rgba(255,255,255,.4) inset;
      backdrop-filter: blur(16px) saturate(1.2);
      color: inherit; font: inherit;
    }
    .pill:hover { border-color: var(--dsw-alias-border-l3, rgba(0,0,0,.2)); }
    .dot {
      width: 16px; height: 16px; border-radius: 6px; flex: 0 0 16px;
      box-shadow: 0 0 0 1px rgba(0,0,0,.12) inset;
    }
    .label { white-space: nowrap; letter-spacing: .01em; }
    .label b { font-weight: 600; }
    .caret { opacity: .55; font-size: 10px; }
    .panel {
      position: absolute; right: 0; bottom: 46px; width: 268px;
      padding: 12px; border-radius: 16px;
      background: var(--dsw-specific-menu, rgba(255,255,255,.96));
      border: 1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12));
      box-shadow: 0 22px 56px rgba(0,0,0,.22);
      backdrop-filter: blur(20px) saturate(1.25);
    }
    .panel[hidden] { display: none; }
    .head { display: flex; align-items: baseline; justify-content: space-between; margin: 2px 4px 10px; }
    .head strong { font-size: 12px; letter-spacing: .04em; text-transform: uppercase; opacity: .55; }
    .head span { font-size: 10.5px; opacity: .45; }
    .grid { display: grid; gap: 6px; }
    .group {
      padding: 8px 6px 3px; font-size: 9.5px; font-weight: 600;
      letter-spacing: .14em; text-transform: uppercase; opacity: .45;
    }
    .group:first-child { padding-top: 2px; }
    .skin {
      display: flex; align-items: center; gap: 9px; padding: 7px 8px;
      border-radius: 10px; cursor: pointer; text-align: left;
      background: transparent; border: 1px solid transparent; color: inherit; font: inherit;
    }
    .skin:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.05)); }
    .skin[aria-checked="true"] {
      background: var(--dsw-specific-sidebar-nav-item-active, rgba(0,0,0,.06));
      border-color: var(--dsw-alias-border-l2, rgba(0,0,0,.12));
    }
    .chip {
      width: 26px; height: 26px; border-radius: 8px; flex: 0 0 26px;
      box-shadow: 0 0 0 1px rgba(0,0,0,.14) inset;
    }
    .names { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .names b { font-weight: 600; font-size: 12px; }
    .names i { font-style: normal; font-size: 10.5px; opacity: .5; }
    .check { margin-left: auto; opacity: .7; font-size: 11px; }
    .foot {
      display: flex; align-items: center; justify-content: space-between;
      margin: 10px 4px 2px; padding-top: 9px;
      border-top: 1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.08));
      font-size: 10.5px; opacity: .55;
    }
    .foot button {
      font: inherit; color: inherit; background: none; border: 0; padding: 2px 0;
      cursor: pointer; text-decoration: underline; text-underline-offset: 2px; opacity: .9;
    }
    @media (prefers-reduced-motion: no-preference) {
      .panel { animation: leshan-in .16s ease-out; }
      @keyframes leshan-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
    }
  `
  root.append(style)

  const wrap = document.createElement('div')
  wrap.className = 'wrap'

  const pill = document.createElement('button')
  pill.className = 'pill'
  pill.type = 'button'
  pill.setAttribute('aria-haspopup', 'dialog')
  pill.setAttribute('aria-expanded', 'false')
  pill.title = 'Leshan 皮肤 · Alt+K 切换'
  const dot = document.createElement('span')
  dot.className = 'dot'
  const label = document.createElement('span')
  label.className = 'label'
  const caret = document.createElement('span')
  caret.className = 'caret'
  caret.textContent = '▾'
  pill.append(dot, label, caret)

  const panel = document.createElement('div')
  panel.className = 'panel'
  panel.hidden = true
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'Leshan 皮肤')

  const head = document.createElement('div')
  head.className = 'head'
  head.innerHTML = '<strong>Leshan</strong><span>3 幅照片 · 3 skins</span>'

  const grid = document.createElement('div')
  grid.className = 'grid'
  grid.setAttribute('role', 'radiogroup')
  grid.setAttribute('aria-label', '皮肤')

  const buttons = new Map()
  for (const skin of deps.skins) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'skin'
    button.setAttribute('role', 'radio')
    button.dataset.skin = skin.id

    const chip = document.createElement('span')
    chip.className = 'chip'
    chip.style.background = `linear-gradient(140deg, ${skin.light.accent}, ${skin.swatch[2]})`

    const names = document.createElement('span')
    names.className = 'names'
    const zh = document.createElement('b')
    zh.textContent = skin.name.zh
    const en = document.createElement('i')
    en.textContent = skin.name.en
    names.append(zh, en)

    const check = document.createElement('span')
    check.className = 'check'
    check.textContent = ''

    button.append(chip, names, check)
    button.addEventListener('click', () => deps.select(skin.id))
    grid.append(button)
    buttons.set(skin.id, { button, chip })
  }

  const foot = document.createElement('div')
  foot.className = 'foot'
  const hint = document.createElement('span')
  hint.textContent = 'Alt+K 轮换'
  const hide = document.createElement('button')
  hide.type = 'button'
  hide.textContent = '隐藏此钮'
  hide.addEventListener('click', () => deps.hideRail())
  foot.append(hint, hide)

  panel.append(head, grid, foot)
  wrap.append(panel, pill)
  root.append(wrap)

  const open = (value) => {
    panel.hidden = !value
    pill.setAttribute('aria-expanded', String(value))
  }
  pill.addEventListener('click', () => open(panel.hidden))

  const onPointerDown = (event) => {
    if (panel.hidden) return
    if (!event.composedPath().includes(host)) open(false)
  }
  document.addEventListener('pointerdown', onPointerDown, true)

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && !panel.hidden) open(false)
    if (event.altKey && (event.key === 'k' || event.key === 'K')) {
      event.preventDefault()
      deps.cycle()
    }
  }
  document.addEventListener('keydown', onKeyDown, true)

  const refresh = () => {
    const skin = deps.current()
    label.innerHTML = `<b>${skin.name.zh}</b> · ${skin.name.en}`
    dot.style.background = `linear-gradient(140deg, ${skin[deps.mode()].accent}, ${skin[deps.mode()].accent2})`
    for (const [id, { button, chip }] of buttons) {
      button.setAttribute('aria-checked', String(id === skin.id))
      const item = deps.skins.find((s) => s.id === id)
      const palette = item[deps.mode()]
      chip.style.background = `linear-gradient(140deg, ${palette.accent}, ${palette.bg})`
      button.querySelector('.check').textContent = id === skin.id ? '✓' : ''
    }
  }

  refresh()
  return {
    host,
    refresh,
    dispose() {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      host.remove()
    },
  }
}

/**
 * @param {object} ctx cordis client context
 * @param {{ skins: object[], getSkin: (id: string) => object, deriveSkin: (skin: object) => object, defaultSkin: string }} core
 */
export function applyLeshan(ctx, core) {
  const { skins, getSkin, deriveSkin, defaultSkin } = core

  const stored = read(KEY_SKIN)
  let activeId = skins.some((skin) => skin.id === stored) ? stored : defaultSkin
  let railHidden = read(KEY_RAIL) === 'hidden'

  const doc = document
  const html = doc.documentElement
  const current = () => getSkin(activeId)
  const isDark = () =>
    doc.body !== null && doc.body.hasAttribute('data-ds-dark-theme')
  const mode = () => (isDark() ? 'dark' : 'light')

  /** Token layer handed to the shell: every value is a { light, dark } pair. */
  const tokenLayer = () => {
    const skin = current()
    const both = deriveSkin(skin)
    return Object.fromEntries(
      Object.keys(both.light).map((name) => [name, { light: both.light[name], dark: both.dark[name] }]),
    )
  }

  let disposeTokens = () => {}
  // `ctx.get` reads a service without declaring it in `inject`. Reading
  // `ctx.theme` directly throws on shells whose cordis enforces strict
  // injection ("cannot get property \"theme\" without inject"), even inside a
  // `typeof` guard, and takes the whole plugin down with it. Plain stub
  // contexts (the preview renderer) have no `get`, so fall back to a guarded
  // direct read there.
  const discoverTheme = () => {
    if (!ctx) return undefined
    if (typeof ctx.get === 'function') return ctx.get('theme')
    try {
      return ctx.theme
    } catch (error) {
      return undefined
    }
  }
  const seeded = discoverTheme()
  let themeSvc = seeded && typeof seeded.overrideTokens === 'function' ? seeded : null
  const themeService = () => themeSvc

  const applyTokens = () => {
    disposeTokens()
    disposeTokens = () => {}
    const skin = current()
    const service = themeService()
    if (service !== null) {
      disposeTokens = service.overrideTokens(SOURCE, tokenLayer()) ?? (() => {})
      doc.getElementById('dsh-theme-leshan/fallback')?.remove()
      return
    }
    // No theme service: write the same tokens into a scoped sheet instead.
    const both = deriveSkin(skin)
    let tag = doc.getElementById('dsh-theme-leshan/fallback')
    if (tag === null) {
      tag = doc.createElement('style')
      tag.id = 'dsh-theme-leshan/fallback'
      doc.head.append(tag)
    }
    tag.textContent = fallbackCss(both.light, both.dark)
  }

  const paint = () => {
    const skin = current()
    // Cheap safety net for shells that register the service without an event we
    // can observe: upgrade on the next repaint rather than parking a fiber.
    if (themeSvc === null) {
      const late = discoverTheme()
      if (late && typeof late.overrideTokens === 'function') themeSvc = late
    }
    const palette = skin[mode()]
    html.setAttribute('data-dsh-leshan', skin.id)
    html.style.setProperty('--leshan-a', palette.accent)
    html.style.setProperty('--leshan-b', palette.accent2)
    html.setAttribute('data-dsh-leshan-mode', mode())
    if (skin.wallpaper !== undefined) {
      // The host route serves assets/wallpapers; alpha scrims keep text legible.
      html.setAttribute('data-dsh-leshan-wallpaper', '')
      html.style.setProperty('--leshan-wallpaper', `url('/dsh-theme-leshan/wallpapers/${skin.wallpaper.file}')`)
      html.style.setProperty('--leshan-focus', skin.wallpaper.focus ?? 'center 50%')
      html.style.setProperty('--leshan-scrim-1', alpha(palette.bg, mode() === 'dark' ? 0.74 : 0.86))
      html.style.setProperty('--leshan-scrim-2', alpha(palette.bg, mode() === 'dark' ? 0.82 : 0.9))
    } else {
      html.removeAttribute('data-dsh-leshan-wallpaper')
      html.style.removeProperty('--leshan-wallpaper')
      html.style.removeProperty('--leshan-focus')
      html.style.removeProperty('--leshan-scrim-1')
      html.style.removeProperty('--leshan-scrim-2')
    }
    applyTokens()
    rail?.refresh()
  }

  let rail = null

  const select = (id) => {
    if (!skins.some((skin) => skin.id === id)) return
    activeId = id
    write(KEY_SKIN, id)
    paint()
  }

  const cycle = () => {
    const index = skins.findIndex((skin) => skin.id === activeId)
    select(skins[(index + 1) % skins.length].id)
  }

  // The signature sheet is plugin-owned: removed with the fiber.
  ctx.effect(() => {
    const tag = doc.createElement('style')
    tag.id = STYLE_ID
    tag.textContent = SIGNATURE_CSS
    doc.head.append(tag)
    return () => tag.remove()
  }, 'leshan: wallpaper sheet')

  // Rail, mounted once the shell has a body; removed with the fiber.
  ctx.effect(() => {
    rail = createRail({
      skins,
      current,
      mode,
      select,
      cycle,
      hideRail: () => {
        railHidden = true
        write(KEY_RAIL, 'hidden')
        rail.host.hidden = true
      },
    })
    rail.host.hidden = railHidden
    doc.body.append(rail.host)
    return () => {
      rail.dispose()
      rail = null
    }
  }, 'leshan: photo rail')

  // Scheme flips change which accent feeds the wash, not which skin is active.
  const onScheme = () => paint()
  ctx.effect(() => {
    const observer = new MutationObserver(onScheme)
    observer.observe(doc.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
    return () => observer.disconnect()
  }, 'leshan: appearance observer')

  // The theme service may arrive after apply on shells that provide it late.
  // Never park a fiber for it: `ctx.inject(['theme'])` stays pending forever on
  // shells that never provide the service, and the shell's own `uiRenderer`
  // injection then never settles — the boot screen freezes on "Loading plugins…".
  // `paint()` re-reads the service on every repaint instead.

  paint()

  // Debug/automation handle: the preview renderer and the smoke test use it.
  try {
    window.__DSH_LESHAN__ = {
      skins: skins.map((skin) => ({ id: skin.id, name: skin.name })),
      apply: select,
      current: () => activeId,
    }
  } catch (error) {
    /* no window: nothing to expose */
  }
}
