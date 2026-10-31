# Leshan theme document / 主题文档

> A pack of three photograph skins for the DeepSeek Harness Web GUI — 三江夜 River Night, 凌云晚照 Lingyun Dusk, 峨眉夜雾 Emei Mist.
> 三套乐山照片皮肤的设计说明：设计原则、token 推导规则、照片皮肤的色彩与磨砂策略、扩展方式。
>
> Companion references: [palettes.md](./palettes.md) (every hex and every measured ratio) · [images.md](./images.md) (every image size) · [../README.md](../README.md) (install).

---

## 1. Why photographs, and why derived

A photo skin is easy to start and hard to finish: drop an image behind the window and every panel, menu, diff gutter and toast has to keep working on top of it. The usual shortcut — repaint a handful of tokens — leaves the rest of the shell stock, so a menu or a warning label floats in the wrong climate.

Leshan is built the other way round. A skin is **six colour inputs per appearance** — page, plate, ink, muted ink, accent, and the ink that sits on the accent — plus two state hues and one photograph. Everything the shell reads is derived from those by role. That gives three properties worth stating plainly:

1. **Completeness is checkable.** The 119 `--dsw-*` alias tokens are a checked contract (`src/tokens.mjs`); the build fails if a derivation misses one or invents one.
2. **Semantics survive the photograph.** `state-error-*` is always the error hue, `bg-mask-*` always darkens, `label-caption` is always quieter than `label-secondary`. Changing photograph changes the light, not the grammar.
3. **Contrast is measured, not judged by eye.** `npm run verify` recomputes WCAG ratios for every skin and appearance and fails below the advertised floors.

The visible result: the skin can be described in one sentence (“warm lantern light smeared across a cold river”), and that sentence still holds on the settings page, in a diff, in a toast and in the composer.

---

## 2. Design principles

**The photograph is the material.** Each skin starts from what the picture is made of — water light, sandstone, mist — and derives its page, plate and accent from that material rather than from a hue that happens to be trending. 三江夜 is warm-led, 凌云晚照 gold-led, 峨眉夜雾 cold-led; all three are complete.

**One temperature per skin.** A skin does not mix a warm page with a cool accent without a reason. Where two hues appear (the rivers' terracotta and hill green, the cliff's gold and navy), the second hue is confined to the rail swatch and the key art — never to a semantic token.

**Quiet chrome, loud content.** Surfaces stay within a narrow band around the page colour; accents are reserved for interaction and state. This is why the skins differ dramatically in feel while looking calm in a screenshot.

**Nothing irreversible.** Every effect is plugin-owned and disposed on unload: token layer, wallpaper sheet, rail. Turning Leshan off returns the stock UI without a reload.

---

## 3. The input roles

| Input | Role | Used for |
| --- | --- | --- |
| `bg` | page paper | `bg-base`, `bg-layer-1`, mask composites |
| `plate` | raised plate | `bg-layer-2`, cards, menus, composer |
| `ink` | primary ink | body text, hairlines (as alpha), brand |
| `muted` | secondary ink | captions, metadata, placeholders |
| `accent` | pigment | primary buttons, links, active nav, focus ring |
| `onAccent` | ink on pigment | button labels, `label-primary-foreground` |
| `danger` / `success` / `warn` | states | error, success, warning triads |
| `accent2` | atmosphere only | rail swatch, key art |
| `wallpaper` | the photograph | `<body>` + conversation canvas paint, key art, rail chip |

`accent2` is deliberately *not* a shell token: a second hue must never leak into a semantic slot.

### Derivation families

| Family | Rule |
| --- | --- |
| Layers | `layer-2 = plate`; `layer-3` and `overlay` step 2.8% (light) / 5.5% (dark) toward white or black |
| Hairlines | `alpha(ink, 0.07 … 0.24)`, ×1.2 in dark |
| Text | `primary` = ink hardened to ≥7:1; `secondary` ≥4.5:1; `tertiary` ≥3:1; `caption` ≥3:1; `dimmed` stays decorative |
| Accent | hue hardened to ≥3:1 as a fill and ≥4.5:1 as text; hover steps 7–8% away from the page |
| Masks | black at 0.32 / 0.14 / 0.30 in light, 0.55 / 0.24 / 0.70 in dark |
| State tints | `tertiary` = state hue at 11–18% alpha, never a new hue |
| Code / markdown | page mixed 3–10% toward ink, so code blocks read as paper, not as a second theme |
| Diff | added/deleted = success/error at low alpha, markers at full strength |

The full derivation is `src/derive.mjs`; the resulting tables are [palettes.md](./palettes.md).

### Contrast policy

| Role | Floor | Basis |
| --- | --- | --- |
| Body text (`label-primary`) | 7.0:1 | WCAG AAA, long reading |
| Secondary text | 4.5:1 | WCAG AA |
| Accent as text (`state-business-primary`, `link`) | 4.5:1 | links and active nav must not rely on hue alone |
| Accent as fill vs page | 3.0:1 | non-text contrast for controls |
| Button label on fill | 4.5:1 | AA for the most-used control |
| Caption / metadata | 3.0:1 | small type stays legible without shouting |

Measured values for all six palettes are in [palettes.md](./palettes.md). The gate that produced them is `scripts/verify.mjs`, also run by CI.

### Photo skins: frosted plates

A skin adds one field to the same six inputs:

```js
wallpaper: { file: 'leshan-sanjiang-1448x1086.jpg', focus: 'center 55%', width: 1448, height: 1086 }
```

Three things change, and only three:

1. **Surface tokens carry alpha.** Layers, inputs, menus, bubbles and code blocks are emitted as `rgba()` at 0.78–0.94 instead of opaque, so the photograph is visible through every panel. The page (`bg-base`) stays opaque; the photograph lives on `<body>` under the scrim, and a second copy paints the conversation column (`[data-conversation-region="chat"]`) because the shell's conversation root otherwise covers the reading surface with an opaque page-colour plate.
2. **The scrim is appearance-keyed.** Light uses 0.86 → 0.90 over the page colour, dark 0.74 → 0.82. Light mode deliberately reads as a milky haze; the photo is texture, not the subject. Dark mode lets the photograph lead.
3. **Photographs are served, not embedded.** The host half exposes `/dsh-theme-leshan/wallpapers/<file>` as an exact-file whitelist (GET/HEAD, strong ETag, immutable cache, 304). Without `webServer` the route is absent and the browser half falls back to the wash — no broken image, no layout shift.

Because the scrim composites to very nearly the palette's own page colour, the contrast numbers computed against `bg` remain representative; the gate still runs on the palette, and the screenshots verify the real composite. On the conversation canvas the same holds: measured against the brightest 0.1% of photo pixels under the scrim, body text stays at 15.2–16.0:1 (light) and 7.3–7.9:1 (dark), so the chat column keeps the skin's reading contract.

---

## 4. The three photographs

Three photographs of 乐山, each carrying its own palette. They share a structure — photograph on `<body>` and on the conversation canvas, translucent plates above it, one warm or cool accent — but not a mood: one is warm-led, one gold-led, one cold-led.

The photographs are used at native resolution (1448×1086 and 1536×1024) and cover-cropped by the shell, so the pack ships three JPEGs rather than a wall of re-encoded sizes.

### 三江夜 · River Night
*岷江 · 青衣江 · 大渡河 / Three rivers at blue hour*

![River Night key art](../assets/keyart/sanjiang-1536x1024.jpg)

Warm lantern light smeared across a cold river. The accent is the lantern's terracotta, the second hue is the hill green; everything else is blue-hour navy. This is the warmest of the three and the one that reads best as a full-bleed image.

Contrast 15.4:1 / 15.9:1. Preview: [light](../assets/screenshots/01-sanjiang-light-1600x1000.jpg) · [dark](../assets/screenshots/02-sanjiang-dark-1600x1000.jpg).

### 凌云晚照 · Lingyun Dusk
*崖壁 · 晚钟 / Cliff face at the evening bell*

![Lingyun Dusk key art](../assets/keyart/lingyun-1536x1024.jpg)

Sandstone holding the last of the daylight: gold-brown accent on navy. In light mode the page turns to a warm paper so the photograph does not fight it; in dark mode the gold is the only warm thing on screen.

Contrast 15.4:1 / 16.5:1. Preview: [light](../assets/screenshots/03-lingyun-light-1600x1000.jpg) · [dark](../assets/screenshots/04-lingyun-dark-1600x1000.jpg).

### 峨眉夜雾 · Emei Mist
*冷雾 · 月色 / Cold mist and moonlight*

![Emei Mist key art](../assets/keyart/emei-1536x1024.jpg)

Blue all night: the mist erases the ridge, the palette keeps a very low temperature and a thin moonlit accent. The coolest of the three, and the softest in contrast.

Contrast 16.1:1 / 15.7:1. Preview: [light](../assets/screenshots/05-emei-light-1600x1000.jpg) · [dark](../assets/screenshots/06-emei-dark-1600x1000.jpg).

## 5. Appearance behaviour

- Leshan ships both palettes in one token layer (`{ light, dark }` per token) and lets the shell decide. It never calls `setTheme`.
- The rail swatch and scrim read the *active* appearance through `html[data-dsh-leshan-mode]` and the shell's `body[data-ds-dark-theme]` attribute, so the atmosphere follows your Appearance setting without a reload.
- Switching skins is instantaneous: the previous override is disposed and the new layer is registered in the same tick.
- The scrim re-keys on the same appearance change, so switching light/dark moves the photograph from "haze" to "subject" without a reload.

## 6. Adding a skin

```js
// src/skins.mjs
{
  id: 'basalt',
  name: { zh: '玄武岩', en: 'Basalt' },
  material: { zh: '玄武岩 · 火山灰', en: 'Basalt and ash' },
  story: { zh: '……', en: '…' },
  swatch: ['#3A3F41', '#8B9497', '#F2F2F0'],
  signature: 'wallpaper',
  wallpaper: { file: 'leshan-basalt-1536x1024.jpg', focus: 'center 50%', width: 1536, height: 1024 },
  light: { bg, plate, ink, muted, accent, onAccent, danger, success, warn, accent2 },
  dark:  { … },
}
```

Then add the JPEG to `assets/wallpapers/` and its file name to the whitelist in `index.js`, and run:

```sh
npm run verify   # token completeness + contrast gate
npm run shots    # re-render the preview, key art and icon at the documented sizes
```

The gate reports the measured ratios; if a floor fails it names the skin and the role, so the fix is a colour change rather than a guessing game.

## 7. Known limits

- The engine derives from six roles; it cannot express a skin that needs two *semantic* accents (for example a product that wants blue for links and violet for selection). That is a deliberate constraint.
- `color-mix()` is required for the selection and focus rules. On an older browser those drop out and the token layer still applies.
- The rail is a floating control. It is hidden by default only after you ask it to be; there is no settings-page surface yet.
- Preview screenshots are rendered from a static reconstruction of the shell ([`preview/`](../preview)), not captured from a live window; they are accurate for colour and layout grammar, not pixel-identical to your build.
- Photo skins depend on the host serving `assets/wallpapers`; a host without `webServer` gets the wash-only version. The photographs are cover-cropped, so a very wide window shows less of the frame than the key art does.
- Light appearance keeps the photograph faint on purpose. If a photo skin should lead in daylight, that needs a per-skin scrim override, not a global change.
