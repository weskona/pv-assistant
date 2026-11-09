// Pure helpers shared by the panel modules: sensor groups, unit factors, merging of statistics rows, plants, periods (ranges).

// Config keys per sensor group (see const.py).
export const GROUPS = [
  { id: "energy", base: "kWh", keys: {
      production: "production_energy_sensors", feed: "feed_in_energy_sensor",
      sin: "storage_in_energy_sensors", sout: "storage_out_energy_sensors",
      comb: "storage_combined_energy_sensors", inv: "invert_storage_combined" } },
  { id: "power", base: "W", keys: {
      production: "production_power_sensors", feed: "feed_in_power_sensor",
      sin: "storage_in_power_sensors", sout: "storage_out_power_sensors",
      comb: "storage_combined_power_sensors", inv: "invert_storage_combined_power" } },
];
// Unit -> factor to base unit (kWh or W).
export const FACTOR = { Wh: 0.001, kWh: 1, MWh: 1000, W: 1, kW: 1000, MW: 1e6 };

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
// statistics rows of a sensor merged with its filtered copy per bucket (the copy wins where it has data;
// it is usually younger, so older buckets must still come from the original sensor)
export const mergedRows = (res, id, filt, field) => {
  const m = new Map();
  for (const r of res[id] || []) if (r[field] != null) m.set(r.start, r);
  for (const r of (filt[id] && res[filt[id]]) || []) if (r[field] != null) m.set(r.start, r);
  return [...m.values()].sort((a, b) => a.start - b.start);
};

// bucket start -> change of a sensor over the whole history, the filtered copy winning where it has data. The first
// bucket of the copy is skipped when the original has it too: the copy starts mid-month, so that bucket is only partial.
export const mergedChange = (res, id, filt) => {
  const m = new Map();
  for (const r of res[id] || []) if (r.change != null) m.set(r.start, r.change);
  const copy = ((filt[id] && res[filt[id]]) || []).filter((r) => r.change != null);
  copy.forEach((r, i) => { if (i > 0 || !m.has(r.start)) m.set(r.start, r.change); });
  return m;
};

// module strings of a plant unit; older versions stored one or two orientations directly on the entry
export const groupsOf = (o) => {
  if (!o) return [];
  if (Array.isArray(o.groups) && o.groups.length) return o.groups;
  const out = [];
  const two = o.azimuth2 != null && o.tilt2 != null;
  const total = o.modules > 0 ? o.modules : null;
  const m2 = two ? (o.modules2 != null ? o.modules2 : total != null ? Math.round(total / 2) : null) : null;
  if (o.azimuth != null || o.tilt != null || total != null) out.push({ modules: total != null ? total - (m2 || 0) : null, azimuth: o.azimuth ?? null, tilt: o.tilt ?? null });
  if (two) out.push({ modules: m2, azimuth: o.azimuth2, tilt: o.tilt2 });
  return out;
};

// inverters of the plant: the saved ones plus, from older versions, a single-sensor inverter for every sensor with its own inverter power
export const invertersOf = (settings, ids) => {
  const out = [];
  const taken = new Set();
  for (const inv of settings?.inverters || []) {
    const sensors = (inv.sensors || []).filter((id) => ids.includes(id) && !taken.has(id));
    sensors.forEach((id) => taken.add(id));
    out.push({ name: inv.name || "", max_w: inv.max_w || 0, sensors });
  }
  for (const id of ids) {
    const w = settings?.strings?.[id]?.inverter_w;
    if (!taken.has(id) && w > 0) out.push({ name: settings.strings[id].name || "", max_w: w, sensors: [id] });
  }
  return out;
};

// plants of the system: every inverter with its sensors, plus every sensor without an inverter as a plant of its own.
// The number of strings / MPPTs inside a plant does not matter: the plant is the unit of comparison.
export const plantsOf = (settings, ids) => {
  const out = invertersOf(settings, ids).filter((p) => p.sensors.length);
  const taken = new Set(out.flatMap((p) => p.sensors));
  for (const id of ids) if (!taken.has(id)) out.push({ name: settings?.strings?.[id]?.name || "", max_w: 0, sensors: [id], implicit: true });
  return out;
};

// ---- periods (ranges) of the tabs
// A range is a string: "day:2026-06-18", "week:2026-06-15" (the Monday), "month:2026-06", "year:2026", "roll:7" / "roll:30" / "roll:90"
// (the last n days), "y12" (the last 12 months) or "all". The older names today, yesterday, d7, d30, d90, ytd and month and the
// numbers 7, 30, 90 and 365 still work.
export const pad2 = (n) => String(n).padStart(2, "0");
export const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const keyDate = (k) => new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const mondayOf = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
export const isoWeek = (d) => { // ISO 8601 week number
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
};
/** A range value as { value, kind, start, end (exclusive), days? }: kind is day, week, month, year, roll, y12 or all. */
export function parsePeriod(v, dataStart) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let s = typeof v === "number" ? (v >= 365 ? "y12" : `roll:${v}`) : String(v || "today");
  s = { today: `day:${dateKey(today)}`, yesterday: `day:${dateKey(addDays(today, -1))}`, d7: "roll:7", d30: "roll:30", d90: "roll:90",
    ytd: `year:${today.getFullYear()}`, month: `month:${today.getFullYear()}-${pad2(today.getMonth() + 1)}` }[s] || s;
  const [kind, arg = ""] = s.split(":");
  if (kind === "day" && /^\d{4}-\d{2}-\d{2}$/.test(arg)) { const start = keyDate(arg); return { value: s, kind, start, end: addDays(start, 1) }; }
  if (kind === "week" && /^\d{4}-\d{2}-\d{2}$/.test(arg)) { const start = mondayOf(keyDate(arg)); return { value: `week:${dateKey(start)}`, kind, start, end: addDays(start, 7) }; }
  if (kind === "month" && /^\d{4}-\d{2}$/.test(arg)) { const y = Number(arg.slice(0, 4)), m = Number(arg.slice(5, 7)); return { value: s, kind, start: new Date(y, m - 1, 1), end: new Date(y, m, 1) }; }
  if (kind === "year" && /^\d{4}$/.test(arg)) { const y = Number(arg); return { value: s, kind, start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) }; }
  if (kind === "roll" && Number(arg) > 0) { const n = Number(arg); return { value: s, kind, days: n, start: addDays(today, -(n - 1)), end: addDays(today, 1) }; }
  if (s === "y12") return { value: s, kind: "y12", start: new Date(today.getFullYear(), today.getMonth() - 11, 1), end: addDays(today, 1) };
  if (s === "all") { const first = new Date(dataStart || today.getTime()); return { value: s, kind: "all", start: new Date(first.getFullYear(), first.getMonth(), 1), end: addDays(today, 1) }; }
  return parsePeriod("today", dataStart); // unknown value: today
}
export const MAX_ALL_YEARS = 5; // hourly tabs load at most this many years for "Total"
