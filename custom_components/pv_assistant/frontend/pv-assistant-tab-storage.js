// Storage tab.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, mergedRows, lineChart, barChart, categoryBarChart, localKeyFn, heatmap, simulateStorage;
export function init(ctx) {
  ({ esc, mergedRows, lineChart, barChart, categoryBarChart, localKeyFn, heatmap, simulateStorage } = ctx);
}

export class StoragePart {
  _buildStorage() {
    const { P, E, G } = this._keys();
    const has = (x) => x.sin.length || x.sout.length || x.comb.length;
    this._storageOn = !!(has(P) || has(E) || G.soc.length);
    const box = this._root.getElementById("sto");
    if (!this._storageOn) { box.replaceChildren(); return; }
    if (!this._srange) this._srange = "today";
    box.innerHTML = `<div class="filters" id="sranges"></div><div class="tiles" id="stiles"></div>${G.soc.length ? `
      <h3 class="ch">${esc(this._t("socChart"))}</h3><div class="chart" id="sosoc"></div>` : ""}${has(P) ? `
      <h3 class="ch" id="sopowh">${esc(this._t("stoPower"))} (W)</h3><div class="chart" id="sopow"></div>` : ""}${has(E) ? `
      <h3 class="ch">${esc(this._t("stoEnergy"))} (kWh)</h3><div class="chart" id="soen"></div>` : ""}${has(E) ? `
      <div id="sobenbox"><h3 class="ch">${esc(this._t("stoBenChart"))}</h3><div class="chart" id="soben"></div></div>
      <div id="soeffbox"><h3 class="ch">${esc(this._t("stoEffChart"))}</h3><div class="chart" id="soeff"></div></div>
      <div id="socycbox"><h3 class="ch">${esc(this._t("stoCycChart"))}</h3><div class="chart" id="socyc"></div></div>` : ""}${G.soc.length ? `
      <div id="soheatbox"><h3 class="ch" id="soheath">${esc(this._t("stoHeat"))}</h3><div class="chart" id="soheat"></div></div>` : ""}${has(E) && E.prod.length ? `
      <div id="sosimbox"><h3 class="ch">${esc(this._t("simTitle"))}</h3>
      <div class="setcard" id="simform"><div class="setrow"><label for="simcap">${esc(this._t("simCap"))}</label><input type="number" id="simcap" min="0" step="0.5"></div>
        <div class="setrow"><label for="simpow">${esc(this._t("simPower"))}</label><input type="number" id="simpow" min="0" step="0.5"></div>
        <div class="setrow"><label for="simeff">${esc(this._t("simEff"))}</label><input type="number" id="simeff" min="50" max="100" step="1"></div>
        <div class="setrow"><label for="simprice">${esc(this._t("simPrice"))}</label><input type="number" id="simprice" min="0" step="10"></div></div>
      <div class="tiles" id="simtiles"></div><ul class="hints" id="simhints"></ul>
      <h3 class="ch">${esc(this._t("stoSimAut"))}</h3><div class="chart" id="sosimaut"></div>
      <div id="sosimbenbox"><h3 class="ch">${esc(this._t("stoSimBen"))}</h3><div class="chart" id="sosimben"></div>
      <h3 class="ch">${esc(this._t("stoSimMarg"))}</h3><div class="chart" id="sosimmarg"></div></div>
      <p class="note" id="sosimnote"></p></div>` : ""}${G.soc.length ? `
      <h3 class="ch">${esc(this._t("stoSocHist"))}</h3><div class="chart" id="sosochist"></div>` : ""}
      <p class="note" id="sonote"></p>`;
    const ranges = box.querySelector("#sranges");
    this._picker(ranges, () => this._srange, (v) => { this._srange = v; this._loadStorage(); });
    for (const id of ["simcap", "simpow", "simeff", "simprice"]) {
      box.querySelector(`#${id}`)?.addEventListener("input", () => {
        this._simState = { cap: this._simNum("simcap"), power: this._simNum("simpow"), eff: this._simNum("simeff"), price: this._simNum("simprice") };
        try { localStorage.setItem("pv_assistant_sim", JSON.stringify(this._simState)); } catch (e) { /* storage unavailable */ }
        this._drawStorageSim();
      });
    }
  }

  async _loadStorage() {
    if (!this._storageOn || !this._hass || !this._root.getElementById("sranges")) return;
    const token = (this._stoken = (this._stoken || 0) + 1);
    const rd = this._rangeDef(this._srange);
    const { P, E, G } = this._keys();
    const filt = this._cfg.filtered || {};
    const energyIds = [...E.sin, ...E.sout, ...E.comb];
    const energyAll = energyIds.concat(energyIds.map((i) => filt[i]).filter(Boolean));
    this._root.querySelectorAll("#sto .chart").forEach((c) => c.classList.add("loading"));
    const powIds = [...P.sin, ...P.sout, ...P.comb];
    // means hide the peaks (a full battery for one hour is no 100 % in a daily mean), so the extremes are read as well
    const [pres, eres, smax, smin, pmax, pmin] = await Promise.all([
      this._stats([...powIds, ...G.soc], rd.pPeriod, "mean", { power: "W" }, rd),
      this._stats(energyAll, rd.long ? "month" : rd.eBucket === 3600e3 ? "hour" : "day", "change", { energy: "kWh" }, rd),
      this._stats(G.soc, rd.pPeriod, "max", {}, rd),
      this._stats(G.soc, rd.pPeriod, "min", {}, rd),
      this._stats(powIds, rd.pPeriod, "max", { power: "W" }, rd),
      this._stats(powIds, rd.pPeriod, "min", { power: "W" }, rd),
    ]);
    if (token !== this._stoken) return;
    this._sdata = { rd, pres, eres, filt, smax, smin, pmax, pmin };
    this._drawStorage();
    this._loadStorageDeep(rd, token);
  }

  // hourly values for the level heat map and the what-if simulation: the range, at least 30 days, at most the last 12 months
  async _loadStorageDeep(rd, token) {
    if (!this._root.getElementById("soheatbox") && !this._root.getElementById("sosimbox")) return;
    const { E, G } = this._keys();
    const day = 24 * 3600e3, end = rd.end;
    const t0 = Math.max(Math.min(rd.t0, end - 30 * day), end - 365 * day);
    const filt = this._cfg.filtered || {};
    const ids = [...E.prod, ...E.feed, ...E.sin, ...E.sout, ...E.comb, ...G.impE, ...G.houseE];
    const [eres, sres] = await Promise.all([
      this._stats(ids.concat(ids.map((i) => filt[i]).filter(Boolean)), "hour", "change", { energy: "kWh" }, { t0, end }),
      this._stats(G.soc, "hour", "mean", {}, { t0, end }),
    ]);
    if (token !== this._stoken) return;
    this._sdeep = { t0, end, eres, sres, filt };
    this._drawStorageDeep();
  }

  _drawStorageDeep() {
    const d = this._sdeep;
    const root = this._root;
    if (!d || !root.getElementById("sranges")) return;
    const { E, G } = this._keys();
    const { t0, end, eres, sres, filt } = d;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const nDays = Math.max(1, Math.round((end - t0) / (24 * 3600e3)));
    const key = localKeyFn(tz);
    const tl = { summary: this._t("table"), time: this._t("time") };
    // level by time of day: one row per day (up to 45 days) or per month
    const heatBox = root.getElementById("soheat");
    if (heatBox && G.soc.length) {
      const perMonth = nDays > 45;
      const rows = new Map(); // row -> {sum[24], n[24]}
      for (const r of mergedRows(sres, G.soc[0], filt, "mean")) {
        const k = key(r.start);
        const row = perMonth ? k.day.slice(0, 7) : k.day;
        if (!rows.has(row)) rows.set(row, { sum: Array(24).fill(0), n: Array(24).fill(0) });
        const c = rows.get(row); c.sum[k.hour] += r.mean; c.n[k.hour] += 1;
      }
      const label = (row) => (perMonth ? new Intl.DateTimeFormat(lang, { month: "short", year: "2-digit" }).format(new Date(Number(row.slice(0, 4)), Number(row.slice(5, 7)) - 1, 15))
        : new Intl.DateTimeFormat(lang, { day: "numeric", month: "numeric" }).format(new Date(Number(row.slice(0, 4)), Number(row.slice(5, 7)) - 1, Number(row.slice(8, 10)))));
      root.getElementById("soheath").textContent = this._t("stoHeatDays").replace("{n}", String(nDays));
      heatmap(heatBox, {
        days: [...rows.keys()].sort().map((row) => ({ label: label(row), cells: rows.get(row).sum.map((v, h) => (rows.get(row).n[h] ? v / rows.get(row).n[h] : 0)) })),
        colorVar: "--pva-bout", fmt: (v) => `${num(v, 0)} %`, hourLabel: (h) => `${String(h).padStart(2, "0")}:00`, empty: this._t("noData"), label: this._t("stoHeat"),
      });
    }
    // what-if: the same hours with a storage of another size (the form and the results are in _drawStorageSim)
    const simBox = root.getElementById("sosimbox");
    if (!simBox) return;
    const flip = (inv) => (v) => (inv ? -v : v), nz = (v) => Math.max(v, 0);
    const sumMap = (ids, fn = (v) => v) => {
      const m = new Map();
      for (const id of ids) for (const r of mergedRows(eres, id, filt, "change")) m.set(r.start, (m.get(r.start) || 0) + fn(r.change));
      return m;
    };
    const prod = sumMap(E.prod), feed = sumMap(E.feed), imp = sumMap(G.impE), house = sumMap(G.houseE);
    const sIn = new Map(sumMap(E.sin)), sOut = new Map(sumMap(E.sout));
    for (const [ts, v] of sumMap(E.comb, (x) => nz(-flip(E.inv)(x)))) sIn.set(ts, (sIn.get(ts) || 0) + v);
    for (const [ts, v] of sumMap(E.comb, (x) => nz(flip(E.inv)(x)))) sOut.set(ts, (sOut.get(ts) || 0) + v);
    const haveLoad = G.houseE.length || (G.impE.length && E.feed.length);
    const keys = [...prod.keys()].sort((a, b) => a - b);
    // the consumption of an hour: the house sensor, otherwise what the energy balance says
    const hours = keys.map((ts) => [prod.get(ts) || 0, G.houseE.length ? house.get(ts) || 0 : Math.max(0, (prod.get(ts) || 0) + (imp.get(ts) || 0) + (sOut.get(ts) || 0) - (feed.get(ts) || 0) - (sIn.get(ts) || 0))]);
    simBox.hidden = !(haveLoad && hours.length >= 24 * 7);
    if (simBox.hidden) { this._ssim = null; return; }
    const gen = this._cfg.settings?.general || {};
    const cap = gen.storage_capacity_kwh > 0 ? gen.storage_capacity_kwh : 0, minSoc = gen.battery_min_soc > 0 ? Math.min(gen.battery_min_soc, 100) : 0;
    const tIn = [...sIn.values()].reduce((a, v) => a + v, 0), tOut = [...sOut.values()].reduce((a, v) => a + v, 0);
    const numOf = (id) => { const v = parseFloat(this._hass.states[id]?.state); return Number.isNaN(v) ? null : v; };
    this._ssim = {
      hours, nDays, usableNow: cap * (1 - minSoc / 100),
      effMeasured: tIn > 20 && tOut > 0 ? Math.min(0.98, Math.max(0.7, tOut / tIn)) : 0.9,
      // the hourly maxima are the limits that fit a model that works on whole hours
      powerMeasured: Math.ceil(Math.max(0, ...sIn.values(), ...sOut.values()) * 10) / 10,
      measuredImp: G.impE.length ? [...imp.values()].reduce((a, v) => a + v, 0) : null,
      pImp: (G.priceImp && numOf(G.priceImp)) || gen.price_import || null, pFeed: (G.priceFeed && numOf(G.priceFeed)) || gen.price_feed_in || null,
    };
    if (!this._simState) {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem("pv_assistant_sim") || "null"); } catch (e) { saved = null; }
      const c = this._ssim;
      this._simState = saved && Number.isFinite(saved.cap) ? saved : { cap: Math.round((c.usableNow || 10) * 10) / 10, power: c.powerMeasured, eff: Math.round(c.effMeasured * 100), price: 0 };
      for (const [id, v] of [["simcap", this._simState.cap], ["simpow", this._simState.power], ["simeff", this._simState.eff], ["simprice", this._simState.price]]) {
        const input = root.getElementById(id);
        if (input) input.value = Number.isFinite(v) ? String(v) : "";
      }
    }
    this._drawStorageSim();
  }

  _simNum(id) {
    const v = parseFloat(this._root.getElementById(id)?.value);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }

  // results of the scenario with the values of the form: key figures, check against the measurement and the charts over the size
  _drawStorageSim() {
    const c = this._ssim, root = this._root;
    if (!c || !root.getElementById("sosimbox")) return;
    const st = this._simState || { cap: 0, power: 0, eff: 90, price: 0 };
    const lang = this._hass.locale?.language || this._hass.language;
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const tl = { summary: this._t("table"), time: "kWh" };
    const { hours, nDays, usableNow, pImp, pFeed } = c;
    const eff = Math.min(1, Math.max(0.5, (st.eff || 90) / 100)), power = st.power || 0;
    const scale = nDays < 330 ? 365 / nDays : 1;
    const load = hours.reduce((a, [, h]) => a + h, 0), produced = hours.reduce((a, [p]) => a + p, 0);
    const run = (size) => simulateStorage(hours, size, eff, power);
    const base = run(0);
    const benefit = (r) => (pImp ? ((base.imp - r.imp) * pImp - (base.feed - r.feed) * (pFeed || 0)) * scale : null);
    const sc = run(st.cap);
    const tiles = [
      [`${num(load > 0 ? (1 - sc.imp / load) * 100 : 0, 0)} %`, this._t("autarky")],
      [`${num(produced > 0 ? ((produced - sc.feed) / produced) * 100 : 0, 0)} %`, this._t("selfShare")],
      [`${num(sc.imp * scale, 0)} kWh`, this._t("simImp")], [`${num(sc.feed * scale, 0)} kWh`, this._t("simFeed")],
    ];
    const ben = benefit(sc);
    if (ben != null) tiles.push([`${num(ben, 0)} €`, this._t("simBen")]);
    if (ben != null && st.cap > 1) tiles.push([`${num(ben - benefit(run(st.cap - 1)), 0)} €`, this._t("simMarg")]);
    if (st.price > 0 && st.cap > 0) {
      tiles.push([`${num(st.price * st.cap, 0)} €`, this._t("simInvest")]);
      tiles.push([ben > 0 ? this._t("simYears").replace("{y}", num((st.price * st.cap) / ben, 1)) : "–", this._t("simPayback")]);
    }
    root.getElementById("simtiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    // check: the same model with the real storage against the measured grid import
    const hints = [];
    if (usableNow > 0 && c.measuredImp > 0) {
      const real = simulateStorage(hours, usableNow, c.effMeasured, c.powerMeasured);
      const dev = ((real.imp - c.measuredImp) / c.measuredImp) * 100;
      hints.push(this._t("simCalib").replace("{m}", num(c.measuredImp, 0)).replace("{s}", num(real.imp, 0)).replace("{d}", `${dev > 0 ? "+" : ""}${num(dev, 0)}`) + (Math.abs(dev) > 15 ? ` ${this._t("simCalibWarn")}` : ""));
    }
    root.getElementById("simhints").innerHTML = hints.map((h) => `<li class="info">${esc(h)}</li>`).join("");
    // over the size: the usual steps plus the real and the scenario size
    const steps = [0, 2.5, 5, 7.5, 10, 12.5, 15, 20, 30];
    const real = usableNow > 0 ? Math.round(usableNow * 10) / 10 : null, mine = st.cap > 0 ? Math.round(st.cap * 10) / 10 : null;
    const sizes = [...new Set([...steps, ...(real ? [real] : []), ...(mine ? [mine] : [])])].filter((v) => v <= Math.max(30, (real || 0) * 2, (mine || 0) * 1.5)).sort((a, b) => a - b);
    const results = sizes.map((v) => run(v));
    const cats = sizes.map((v) => `${num(v, 1)}${v === real ? " ★" : ""}${v === mine ? " ◆" : ""}`);
    categoryBarChart(root.getElementById("sosimaut"), {
      categories: cats, series: [{ name: this._t("autarky"), color: "--pva-pos", values: results.map((r) => (load > 0 ? (1 - r.imp / load) * 100 : null)) }],
      fmtValue: (v, axis) => `${num(v, 0)}${axis ? "" : " %"}`, empty: this._t("noData"), tableLabels: tl, label: this._t("stoSimAut"),
    });
    const benBox = root.getElementById("sosimbenbox");
    benBox.hidden = !pImp;
    if (pImp) {
      const bens = results.map(benefit);
      categoryBarChart(root.getElementById("sosimben"), {
        categories: cats, series: [{ name: this._t("stoSimBen"), color: "--pva-bout", values: bens }],
        fmtValue: (v, axis) => `${num(v, 0)}${axis ? "" : " €"}`, empty: this._t("noData"), tableLabels: tl, label: this._t("stoSimBen"),
      });
      // what the next kWh brings: the extra benefit of a step divided by its size
      categoryBarChart(root.getElementById("sosimmarg"), {
        categories: cats.slice(1), series: [{ name: this._t("stoSimMarg"), color: "--pva-s2", values: bens.slice(1).map((b, i) => (b - bens[i]) / (sizes[i + 1] - sizes[i])) }],
        fmtValue: (v, axis) => `${num(v, axis ? 0 : 1)}${axis ? "" : " €"}`, empty: this._t("noData"), tableLabels: tl, label: this._t("stoSimMarg"),
      });
    }
    root.getElementById("sosimnote").textContent = this._t("stoSimNote").replace("{n}", String(nDays));
  }

  _drawStorage() {
    const d = this._sdata;
    if (!d || !this._storageOn || !this._root.getElementById("sranges")) return;
    const { rd, pres, eres, filt, smax, smin, pmax, pmin } = d;
    const { P, E, G } = this._keys();
    const root = this._root;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const fm = (o) => new Intl.DateTimeFormat(lang, { ...o, timeZone: tz });
    const fDT = fm({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const fD = fm({ weekday: "short", day: "numeric", month: "numeric" });
    const fH = fm({ hour: "2-digit", minute: "2-digit" });
    const fDM = fm({ day: "numeric", month: "numeric" });
    const num = (v, dec = 2) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const get = (res, id, field) => (res[id] || []).filter((r) => r[field] != null);
    const pr = (id) => get(pres, id, "mean");
    const pickE = (id) => mergedRows(eres, id, filt, "change");
    const add = (m, ts, v) => m.set(ts, (m.get(ts) || 0) + v);
    const each = (ids, rows, field, fn) => ids.map((id) => {
      const m = new Map();
      for (const r of rows(id)) add(m, r.start, fn(r[field]));
      return { name: this._read(id).name, values: m };
    });
    const total = (parts) => { const m = new Map(); for (const x of parts) for (const [k, v] of x.values) add(m, k, v); return m; };
    const toPts = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]);
    const sum = (m) => [...m.values()].reduce((a, v) => a + v, 0);
    const timeLabels = { summary: this._t("table"), time: this._t("time") };
    const fMon = fm(new Date(rd.t0).getFullYear() === new Date(rd.t1 - 1).getFullYear() ? { month: "short" } : { month: "short", year: "2-digit" });
    const tickFmt = rd.long ? (t) => fMon.format(t + 15 * 24 * 3600e3) : rd.days === 1 ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t);

    // sign convention of the combined sensors: positive = from storage unless inverted
    const nz = (v) => Math.max(v, 0);
    const ns = P.absStorage ? (v) => Math.abs(v) : nz;
    const w = (inv) => (v) => (inv ? -v : v);
    const outP = [...each(P.sout, pr, "mean", ns), ...each(P.comb, pr, "mean", (v) => nz(w(P.inv)(v)))];
    const inP = [...each(P.sin, pr, "mean", ns), ...each(P.comb, pr, "mean", (v) => nz(-w(P.inv)(v)))];
    const netP = new Map();
    for (const [ts, v] of total(outP)) add(netP, ts, v);
    for (const [ts, v] of total(inP)) add(netP, ts, -v);
    const netParts = [...each(P.sout, pr, "mean", ns), ...each(P.sin, pr, "mean", (v) => -ns(v)), ...each(P.comb, pr, "mean", w(P.inv))];

    // peak power per bucket from the max / min statistics (sum over the storages)
    const mmRows = (res, id, field) => new Map(get(res, id, field).map((r) => [r.start, r[field]]));
    const peakOut = new Map(), peakIn = new Map();
    for (const id of [...P.sin, ...P.sout]) {
      const mx = mmRows(pmax, id, "max"), mn = mmRows(pmin, id, "min");
      const target = P.sout.includes(id) ? peakOut : peakIn;
      for (const [ts, v] of mx) add(target, ts, P.absStorage ? Math.max(Math.abs(v), Math.abs(mn.get(ts) ?? 0)) : Math.max(v, 0));
    }
    for (const id of P.comb) { // default: positive = from storage, negative = into storage
      const mx = mmRows(pmax, id, "max"), mn = mmRows(pmin, id, "min");
      for (const ts of new Set([...mx.keys(), ...mn.keys()])) {
        const hi = mx.get(ts) ?? 0, lo = mn.get(ts) ?? 0;
        add(peakOut, ts, Math.max(P.inv ? -lo : hi, 0));
        add(peakIn, ts, Math.max(P.inv ? hi : -lo, 0));
      }
    }
    // level
    const socRows = G.soc.length ? pr(G.soc[0]) : [];
    const socMaxRows = G.soc.length ? get(smax, G.soc[0], "max") : [], socMinRows = G.soc.length ? get(smin, G.soc[0], "min") : [];
    const soc = socRows.map((r) => r.mean);
    const socBox = root.getElementById("sosoc");
    const socPts = (rows, field) => toPts(new Map(rows.map((r) => [r.start, r[field]])));
    if (socBox) lineChart(socBox, {
      series: rd.long && socMaxRows.length
        ? [{ name: this._t("stoSocMax"), short: this._t("stoSocMax"), color: "--pva-s2", points: socPts(socMaxRows, "max") },
           { name: this._t("stoSocAvg"), short: this._t("stoSocAvg"), color: "--pva-s1", points: socPts(socRows, "mean") },
           { name: this._t("stoSocMin"), short: this._t("stoSocMin"), color: "--pva-s3", points: socPts(socMinRows, "min") }]
        : [{ name: this._t("socName"), short: this._t("socName"), color: "--pva-s1", points: toPts(new Map(socRows.map((r) => [r.start, r.mean]))) }],
      t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis ? 1 : 0)} %`, fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
      empty: this._t("noData"), tableLabels: timeLabels, label: this._t("socChart"),
    });
    const powBox = root.getElementById("sopow");
    if (powBox && rd.long) {
      root.getElementById("sopowh").textContent = `${this._t("stoPeakPower")} (W)`;
      lineChart(powBox, {
        series: [{ name: this._t("stoPeakOut"), short: this._t("sout"), color: "--pva-bout", points: toPts(peakOut) },
                 { name: this._t("stoPeakIn"), short: this._t("sin"), color: "--pva-bin", points: toPts(new Map([...peakIn].map(([k, v]) => [k, -v]))) }],
        t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
        fmtValue: (v, axis) => `${num(v, axis ? 1 : 0)}${axis ? "" : " W"}`, fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
        empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("stoPeakPower")} (W)`,
      });
    } else if (powBox) {
      root.getElementById("sopowh").textContent = `${this._t("stoPower")} (W)`;
      lineChart(powBox, {
      series: [{ name: this._t("storageNet"), short: this._t("storage"), color: "--pva-bout", colorNeg: "--pva-bin",
        legendItems: [{ name: `${this._t("sout")} (+)`, color: "--pva-bout" }, { name: `${this._t("sin")} (−)`, color: "--pva-bin" }],
        points: toPts(netP), parts: netParts }],
      t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis ? 1 : 0)}${axis ? "" : " W"}`, fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
      empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("stoPower")} (W)`,
      });
    }

    // energy per hour / day
    const flip = (inv) => (v) => (inv ? -v : v);
    const outE = [...each(E.sout, pickE, "change", (v) => v), ...each(E.comb, pickE, "change", (v) => nz(flip(E.inv)(v)))];
    const inE = [...each(E.sin, pickE, "change", (v) => v), ...each(E.comb, pickE, "change", (v) => nz(-flip(E.inv)(v)))];
    const eOut = total(outE), eIn = total(inE);
    const hourly = rd.eBucket === 3600e3;
    const enBox = root.getElementById("soen");
    if (enBox && rd.long) {
      const { categories, toArr } = this._monthAxis(rd, tz, fMon);
      const mk = (s) => ({ ...s, values: toArr(s.values), parts: s.parts && s.parts.map((x) => ({ ...x, values: toArr(x.values) })) });
      categoryBarChart(enBox, {
        categories,
        series: [mk({ name: this._t("sin"), color: "--pva-bin", values: eIn, parts: inE }), mk({ name: this._t("sout"), color: "--pva-bout", values: eOut, parts: outE })],
        fmtValue: (v, axis) => `${num(v, axis ? 1 : 2)}${axis ? "" : " kWh"}`,
        empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("stoEnergy")} (kWh)`,
      });
    } else if (enBox) barChart(enBox, {
      series: [
        { name: this._t("sin"), color: "--pva-bin", values: eIn, parts: inE },
        { name: this._t("sout"), color: "--pva-bout", values: eOut, parts: outE },
      ],
      t0: rd.t0, t1: rd.t1, bucket: rd.eBucket, tickStep: hourly ? 3 * 3600e3 : rd.days === 7 ? 24 * 3600e3 : 5 * 24 * 3600e3,
      fmtValue: (v, axis) => `${num(v, axis ? 1 : 2)}${axis ? "" : " kWh"}`,
      fmtTime: (t) => (hourly ? fDT.format(t) : fD.format(t)),
      fmtTick: hourly ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t),
      empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("stoEnergy")} (kWh)`,
    });

    // tiles
    const tiles = [];
    const gen = this._cfg.settings?.general || {};
    const nowSoc = G.soc.length ? parseFloat(this._hass.states[G.soc[0]]?.state) : NaN;
    if (!Number.isNaN(nowSoc)) tiles.push([`${num(nowSoc, 0)} %`, this._t("stoNow")]);
    const tIn = sum(eIn), tOut = sum(eOut);
    if (tIn > 0) tiles.push([`${num(tIn)} kWh`, this._t("sin")]);
    if (tOut > 0) tiles.push([`${num(tOut)} kWh`, this._t("sout")]);
    if (tIn > 0 && tOut > 0) tiles.push([`${num((tOut / tIn) * 100, 0)} %`, this._t("storEff")]);
    // what the storage brings in money: discharged energy replaces bought energy, charged energy would otherwise have been fed in
    const stoNotes = [];
    if (tIn > 0 && tOut > 0) {
      const numOf = (id) => { const v = parseFloat(this._hass.states[id]?.state); return Number.isNaN(v) ? null : v; };
      const pImp = (G.priceImp && numOf(G.priceImp)) || gen.price_import || null;
      const pFeed = (G.priceFeed && numOf(G.priceFeed)) || gen.price_feed_in || null;
      if (pImp) {
        tiles.push([`${num(tOut * pImp - tIn * (pFeed || 0))} €`, this._t("stoBenefit")]);
        stoNotes.push(this._t("stoBenefitNote"));
      }
      const loss = Math.max(0, tIn - tOut), lossPrice = pFeed || pImp;
      tiles.push([`${num(loss)} kWh${lossPrice ? ` · ${num(loss * lossPrice)} €` : ""}`, this._t("stoLoss")]);
      // efficiency per month (long ranges): a clear drop between the first and the last third is a hint
      if (rd.long) {
        const effs = [...eIn].sort((a, b) => a[0] - b[0]).filter(([ts, v]) => v >= 5 && eOut.get(ts) > 0).map(([ts, v]) => (eOut.get(ts) / v) * 100);
        if (effs.length >= 3) {
          const third = Math.max(1, Math.floor(effs.length / 3));
          const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
          const first = mean(effs.slice(0, third)), last = mean(effs.slice(-third));
          if (first - last >= 5) stoNotes.push(this._t("stoEffDrop").replace("{a}", num(first, 0)).replace("{b}", num(last, 0)));
        }
      }
    }
    // usable capacity = capacity x (1 - minimum level); cycles and the energy that can still be drawn use it
    const cap = gen.storage_capacity_kwh > 0 ? gen.storage_capacity_kwh : 0, minSoc = gen.battery_min_soc > 0 ? Math.min(gen.battery_min_soc, 100) : 0;
    const usable = cap * (1 - minSoc / 100);
    if (usable > 0) tiles.push([`${num(usable)} kWh`, this._t("stoUsable")]);
    if (usable > 0 && !Number.isNaN(nowSoc)) tiles.push([`${num(Math.max(0, ((nowSoc - minSoc) / 100) * cap))} kWh`, this._t("stoUsableNow")]);
    if (usable > 0 && tIn > 0) tiles.push([num(tIn / usable, 1), this._t("cycles")]);
    const maxIn = Math.max(0, ...peakIn.values()), maxOut = Math.max(0, ...peakOut.values());
    if (maxIn > 0) tiles.push([`${num(maxIn, 0)} W`, this._t("stoMaxCharge")]);
    if (maxOut > 0) tiles.push([`${num(maxOut, 0)} W`, this._t("stoMaxDis")]);
    const vals = soc.filter((v) => v != null);
    if (vals.length) {
      const hi = socMaxRows.length ? Math.max(...socMaxRows.map((r) => r.max)) : Math.max(...vals);
      const lo = socMinRows.length ? Math.min(...socMinRows.map((r) => r.min)) : Math.min(...vals);
      tiles.push([`${num(lo, 0)}–${num(hi, 0)} %`, this._t("socRange")]);
      tiles.push([`${num(vals.reduce((a, v) => a + v, 0) / vals.length, 0)} %`, this._t("stoAvgSoc")]);
    }
    root.getElementById("stiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    // monthly benefit / losses and efficiency (long ranges), distribution of the level
    const numOf2 = (id) => { const v = parseFloat(this._hass.states[id]?.state); return Number.isNaN(v) ? null : v; };
    const pImp2 = (G.priceImp && numOf2(G.priceImp)) || gen.price_import || null, pFeed2 = (G.priceFeed && numOf2(G.priceFeed)) || gen.price_feed_in || null;
    const monthly = rd.long && tIn > 0 && tOut > 0;
    const benBox = root.getElementById("sobenbox"), effBox = root.getElementById("soeffbox");
    if (benBox) benBox.hidden = !(monthly && pImp2);
    if (effBox) effBox.hidden = !monthly;
    if (monthly) {
      const { categories, toArr } = this._monthAxis(rd, tz, fMon);
      const bens = new Map(), losses = new Map(), effs = new Map();
      for (const [ts, vin] of eIn) {
        const vout = eOut.get(ts) || 0;
        if (pImp2) { bens.set(ts, vout * pImp2 - vin * (pFeed2 || 0)); losses.set(ts, Math.max(vin - vout, 0) * (pFeed2 || pImp2)); }
        if (vin >= 5) effs.set(ts, (vout / vin) * 100);
      }
      if (pImp2) categoryBarChart(root.getElementById("soben"), {
        categories,
        series: [{ name: this._t("stoBenefit"), color: "--pva-pos", values: toArr(bens) }, { name: this._t("stoLoss"), color: "--pva-neg", values: toArr(losses) }],
        fmtValue: (v, axis) => `${num(v, axis ? 0 : 2)}${axis ? "" : " €"}`, empty: this._t("noData"), tableLabels: timeLabels, label: this._t("stoBenChart"),
      });
      categoryBarChart(root.getElementById("soeff"), {
        categories, series: [{ name: this._t("storEff"), color: "--pva-bout", values: toArr(effs) }],
        fmtValue: (v, axis) => `${num(v, 0)}${axis ? "" : " %"}`, empty: this._t("noData"), tableLabels: timeLabels, label: this._t("stoEffChart"),
      });
    }
    const cycBox = root.getElementById("socycbox");
    if (cycBox) {
      cycBox.hidden = !(rd.long && usable > 0 && tIn > 0);
      if (!cycBox.hidden) {
        const { categories, toArr } = this._monthAxis(rd, tz, fMon);
        categoryBarChart(root.getElementById("socyc"), {
          categories, series: [{ name: this._t("cycles"), color: "--pva-bin", values: toArr(new Map([...eIn].map(([ts, v]) => [ts, v / usable]))) }],
          fmtValue: (v, axis) => `${num(v, 1)}${axis ? "" : ""}`, empty: this._t("noData"), tableLabels: timeLabels, label: this._t("stoCycChart"),
        });
      }
    }
    const histBox = root.getElementById("sosochist");
    if (histBox) {
      const bands = Array(10).fill(0);
      for (const v of soc) if (v != null) bands[Math.min(9, Math.max(0, Math.floor(v / 10)))]++;
      const n = bands.reduce((a, v) => a + v, 0);
      categoryBarChart(histBox, {
        categories: bands.map((_, i) => `${i * 10}–${i * 10 + 10}`),
        series: [{ name: this._t("stoSocHist"), color: "--pva-bout", values: n ? bands.map((v) => (v / n) * 100) : [] }],
        fmtValue: (v, axis) => `${num(v, axis ? 0 : 1)}${axis ? "" : " %"}`, empty: this._t("noData"), tableLabels: timeLabels, label: this._t("stoSocHist"),
      });
    }
    const note = root.getElementById("sonote");
    note.textContent = [tIn > 0 && tOut > 0 ? this._t("stoNote") : "", !(cap > 0) && tIn > 0 ? this._t("stoNoCap") : "", ...stoNotes].filter(Boolean).join(" ");
    root.querySelectorAll("#sto .chart").forEach((x) => x.classList.remove("loading"));
  }
}
