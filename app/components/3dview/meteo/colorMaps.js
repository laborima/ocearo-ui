import * as THREE from 'three';

/**
 * Colour maps for the ocean and atmosphere layers, the ones of Grid Viewer:
 * cmocean (Thyng et al. 2016, MIT licence), designed for oceanography, the
 * perceptual matplotlib maps (CC0) and Google's turbo (Apache-2.0). 17 stops
 * each, from low to high, linear in between.
 */

export const COLOR_MAPS = {
    speed: ['#fffdcd', '#f4eaab', '#e9d889', '#dbc866', '#c9ba45', '#b2af28', '#98a512', '#7c9c06', '#5f920c', '#448818', '#287c23', '#126e2a', '#0b602d', '#11512c', '#174127', '#19321e', '#172313'],
    thermal: ['#042333', '#082e54', '#19337c', '#39339e', '#563b9c', '#6d4694', '#83508f', '#995889', '#b15f82', '#c76676', '#de7065', '#ef7e52', '#f99242', '#fcaa3c', '#f9c441', '#f3df4c', '#e8fa5b'],
    haline: ['#2a186c', '#2e1d93', '#2034a2', '#0f4a98', '#0f5b90', '#1c6a8c', '#297789', '#338588', '#3c9387', '#44a184', '#4faf7e', '#5fbe75', '#78cb68', '#9bd55c', '#c1dd64', '#e1e57c', '#fdef9a'],
    deep: ['#fdfecc', '#ddf2ba', '#bbe6ac', '#98daa4', '#78cea3', '#62bfa4', '#55aea3', '#4e9ea1', '#488e9e', '#437f9a', '#3f6f97', '#3e5f93', '#404d8c', '#413e76', '#3b325c', '#322643', '#281a2c'],
    ice: ['#040613', '#13132a', '#212041', '#2e2c5a', '#383975', '#3e478f', '#3f57a3', '#3e69b0', '#427bb7', '#4b8bbd', '#579cc3', '#67adc9', '#79bed0', '#92ced7', '#afdde1', '#cdecef', '#eafdfd'],
    dense: ['#e6f1f1', '#cbe4e8', '#b1d6e3', '#9ac8e2', '#86b9e3', '#79a9e4', '#7397e4', '#7584df', '#7871d5', '#7960c7', '#784eb3', '#753d9d', '#6f2e85', '#66216c', '#5a1851', '#491238', '#360e24'],
    magma: ['#000004', '#0a0822', '#1d1147', '#36106b', '#51127c', '#6a1c81', '#832681', '#9c2e7f', '#b73779', '#cf4070', '#e55064', '#f4695c', '#fb8761', '#fea571', '#fec287', '#fde0a1', '#fcfdbf'],
    viridis: ['#440154', '#48186a', '#472d7b', '#424086', '#3b528b', '#33638d', '#2c728e', '#26828e', '#21918c', '#1f9f88', '#27ad81', '#3dbc74', '#5cc863', '#81d34d', '#aadc32', '#d5e21a', '#fde725'],
    turbo: ['#30123b', '#4040a2', '#466be3', '#4294ff', '#28bceb', '#18ddc2', '#32f298', '#6dfe62', '#a4fc3c', '#cbed34', '#ecd13a', '#fdae35', '#fb8122', '#ec530f', '#d23105', '#ac1701', '#7a0403'],
};

/**
 * Where each map starts for a layer drawn over the chart: its darkest end
 * would read as a dark veil (slack water is drawn clear anyway)
 */
export const MAP_START = { thermal: 0.28, magma: 0.3, dense: 0.15, deep: 0, haline: 0.1, turbo: 0.08 };

const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const parsed = Object.fromEntries(Object.entries(COLOR_MAPS).map(([k, stops]) => [k, stops.map(rgb)]));

/** Colour (RGB 0..255) of `name` at t in 0..1 */
export const colorAt = (name, t) => {
    const stops = parsed[name] || parsed.speed;
    const f = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(f));
    const a = f - i;
    return stops[i].map((c, n) => c + (stops[i + 1][n] - c) * a);
};

/** CSS gradient of a map (from its start), for legends */
export const cssGradient = (name) => {
    const start = MAP_START[name] || 0;
    const stops = Array.from({ length: 9 }, (_, i) => {
        const [r, g, b] = colorAt(name, start + (1 - start) * i / 8);
        return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    });
    return `linear-gradient(to right, ${stops.join(', ')})`;
};

/** 256×1 texture of a map (from its start), for shaders (sRGB) */
export const colorMapTexture = (name) => {
    const data = new Uint8Array(256 * 4);
    const start = MAP_START[name] || 0;
    for (let i = 0; i < 256; i++) {
        const [r, g, b] = colorAt(name, start + (1 - start) * i / 255);
        data.set([Math.round(r), Math.round(g), Math.round(b), 255], i * 4);
    }
    const t = new THREE.DataTexture(data, 256, 1, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
};
