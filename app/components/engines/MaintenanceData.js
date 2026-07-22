/**
 * Manufacturer maintenance schedules for common sailboat auxiliary engines.
 * Intervals are "whichever comes first": engine hours and/or calendar months.
 * Values come from the manufacturers' operator manuals — indicative, always
 * check the manual of your exact engine version.
 */

const VOLVO_D1_ITEMS = [
  { id: 'oilChange', intervalHours: 200, intervalMonths: 12 },
  { id: 'oilFilter', intervalHours: 200, intervalMonths: 12 },
  { id: 'fuelFilter', intervalHours: 400, intervalMonths: 12 },
  { id: 'fuelPreFilter', intervalHours: 400, intervalMonths: 12 },
  { id: 'impeller', intervalHours: 400, intervalMonths: 12 },
  { id: 'driveBelt', intervalHours: 500, intervalMonths: 12 },
  { id: 'airFilter', intervalHours: 500, intervalMonths: 24 },
  { id: 'valveClearance', intervalHours: 500, intervalMonths: null },
  { id: 'coolant', intervalHours: 1000, intervalMonths: 24 },
  { id: 'anodes', intervalHours: null, intervalMonths: 12 },
  { id: 'saildriveOil', intervalHours: 200, intervalMonths: 12 },
  { id: 'saildriveDiaphragm', intervalHours: null, intervalMonths: 84 },
  { id: 'engineMounts', intervalHours: null, intervalMonths: 12 },
];

const YANMAR_YM_ITEMS = [
  { id: 'oilChange', intervalHours: 100, intervalMonths: 12 },
  { id: 'oilFilter', intervalHours: 200, intervalMonths: 12 },
  { id: 'fuelFilter', intervalHours: 200, intervalMonths: 12 },
  { id: 'fuelPreFilter', intervalHours: 200, intervalMonths: 12 },
  { id: 'impeller', intervalHours: 500, intervalMonths: 12 },
  { id: 'driveBelt', intervalHours: 250, intervalMonths: 12 },
  { id: 'airFilter', intervalHours: 500, intervalMonths: 24 },
  { id: 'valveClearance', intervalHours: 500, intervalMonths: null },
  { id: 'coolant', intervalHours: 1000, intervalMonths: 24 },
  { id: 'anodes', intervalHours: null, intervalMonths: 12 },
  { id: 'saildriveOil', intervalHours: 250, intervalMonths: 12 },
  { id: 'engineMounts', intervalHours: null, intervalMonths: 12 },
];

const GENERIC_ITEMS = [
  { id: 'oilChange', intervalHours: 150, intervalMonths: 12 },
  { id: 'oilFilter', intervalHours: 150, intervalMonths: 12 },
  { id: 'fuelFilter', intervalHours: 300, intervalMonths: 12 },
  { id: 'fuelPreFilter', intervalHours: 300, intervalMonths: 12 },
  { id: 'impeller', intervalHours: 400, intervalMonths: 12 },
  { id: 'driveBelt', intervalHours: 400, intervalMonths: 12 },
  { id: 'coolant', intervalHours: 1000, intervalMonths: 24 },
  { id: 'anodes', intervalHours: null, intervalMonths: 12 },
  { id: 'engineMounts', intervalHours: null, intervalMonths: 12 },
];

export const ENGINE_PRESETS = {
  'volvo-d1-20': { name: 'Volvo Penta D1-20', items: VOLVO_D1_ITEMS },
  'volvo-d1-30': { name: 'Volvo Penta D1-13/30', items: VOLVO_D1_ITEMS },
  'volvo-d2-40': { name: 'Volvo Penta D2-40/50', items: VOLVO_D1_ITEMS },
  'yanmar-2ym15': { name: 'Yanmar 2YM15', items: YANMAR_YM_ITEMS },
  'yanmar-3ym30': { name: 'Yanmar 3YM20/30', items: YANMAR_YM_ITEMS },
  'generic-diesel': { name: 'Generic diesel', items: GENERIC_ITEMS },
};

export const DEFAULT_ENGINE_PRESET = 'volvo-d1-20';

const STORAGE_KEY = 'ocearo_maintenance';

export const loadMaintenanceState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* storage unavailable */ }
  return { engineModel: DEFAULT_ENGINE_PRESET, lastDone: {} };
};

export const saveMaintenanceState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) { /* storage unavailable */ }
};

/**
 * Compute the due status of a maintenance item.
 * @param {Object} item - {intervalHours, intervalMonths}
 * @param {Object|null} lastDone - {hours, date} of the last service
 * @param {number|null} currentHours - current engine hours
 * @returns {Object} {status, hoursLeft, daysLeft, dueHours, dueDate}
 *   status: 'unknown' | 'ok' | 'due' | 'overdue'
 */
export const computeMaintenanceStatus = (item, lastDone, currentHours) => {
  if (!lastDone || (lastDone.hours == null && !lastDone.date)) {
    return { status: 'unknown', hoursLeft: null, daysLeft: null, dueHours: null, dueDate: null };
  }

  let hoursLeft = null;
  let dueHours = null;
  if (item.intervalHours != null && lastDone.hours != null && currentHours != null) {
    dueHours = lastDone.hours + item.intervalHours;
    hoursLeft = Math.round((dueHours - currentHours) * 10) / 10;
  }

  let daysLeft = null;
  let dueDate = null;
  if (item.intervalMonths != null && lastDone.date) {
    const due = new Date(lastDone.date);
    due.setMonth(due.getMonth() + item.intervalMonths);
    dueDate = due;
    daysLeft = Math.floor((due.getTime() - Date.now()) / 86400000);
  }

  let status = 'ok';
  if ((hoursLeft != null && hoursLeft < 0) || (daysLeft != null && daysLeft < 0)) {
    status = 'overdue';
  } else if ((hoursLeft != null && hoursLeft <= 25) || (daysLeft != null && daysLeft <= 30)) {
    status = 'due';
  }

  return { status, hoursLeft, daysLeft, dueHours, dueDate };
};
