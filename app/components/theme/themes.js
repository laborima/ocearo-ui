/**
 * Ocearo themes — the single source of colour for the whole app.
 *
 * Each theme defines the same semantic tokens. The UI reads them through CSS
 * variables (applied on <html> by `applyThemeTokens`, consumed by the Tailwind
 * classes declared in globals.css); canvas drawings and the 3D scene read the
 * same values from JS through `useTheme()`. Changing a colour here changes it
 * everywhere.
 *
 * - day:   white HUD for bright sunlight, light grey 3D ground (Tesla white view)
 * - dark:  the historical Ocearo black HUD
 * - night: red-only palette that preserves night vision
 */

export const THEME_IDS = ['day', 'dark', 'night'];

/** Theme modes a user can pick: 'auto' follows the sun */
export const THEME_MODES = ['auto', ...THEME_IDS];

const DAY = {
  id: 'day',
  // Panes
  appBg: '#f2f3f5',
  leftPaneBg: '#e9ebee',
  rightPaneBg: '#f6f7f9',
  // Surfaces
  surface: 'rgba(255, 255, 255, 0.72)',
  surfaceElevated: 'rgba(0, 0, 0, 0.045)',
  card: 'rgba(255, 255, 255, 0.9)',
  border: 'rgba(0, 0, 0, 0.08)',
  // Text
  textMain: '#111418',
  textSecondary: 'rgba(17, 20, 24, 0.62)',
  textMuted: 'rgba(17, 20, 24, 0.45)',
  textDim: 'rgba(17, 20, 24, 0.28)',
  // Semantic colours (darker than on black so they keep contrast on white)
  accent: '#0a7fc2',
  ok: '#0e9f47',
  warn: '#c98a00',
  danger: '#d0021b',
  neutral: '#7d8288',
  neutralStrong: '#c5c9ce',
  shadowSoft: '0 1px 4px rgba(0, 0, 0, 0.08)',
  shadowSubtle: '0 1px 3px rgba(0, 0, 0, 0.05)',
  // Attitude instrument faces
  instrument: { sky: '#9fd3f2', sea: '#b9bcc0', bezel: '#c5c9ce' },
  scene: {
    // FSD day look: near-white world, thin light-grey lines, mid-grey vehicles
    background: '#f7f8f9',
    ground: '#f2f3f5',
    grid: '#dcdfe3',
    // Ocean: deep Atlantic blue, turquoise light through the crests, white
    // foam, a clear sky fading to a pale haze at the horizon
    sea: '#134868',
    seaScatter: '#2b97a3',
    seaFoam: '#f3f7f9',
    skyZenith: '#4f86b8',
    skyHorizon: '#dbe6ed',
    markerDim: '#b5bac0',
    water: '#9fb4c2',
    ownHull: '#ffffff',
    ownDeck: '#8f99a4',
    sail: '#f7f8fa',
    rigging: '#5a6068',
    compass: '#2b3036',
    compassDim: '#8a9097',
    compassFace: '#dfe2e6',
    vessel: '#9aa0a6',
    vesselDanger: '#d2504f',   // risk of collision, we must keep clear
    vesselYields: '#8f86c9',   // risk of collision, it must keep clear of us
    vesselClose: '#d9a066',    // near, but no risk of collision
    route: '#1688d8',
    routeGlow: '#5fb8ff',
    laylinePort: '#e0262f',
    laylineStarboard: '#0e9f47',
    wakeGood: '#0e9f47',
    wakeFair: '#e3a400',
    wakeBad: '#e0262f',
    wakeFoam: '#ffffff',
    ghost: '#5f6b78',
    // Own hull when we must keep clear of another vessel (COLREG)
    giveWay: '#e8954f',
    target: '#c98a00',
    wind: '#2b3036',
    current: '#0e9f47',
    light: '#ffffff',
    rimLight: '#ffffff',
    ambient: 1.3,
    keyLight: 2.4,
    fillLight: 1.0,
  },
};

const DARK = {
  id: 'dark',
  // Tesla FSD dark: a blue-tinted charcoal rather than black, light-grey
  // objects, white lines and a luminous cyan accent; every label readable
  appBg: '#101216',
  leftPaneBg: '#121418',
  rightPaneBg: '#171a1f',
  surface: 'rgba(255, 255, 255, 0.03)',
  surfaceElevated: 'rgba(255, 255, 255, 0.07)',
  card: 'rgba(255, 255, 255, 0.045)',
  border: 'rgba(255, 255, 255, 0.09)',
  textMain: '#f2f4f7',
  textSecondary: 'rgba(235, 240, 245, 0.68)',
  textMuted: 'rgba(235, 240, 245, 0.52)',
  textDim: 'rgba(235, 240, 245, 0.36)',
  accent: '#3ec6ff',
  ok: '#2fd27a',
  warn: '#ffc53d',
  danger: '#ff4d4f',
  neutral: '#9aa3ad',
  neutralStrong: '#4a525c',
  shadowSoft: '0 4px 20px rgba(0, 0, 0, 0.35)',
  shadowSubtle: '0 2px 10px rgba(0, 0, 0, 0.25)',
  // Attitude instrument faces
  instrument: { sky: '#5b8fb8', sea: '#3a4048', bezel: '#4a525c' },
  scene: {
    // Lit ground around the boat fading into the charcoal background
    background: '#16191e',
    ground: '#20252c',
    grid: '#353d47',
    sea: '#0b1e2b',
    seaScatter: '#16485a',
    seaFoam: '#3e4a55',
    skyZenith: '#0b1016',
    skyHorizon: '#222c37',
    markerDim: '#4a525c',
    water: '#0d3550',
    ownHull: '#f4f6f8',
    ownDeck: '#c9cfd6',
    sail: '#eef1f4',
    rigging: '#aeb6bf',
    compass: '#e8ecf0',
    compassDim: '#7d8690',
    compassFace: '#16191e',
    vessel: '#b9c0c8',
    vesselDanger: '#ff4d4f',
    vesselYields: '#a99cf0',
    vesselClose: '#f0b46e',
    route: '#3ec6ff',
    routeGlow: '#8fe0ff',
    laylinePort: '#ff5a5a',
    laylineStarboard: '#2fd27a',
    wakeGood: '#2fd27a',
    wakeFair: '#ffc53d',
    wakeBad: '#ff4d4f',
    wakeFoam: '#8fd4ff',
    ghost: '#a9bccf',
    giveWay: '#f0a060',
    target: '#ffc53d',
    wind: '#ffffff',
    current: '#2fd27a',
    light: '#ffffff',
    rimLight: '#dfe9f5',
    ambient: 1.0,
    keyLight: 2.0,
    fillLight: 0.9,
  },
};

// Night: long wavelengths only (red to red-orange) to keep night vision,
// but on a warm dark ground with a clear brightness hierarchy instead of
// red on black: values bright, labels dimmer, frames visible.
const RED = '#ff7a63';
const NIGHT = {
  id: 'night',
  appBg: '#0f0706',
  leftPaneBg: '#110807',
  rightPaneBg: '#160a08',
  surface: 'rgba(255, 110, 90, 0.04)',
  surfaceElevated: 'rgba(255, 110, 90, 0.1)',
  card: 'rgba(255, 110, 90, 0.06)',
  border: 'rgba(255, 110, 90, 0.18)',
  textMain: RED,
  textSecondary: 'rgba(255, 122, 99, 0.78)',
  textMuted: 'rgba(255, 122, 99, 0.6)',
  textDim: 'rgba(255, 122, 99, 0.42)',
  // Hues collapse to the red end: states differ by brightness and warmth
  accent: '#ff8a6b',
  onAccent: '#1a0806',
  ok: '#ff9478',
  warn: '#ffad80',
  danger: '#ff3b2f',
  neutral: '#a8473a',
  neutralStrong: '#4a1a14',
  shadowSoft: 'none',
  shadowSubtle: 'none',
  // Attitude instrument faces
  instrument: { sky: '#3a1510', sea: '#1a0907', bezel: '#4a1a14' },
  scene: {
    background: '#120807',
    ground: '#1c0e0b',
    grid: '#43201a',
    sea: '#1a0907',
    seaScatter: '#3a130e',
    seaFoam: '#4f2018',
    skyZenith: '#0c0504',
    skyHorizon: '#26110d',
    markerDim: '#5a261e',
    water: '#1a0907',
    ownHull: '#d9705d',
    ownDeck: '#9c4436',
    sail: '#c8604e',
    rigging: '#8a3a2e',
    compass: '#ff8a72',
    compassDim: '#93412f',
    compassFace: '#120807',
    vessel: '#b35a4a',
    vesselDanger: '#ff3b2f',
    vesselYields: '#e0607a',
    vesselClose: '#ff9a5a',
    route: RED,
    routeGlow: '#ffab95',
    laylinePort: '#e04a3a',
    laylineStarboard: '#ffab95',
    // Performance wake: brightness instead of hue at night
    wakeGood: '#ffab95',
    wakeFair: '#e0604a',
    wakeBad: '#8a2a1e',
    wakeFoam: '#93412f',
    ghost: '#93412f',
    giveWay: '#ff7a3a',
    target: '#ffad80',
    wind: '#ffb3a3',
    current: RED,
    light: '#ffb3a3',
    rimLight: '#ff8a72',
    ambient: 0.75,
    keyLight: 1.4,
    fillLight: 0.6,
  },
};

export const THEMES = { day: DAY, dark: DARK, night: NIGHT };

/** Older configs stored 'light' for the white theme */
export const normalizeThemeMode = (mode) => {
  if (mode === 'light') return 'day';
  return THEME_MODES.includes(mode) ? mode : 'dark';
};

/**
 * Write a theme's tokens as CSS variables on <html>. Inline custom properties
 * beat every stylesheet rule, so no per-theme CSS block is needed.
 */
export const applyThemeTokens = (theme, root = document.documentElement) => {
  const vars = {
    '--background': theme.appBg,
    '--foreground': theme.textMain,
    '--color-leftPaneBg': theme.leftPaneBg,
    '--color-rightPaneBg': theme.rightPaneBg,
    '--hud-bg': theme.surface,
    '--hud-bg-elevated': theme.surfaceElevated,
    '--hud-card-bg': theme.card,
    '--hud-border': theme.border,
    '--hud-text-main': theme.textMain,
    '--hud-text-secondary': theme.textSecondary,
    '--hud-text-muted': theme.textMuted,
    '--hud-text-dim': theme.textDim,
    '--color-oBlue': theme.accent,
    '--color-oGreen': theme.ok,
    '--color-oYellow': theme.warn,
    '--color-oRed': theme.danger,
    '--color-oGray': theme.neutral,
    '--color-oGray2': theme.neutralStrong,
    '--color-oNight': theme.textMain,
    '--color-onAccent': theme.onAccent || '#ffffff',
    '--shadow-soft': theme.shadowSoft,
    '--shadow-subtle': theme.shadowSubtle,
  };
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
  root.setAttribute('data-theme', theme.id);
  root.style.colorScheme = theme.id === 'day' ? 'light' : 'dark';
};

// Sun elevation thresholds (degrees) for the automatic mode, with hysteresis
// so a sun hovering on a threshold doesn't flip the display back and forth.
// Above ~6° the sky is bright enough for the white theme; below civil
// twilight (-6°) the cockpit is dark and the red theme protects night vision.
const DAY_ABOVE = 6;
const NIGHT_BELOW = -6;
const HYSTERESIS = 1;

/**
 * Theme for a sun elevation, given the theme currently shown.
 * @param {number|null} elevation - degrees, null when unknown (no position)
 * @param {string} current - theme id currently displayed
 */
export const themeForSunElevation = (elevation, current) => {
  if (!Number.isFinite(elevation)) return current || 'dark';
  const margin = (target) => (current === target ? HYSTERESIS : -HYSTERESIS);
  if (elevation > DAY_ABOVE - margin('day')) return 'day';
  if (elevation < NIGHT_BELOW + margin('night')) return 'night';
  return 'dark';
};

/**
 * Night vision: map any computed colour (gradients, data-driven hues) to a red
 * of the same brightness. Other themes keep the colour unchanged.
 * @param {Object} theme - theme tokens
 * @param {import('three').Color} color - mutated and returned
 */
export const tintForTheme = (theme, color) => {
  if (theme.id !== 'night') return color;
  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  return color.setRGB(Math.min(1, 0.25 + luminance), 0.04 * luminance, 0.04 * luminance);
};
