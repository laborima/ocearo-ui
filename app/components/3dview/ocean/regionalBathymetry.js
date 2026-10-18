/**
 * Finer seabed than the global Terrarium relief (ETOPO1, ~1.8 km), chosen by
 * where the boat is:
 *
 * - Europe: EMODnet Bathymetry DTM (1/16 arc-minute, ~115 m), referenced to
 *   the lowest astronomical tide, i.e. close to chart datum;
 * - everywhere else: NOAA NCEI's DEM mosaic, the best grid it holds at each
 *   place (coastal surveys down to ~3 m along the US coasts, ETOPO 2022 at
 *   15 arc-seconds, ~450 m, elsewhere), referenced to about mean sea level.
 *
 * Both are open services that answer the browser directly (CORS) with an
 * uncompressed 32-bit float GeoTIFF, read here without any library. A square
 * of about 20 km around the boat is fetched and kept for offline use like the
 * chart tiles. The SHOM surveys from ocearo-core still come first in France.
 */

import { cachedFetch } from '../../utils/offlineCache';

// Half-side of the square fetched, degrees of latitude (~10 km)
const HALF_DEG = 0.09;
const NOAA_PIXELS = 384;     // ~50 m per pixel over the square
const EMODNET_PIXELS = 192;  // the grid's own ~115 m, a bit finer for smoothness
// Heights beyond these are no-data markers
const VALID = 12000;

const EUROPE = { south: 15, north: 90, west: -36, east: 43 };
const inEurope = (lat, lon) => lat >= EUROPE.south && lat <= EUROPE.north && lon >= EUROPE.west && lon <= EUROPE.east;

/**
 * Minimal GeoTIFF reader: one band of 32-bit floats, uncompressed, in strips
 * or tiles, either byte order. Returns { width, height, values } with row 0
 * at the top (north).
 */
export const readFloatTiff = (buffer) => {
    const view = new DataView(buffer);
    const little = view.getUint16(0) === 0x4949;
    const u16 = (o) => view.getUint16(o, little);
    const u32 = (o) => view.getUint32(o, little);
    if (u16(2) !== 42) throw new Error('Not a TIFF');
    const ifd = u32(4);
    const tags = {};
    const SIZES = { 1: 1, 3: 2, 4: 4, 11: 4, 12: 8, 16: 8 };
    for (let i = 0; i < u16(ifd); i++) {
        const p = ifd + 2 + i * 12;
        const tag = u16(p);
        const type = u16(p + 2);
        const count = u32(p + 4);
        const bytes = (SIZES[type] || 1) * count;
        const at = bytes <= 4 ? p + 8 : u32(p + 8);
        const read = (k) => (type === 3 ? u16(at + k * 2) : type === 4 ? u32(at + k * 4) : view.getUint8(at + k));
        tags[tag] = Array.from({ length: count }, (_, k) => read(k));
    }
    const width = tags[256][0];
    const height = tags[257][0];
    if ((tags[259]?.[0] ?? 1) !== 1) throw new Error('Compressed TIFF');
    if ((tags[258]?.[0] ?? 32) !== 32) throw new Error('Not 32-bit');
    const values = new Float32Array(width * height).fill(NaN);
    const put = (offset, x0, y0, w, h) => {
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (x0 + x >= width || y0 + y >= height) continue;
                const v = view.getFloat32(offset + (y * w + x) * 4, little);
                values[(y0 + y) * width + x0 + x] = Math.abs(v) < VALID ? v : NaN;
            }
        }
    };
    if (tags[322]) {
        const tw = tags[322][0];
        const th = tags[323][0];
        const across = Math.ceil(width / tw);
        tags[324].forEach((offset, k) => put(offset, (k % across) * tw, Math.floor(k / across) * th, tw, th));
    } else {
        const rows = tags[278]?.[0] ?? height;
        tags[273].forEach((offset, k) => put(offset, 0, k * rows, width, Math.min(rows, height - k * rows)));
    }
    return { width, height, values };
};

const bbox = (lat, lon) => {
    const halfLon = HALF_DEG / Math.cos(lat * Math.PI / 180);
    return { south: lat - HALF_DEG, north: lat + HALF_DEG, west: lon - halfLon, east: lon + halfLon };
};

const SOURCES = {
    emodnet: {
        datum: 'cd',
        pixels: EMODNET_PIXELS,
        url: (b, n) => 'https://ows.emodnet-bathymetry.eu/wcs?service=WCS&version=1.0.0&request=GetCoverage&coverage=emodnet:mean'
            + `&crs=EPSG:4326&bbox=${b.west},${b.south},${b.east},${b.north}&format=image/tiff&width=${n}&height=${n}`,
    },
    noaa: {
        datum: 'msl',
        pixels: NOAA_PIXELS,
        url: (b, n) => 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer/exportImage'
            + `?bbox=${b.west},${b.south},${b.east},${b.north}&bboxSR=4326&imageSR=4326&size=${n},${n}`
            + '&format=tiff&pixelType=F32&interpolation=RSP_BilinearInterpolation&f=image',
    },
};

// The last few squares in memory (~0.6 MB each); older ones come back from
// the offline cache on disk
const cache = new Map();
const KEEP = 3;

const fetchSource = async (name, b) => {
    const src = SOURCES[name];
    const res = await cachedFetch(src.url(b, src.pixels), { kind: 'tile' });
    if (!res.ok) throw new Error(`${name} ${res.status}`);
    const { width, height, values } = readFloatTiff(await res.arrayBuffer());
    let covered = 0;
    for (let i = 0; i < values.length; i++) if (Number.isFinite(values[i])) covered++;
    if (covered < values.length * 0.2) throw new Error(`${name}: not covered`);
    // Metres per pixel, for the mesh resolution
    const res_m = (b.north - b.south) * 111320 / height;
    return { heights: values, width, height, nw: { lat: b.north, lon: b.west }, se: { lat: b.south, lon: b.east },
        linear: true, datum: src.datum, source: name, resolution: res_m };
};

const STEP = 0.04;
const rounded = (lat, lon) => ({ lat: Math.round(lat / STEP) * STEP, lon: Math.round(lon / STEP) * STEP });
const sourcesFor = (lat, lon) => (inEurope(lat, lon) ? ['emodnet', 'noaa'] : ['noaa']);

/** URLs of the grids for the area, to download for offline use */
export const regionalSeabedUrls = (lat, lon) => {
    const r = rounded(lat, lon);
    const b = bbox(r.lat, r.lon);
    return sourcesFor(r.lat, r.lon).map((name) => SOURCES[name].url(b, SOURCES[name].pixels));
};

/**
 * The finest grid for the area around (lat, lon), or null. Rounded so a
 * moving boat reuses one square for ~4 km.
 */
export const loadRegionalSeabed = async (lat, lon) => {
    const { lat: rLat, lon: rLon } = rounded(lat, lon);
    const key = `${rLat.toFixed(2)},${rLon.toFixed(2)}`;
    if (cache.has(key)) return cache.get(key);
    const b = bbox(rLat, rLon);
    const order = sourcesFor(rLat, rLon);
    let result = null;
    for (const name of order) {
        try {
            result = await fetchSource(name, b); // eslint-disable-line no-await-in-loop
            break;
        } catch (error) {
            // Next source; said once in the console, for whoever wonders why
            // the seabed is the coarse one
            console.warn(`Regional bathymetry: ${name} unavailable (${error.message})`); // eslint-disable-line no-console
        }
    }
    // Kept only when found: offline now, the next try may succeed
    if (result) {
        cache.set(key, result);
        while (cache.size > KEEP) cache.delete(cache.keys().next().value);
    }
    return result;
};

/** Height (m) at a lat/lon in a regional grid, bilinear; NaN where not covered */
export const regionalHeightAt = (data, lat, lon) => {
    const { heights, width, height, nw, se } = data;
    const fx = (lon - nw.lon) / (se.lon - nw.lon) * (width - 1);
    const fy = (nw.lat - lat) / (nw.lat - se.lat) * (height - 1);
    if (fx < 0 || fy < 0 || fx > width - 1 || fy > height - 1) return NaN;
    const i = Math.min(width - 2, Math.floor(fx));
    const j = Math.min(height - 2, Math.floor(fy));
    const a = fx - i;
    const b = fy - j;
    const h = (x, y) => heights[y * width + x];
    return (h(i, j) * (1 - a) + h(i + 1, j) * a) * (1 - b) + (h(i, j + 1) * (1 - a) + h(i + 1, j + 1) * a) * b;
};
