// Sample data for the screenshots: a small Home Assistant stand-in for the panel (states, configuration and a fake recorder).
// The system: a hybrid inverter ("Alpha ESS", 5 kW) with an east and a west string, a south balcony plant and a garage plant,
// a 10 kWh storage, a house and the grid. Three and a half years of hourly values are simulated from a clear-sky model with
// seasonal cloudiness; the numbers are made up, nothing here is real data.

const H = 3600e3;
const TZ = "Europe/Berlin";
const LAT = 50.11, LON = 8.68;

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const NAMES = {
  en: { east: "Roof east", west: "Roof west", balcony: "Balcony south", garage: "Garage", alpha: "Alpha ESS" },
  de: { east: "Dach Ost", west: "Dach West", balcony: "Balkon Süd", garage: "Garage", alpha: "Alpha ESS" },
};

export async function setupMock({ lang, nowMs, analysisUrl }) {
  const an = await import(analysisUrl);
  const names = NAMES[lang];
  const tzParts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
  const local = (ts) => Object.fromEntries(tzParts.formatToParts(ts).map((p) => [p.type, p.value]));

  // ---- plants
  const plants = [
    { key: "east", id: "sensor.roof_east_power", eid: "sensor.roof_east_energy", wp: 3200, modules: 8, az: -90, tilt: 30 },
    { key: "west", id: "sensor.roof_west_power", eid: "sensor.roof_west_energy", wp: 3200, modules: 8, az: 90, tilt: 30 },
    { key: "balcony", id: "sensor.balcony_south_power", eid: "sensor.balcony_south_energy", wp: 800, modules: 2, az: 0, tilt: 80, limit: 800 },
    { key: "garage", id: "sensor.garage_power", eid: "sensor.garage_energy", wp: 800, modules: 2, az: 45, tilt: 20, limit: 800 },
  ];
  const ALPHA_LIMIT = 4500, CAP = 10, MIN_SOC = 10, BAT_W = 3000, ETA = 0.95;

  // ---- simulation (hourly, local midnight of 1 Jan 2023 until the end of tomorrow)
  const start = Date.UTC(2022, 11, 31, 23);
  const end = nowMs + 2 * 24 * H;
  const n = Math.ceil((end - start) / H);
  const ts = (i) => start + i * H;
  const rand = rng(20260618);
  const dayCloud = new Map();
  { const p = local(nowMs); dayCloud.set(`${p.year}-${p.month}-${p.day}`, 0.62); } // today is partly cloudy: the storage is still charging in the afternoon
  const cloudOf = (t) => {
    const p = local(t); const day = `${p.year}-${p.month}-${p.day}`;
    if (!dayCloud.has(day)) {
      const doy = (Date.UTC(+p.year, +p.month - 1, +p.day) - Date.UTC(+p.year, 0, 1)) / 86400e3;
      const summer = 0.5 - 0.5 * Math.cos(((doy - 15) / 365) * 2 * Math.PI); // 0 in January, 1 in July
      const u = rand();
      const low = 0.45 - 0.25 * summer, mid = low + 0.3;
      dayCloud.set(day, u < low ? 0.1 + 0.25 * rand() : u < mid ? 0.35 + 0.35 * rand() : 0.78 + 0.22 * rand());
    }
    return dayCloud.get(day);
  };
  const prod = plants.map(() => new Float32Array(n));
  const irr = new Float32Array(n);
  const house = new Float32Array(n), imp = new Float32Array(n), feed = new Float32Array(n);
  const batIn = new Float32Array(n), batOut = new Float32Array(n), soc = new Float32Array(n), price = new Float32Array(n);
  let stored = CAP * 0.3;
  const soh = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = ts(i), p = local(t), hour = +p.hour;
    const c = cloudOf(t), jitter = c > 0.75 ? 0.97 + 0.06 * rand() : 0.8 + 0.4 * rand();
    const sun = an.sunPosition(t + 1800e3, LAT, LON);
    irr[i] = an.planeIrradiance(sun.el, sun.az, 0, 0) * c * jitter * 0.75;
    const raw = plants.map((pl) => {
      const g = an.plantIrradiance(t, LAT, LON, [{ azimuth: pl.az, tilt: pl.tilt, modules: pl.modules }]);
      let v = (pl.wp * g / 1000) * 0.72 * c * jitter;
      if (pl.key === "balcony" && hour >= 16 && hour <= 18) v *= 0.45; // a tree shades the balcony in the late afternoon
      if (pl.key === "garage") v *= 0.92; // dirty modules
      return v;
    });
    const alpha = raw[0] + raw[1];
    const k = alpha > ALPHA_LIMIT ? ALPHA_LIMIT / alpha : 1;
    raw[0] *= k; raw[1] *= k;
    for (let q = 2; q < 4; q++) raw[q] = Math.min(raw[q], plants[q].limit);
    raw.forEach((v, q) => { prod[q][i] = v; });
    const pv = raw.reduce((a, v) => a + v, 0);
    // household
    const dow = new Date(t).getUTCDay();
    let base = 260 + (hour >= 6 && hour <= 8 ? 650 : 0) + (hour >= 11 && hour <= 13 ? 380 : 0) + (hour >= 17 && hour <= 22 ? 1050 : 0) + (dow === 0 || dow === 6 ? (hour >= 9 && hour <= 12 ? 450 : 0) : 0);
    const winter = 0.5 + 0.5 * Math.cos(((+p.month - 1) / 12) * 2 * Math.PI);
    base *= (0.85 + 0.35 * winter) * 1.35;
    house[i] = base * (0.8 + 0.4 * rand()) + (rand() < 0.04 ? 1500 : 0);
    // storage and grid: the usable capacity fades by 6 % over the whole time, the level and the health sensor follow it
    const capNow = CAP * (1 - 0.06 * (i / n));
    stored = Math.min(stored, capNow);
    const surplus = pv - house[i];
    let cIn = 0, out = 0;
    if (surplus > 0) {
      cIn = Math.min(surplus, BAT_W, ((capNow - stored) * 1000) / ETA);
      stored += (cIn * ETA) / 1000;
      feed[i] = surplus - cIn;
    } else {
      const need = -surplus;
      out = Math.min(need, BAT_W, Math.max(0, stored - capNow * MIN_SOC / 100) * 1000 * ETA);
      stored -= out / ETA / 1000;
      imp[i] = need - out;
    }
    batIn[i] = cIn; batOut[i] = out; soc[i] = (stored / capNow) * 100; soh[i] = 100 * (capNow / CAP);
    price[i] = 0.3 + (hour >= 17 && hour <= 20 ? 0.09 : 0) - (hour <= 5 ? 0.07 : 0) - (hour >= 11 && hour <= 14 ? 0.04 : 0) + 0.02 * Math.sin(i / 37);
  }
  const hourOf = (t) => Math.floor((t - start) / H);
  const nowIdx = hourOf(nowMs);

  // ---- series by sensor id (hourly mean power in W or energy in kWh per hour)
  const series = {};
  const power = (id, arr) => { series[id] = { kind: "power", arr }; };
  const energy = (id, arr) => { series[id] = { kind: "energy", arr }; };
  plants.forEach((pl, q) => { power(pl.id, prod[q]); energy(pl.eid, prod[q].map((v) => v / 1000)); });
  power("sensor.grid_feed_in_power", feed); energy("sensor.grid_feed_in_energy", feed.map((v) => v / 1000));
  power("sensor.grid_import_power", imp); energy("sensor.grid_import_energy", imp.map((v) => v / 1000));
  power("sensor.house_power", house); energy("sensor.house_energy", house.map((v) => v / 1000));
  power("sensor.battery_charge_power", batIn); energy("sensor.battery_charged_energy", batIn.map((v) => v / 1000));
  power("sensor.battery_discharge_power", batOut); energy("sensor.battery_discharged_energy", batOut.map((v) => v / 1000));
  series["sensor.battery_level"] = { kind: "level", arr: soc };
  series["sensor.battery_health"] = { kind: "level", arr: soh };
  series["sensor.solar_irradiance"] = { kind: "power", arr: irr };
  series["sensor.grid_price"] = { kind: "level", arr: price };
  // cumulative counters at the start of every hour
  const cum = {};
  for (const [id, s] of Object.entries(series)) if (s.kind === "energy") { const c = new Float64Array(n + 1); for (let i = 0; i < n; i++) c[i + 1] = c[i] + s.arr[i]; cum[id] = c; }

  // ---- buckets: local day / month keys per hour
  const dayKey = new Array(n), monKey = new Array(n);
  for (let i = 0; i < n; i++) { const p = local(ts(i)); dayKey[i] = `${p.year}-${p.month}-${p.day}`; monKey[i] = `${p.year}-${p.month}`; }
  const bucketsOf = (period, t0, t1) => { // [{start, from, to}] hour index ranges
    const out = [];
    const i0 = Math.max(0, hourOf(t0)), i1 = Math.min(nowIdx, hourOf(t1 - 1));
    if (period === "hour") { for (let i = i0; i <= i1; i++) out.push({ start: ts(i), from: i, to: i }); return out; }
    const key = period === "day" ? dayKey : monKey;
    let cur = null;
    for (let i = i0; i <= i1; i++) {
      if (!cur || key[i] !== cur.key) { cur = { key: key[i], start: ts(i), from: i, to: i }; out.push(cur); } else cur.to = i;
    }
    return out;
  };
  const noise = rng(7);
  const rowsFor = (id, period, t0, t1, types) => {
    const s = series[id];
    if (!s) return [];
    if (period === "5minute") { // interpolate between the hourly means, centred on the half hour
      const rows = [];
      const a = Math.max(start, Math.ceil(t0 / 300e3) * 300e3);
      for (let t = a; t < Math.min(t1, nowMs); t += 300e3) {
        const f = (t - start) / H - 0.5, i = Math.floor(f), w = f - i;
        const v0 = s.arr[Math.max(0, i)], v1 = s.arr[Math.min(n - 1, i + 1)];
        let v = v0 * (1 - w) + v1 * w;
        if (s.kind === "power") v *= 0.97 + 0.06 * noise();
        const row = { start: t, end: t + 300e3 };
        if (types.includes("mean")) row.mean = v;
        if (types.includes("max")) row.max = s.kind === "level" ? v : v * 1.03;
        if (types.includes("min")) row.min = s.kind === "level" ? v : v * 0.97;
        rows.push(row);
      }
      return rows;
    }
    return bucketsOf(period, t0, t1).map((b) => {
      const row = { start: b.start, end: b.start + (b.to - b.from + 1) * H };
      const slice = [];
      for (let i = b.from; i <= b.to; i++) slice.push(s.arr[i]);
      const mean = slice.reduce((a, v) => a + v, 0) / slice.length;
      if (s.kind === "energy") { row.change = cum[id][b.to + 1] - cum[id][b.from]; row.sum = row.change; row.state = cum[id][b.to + 1]; return row; }
      if (types.includes("mean")) row.mean = mean;
      if (types.includes("max")) row.max = Math.max(...slice) * (s.kind === "power" ? 1.04 : 1);
      if (types.includes("min")) row.min = Math.min(...slice);
      return row;
    });
  };

  // ---- current states
  const iNow = Math.min(nowIdx, n - 1);
  const states = {};
  const friendly = {
    "sensor.roof_east_power": names.east, "sensor.roof_west_power": names.west, "sensor.balcony_south_power": names.balcony, "sensor.garage_power": names.garage,
    "sensor.roof_east_energy": names.east, "sensor.roof_west_energy": names.west, "sensor.balcony_south_energy": names.balcony, "sensor.garage_energy": names.garage,
  };
  const put = (id, value, unit, extra = {}) => { states[id] = { entity_id: id, state: String(Math.round(value * 1000) / 1000), attributes: { friendly_name: friendly[id] || extra.name || id, unit_of_measurement: unit, ...extra.attrs } }; };
  const label = (en, de) => (lang === "de" ? de : en);
  for (const [id, s] of Object.entries(series)) {
    const nm = {
      "sensor.grid_feed_in_power": label("Grid feed-in power", "Einspeiseleistung"), "sensor.grid_feed_in_energy": label("Grid feed-in energy", "Einspeisung Energie"),
      "sensor.grid_import_power": label("Grid import power", "Netzbezug Leistung"), "sensor.grid_import_energy": label("Grid import energy", "Netzbezug Energie"),
      "sensor.house_power": label("House power", "Hausverbrauch Leistung"), "sensor.house_energy": label("House energy", "Hausverbrauch Energie"),
      "sensor.battery_charge_power": label("Battery charging power", "Batterie Ladeleistung"), "sensor.battery_charged_energy": label("Battery charged", "Batterie geladen"),
      "sensor.battery_discharge_power": label("Battery discharging power", "Batterie Entladeleistung"), "sensor.battery_discharged_energy": label("Battery discharged", "Batterie entladen"),
      "sensor.battery_level": label("Battery level", "Batterie Ladestand"), "sensor.battery_health": label("Battery health", "Batterie Gesundheit"), "sensor.solar_irradiance": label("Solar irradiance", "Sonneneinstrahlung"), "sensor.grid_price": label("Electricity price", "Strompreis"),
    }[id];
    if (s.kind === "energy") put(id, cum[id][iNow], "kWh", { name: nm });
    else if (id === "sensor.battery_level" || id === "sensor.battery_health") put(id, s.arr[iNow], "%", { name: nm });
    else if (id === "sensor.grid_price") put(id, s.arr[iNow], "€/kWh", { name: nm });
    else put(id, s.arr[iNow], "W", { name: nm });
  }
  // forecast sensors (kWh): a noisy version of what the model produces
  const dayTotal = (i0) => { const d = dayKey[i0]; let a = 0; for (let i = i0; i < n && dayKey[i] === d; i++) a += prod.reduce((x, arr) => x + arr[i], 0) / 1000; return a; };
  const dayFirst = (i) => { let j = i; while (j > 0 && dayKey[j - 1] === dayKey[i]) j--; return j; };
  const todayFirst = dayFirst(iNow);
  const tomorrowFirst = (() => { let j = iNow; while (dayKey[j] === dayKey[iNow]) j++; return j; })();
  const fToday = dayTotal(todayFirst) * 1.04, fTomorrow = dayTotal(tomorrowFirst) * 0.93;
  let restToday = 0; for (let i = iNow + 1; i < n && dayKey[i] === dayKey[iNow]; i++) restToday += prod.reduce((x, arr) => x + arr[i], 0) / 1000;
  put("sensor.forecast_today", fToday, "kWh", { name: label("Forecast today", "Prognose heute") });
  put("sensor.forecast_tomorrow", fTomorrow, "kWh", { name: label("Forecast tomorrow", "Prognose morgen") });
  put("sensor.forecast_remaining", restToday * 1.04, "kWh", { name: label("Forecast rest of today", "Prognose Rest heute") });
  const forecastLog = {};
  const frand = rng(99);
  for (let i = todayFirst - 24 * 200; i < todayFirst; i += 24) {
    const j = dayFirst(Math.max(0, i));
    if (j >= todayFirst || j < 0) continue;
    forecastLog[dayKey[j]] = Math.round(dayTotal(j) * (0.82 + 0.4 * frand()) * 100) / 100;
  }

  // ---- configuration and settings of the integration
  const cfg = {
    production_power_sensors: plants.map((p) => p.id), production_energy_sensors: plants.map((p) => p.eid),
    feed_in_power_sensor: "sensor.grid_feed_in_power", feed_in_energy_sensor: "sensor.grid_feed_in_energy",
    grid_import_power_sensors: ["sensor.grid_import_power"], grid_import_energy_sensors: ["sensor.grid_import_energy"],
    house_power_sensors: ["sensor.house_power"], house_energy_sensors: ["sensor.house_energy"],
    storage_in_power_sensors: ["sensor.battery_charge_power"], storage_out_power_sensors: ["sensor.battery_discharge_power"],
    storage_in_energy_sensors: ["sensor.battery_charged_energy"], storage_out_energy_sensors: ["sensor.battery_discharged_energy"],
    battery_soc_sensor: "sensor.battery_level", battery_soh_sensor: "sensor.battery_health", irradiance_sensor: "sensor.solar_irradiance", price_import: "sensor.grid_price",
    forecast_today_energy_sensors: ["sensor.forecast_today"], forecast_tomorrow_energy_sensors: ["sensor.forecast_tomorrow"], forecast_remaining_energy_sensors: ["sensor.forecast_remaining"],
    filtered: {},
    settings: {
      strings: Object.fromEntries(plants.map((p) => [p.id, {
        name: names[p.key], peak: p.wp, module_wp: 400, groups: [{ modules: p.modules, azimuth: p.az, tilt: p.tilt, mppt: p.key === "west" ? 2 : 1 }], ...(p.key === "east" || p.key === "west" ? { mppts: 1 } : {}),
      }])),
      inverters: [{ name: names.alpha, max_w: ALPHA_LIMIT, sensors: [plants[0].id, plants[1].id] }],
      general: { storage_capacity_kwh: CAP, battery_min_soc: MIN_SOC, price_feed_in: 0.082, system_cost_eur: 14500, co2_g_per_kwh: 380, latitude: LAT, longitude: LON },
      forecast_log: forecastLog,
    },
  };

  const hass = {
    language: lang, locale: { language: lang === "de" ? "de" : "en-GB" }, themes: { darkMode: true },
    user: { is_admin: true }, config: { latitude: LAT, longitude: LON, time_zone: TZ, currency: "EUR" }, states,
    callWS: async (msg) => {
      if (msg.type === "pv_assistant/config") return cfg;
      if (msg.type === "pv_assistant/set_settings") return cfg.settings;
      if (msg.type === "recorder/statistics_during_period") {
        const t0 = Date.parse(msg.start_time), t1 = Date.parse(msg.end_time);
        const out = {};
        for (const id of msg.statistic_ids) { const rows = rowsFor(id, msg.period, t0, t1, msg.types || []); if (rows.length) out[id] = rows; }
        return out;
      }
      if (msg.type === "history/history_during_period") return {};
      return {};
    },
  };
  return { hass, cfg };
}
