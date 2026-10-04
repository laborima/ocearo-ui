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
    // FSD ocean: grey-blue faceted sea, light crests, pale gradient sky
    sea: '#b9c3cd',
    seaTrough: '#8f9ba8',
    seaCrest: '#eef1f4',
    skyZenith: '#d5dde6',
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
    vesselDanger: '#e0262f',
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
    giveWay: '#ffb46b',
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
  appBg: '#0a0a0a',
  leftPaneBg: '#0e0e0e',
  rightPaneBg: '#1e1e1e',
  surface: 'rgba(0, 0, 0, 0.2)',
  surfaceElevated: 'rgba(255, 255, 255, 0.05)',
  card: 'rgba(255, 255, 255, 0.02)',
  border: 'rgba(255, 255, 255, 0.05)',
  textMain: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.4)',
  textMuted: 'rgba(255, 255, 255, 0.3)',
  textDim: 'rgba(255, 255, 255, 0.2)',
  accent: '#09bfff',
  ok: '#0fcd4f',
  warn: '#ffbe00',
  danger: '#cc000c',
  neutral: '#989898',
  neutralStrong: '#424242',
  shadowSoft: '0 4px 20px rgba(0, 0, 0, 0.3)',
  shadowSubtle: '0 2px 10px rgba(0, 0, 0, 0.2)',
  // Attitude instrument faces
  instrument: { sky: '#87CEEB', sea: '#424242', bezel: '#424242' },
  scene: {
    background: '#000000',
    ground: '#0c0e11',
    grid: '#1f242a',
    sea: '#1b2229',
    seaTrough: '#0b0f13',
    seaCrest: '#55606c',
    skyZenith: '#05070a',
    markerDim: '#333333',
    water: '#004466',
    ownHull: '#ffffff',
    ownDeck: '#d9dde2',
    sail: '#f2f4f7',
    rigging: '#9aa0a6',
    compass: '#ffffff',
    compassDim: '#6b7178',
    compassFace: '#0a0a0a',
    vessel: '#8a9097',
    vesselDanger: '#ff2d38',
    route: '#09bfff',
    routeGlow: '#6fdcff',
    laylinePort: '#ff3b3b',
    laylineStarboard: '#0fcd4f',
    wakeGood: '#0fcd4f',
    wakeFair: '#ffbe00',
    wakeBad: '#ff2d38',
    wakeFoam: '#88ccff',
    ghost: '#9fb3c8',
    giveWay: '#ffb46b',
    target: '#ffbe00',
    wind: '#ffffff',
    current: '#0fcd4f',
    light: '#ffffff',
    rimLight: '#ffffff',
    ambient: 0.9,
    keyLight: 2.0,
    fillLight: 0.8,
  },
};

const RED = '#ef4444';
const NIGHT = {
  id: 'night',
  appBg: '#0a0000',
  leftPaneBg: '#0a0000',
  rightPaneBg: '#120000',
  surface: 'rgba(10, 0, 0, 0.6)',
  surfaceElevated: 'rgba(239, 68, 68, 0.08)',
  card: 'rgba(239, 68, 68, 0.04)',
  border: 'rgba(239, 68, 68, 0.12)',
  textMain: RED,
  textSecondary: 'rgba(239, 68, 68, 0.6)',
  textMuted: 'rgba(239, 68, 68, 0.4)',
  textDim: 'rgba(239, 68, 68, 0.25)',
  // Every hue collapses to red: blue or green light ruins night vision
  accent: RED,
  ok: RED,
  warn: RED,
  danger: '#ff1f1f',
  neutral: '#7f1d1d',
  neutralStrong: '#450a0a',
  shadowSoft: 'none',
  shadowSubtle: 'none',
  // Attitude instrument faces
  instrument: { sky: '#1a0000', sea: '#000000', bezel: '#330000' },
  scene: {
    background: '#000000',
    ground: '#050000',
    grid: '#2a0505',
    sea: '#1a0303',
    seaTrough: '#0a0000',
    seaCrest: '#4a0a0a',
    skyZenith: '#030000',
    markerDim: '#3a0a0a',
    water: '#0a0000',
    ownHull: '#8f1d1d',
    ownDeck: '#5a1010',
    sail: '#7a1818',
    rigging: '#5a1010',
    compass: RED,
    compassDim: '#7f1d1d',
    compassFace: '#000000',
    vessel: '#6b1515',
    vesselDanger: '#ff1f1f',
    route: RED,
    routeGlow: '#ff6b6b',
    laylinePort: '#b91c1c',
    laylineStarboard: '#f87171',
    // Performance wake: brightness instead of hue at night
    wakeGood: '#ff6b6b',
    wakeFair: '#b91c1c',
    wakeBad: '#5a0e0e',
    wakeFoam: '#7f1d1d',
    ghost: '#7f1d1d',
    giveWay: '#ff7a7a',
    target: RED,
    wind: RED,
    current: RED,
    light: '#ff9a9a',
    rimLight: '#ff6b6b',
    ambient: 0.45,
    keyLight: 1.0,
    fillLight: 0.4,
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
