/**
 * The Ocearo guide: one section per screen, each a screenshot (public/guide,
 * 16:9) with numbered spots. x / y are the spot's position in percent of the
 * image. Titles and texts live in the locales under guide.<section>.
 */
export const GUIDE_SECTIONS = [
    { id: 'start', steps: ['connect', 'demo', 'views', 'phone', 'settings'] },
    {
        id: 'view',
        image: 'hero.jpg',
        spots: [
            { id: 'toolbar', x: 13.5, y: 3 },
            { id: 'speed', x: 6.5, y: 10 },
            { id: 'values', x: 6, y: 23 },
            { id: 'legend', x: 6, y: 33 },
            { id: 'sky', x: 90, y: 3 },
            { id: 'sails', x: 49, y: 33 },
            { id: 'ais', x: 79, y: 29.5 },
            { id: 'compass', x: 60, y: 66 },
            { id: 'wake', x: 50, y: 85 },
            { id: 'depth', x: 13.5, y: 84 },
            { id: 'tide', x: 82, y: 83 },
            { id: 'bottom', x: 12.8, y: 96 },
            { id: 'readings', x: 94, y: 97 },
            { id: 'shortcuts', x: 50, y: 96 },
        ],
    },
    {
        id: 'route',
        image: 'polars.jpg',
        spots: [
            { id: 'toggles', x: 15, y: 3 },
            { id: 'waypoint', x: 9, y: 35 },
            { id: 'route', x: 40.6, y: 33 },
            { id: 'isochrones', x: 58, y: 32 },
            { id: 'laylines', x: 19, y: 48 },
            { id: 'wake', x: 43, y: 87 },
        ],
    },
    {
        id: 'traffic',
        image: 'traffic.jpg',
        spots: [
            { id: 'toggle', x: 22, y: 3.5 },
            { id: 'banner', x: 50, y: 9 },
            { id: 'yields', x: 34, y: 26 },
            { id: 'tags', x: 57.5, y: 21 },
            { id: 'danger', x: 45, y: 45.5 },
            { id: 'advice', x: 33, y: 87 },
        ],
    },
    {
        id: 'anchor',
        image: 'anchor.jpg',
        spots: [
            { id: 'button', x: 5, y: 3.5 },
            { id: 'position', x: 11, y: 8 },
            { id: 'values', x: 3.5, y: 37 },
            { id: 'alarm', x: 91, y: 64 },
            { id: 'swing', x: 37.5, y: 60.5 },
            { id: 'track', x: 47.5, y: 57 },
            { id: 'anchorPoint', x: 61, y: 59 },
        ],
    },
    {
        id: 'parking',
        image: 'parking.jpg',
        spots: [
            { id: 'button', x: 7.8, y: 3.5 },
            { id: 'berth', x: 50, y: 31 },
            { id: 'path', x: 49, y: 41 },
            { id: 'wind', x: 42, y: 64 },
            { id: 'depth', x: 6, y: 81 },
            { id: 'guidance', x: 40, y: 84 },
            { id: 'types', x: 66, y: 90 },
        ],
    },
    {
        id: 'bathymetry',
        image: 'bathymetry.jpg',
        spots: [
            { id: 'button', x: 11.4, y: 3 },
            { id: 'coast', x: 69, y: 7 },
            { id: 'soundings', x: 36, y: 22.5 },
            { id: 'seabed', x: 19, y: 67 },
            { id: 'keel', x: 51.5, y: 86 },
        ],
    },
    {
        id: 'weather',
        image: 'weather.jpg',
        spots: [
            { id: 'button', x: 11.4, y: 3 },
            { id: 'slider', x: 51, y: 6.7 },
            { id: 'map', x: 39, y: 28 },
            { id: 'wind', x: 75, y: 44 },
        ],
    },
    {
        id: 'mob',
        image: 'mob.jpg',
        spots: [
            { id: 'button', x: 12.75, y: 96 },
            { id: 'alert', x: 66, y: 6 },
            { id: 'marker', x: 75, y: 59 },
            { id: 'drift', x: 68, y: 63.5 },
            { id: 'return', x: 61, y: 55.5 },
        ],
    },
    {
        id: 'dashboard',
        image: 'dashboard.jpg',
        spots: [
            { id: 'view', x: 20, y: 44 },
            { id: 'radar', x: 60, y: 39 },
            { id: 'range', x: 75, y: 5 },
            { id: 'tactical', x: 60, y: 79 },
            { id: 'weather', x: 90, y: 24 },
            { id: 'course', x: 90, y: 62 },
        ],
    },
    {
        id: 'logbook',
        image: 'logbook.jpg',
        spots: [
            { id: 'tabs', x: 69, y: 6.3 },
            { id: 'add', x: 93, y: 12 },
            { id: 'entries', x: 69, y: 30 },
        ],
    },
    { id: 'legend', legend: true },
];
