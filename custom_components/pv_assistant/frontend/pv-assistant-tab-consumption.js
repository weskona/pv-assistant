// Consumption tab: base load, course of the day on working days and weekends, consumption by time of day, grid import by hour.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, mergedRows, categoryBarChart, areaChart, localKeyFn, heatmap, median;
export function init(ctx) {
  ({ esc, mergedRows, categoryBarChart, areaChart, localKeyFn, heatmap, median } = ctx);
}

export class ConsumptionPart {
  _buildConsumption() {
    const { E, G } = this._keys();
    const box = this._root.getElementById("con");
    // the consumption comes from the house sensors, otherwise from the energy balance (production, feed-in and grid import)
    this._consumptionOn = !!(G.houseE.length || G.houseP.length || (E.prod.length && E.feed.length && G.impE.length));
    if (!this._consumptionOn) { box.replaceChildren(); return; }
    if (!this._crange) this._crange = "d30";
    box.innerHTML = `<div class="filters" id="cranges"></div><div class="tiles" id="ctiles"></div><ul class="hints" id="chints"></ul>
      <h3 class="ch">${esc(this._t("conProfile"))}</h3><div class="chart" id="cprof"></div>
      <h3 class="ch">${esc(this._t("conHeat"))}</h3><div class="chart" id="cheat"></div>
      <h3 class="ch" id="cdaysh"></h3><div class="chart" id="cdays"></div>
      <div id="cgridbox"><h3 class="ch">${esc(this._t("conGridHour"))}</h3><div class="chart" id="cgrid"></div></div>
      <p class="note">${esc(this._t("conNote"))}</p>`;
    this._picker(box.querySelector("#cranges"), () => this._crange, (v) => { this._crange = v; this._loadConsumption(); });
  }

  async _loadConsumption() {
    if (!this._consumptionOn || !this._hass || !this._root.getElementById("cranges")) return;
    const token = (this._ctoken = (this._ctoken || 0) + 1);
    const { P, E, G } = this._keys();
    const { start, end, capped } = this._window(this._crange);
    const win = { t0: start.getTime(), end: end.getTime() };
    const filt = this._cfg.filtered || {};
    this._root.querySelectorAll("#con .chart").forEach((c) => c.classList.add("loading"));
    const eIds = [...(G.houseE.length ? G.houseE : [...E.prod, ...E.feed, ...E.sin, ...E.sout, ...E.comb]), ...G.impE];
    const pIds = G.houseE.length ? [] : G.houseP;
    const [eres, pres, gmax] = await Promise.all([
      this._stats(eIds.concat(eIds.map((i) => filt[i]).filter(Boolean)), "hour", "change", { energy: "kWh" }, win),
      this._stats(pIds, "hour", "mean", { power: "W" }, win),
      this._stats(G.impP, "hour", "max", { power: "W" }, win),
    ]);
    if (token !== this._ctoken) return;
    this._cdata = { win, capped, eres, pres, gmax, filt, haveP: P.prod.length > 0 };
    this._drawConsumption();
  }

  _drawConsumption() {
    const d = this._cdata;
    const root = this._root;
    if (!d || !this._consumptionOn || !root.getElementById("cranges")) return;
    const { E, G } = this._keys();
    const { win, eres, pres, gmax, filt } = d;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const key = localKeyFn(tz);
    const tl = { summary: this._t("table"), time: this._t("time") };
    root.querySelectorAll("#con .chart").forEach((c) => c.classList.remove("loading"));

    // consumption per hour (kWh): the house energy sensors, their mean power, or the energy balance
    const flip = (inv) => (v) => (inv ? -v : v), nz = (v) => Math.max(v, 0);
    const sumMap = (ids, fn = (v) => v) => {
      const m = new Map();
      for (const id of ids) for (const r of mergedRows(eres, id, filt, "change")) m.set(r.start, (m.get(r.start) || 0) + fn(r.change));
      return m;
    };
    const imp = sumMap(G.impE);
    let house = new Map();
    if (G.houseE.length) house = sumMap(G.houseE);
    else if (G.houseP.length) {
      for (const id of G.houseP) for (const r of pres[id] || []) if (r.mean != null) house.set(r.start, (house.get(r.start) || 0) + nz(r.mean) / 1000);
    } else {
      const prod = sumMap(E.prod), feed = sumMap(E.feed), sIn = sumMap(E.sin), sOut = sumMap(E.sout);
      for (const [ts, v] of sumMap(E.comb, (x) => nz(-flip(E.inv)(x)))) sIn.set(ts, (sIn.get(ts) || 0) + v);
      for (const [ts, v] of sumMap(E.comb, (x) => nz(flip(E.inv)(x)))) sOut.set(ts, (sOut.get(ts) || 0) + v);
      for (const ts of prod.keys()) house.set(ts, nz((prod.get(ts) || 0) + (imp.get(ts) || 0) + (sOut.get(ts) || 0) - (feed.get(ts) || 0) - (sIn.get(ts) || 0)));
    }
    const keys = [...house.keys()].sort((a, b) => a - b);
    if (!keys.length) {
      root.getElementById("ctiles").replaceChildren();
      for (const id of ["cprof", "cheat", "cdays", "cgrid"]) root.getElementById(id)?.replaceChildren(Object.assign(document.createElement("p"), { className: "empty", textContent: this._t("noData") }));
      return;
    }

    // per day: consumption and the lowest hour of the night (the base load)
    const days = new Map(); // day -> {kwh, night:[...], weekend}
    const weekday = Array(24).fill(0), weekdayN = Array(24).fill(0), weekend = Array(24).fill(0), weekendN = Array(24).fill(0);
    const hourSum = Array(24).fill(0), hourN = Array(24).fill(0), impSum = Array(24).fill(0), impN = Array(24).fill(0);
    let peakHour = 0, peakTs = 0;
    for (const ts of keys) {
      const v = house.get(ts), k = key(ts);
      const day = days.get(k.day) || { kwh: 0, night: [], weekend: [0, 6].includes(new Date(Number(k.day.slice(0, 4)), Number(k.day.slice(5, 7)) - 1, Number(k.day.slice(8, 10))).getDay()) };
      day.kwh += v;
      if (k.hour < 6) day.night.push(v);
      days.set(k.day, day);
      (day.weekend ? weekend : weekday)[k.hour] += v; (day.weekend ? weekendN : weekdayN)[k.hour] += 1;
      hourSum[k.hour] += v; hourN[k.hour] += 1;
      if (imp.size) { impSum[k.hour] += imp.get(ts) || 0; impN[k.hour] += 1; }
      if (v > peakHour) { peakHour = v; peakTs = ts; }
    }
    const complete = [...days.entries()].filter(([, x]) => x.night.length >= 5);
    const baseW = complete.length >= 3 ? median(complete.map(([, x]) => Math.min(...x.night) * 1000)) : null; // one hour in kWh is the mean power in kW
    const totalKwh = [...days.values()].reduce((a, x) => a + x.kwh, 0);
    const avgDay = totalKwh / days.size;
    const avgOf = (arr, n) => arr.map((v, h) => (n[h] ? v / n[h] : 0));

    // tiles
    const tiles = [[`${num(totalKwh, 0)} kWh`, this._t("conTotal")], [`${num(avgDay)} kWh`, this._t("conPerDay")]];
    if (baseW != null) tiles.push([`${num(baseW, 0)} W`, this._t("conBase")], [`${num(Math.min(100, (baseW * 24) / 1000 / avgDay * 100), 0)} %`, this._t("conBaseShare")]);
    tiles.push([`${num(peakHour * 1000, 0)} W · ${new Intl.DateTimeFormat(lang, { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(peakTs)}`, this._t("conPeak")]);
    // highest grid import: the measured maximum of the power sensor, otherwise the highest hourly energy
    let peakGrid = null;
    for (const id of G.impP) for (const r of gmax[id] || []) if (r.max != null && (peakGrid == null || r.max > peakGrid)) peakGrid = r.max;
    if (peakGrid == null && imp.size) peakGrid = Math.max(...imp.values()) * 1000;
    if (peakGrid != null && peakGrid > 0) tiles.push([`${num(peakGrid, 0)} W`, this._t("conPeakGrid")]);
    const wdAvg = [...days.values()].filter((x) => !x.weekend), weAvg = [...days.values()].filter((x) => x.weekend);
    if (wdAvg.length >= 3 && weAvg.length >= 1) {
      const a = wdAvg.reduce((s, x) => s + x.kwh, 0) / wdAvg.length, b = weAvg.reduce((s, x) => s + x.kwh, 0) / weAvg.length;
      if (a > 0) tiles.push([`${b >= a ? "+" : "−"}${num(Math.abs(b / a - 1) * 100, 0)} %`, this._t("conWeekendVs")]);
    }
    root.getElementById("ctiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    const hints = [];
    if (baseW != null && baseW > 0 && (baseW * 24) / 1000 / avgDay > 0.25) {
      hints.push(this._t("conBaseHint").replace("{w}", num(baseW, 0)).replace("{p}", num((baseW * 24) / 1000 / avgDay * 100, 0)).replace("{kwh}", num(baseW * 8.76, 0)));
    }
    root.getElementById("chints").innerHTML = hints.map((h) => `<li class="info">${esc(h)}</li>`).join("");

    // course of the day on working days and weekends
    const hours = [...Array(24).keys()];
    const fmtKwh = (v, axis) => `${num(v, axis ? 2 : 3)}${axis ? "" : " kWh"}`;
    areaChart(root.getElementById("cprof"), {
      categories: hours.map((h) => String(h).padStart(2, "0")), series: [],
      lines: [{ name: this._t("conWeekday"), color: "--pva-s1", values: avgOf(weekday, weekdayN) }, ...(weekendN.some((n) => n) ? [{ name: this._t("conWeekendName"), color: "--pva-s3", values: avgOf(weekend, weekendN) }] : [])],
      fmtValue: fmtKwh, empty: this._t("noData"), tableLabels: tl, label: this._t("conProfile"),
    });
    // heat map: one row per day (up to 45 days) or per month
    const perMonth = days.size > 45;
    const rows = new Map();
    for (const ts of keys) {
      const k = key(ts), row = perMonth ? k.day.slice(0, 7) : k.day;
      if (!rows.has(row)) rows.set(row, { sum: Array(24).fill(0), n: Array(24).fill(0) });
      const c = rows.get(row); c.sum[k.hour] += house.get(ts); c.n[k.hour] += 1;
    }
    const rowLabel = (row) => new Intl.DateTimeFormat(lang, perMonth ? { month: "short", year: "2-digit" } : { day: "numeric", month: "numeric" })
      .format(new Date(Number(row.slice(0, 4)), Number(row.slice(5, 7)) - 1, perMonth ? 15 : Number(row.slice(8, 10))));
    heatmap(root.getElementById("cheat"), {
      days: [...rows.keys()].sort().map((row) => ({ label: rowLabel(row), cells: rows.get(row).sum.map((v, h) => (rows.get(row).n[h] ? v / rows.get(row).n[h] : 0)) })),
      colorVar: "--pva-house", fmt: (v) => `${num(v, 2)} kWh`, hourLabel: (h) => `${String(h).padStart(2, "0")}:00`, empty: this._t("noData"), label: this._t("conHeat"),
    });
    // consumption per day (or per month in long ranges)
    const byMonth = days.size > 62;
    const bars = new Map();
    for (const [day, x] of days) { const k = byMonth ? day.slice(0, 7) : day; bars.set(k, (bars.get(k) || 0) + x.kwh); }
    const barKeys = [...bars.keys()].sort();
    root.getElementById("cdaysh").textContent = this._t(byMonth ? "conMonths" : "conDays");
    categoryBarChart(root.getElementById("cdays"), {
      categories: barKeys.map(rowLabelFor(byMonth, lang)), series: [{ name: this._t("conTotal"), color: "--pva-house", values: barKeys.map((k) => bars.get(k)) }],
      fmtValue: (v, axis) => `${num(v, axis ? 0 : 1)}${axis ? "" : " kWh"}`, empty: this._t("noData"), tableLabels: tl, label: this._t(byMonth ? "conMonths" : "conDays"),
    });
    // grid import by time of day
    const gridBox = root.getElementById("cgridbox");
    gridBox.hidden = !imp.size;
    if (imp.size) categoryBarChart(root.getElementById("cgrid"), {
      categories: hours.map((h) => String(h).padStart(2, "0")), series: [{ name: this._t("balFromGrid"), color: "--pva-grid", values: avgOf(impSum, impN) }],
      fmtValue: (v, axis) => `${num(v, axis ? 2 : 3)}${axis ? "" : " kWh"}`, empty: this._t("noData"), tableLabels: tl, label: this._t("conGridHour"),
    });
  }
}

// label of a day ("YYYY-MM-DD") or month ("YYYY-MM") for the axis
function rowLabelFor(month, lang) {
  const f = new Intl.DateTimeFormat(lang, month ? { month: "short", year: "2-digit" } : { day: "numeric", month: "numeric" });
  return (k) => f.format(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, month ? 15 : Number(k.slice(8, 10))));
}
