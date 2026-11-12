// Health of the storage (a section of the Storage tab): the state of health of the manufacturer, the capacity estimated from the
// hourly values and the loss in idle. Part of the panel class: the methods are added to the PVAssistantPanel prototype by
// pv-assistant-panel.js (so `this` is the panel). Shared helpers are handed over by init(ctx) because the modules are loaded with
// the ?v=<version> of the panel.

let esc, mergedRows, categoryBarChart, localKeyFn, estimateCapacity, idleLoss;
export function init(ctx) {
  ({ esc, mergedRows, categoryBarChart, localKeyFn, estimateCapacity, idleLoss } = ctx);
}

const CACHE_MS = 30 * 60e3; // the hourly values of a year are read again after this time only
const DAY = 24 * 3600e3;

export class StorageHealthPart {
  // the markup of the section, for _buildStorage
  _storageHealthMarkup() {
    const t = (k) => esc(this._t(k));
    return `<div id="sohbox" hidden><h3 class="ch">${t("sohTitle")}</h3><div class="tiles" id="sohtiles"></div><ul class="hints" id="sohhints"></ul>
      <h3 class="ch">${t("sohChart")}</h3><div class="chart" id="sohchart"></div><p class="note" id="sohnote"></p></div>`;
  }

  async _loadStorageHealth() {
    const { E, G } = this._keys();
    const hasEnergy = E.sin.length + E.sout.length + E.comb.length > 0;
    const box = this._root.getElementById("sohbox");
    if (!box) return;
    if (!G.soh.length && !(G.soc.length && hasEnergy)) { box.hidden = true; return; }
    if (this._shdata && Date.now() - this._shdata.at < CACHE_MS) { this._drawStorageHealth(); return; }
    const token = (this._shtoken = (this._shtoken || 0) + 1);
    const end = Date.now(), t0 = end - 365 * DAY;
    const filt = this._cfg.filtered || {};
    const ids = [...E.sin, ...E.sout, ...E.comb];
    const [sres, eres, soh] = await Promise.all([
      G.soc.length ? this._stats(G.soc, "hour", "mean", {}, { t0, end }) : {},
      G.soc.length && hasEnergy ? this._stats(ids.concat(ids.map((i) => filt[i]).filter(Boolean)), "hour", "change", { energy: "kWh" }, { t0, end }) : {},
      G.soh.length ? this._ltMonthly("soh", G.soh, "mean", {}).catch(() => ({})) : {},
    ]);
    if (token !== this._shtoken) return;
    this._shdata = { at: Date.now(), t0, end, sres, eres, soh, filt };
    this._drawStorageHealth();
  }

  _drawStorageHealth() {
    const d = this._shdata;
    const root = this._root;
    const box = root.getElementById("sohbox");
    if (!d || !box) return;
    const { E, G } = this._keys();
    const { sres, eres, soh, filt } = d;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const key = localKeyFn(tz);
    const monthOf = (ts) => key(ts).day.slice(0, 7);
    const gen = this._cfg.settings?.general || {};
    const nominal = gen.storage_capacity_kwh > 0 ? gen.storage_capacity_kwh : 0;

    // hourly rows: level and energy into and out of the storage
    const flip = (inv) => (v) => (inv ? -v : v), nz = (v) => Math.max(v, 0);
    const sumMap = (ids, fn = (v) => v) => {
      const m = new Map();
      for (const id of ids) for (const r of mergedRows(eres, id, filt, "change")) m.set(r.start, (m.get(r.start) || 0) + fn(r.change));
      return m;
    };
    const inMap = new Map(sumMap(E.sin)), outMap = new Map(sumMap(E.sout));
    for (const [ts, v] of sumMap(E.comb, (x) => nz(-flip(E.inv)(x)))) inMap.set(ts, (inMap.get(ts) || 0) + v);
    for (const [ts, v] of sumMap(E.comb, (x) => nz(flip(E.inv)(x)))) outMap.set(ts, (outMap.get(ts) || 0) + v);
    const socRows = G.soc.length ? (sres[G.soc[0]] || []).filter((r) => r.mean != null) : [];
    const rows = socRows.map((r) => ({ ts: r.start, soc: r.mean, inKwh: inMap.get(r.start) ?? 0, outKwh: outMap.get(r.start) ?? 0 }));
    const tIn = [...inMap.values()].reduce((a, v) => a + v, 0), tOut = [...outMap.values()].reduce((a, v) => a + v, 0);
    const efficiency = tIn > 20 && tOut > 0 ? Math.min(0.98, Math.max(0.8, tOut / tIn)) : 0.92;
    const capByMonth = rows.length ? estimateCapacity(rows, monthOf, efficiency) : new Map();
    const idle = rows.length ? idleLoss(rows) : null;

    // the health sensor of the manufacturer: monthly means over the whole history, and the value now
    const sohRows = G.soh.length ? (soh[G.soh[0]] || []).filter((r) => r.mean != null).map((r) => [monthOf(r.start), r.mean]) : [];
    const sohByMonth = new Map(sohRows);
    const sohNow = G.soh.length ? parseFloat(this._hass.states[G.soh[0]]?.state) : NaN;

    const capKeys = [...capByMonth.keys()].sort();
    // the months of the chart: those of the estimate (a year of hourly values) and the months of the sensor from the first of them on
    const window12 = [...sohByMonth.keys()].sort().slice(-12);
    const months = [...new Set([...capKeys, ...(capKeys.length ? window12.filter((m) => m >= capKeys[0]) : window12)])].sort();
    const hasCap = capByMonth.size >= 2, hasSoh = sohByMonth.size >= 2;
    box.hidden = !(G.soh.length || capByMonth.size || idle);
    if (box.hidden) return;

    // key figures and hints
    const tiles = [], hints = [];
    const years = (a, b) => (new Date(`${b}-15`) - new Date(`${a}-15`)) / (365.25 * DAY);
    if (!Number.isNaN(sohNow)) tiles.push([`${num(sohNow, 1)} %`, this._t("sohNow")]);
    const sohKeys = [...sohByMonth.keys()].sort();
    if (sohKeys.length >= 6) {
      const y = years(sohKeys[0], sohKeys.at(-1));
      const perYear = y > 0 ? (sohByMonth.get(sohKeys.at(-1)) - sohByMonth.get(sohKeys[0])) / y : 0;
      tiles.push([`${perYear > 0 ? "+" : ""}${num(perYear, 2)}`, this._t("sohPerYear")]);
      if (perYear < -0.05) {
        const current = Number.isNaN(sohNow) ? sohByMonth.get(sohKeys.at(-1)) : sohNow;
        const toEighty = current > 80 ? (current - 80) / -perYear : 0;
        hints.push(this._t("sohHintTrend").replace("{p}", num(-perYear, 2)).replace("{y}", num(toEighty, 0)) + (-perYear > 3 ? ` ${this._t("sohHintFast")}` : ""));
      }
    }
    if (capKeys.length) {
      const last = capByMonth.get(capKeys.at(-1)).capacity, first = capByMonth.get(capKeys[0]).capacity;
      tiles.push([`${num(last, 1)} kWh`, this._t("sohCapNow")]);
      if (nominal > 0) tiles.push([`${num((last / nominal) * 100, 0)} %`, this._t("sohCapNominal")]);
      if (capKeys.length >= 2) tiles.push([`${last >= first ? "+" : "−"}${num(Math.abs(last / first - 1) * 100, 1)} %`, this._t("sohCapFirst")]);
      if (capKeys.length >= 4 && last < first * 0.9) hints.push(this._t("sohHintCapDrop").replace("{p}", num((1 - last / first) * 100, 0)));
      // sensor and estimate against each other: both measure the same loss, but the estimate is rough
      if (sohKeys.length >= 2 && capKeys.length >= 2) {
        const common = capKeys.filter((m) => sohByMonth.has(m));
        if (common.length >= 2) {
          const dSoh = sohByMonth.get(common.at(-1)) - sohByMonth.get(common[0]);
          const dCap = (capByMonth.get(common.at(-1)).capacity / capByMonth.get(common[0]).capacity - 1) * 100;
          if (Math.abs(dSoh - dCap) > 8) hints.push(this._t("sohHintMismatch").replace("{d}", num(Math.abs(dSoh - dCap), 0)));
        }
      }
    }
    if (idle) {
      const kwh = nominal > 0 ? (idle.perDay / 100) * nominal : null;
      tiles.push([`${num(idle.perDay, 1)} %${kwh != null ? ` · ${num(kwh, 2)} kWh` : ""}`, this._t("sohIdle")]);
      if (idle.perDay > 3) hints.push(this._t("sohHintIdle").replace("{p}", num(idle.perDay, 1)));
    }
    root.getElementById("sohtiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    root.getElementById("sohhints").innerHTML = hints.map((h) => `<li class="info">${esc(h)}</li>`).join("");

    // chart: the change against the first month shown (the sensor in points, the estimate in percent)
    const chart = root.getElementById("sohchart");
    const fm = new Intl.DateTimeFormat(lang, { month: "short", year: "2-digit" });
    const label = (m) => fm.format(new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 15));
    const firstOf = (map, pick) => { const k = months.find((m) => map.has(m)); return k ? pick(map.get(k)) : null; };
    const baseSoh = firstOf(sohByMonth, (v) => v), baseCap = firstOf(capByMonth, (v) => v.capacity);
    const series = [];
    if (hasSoh && baseSoh != null) series.push({ name: this._t("sohSeriesSensor"), color: "--pva-s1", values: months.map((m) => (sohByMonth.has(m) ? sohByMonth.get(m) - baseSoh : null)) });
    if (hasCap && baseCap != null) series.push({ name: this._t("sohSeriesCap"), color: "--pva-s3", values: months.map((m) => (capByMonth.has(m) ? (capByMonth.get(m).capacity / baseCap - 1) * 100 : null)) });
    if (series.length && months.length >= 2) {
      categoryBarChart(chart, {
        categories: months.map(label), series,
        fmtValue: (v, axis) => `${v > 0 ? "+" : ""}${num(v, axis ? 1 : 2)}${axis ? "" : " %"}`, empty: this._t("noData"),
        tableLabels: { summary: this._t("table"), time: this._t("time") }, label: this._t("sohChart"),
      });
    } else chart.replaceChildren(Object.assign(document.createElement("p"), { className: "empty", textContent: this._t("sohNoChart") }));
    root.getElementById("sohnote").textContent = this._t("sohNote");
  }
}
