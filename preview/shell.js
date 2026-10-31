/* Applies one Leshan palette to the static preview, from ?skin=&mode=. */
(function () {
  const query = new URLSearchParams(location.search)
  const data = window.__LESHAN_DATA__
  if (!data) return

  const id = query.get('skin') || 'sanjiang'
  const mode = query.get('mode') === 'dark' ? 'dark' : 'light'
  const skin = data.skins.find((item) => item.id === id) || data.skins[0]
  const entry = data.palette[skin.id]
  const tokens = entry[mode]

  const root = document.documentElement
  for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value)
  root.style.setProperty('--leshan-a', skin[mode].accent)
  root.style.setProperty('--leshan-b', skin[mode].accent2)
  root.dataset.skin = skin.id
  root.dataset.mode = mode
  if (skin.wallpaper) {
    document.body.style.backgroundImage = `url(../assets/wallpapers/${skin.wallpaper.file})`
    document.body.style.backgroundPosition = skin.wallpaper.focus || 'center'
    const scrim = (a) => {
      const hex = skin[mode].bg
      const n = parseInt(hex.slice(1), 16)
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
    }
    root.style.setProperty('--leshan-scrim-1', scrim(mode === 'dark' ? 0.8 : 0.92))
    root.style.setProperty('--leshan-scrim-2', scrim(mode === 'dark' ? 0.88 : 0.95))
  }
  if (mode === 'dark') document.body.setAttribute('data-ds-dark-theme', '')

  const set = (selector, text) => {
    const node = document.querySelector(selector)
    if (node) node.textContent = text
  }
  const modeLabel = mode === 'dark' ? '深色' : '浅色'
  set('#foot-name', skin.name.zh)
  set('#foot-mode', skin.wallpaper ? `${modeLabel} · 照片` : modeLabel)
  set('#top-mode', modeLabel)
  set('#body-skin', skin.name.zh)

  const note = document.querySelector('#tool-note')
  if (note) note.textContent = `${data.skins.length} skins × 2 modes, all floors met`

  const tbody = document.querySelector('#palette-rows')
  if (tbody) {
    tbody.innerHTML = data.skins.map((item) => {
      const light = data.palette[item.id].contrast.find((c) => c.mode === 'light')
      const dark = data.palette[item.id].contrast.find((c) => c.mode === 'dark')
      return `<tr><td><b>${item.name.zh}</b> ${item.name.en}</td><td><code class="inline">${item.light.accent}</code></td><td>${light.body.toFixed(1)}</td><td>${dark.body.toFixed(1)}</td></tr>`
    }).join('')
  }

  const row = entry.contrast.find((item) => item.mode === mode) || { body: 0, buttonLabel: 0 }
  if (skin.wallpaper) {
    const lead = document.querySelector('#lead')
    if (lead) {
      lead.innerHTML = `乐山这组直接用照片做底：<b>${skin.name.zh}</b> 用 <code class="inline">${skin.wallpaper.file}</code> 铺满窗口，罩层按外观取 0.74（深）／0.86（浅），面板转成半透明磨砂，正文对比度仍有 <b>${row.body.toFixed(1)}</b>:1。`
    }
    const block = document.querySelector('#code-block')
    if (block) {
      block.innerHTML = `<span class="c">// 照片皮肤只多一个 wallpaper 字段</span>
<span class="k">wallpaper</span>: {
  file: <span class="s">'${skin.wallpaper.file}'</span>,
  focus: <span class="s">'${skin.wallpaper.focus}'</span>,
  scrim: { light: <span class="n">0.86</span>, dark: <span class="n">0.74</span> },
}`
    }
  }

  set('#body-contrast', row.body.toFixed(1))
  set('#body-button', row.buttonLabel.toFixed(1))

  const swatch = document.querySelector('#foot-swatch')
  if (swatch) swatch.style.background = `linear-gradient(140deg, ${skin[mode].accent}, ${skin[mode].accent2})`

  const codeLabel = document.querySelector('.code-head')
  if (codeLabel) codeLabel.firstChild.textContent = 'src/skins.mjs'
  const code = document.querySelector('.code pre')
  if (code) {
    const p = skin[mode]
    code.innerHTML = code.innerHTML.replace(/(<span class="k">)light(<\/span>)/, `$1${mode === 'dark' ? 'dark' : 'light'}$2`)
    code.innerHTML = code.innerHTML
      .replace(/#F4F6F5/g, p.bg)
      .replace(/#FFFFFF/g, p.plate)
      .replace(/#14201F/g, p.ink)
      .replace(/#566663/g, p.muted)
      .replace(/#A9552F/g, p.accent)
      .replace(/#FFF7F2/g, p.onAccent)
  }

  const diffValues = document.querySelectorAll('.diff .line span:nth-child(2)')
  if (diffValues.length >= 4) {
    const p = skin[mode]
    diffValues[1].textContent = `accent: '${p.accent}',`
    diffValues[2].textContent = `onAccent: '${p.onAccent}',`
    diffValues[3].textContent = `accent2: '${p.accent2}',`
  }

  document.title = `Leshan · ${skin.name.zh} ${skin.name.en} · ${modeLabel}`
  window.__PREVIEW_READY__ = true
})()
