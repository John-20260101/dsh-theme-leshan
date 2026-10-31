/* Leshan triptych: three photo skins, one panel each. */
(function () {
  const data = window.__LESHAN_DATA__
  const host = document.querySelector('#panels')
  if (!data || !host) return

  const skins = data.skins
  const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

  host.innerHTML = skins.map((skin) => {
    const p = skin.dark
    const rows = data.palette[skin.id].contrast
    const light = rows.find((row) => row.mode === 'light')
    const dark = rows.find((row) => row.mode === 'dark')
    const dots = [skin.light.accent, skin.dark.accent, skin.light.accent2, p.bg, skin.light.bg, skin.dark.plate]
      .map((color) => `<i style="background:${esc(color)}"></i>`).join('')
    return `
      <article class="panel" style="background-image:url(../assets/wallpapers/${encodeURIComponent(skin.wallpaper.file)})">
        <div class="top"><i></i><span>${esc(skin.wallpaper.width)} × ${esc(skin.wallpaper.height)} · jpg</span></div>
        <div class="body">
          <h2>${esc(skin.name.zh)}</h2>
          <p class="en">${esc(skin.name.en)}</p>
          <p>${esc(skin.story.zh)}</p>
          <div class="dots">${dots}</div>
          <div class="stat"><span>body <b>${light.body.toFixed(1)}</b>:1 / <b>${dark.body.toFixed(1)}</b>:1</span><span>light · dark</span></div>
        </div>
      </article>`
  }).join('')

  window.__PREVIEW_READY__ = true
})()
