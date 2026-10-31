/* Photo-led key art for the Leshan skins: ?skin=<id>. */
(function () {
  const data = window.__LESHAN_DATA__
  const id = new URLSearchParams(location.search).get('skin') || 'sanjiang'
  const skin = data.skins.find((item) => item.id === id) || data.skins[0]
  const all = data.skins
  const index = all.findIndex((item) => item.id === skin.id)
  const p = skin.light
  const d = skin.dark

  document.body.style.backgroundImage = `url(../assets/wallpapers/${encodeURIComponent(skin.wallpaper.file)})`
  document.body.style.backgroundPosition = skin.wallpaper.focus || 'center'
  document.documentElement.style.setProperty('--accent', d.accent)

  const text = (selector, value) => {
    const node = document.querySelector(selector)
    if (node) node.textContent = value
  }
  text('#zh', skin.name.zh)
  text('#en', skin.name.en)
  text('#material', `${skin.material.zh} — ${skin.material.en}`)
  text('#index', `${String(index + 1).padStart(2, '0')} / 03`)
  text('#file', `${skin.wallpaper.file} · cover`)

  const rows = data.palette[skin.id].contrast
  const light = rows.find((row) => row.mode === 'light')
  const dark = rows.find((row) => row.mode === 'dark')
  text('#contrast', `${light.body.toFixed(1)} / ${dark.body.toFixed(1)}`)

  const swatches = [['accent', d.accent], ['light', p.accent], ['accent2', d.accent2], ['ink', d.ink]]
  document.querySelector('#swatches').innerHTML = swatches.map(([name, color]) => `
    <div class="sw">
      <i style="background:${color}"></i>
      <span>${name} ${color.toUpperCase()}</span>
    </div>`).join('')

  window.__PREVIEW_READY__ = true
})()
