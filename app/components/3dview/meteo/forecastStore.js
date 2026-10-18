/** Forecast hour shown by the meteo layer (0 = now), shared by the 3D layer and its bar */
let hour = 0;
const listeners = new Set();

export const getForecastHour = () => hour;
export const setForecastHour = (h) => {
    hour = Math.max(0, h);
    listeners.forEach((l) => l(hour));
};
export const subscribeForecast = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

// Speed at the boat over the forecast, per layer ('wind', 'current'):
// { start (ms), values (m/s per hour), top (m/s) } or null
let series = {};
const seriesListeners = new Set();
export const getSeries = () => series;
export const setSeries = (kind, value) => {
    series = { ...series, [kind]: value };
    seriesListeners.forEach((l) => l(series));
};
export const subscribeSeries = (listener) => {
    seriesListeners.add(listener);
    return () => seriesListeners.delete(listener);
};
