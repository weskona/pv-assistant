// Storage tab.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, mergedRows, lineChart, barChart, categoryBarChart, localKeyFn, heatmap, simulateStorage;
export function init(ctx) {
  ({ esc, mergedRows, lineChart, barChart, categoryBarChart, localKeyFn, heatmap, simulateStorage } = ctx);
}

// the fields of the scenario calculator: [input id, key in the state]
const SIM_FIELDS = [["simcap", "cap"], ["simpow", "power"], ["simeff", "eff"], ["simprice", "price"], ["simpv", "pv"], ["simpvprice", "pvprice"],
  ["simload", "load"], ["simfrom", "from"], ["simlen", "len"]];
const SIM_DEFAULTS = { pv: 0, pvprice: 0, load: 0, from: 10, len: 4 };
const MAX_SAVED = 5;

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
      <div class="setcard" id="simform">
        <div class="setrow"><label for="simcap">${esc(this._t("simCap"))}</label><input type="number" id="simcap" min="0" step="0.5"></div>
        <div class="setrow"><label for="simpow">${esc(this._t("simPower"))}</label><input type="number" id="simpow" min="0" step="0.5"></div>
        <div class="setrow"><label for="simeff">${esc(this._t("simEff"))}</label><input type="number" id="simeff" min="50" max="100" step="1"></div>
        <div class="setrow"><label for="simprice">${esc(this._t("simPrice"))}</label><input type="number" id="simprice" min="0" step="10"></div>
        <div class="setrow"><label for="simpv">${esc(this._t("simPv"))}</label><input type="number" id="simpv" min="0" step="5"><span class="hint" id="simpvhint"></span></div>
        <div class="setrow"><label for="simpvprice">${esc(this._t("simPvPrice"))}</label><input type="number" id="simpvprice" min="0" step="50"></div>
        <div class="setrow"><label for="simload">${esc(this._t("simLoad"))}</label><input type="number" id="simload" min="0" step="1"></div>
        <div class="setrow"><label for="simfrom">${esc(this._t("simFrom"))}</label><input type="number" id="simfrom" min="0" max="23" step="1"></div>
        <div class="setrow"><label for="simlen">${esc(this._t("simLen"))}</label><input type="number" id="simlen" min="1" max="24" step="1"></div>
        <div class="setbar"><button class="setbtn" id="simsave">${esc(this._t("simSave"))}</button></div></div>
      <div class="tiles" id="simtiles"></div><ul class="hints" id="simhints"></ul>
      <h3 class="ch">${esc(this._t("stoSimAut"))}</h3><div class="chart" id="sosimaut"></div>
      <div id="sosimbenbox"><h3 class="ch">${esc(this._t("stoSimBen"))}</h3><div class="chart" id="sosimben"></div>
      <h3 class="ch">${esc(this._t("stoSimMarg"))}</h3><div class="chart" id="sosimmarg"></div></div>
      <h3 class="ch">${esc(this._t("simMatrixAut"))}</h3><div class="chart" id="simmat1"></div>
      <div id="simmat2box"><h3 class="ch">${esc(this._t("simMatrixBen"))}</h3><div class="chart" id="simmat2"></div></div>
      <div id="simsavedbox"><h3 class="ch">${esc(this._t("simSaved"))}</h3><div class="chart" id="simsaved"></div></div>
      <p class="note" id="sosimnote"></p></div>` : ""}${G.soc.length ? `
      <h3 class="ch">${esc(this._t("stoSocHist"))}</h3><div class="chart" id="sosochist"></div>` : ""}
      <p class="note" id="sonote"></p>`;
    const ranges = box.querySelector("#sranges");
    this._picker(ranges, () => this._srange, (v) => { this._srange = v; this._loadStorage(); });
    for (const [id] of SIM_FIELDS) {
      box.querySelector(`#${id}`)?.addEventListener("input", () => {
        this._simState = Object.fromEntries(SIM_FIELDS.map(([fid, key]) => [key, this._simNum(fid)]));
        try { localStorage.setItem("pv_assistant_sim", JSON.stringify(this._simState)); } catch (e) { /* storage unavailable */ }
        this._drawStorageSim();
      });
    }
    box.querySelector("#simsave")?.addEventListener("click", () => this._simSave());
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
    const strs = this._cfg.settings?.strings || {};
    const { P } = this._keys();
    const peakWp = P.prod.reduce((a, id) => a + (strs[id]?.peak > 0 ? strs[id].peak : 0), 0);
    this._ssim = {
      hours, hod: keys.map((ts) => key(ts).hour), nDays, usableNow: cap * (1 - minSoc / 100),
      effMeasured: tIn > 20 && tOut > 0 ? Math.min(0.98, Math.max(0.7, tOut / tIn)) : 0.9,
      // the hourly maxima are the limits that fit a model that works on whole hours
      powerMeasured: Math.ceil(Math.max(0, ...sIn.values(), ...sOut.values()) * 10) / 10,
      measuredImp: G.impE.length ? [...imp.values()].reduce((a, v) => a + v, 0) : null,
      pImp: (G.priceImp && numOf(G.priceImp)) || gen.price_import || null, pFeed: (G.priceFeed && numOf(G.priceFeed)) || gen.price_feed_in || null,
      peakKwp: peakWp / 1000,
    };
    if (!this._simState) {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem("pv_assistant_sim") || "null"); } catch (e) { saved = null; }
      const c = this._ssim;
      const fresh = { cap: Math.round((c.usableNow || 10) * 10) / 10, power: c.powerMeasured, eff: Math.round(c.effMeasured * 100), price: 0 };
      this._simState = { ...SIM_DEFAULTS, ...(saved && Number.isFinite(saved.cap) ? saved : fresh) };
      for (const [id, key2] of SIM_FIELDS) {
        const input = root.getElementById(id);
        if (input) input.value = Number.isFinite(this._simState[key2]) ? String(this._simState[key2]) : "";
      }
    }
    this._drawStorageSim();
  }

  _simNum(id) {
    const v = parseFloat(this._root.getElementById(id)?.value);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }

  // the key figures of a scenario: more production, an extra load on top of the house consumption and a storage, on the hours of the range
  _simMetrics(st) {
    const c = this._ssim;
    const { hours, hod, nDays, pImp, pFeed, peakKwp } = c;
    const eff = Math.min(1, Math.max(0.5, (st.eff || 90) / 100)), power = st.power || 0;
    const scale = nDays < 330 ? 365 / nDays : 1;
    const pvF = 1 + (st.pv || 0) / 100;
    const len = Math.min(24, Math.max(1, Math.round(st.len || 1))), from = Math.min(23, Math.max(0, Math.round(st.from || 0)));
    const perHour = st.load > 0 ? st.load / len : 0;
    const inWindow = (h) => ((h - from + 24) % 24) < len;
    const build = (withExtra) => hours.map(([p, h], i) => [p * pvF, h + (withExtra && inWindow(hod[i]) ? perHour : 0)]);
    const base = simulateStorage(hours, 0, eff, power); // today's plant without a storage: the reference
    const noExtra = simulateStorage(build(false), st.cap, eff, power);
    const withExtraHours = build(true);
    const run = perHour > 0 ? simulateStorage(withExtraHours, st.cap, eff, power) : noExtra;
    const load = withExtraHours.reduce((a, [, h]) => a + h, 0), produced = withExtraHours.reduce((a, [p]) => a + p, 0);
    const extraTotal = perHour > 0 ? withExtraHours.reduce((a, [, h], i) => a + (h - hours[i][1]), 0) : 0;
    const money = (r) => (pImp ? ((base.imp - r.imp) * pImp - (base.feed - r.feed) * (pFeed || 0)) * scale : null);
    const investment = (st.price > 0 ? st.price * st.cap : 0) + (st.pvprice > 0 && peakKwp > 0 ? st.pvprice * peakKwp * (st.pv || 0) / 100 : 0);
    const benefit = money(noExtra); // storage and more production, without the extra load
    return {
      autarky: load > 0 ? (1 - run.imp / load) * 100 : 0, self: produced > 0 ? ((produced - run.feed) / produced) * 100 : 0,
      imp: run.imp * scale, feed: run.feed * scale, benefit, investment, payback: investment > 0 && benefit > 0 ? investment / benefit : null,
      extraYear: extraTotal * scale,
      extraPv: extraTotal > 0 ? Math.max(0, 1 - (run.imp - noExtra.imp) / extraTotal) * 100 : null,
      extraCost: extraTotal > 0 && pImp ? ((run.imp - noExtra.imp) * pImp + (noExtra.feed - run.feed) * (pFeed || 0)) * scale : null,
    };
  }

  _simSave() {
    const st = this._simState;
    if (!st || !this._ssim) return;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem("pv_assistant_sim_saved") || "[]"); } catch (e) { saved = []; }
    saved = [...saved.filter((x) => JSON.stringify(x.st) !== JSON.stringify(st)), { st: { ...st } }].slice(-MAX_SAVED);
    try { localStorage.setItem("pv_assistant_sim_saved", JSON.stringify(saved)); } catch (e) { /* storage unavailable */ }
    this._drawStorageSim();
  }

  // results of the scenario with the values of the form: key figures, check against the measurement, the matrix, the saved scenarios
  // and the charts over the size
  _drawStorageSim() {
    const c = this._ssim, root = this._root;
    if (!c || !root.getElementById("sosimbox")) return;
    const st = this._simState || { ...SIM_DEFAULTS, cap: 0, power: 0, eff: 90, price: 0 };
    const lang = this._hass.locale?.language || this._hass.language;
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const tl = { summary: this._t("table"), time: "kWh" };
    const { hours, nDays, usableNow, pImp, peakKwp } = c;
    const m = this._simMetrics(st);
    const years = (v) => (v == null ? "–" : this._t("simYears").replace("{y}", num(v, 1)));
    const hint = root.getElementById("simpvhint");
    if (hint) hint.textContent = peakKwp > 0 && st.pv > 0 ? this._t("simPvKwp").replace("{k}", num((peakKwp * st.pv) / 100, 1)).replace("{p}", num(peakKwp, 1)) : "";
    const tiles = [[`${num(m.autarky, 0)} %`, this._t("autarky")], [`${num(m.self, 0)} %`, this._t("selfShare")],
      [`${num(m.imp, 0)} kWh`, this._t("simImp")], [`${num(m.feed, 0)} kWh`, this._t("simFeed")]];
    if (m.benefit != null) tiles.push([`${num(m.benefit, 0)} €`, this._t("simBen")]);
    if (m.benefit != null && st.cap > 1) tiles.push([`${num(m.benefit - this._simMetrics({ ...st, cap: st.cap - 1, load: 0 }).benefit, 0)} €`, this._t("simMarg")]);
    if (m.investment > 0) tiles.push([`${num(m.investment, 0)} €`, this._t("simInvest")], [years(m.payback), this._t("simPayback")]);
    if (m.extraYear > 0) {
      tiles.push([`${num(m.extraYear, 0)} kWh`, this._t("simExtraYear")], [`${num(m.extraPv, 0)} %`, this._t("simExtraPv")]);
      if (m.extraCost != null) tiles.push([`${num(m.extraCost, 0)} €`, this._t("simExtraCost")], [`${num(m.extraCost / m.extraYear, 3)} €`, this._t("simExtraKwh")]);
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
    // over the size: the usual steps plus the real and the scenario size (more production and the extra load come along)
    const steps = [0, 2.5, 5, 7.5, 10, 12.5, 15, 20, 30];
    const real = usableNow > 0 ? Math.round(usableNow * 10) / 10 : null, mine = st.cap > 0 ? Math.round(st.cap * 10) / 10 : null;
    const sizes = [...new Set([...steps, ...(real ? [real] : []), ...(mine ? [mine] : [])])].filter((v) => v <= Math.max(30, (real || 0) * 2, (mine || 0) * 1.5)).sort((a, b) => a - b);
    const at = (size, extra = {}) => this._simMetrics({ ...st, cap: size, ...extra });
    const results = sizes.map((v) => at(v));
    const cats = sizes.map((v) => `${num(v, 1)}${v === real ? " ★" : ""}${v === mine ? " ◆" : ""}`);
    categoryBarChart(root.getElementById("sosimaut"), {
      categories: cats, series: [{ name: this._t("autarky"), color: "--pva-pos", values: results.map((r) => r.autarky) }],
      fmtValue: (v, axis) => `${num(v, 0)}${axis ? "" : " %"}`, empty: this._t("noData"), tableLabels: tl, label: this._t("stoSimAut"),
    });
    const benBox = root.getElementById("sosimbenbox");
    benBox.hidden = !pImp;
    if (pImp) {
      const bens = results.map((r) => r.benefit);
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
    // matrix: storage size against more production (without the extra load), the cell of the calculator is framed
    const rowsKwh = [0, 5, 10, 15, 20], cols = [0, 25, 50, 100];
    const matrix = (field, fmt) => {
      const grid = rowsKwh.map((r) => cols.map((cpv) => at(r, { pv: cpv, load: 0 })[field]));
      const flat = grid.flat().filter((v) => v != null), lo = Math.min(...flat), hi = Math.max(...flat);
      const head = `<tr><th>${esc(this._t("simMatrixRows"))}</th>${cols.map((cpv) => `<th>+${cpv} %${peakKwp > 0 ? ` (${num((peakKwp * cpv) / 100, 1)} kWp)` : ""}</th>`).join("")}</tr>`;
      const body = grid.map((row, ri) => `<tr><th>${esc(num(rowsKwh[ri], 1))}</th>${row.map((v, ci) => {
        const level = hi > lo ? (v - lo) / (hi - lo) : 0, mark = rowsKwh[ri] === st.cap && cols[ci] === st.pv;
        return `<td style="background:color-mix(in srgb, var(--pva-pos) ${Math.round(8 + level * 52)}%, transparent)${mark ? ";outline:2px solid var(--g-accent)" : ""}">${esc(fmt(v))}</td>`;
      }).join("")}</tr>`).join("");
      return `<table class="dtable"><thead>${head}</thead><tbody>${body}</tbody></table>`;
    };
    root.getElementById("simmat1").innerHTML = matrix("autarky", (v) => `${num(v, 0)} %`);
    root.getElementById("simmat2box").hidden = !pImp;
    if (pImp) root.getElementById("simmat2").innerHTML = matrix("benefit", (v) => `${num(v, 0)} €`);
    // saved scenarios side by side
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem("pv_assistant_sim_saved") || "[]"); } catch (e) { saved = []; }
    const savedBox = root.getElementById("simsavedbox");
    savedBox.hidden = !saved.length;
    if (saved.length) {
      const name = (x) => `${num(x.cap, 1)} kWh${x.power > 0 ? ` · ${num(x.power, 1)} kW` : ""}${x.pv > 0 ? ` · +${num(x.pv, 0)} %` : ""}${x.load > 0 ? ` · +${num(x.load, 0)} kWh/${this._t("simPerDay")}` : ""}`;
      const head = ["simName", "autarky", "selfShare", "simImp", "simFeed", "simBen", "simInvest", "simPayback"].map((k) => `<th>${esc(this._t(k))}</th>`).join("") + "<th></th>";
      const rows = saved.map((x, i) => {
        const r = this._simMetrics({ ...SIM_DEFAULTS, ...x.st });
        return `<tr><th>${esc(name({ ...SIM_DEFAULTS, ...x.st }))}</th><td>${num(r.autarky, 0)} %</td><td>${num(r.self, 0)} %</td><td>${num(r.imp, 0)}</td><td>${num(r.feed, 0)}</td>`
          + `<td>${r.benefit == null ? "–" : `${num(r.benefit, 0)} €`}</td><td>${r.investment > 0 ? `${num(r.investment, 0)} €` : "–"}</td><td>${esc(years(r.payback))}</td>`
          + `<td><button class="setbtn" data-load="${i}">${esc(this._t("simLoadBtn"))}</button> <button class="setbtn" data-del="${i}">${esc(this._t("simDel"))}</button></td></tr>`;
      }).join("");
      const holder = root.getElementById("simsaved");
      holder.innerHTML = `<table class="dtable"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
      holder.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
        const idx = Number(b.dataset.load ?? b.dataset.del);
        if (b.dataset.del != null) {
          saved.splice(idx, 1);
          try { localStorage.setItem("pv_assistant_sim_saved", JSON.stringify(saved)); } catch (e) { /* storage unavailable */ }
        } else {
          this._simState = { ...SIM_DEFAULTS, ...saved[idx].st };
          for (const [id, key2] of SIM_FIELDS) { const input = root.getElementById(id); if (input) input.value = String(this._simState[key2]); }
          try { localStorage.setItem("pv_assistant_sim", JSON.stringify(this._simState)); } catch (e) { /* storage unavailable */ }
        }
        this._drawStorageSim();
      }));
    }
    root.getElementById("sosimnote").textContent = `${this._t("stoSimNote").replace("{n}", String(nDays))} ${this._t("simNote2")}`;
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
