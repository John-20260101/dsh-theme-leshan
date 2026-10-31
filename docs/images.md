# Image sizes / 图片尺寸规范

Every image in this repository is generated, not hand-exported: `npm run shots` renders the static preview pages at the sizes below and writes them into `assets/`. That is why the table is a contract — a size changed in `scripts/shots.mjs` without changing this document is a bug.

仓库里所有图片都是生成的：`npm run shots` 按下列尺寸渲染静态预览页并写入 `assets/`。所以这张表就是契约——改了 `scripts/shots.mjs` 却没改这里，就是 bug。

---

## 1. Shipped sizes

| # | Asset | Pixels | Ratio | Format | Purpose | Referenced by |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `assets/icon-1024.png` | 1024×1024 | 1:1 | PNG (alpha) | master icon, source for the smaller cuts | this doc |
| 2 | `assets/icon-512.png` | 512×512 | 1:1 | PNG (alpha) | storefront / plugin-manager tile | this doc |
| 3 | `assets/icon-180.png` | 180×180 | 1:1 | PNG (alpha) | small tile, list rows | this doc |
| 4 | `assets/screenshots/00-leshan-2400x1350.jpg` | 2400×1350 | 16:9 | JPEG | triptych banner, README banner, social preview | README, `screenshots.json` |
| 5 | `assets/screenshots/01…06-<skin>-<mode>-1600x1000.jpg` | 1600×1000 | 16:10 | JPEG | one storefront screenshot per photograph per appearance | `screenshots.json` (all) |
| 6 | `assets/keyart/<skin>-1536x1024.jpg` | 1536×1024 | 3:2 | JPEG | key art per photograph, photo-led | `docs/themes.md` |
| 7 | `assets/wallpapers/leshan-<id>-<w>x<h>.jpg` | native 1448×1086 / 1536×1024 | 4:3-ish | JPEG | the photographs the three skins paint, served at native size and cover-cropped by the shell | runtime, docs |

`screenshots.json` lists seven images — the banner plus three photographs in both appearances, in reading order (sanjiang light/dark, lingyun light/dark, emei light/dark).

## 2. Why these numbers

- **Icon, 1024 master.** Marketplaces draw the tile at roughly 96 px. Exporting from a 1024 master keeps the geometry clean at any scale and lets the same file serve a 512 tile and a 180 list row without resampling twice.
- **1600×1000, not 1920×1080.** DSH is a three-column desktop shell; 16:10 at 1600 wide is the smallest canvas where the sidebar, transcript and right panel all read without shrinking type below 11 px. It also halves cleanly to 800×500 in a detail modal.
- **2400×1350 for the banner.** 16:9 so it can be reused as a GitHub social preview without letterboxing; 2400 wide because the triptych carries three panels and the type has to survive being shown at ~900 px in a README.
- **1536×1024 for key art.** 3:2 prints and crops well, and matches the size the poster layout was composed for; downscaling to 1152×768 still keeps the microtype legible.
- **JPEG for renders, PNG for icons.** Renders ship as JPEG: quality 86 with 4:4:4 chroma for the UI shots (text stays crisp, hairlines do not smear), quality 84 4:2:0 for key art. The whole render set fell from ~14 MB of PNG to ~1.3 MB without a visible difference at 100%. Icons stay PNG — flat geometry, and they need the alpha.
- **Wallpapers at quality 80.** ~740 KB of JPEG for the three photographs; they are viewed under a scrim, so the last few percent of quality is invisible while the bytes are not.
- **Wallpapers are not re-rendered.** They are the supplied files, kept at native resolution; the filename carries their real pixel size so the asset test can verify them like any other image.

## 3. Display guidance

| Surface | Renders at | File to use |
| --- | --- | --- |
| dsh-market / plugin tile | ~96 px square | `icon-512.png` (never the 180) |
| Plugin detail screenshots | up to ~1200 px wide | the 1600×1000 shots |
| README banner | ~900 px wide | `00-leshan-2400x1350.jpg` |
| Docs inline figure | 640–760 px wide | key art, or the 1600 shot scaled by CSS |
| Social preview | 1200×630 crop | the banner, centre-cropped to 1.9:1 |

The 180 px icon exists for list rows and README badges; it is a downscale of the 1024 master, not a separately drawn mark.

## 4. Regenerating

```sh
npm run build      # palettes first: images are painted from derived tokens
npm run shots      # renders UI shots (dsf 2, saved at CSS size), key art, icon
```

- UI screenshots are captured with `deviceScaleFactor: 2` and saved with `scale: 'css'`, so the file is exactly 1600×1000 while the type was laid out with 2× rasterisation.
- Every render runs a geometry gate: if any element overflows the fixed canvas, the script prints the page and the offending nodes, so a 2400×1350 banner cannot silently start clipping its footer.
- The icon is rendered once at 1024 with a transparent background, then `scripts/compress.py` cuts 512 / 180 with LANCZOS and palette-quantises all three.
- `scripts/compress.py` also re-encodes the renders (screenshots q86 4:4:4, key art q84 4:2:0) and re-derives the wallpapers from the PNG masters in the package root.

## 5. Checklist before shipping an image change

1. `npm run verify` passes (the images must match a valid palette).
2. The file name still carries its pixel size — a mismatch between name and file is a documentation bug.
3. `screenshots.json` still lists exactly the UI shots, in reading order, and no key art.
4. The README and this table agree with the file listing:

```sh
ls assets/screenshots assets/keyart assets/wallpapers assets/*.png
```
