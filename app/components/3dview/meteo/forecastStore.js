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
