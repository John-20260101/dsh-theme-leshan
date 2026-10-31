/**
 * The three Leshan skins and their two appearances.
 *
 * A skin is *six numbers per appearance* — paper, plate, ink, muted ink,
 * accent and the two state colours — and the engine derives the remaining
 * ~110 shell tokens from them. Keeping the input this small is what makes the
 * pack swappable: a new photograph is a new row here, not a new stylesheet.
 *
 * Every skin in this pack carries a `wallpaper`: the photograph the shell
 * paints under its frosted panels. `accent2` is not a shell token; it only
 * feeds the rail swatch and the promo art.
 */

/** @typedef {{ bg: string, plate: string, ink: string, muted: string, accent: string, onAccent: string, danger: string, success: string, warn: string, accent2: string }} Palette */

/** @type {ReadonlyArray<object>} */
export const SKINS = [
  {
    id: 'sanjiang',
    name: { zh: '三江夜', en: 'River Night' },
    material: { zh: '岷江 · 青衣江 · 大渡河', en: 'Three rivers at blue hour' },
    story: {
      zh: '江面把城市的灯揉成一条条暖线，山影是冷的。暖色只留给按钮和状态灯。',
      en: 'City lights smeared into warm lines on the water; the hills stay cold. Warmth is reserved for buttons and state.',
    },
    swatch: ['#C97A50', '#3E6A55', '#08131C'],
    signature: 'wallpaper',
    wallpaper: {
      file: 'leshan-sanjiang-1448x1086.jpg',
      width: 1448,
      height: 1086,
      focus: 'center 55%',
      alt: { zh: '乐山三江夜色（用户提供照片）', en: 'Leshan rivers at night (user-provided photograph)' },
    },
    light: {
      bg: '#F4F6F5', plate: '#FFFFFF', ink: '#14201F', muted: '#566663',
      accent: '#A9552F', onAccent: '#FFF7F2', danger: '#A93C2C',
      success: '#3F7A55', warn: '#96701B', accent2: '#3E6A55',
    },
    dark: {
      bg: '#08131C', plate: '#0F1D27', ink: '#E4EEF2', muted: '#9CB0B8',
      accent: '#C97A50', onAccent: '#1A0E08', danger: '#E07A67',
      success: '#6BBF95', warn: '#DFAF5F', accent2: '#3E6A55',
    },
  },
  {
    id: 'lingyun',
    name: { zh: '凌云晚照', en: 'Lingyun Dusk' },
    material: { zh: '崖壁 · 晚钟', en: 'Cliff face at the evening bell' },
    story: {
      zh: '砂岩吸走最后一点日光，只剩金褐色的边。全套里唯一以暖色为主调的深色皮肤。',
      en: 'Sandstone holds the last daylight as a gold-brown edge — the only warm-led dark skin in the pack.',
    },
    swatch: ['#D3A961', '#4A6E9E', '#0A1220'],
    signature: 'wallpaper',
    wallpaper: {
      file: 'leshan-lingyun-1536x1024.jpg',
      width: 1536,
      height: 1024,
      focus: 'center 45%',
      alt: { zh: '乐山凌云山晚照（用户提供照片）', en: 'Lingyun hill at dusk (user-provided photograph)' },
    },
    light: {
      bg: '#F7F2E8', plate: '#FFFDF8', ink: '#201A14', muted: '#6B5C4A',
      accent: '#8A6320', onAccent: '#FFF9EE', danger: '#A83A2A',
      success: '#4F7A46', warn: '#96701B', accent2: '#C9A25C',
    },
    dark: {
      bg: '#0A1220', plate: '#111C2B', ink: '#ECF1F8', muted: '#A3B1C2',
      accent: '#D3A961', onAccent: '#171006', danger: '#E88A74',
      success: '#79C39C', warn: '#E0B05E', accent2: '#C9A25C',
    },
  },
  {
    id: 'emei',
    name: { zh: '峨眉夜雾', en: 'Emei Mist' },
    material: { zh: '冷雾 · 月色', en: 'Cold mist and moonlight' },
    story: {
      zh: '整夜都是蓝的：雾把山脊擦掉，只留下很低的对比和一条月色边线。',
      en: 'Blue all night: mist erases the ridge, leaving very low contrast and a thin moonlit edge.',
    },
    swatch: ['#7FB2E8', '#4C6A8C', '#081320'],
    signature: 'wallpaper',
    wallpaper: {
      file: 'leshan-emei-1536x1024.jpg',
      width: 1536,
      height: 1024,
      focus: 'center 60%',
      alt: { zh: '峨眉山夜雾（用户提供照片）', en: 'Emei mist at night (user-provided photograph)' },
    },
    light: {
      bg: '#F1F5FA', plate: '#FFFFFF', ink: '#0E1A26', muted: '#4C6072',
      accent: '#25618F', onAccent: '#F4FAFF', danger: '#B23B32',
      success: '#2F7A55', warn: '#8F6C14', accent2: '#7FA6C9',
    },
    dark: {
      bg: '#081320', plate: '#0F1D2C', ink: '#E2EDF7', muted: '#98AEC2',
      accent: '#7FB2E8', onAccent: '#06121E', danger: '#EF8075',
      success: '#5FC49C', warn: '#E4B25F', accent2: '#4C6A8C',
    },
  },
]

/** Look a skin up by id. */
export function getSkin(id) {
  return SKINS.find((skin) => skin.id === id) ?? SKINS[0]
}


/** First-run skin: the river night, the widest of the three photographs. */
export const DEFAULT_SKIN = 'sanjiang'
