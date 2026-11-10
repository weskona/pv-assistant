// Scenarios tab: a calculator for a storage, more production and an extra consumption, on the hourly values of the last months.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, mergedRows, categoryBarChart, localKeyFn, simulateStorage;
export function init(ctx) {
  ({ esc, mergedRows, categoryBarChart, localKeyFn, simulateStorage } = ctx);
}

// the fields of the scenario calculator: [input id, key in the state]
const SIM_FIELDS = [["simcap", "cap"], ["simpow", "power"], ["simeff", "eff"], ["simprice", "price"], ["simpv", "pv"], ["simpvprice", "pvprice"],
  ["simload", "load"], ["simfrom", "from"], ["simlen", "len"]];
const SIM_DEFAULTS = { pv: 0, pvprice: 0, load: 0, from: 10, len: 4 };
const MAX_SAVED = 5;

export class ScenariosPart {
  _buildScenarios() {
    const { E, G } = this._keys();
    const box = this._root.getElementById("scn");
    // the consumption comes from the house sensor, otherwise from the energy balance (production, feed-in and grid import)
    this._scenariosOn = !!(E.prod.length && (G.houseE.length || (G.impE.length && E.feed.length)));
    if (!this._scenariosOn) { box.replaceChildren(); return; }
    if (!this._scrange) this._scrange = "y12";
    box.innerHTML = `<div class="filters" id="scranges"></div>
      <p class="empty" id="scnempty" hidden>${esc(this._t("noData"))}</p>
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
      <p class="note" id="sosimnote"></p></div>`;
    this._picker(box.querySelector("#scranges"), () => this._scrange, (v) => { this._scrange = v; this._loadScenarios(); });
    for (const [id] of SIM_FIELDS) {
      box.querySelector(`#${id}`)?.addEventListener("input", () => {
        this._simState = Object.fromEntries(SIM_FIELDS.map(([fid, key]) => [key, this._simNum(fid)]));
        try { localStorage.setItem("pv_assistant_sim", JSON.stringify(this._simState)); } catch (e) { /* storage unavailable */ }
        this._drawScenarioSim();
      });
    }
    box.querySelector("#simsave")?.addEventListener("click", () => this._simSave());
  }

  // hourly values of the range, at most the last 12 months (at least 7 days are needed)
  async _loadScenarios() {
    if (!this._scenariosOn || !this._hass || !this._root.getElementById("scranges")) return;
    const token = (this._sctoken = (this._sctoken || 0) + 1);
    const { E, G } = this._keys();
    const { start, end } = this._window(this._scrange);
    const day = 24 * 3600e3, t1 = end.getTime();
    const t0 = Math.max(start.getTime(), t1 - 365 * day);
    const filt = this._cfg.filtered || {};
    const ids = [...E.prod, ...E.feed, ...E.sin, ...E.sout, ...E.comb, ...G.impE, ...G.houseE];
    this._root.querySelectorAll("#scn .chart").forEach((c) => c.classList.add("loading"));
    const eres = await this._stats(ids.concat(ids.map((i) => filt[i]).filter(Boolean)), "hour", "change", { energy: "kWh" }, { t0, end: t1 });
    if (token !== this._sctoken) return;
    this._scdata = { t0, end: t1, eres, filt };
    this._drawScenarios();
  }

  _drawScenarios() {
    const d = this._scdata;
    const root = this._root;
    if (!d || !this._scenariosOn || !root.getElementById("scranges")) return;
    const { E, G } = this._keys();
    const { t0, end, eres, filt } = d;
    const tz = this._hass.config?.time_zone;
    const nDays = Math.max(1, Math.round((end - t0) / (24 * 3600e3)));
    const key = localKeyFn(tz);
    root.querySelectorAll("#scn .chart").forEach((c) => c.classList.remove("loading"));
    const simBox = root.getElementById("sosimbox");
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
    root.getElementById("scnempty").hidden = !simBox.hidden;
    if (simBox.hidden) { this._scn = null; return; }
    const gen = this._cfg.settings?.general || {};
    const cap = gen.storage_capacity_kwh > 0 ? gen.storage_capacity_kwh : 0, minSoc = gen.battery_min_soc > 0 ? Math.min(gen.battery_min_soc, 100) : 0;
    const tIn = [...sIn.values()].reduce((a, v) => a + v, 0), tOut = [...sOut.values()].reduce((a, v) => a + v, 0);
    const numOf = (id) => { const v = parseFloat(this._hass.states[id]?.state); return Number.isNaN(v) ? null : v; };
    const strs = this._cfg.settings?.strings || {};
    const { P } = this._keys();
    const peakWp = P.prod.reduce((a, id) => a + (strs[id]?.peak > 0 ? strs[id].peak : 0), 0);
    this._scn = {
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
      const c = this._scn;
      const fresh = { cap: Math.round((c.usableNow || 10) * 10) / 10, power: c.powerMeasured, eff: Math.round(c.effMeasured * 100), price: 0 };
      this._simState = { ...SIM_DEFAULTS, ...(saved && Number.isFinite(saved.cap) ? saved : fresh) };
      for (const [id, key2] of SIM_FIELDS) {
        const input = root.getElementById(id);
        if (input) input.value = Number.isFinite(this._simState[key2]) ? String(this._simState[key2]) : "";
      }
    }
    this._drawScenarioSim();
  }

  _simNum(id) {
    const v = parseFloat(this._root.getElementById(id)?.value);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }

  // the key figures of a scenario: more production, an extra load on top of the house consumption and a storage, on the hours of the range
  _simMetrics(st) {
    const c = this._scn;
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
    if (!st || !this._scn) return;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem("pv_assistant_sim_saved") || "[]"); } catch (e) { saved = []; }
    saved = [...saved.filter((x) => JSON.stringify(x.st) !== JSON.stringify(st)), { st: { ...st } }].slice(-MAX_SAVED);
    try { localStorage.setItem("pv_assistant_sim_saved", JSON.stringify(saved)); } catch (e) { /* storage unavailable */ }
    this._drawScenarioSim();
  }

  // results of the scenario with the values of the form: key figures, check against the measurement, the matrix, the saved scenarios
  // and the charts over the size
  _drawScenarioSim() {
    const c = this._scn, root = this._root;
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
        this._drawScenarioSim();
      }));
    }
    root.getElementById("sosimnote").textContent = `${this._t("stoSimNote").replace("{n}", String(nDays))} ${this._t("simNote2")}`;
  }
}
