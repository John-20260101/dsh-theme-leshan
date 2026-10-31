# Changelog

All notable changes to `dsh-theme-leshan`. This package is a Leshan-only fork of
`dsh-theme-atlas` 0.2.2: the token engine, tests and image pipeline are inherited,
the six abstract material skins are not.

## 0.1.2 — 2026-10-31

- **Public install paths.** The READMEs now lead with the prebuilt GitHub
  Release tarball and the `github:` source install, and keep the local folder
  as the development path. Version bump so the published tarball carries the
  same README the repository shows.

## 0.1.1 — 2026-10-31

- **The photograph reaches the conversation column.** The shell paints its
  conversation root with an opaque `--dsw-alias-bg-base` plate, so the body-level
  photograph stopped at the edge of the chat column. The wallpaper sheet now also
  paints `[data-conversation-region="chat"]` with the same image, focus, `fixed`
  attachment and scrim, so one continuous photograph runs from the sidebar into the
  reading surface. The scoped selector leaves the composer region and any other
  `data-conversation-region` seat untouched.
- Measured on the brightest 0.1% of photo pixels under the scrim, body text over
  the chat canvas holds 15.2–16.0:1 in light and 7.3–7.9:1 in dark.

## 0.1.0 — 2026-10-31

- **Renamed the pack.** Package, plugin row id (`theme-leshan`), host export
  (`themeLeshan`), browser module id, storage keys, DOM attributes and CSS variables
  all move from `atlas` to `leshan`. The wallpaper route is now
  `/dsh-theme-leshan/wallpapers/<file>`.
- **Focused on 乐山.** The six material studies (Ink Jade, Terracotta, Aurora, Abyss,
  Sakura Mist, Paper) are removed. The pack ships the three photograph skins and the
  rail lists them without series headings.
- **Wallpapers come from the supplied originals.** `assets/wallpapers/*.jpg` are derived
  from the three `gpt-image-*.png` masters in the package root: River Night and Emei
  Mist re-encoded from their originals, Lingyun Dusk from the new third render. The
  exact-file whitelist in `index.js` still serves only those three names.
- **New icon and render set.** The icon is redrawn as a night river mark (moon, cliff
  line, three river bands) and rendered with a transparent corner. Storefront renders
  are now the triptych banner plus each photograph in light and dark; key art is
  photo-led for all three skins.
- **Tests follow the pack.** The browser smoke test switches between two photographs,
  asserts the wallpaper URL changes with the skin, and keeps the strict-injection
  fallback case. The host route test keeps covering 200/304/HEAD/404/405.

## Inherited from dsh-theme-atlas

- Token engine: six inputs per appearance → 119 `--dsw-*` alias tokens, contrast-gated.
- Strict-injection safety: the theme service is read through `ctx.get`, never parked as
  a `ctx.inject(['theme'])` fiber, so a shell without the service still boots.
- Frosted plates for photo skins, appearance-keyed scrim, and the shadow-DOM skin rail.
