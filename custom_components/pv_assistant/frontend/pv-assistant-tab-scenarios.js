// Scenarios tab: a calculator for a storage, more production and an extra consumption, on the hourly values of the last months.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, mergedRows, categoryBarChart, localKeyFn, simulateStorage, simulateStorages, bestPayback, recommend;
export function init(ctx) {
  ({ esc, mergedRows, categoryBarChart, localKeyFn, simulateStorage, simulateStorages, bestPayback, recommend } = ctx);
}

// the fields of the scenario calculator, all of them describe what is NEW: [input id, key in the state]
const SIM_FIELDS = [["simcap", "addcap"], ["simpow", "addpow"], ["simeff", "addeff"], ["simprice", "addprice"], ["simkwp", "addkwp"], ["simpv", "addpct"],
  ["simpvprice", "pvprice"], ["simload", "load"], ["simfrom", "from"], ["simlen", "len"]];
// nothing added: the efficiency of a new storage starts at a usual value
const SIM_DEFAULTS = { addcap: 0, addpow: 0, addeff: 90, addprice: 0, addkwp: 0, addpct: 0, pvprice: 0, load: 0, from: 10, len: 4 };
const MAX_SAVED = 5;
// prices that the recommendation assumes when none are entered (storage per kWh, PV per kWp) and the longest payback that counts
const DEFAULT_STORAGE_PRICE = 600, DEFAULT_PV_PRICE = 1200, PAYBACK_LIMIT = 25;
// the form: groups of rows [input id, label text, hint text, attributes]
const SIM_GROUPS = [
  ["simGroupStorage", [
    ["simcap", "simCap", "simCapHint", 'min="0" step="0.5"'], ["simeff", "simEff", "simEffHint", 'min="50" max="100" step="1"'],
    ["simpow", "simPower", "simPowerHint", 'min="0" step="0.5"'], ["simprice", "simPrice", "simPriceHint", 'min="0" step="10"']]],
  ["simGroupPv", [
    ["simkwp", "simKwp", "simKwpHint", 'min="0" step="0.5"'], ["simpv", "simPv", "simPvHint", 'min="0" step="5"'],
    ["simpvprice", "simPvPrice", "simPvPriceHint", 'min="0" step="50"']]],
  ["simGroupLoad", [
    ["simload", "simLoad", "simLoadHint", 'min="0" step="1"'], ["simfrom", "simFrom", "simFromHint", 'min="0" max="23" step="1"'],
    ["simlen", "simLen", "simLenHint", 'min="1" max="24" step="1"']]],
];
// the terms and the typical questions that are explained on the tab: [text key of the term, text key of the explanation]
const TERMS = [
  ["scnTermAut", "scnTermAutText"],
  ["scnTermSelf", "scnTermSelfText"],
  ["scnTermYear", "scnTermYearText"],
  ["scnTermGain", "scnTermGainText"],
  ["scnTermRec", "scnTermRecText"],
  ["scnTermMarg", "scnTermMargText"],
  ["scnTermInvest", "scnTermInvestText"],
  ["scnTermExtra", "scnTermExtraText"],
  ["scnTermCheck", "scnTermCheckText"],
  ["scnTermMatrix", "scnTermMatrixText"],
  ["scnTermMarks", "scnTermMarksText"],
];
const QUESTIONS = [
  ["scnQWhich", "scnQWhichText"],
  ["scnQBigger", "scnQBiggerText"],
  ["scnQWallbox", "scnQWallboxText"],
  ["scnQPv", "scnQPvText"],
  ["scnQCompare", "scnQCompareText"],
];
const STEPS = ["scnIntro1", "scnIntro2", "scnIntro3", "scnIntro4", "scnIntro5"];

export class ScenariosPart {
  // the explanation on top of the tab: how it works, what the numbers mean, typical questions
  _scenarioHelp() {
    const t = (k) => esc(this._t(k));
    const steps = STEPS.map((k) => `<li>${t(k)}</li>`).join("");
    const terms = TERMS.map(([k, text]) => `<dt>${t(k)}</dt><dd>${t(text)}</dd>`).join("");
    const questions = QUESTIONS.map(([k, text]) => `<dt>${t(k)}</dt><dd>${t(text)}</dd>`).join("");
    return `<details class="setcard scnhelp" open><summary><h3>${t("scnIntroTitle")}</h3></summary><ol class="scnlist">${steps}</ol></details>
      <details class="setcard scnhelp"><summary><h3>${t("scnQuestionsTitle")}</h3></summary><dl class="scnterms">${questions}</dl></details>
      <details class="setcard scnhelp"><summary><h3>${t("scnTermsTitle")}</h3></summary><dl class="scnterms">${terms}</dl></details>`;
  }

  _buildScenarios() {
    const { E, G } = this._keys();
    const box = this._root.getElementById("scn");
    // the consumption comes from the house sensor, otherwise from the energy balance (production, feed-in and grid import)
    this._scenariosOn = !!(E.prod.length && (G.houseE.length || (G.impE.length && E.feed.length)));
    if (!this._scenariosOn) { box.replaceChildren(); return; }
    if (!this._scrange) this._scrange = "y12";
    box.innerHTML = `<div class="filters" id="scranges"></div>
      <p class="empty" id="scnempty" hidden>${esc(this._t("noData"))}</p>
      <div id="sosimbox">${this._scenarioHelp()}<h3 class="ch">${esc(this._t("simTitle"))}</h3>
      <p class="note" id="simtoday"></p>
      <div class="setcard" id="simform">
        ${SIM_GROUPS.map(([group, rows]) => `<h4 class="setsub">${esc(this._t(group))}</h4>${rows.map(([id, label, hint, attrs]) => `<div class="setrow" id="${id}row"><label for="${id}">${esc(this._t(label))}</label><input type="number" id="${id}" ${attrs}>
          <span class="hint">${esc(this._t(hint))}${id === "simkwp" ? ' <b id="simpvhint"></b>' : ""}</span></div>`).join("")}`).join("")}
        <div class="setbar"><button class="setbtn" id="simsave">${esc(this._t("simSave"))}</button><button class="setbtn" id="simreset">${esc(this._t("simReset"))}</button></div></div>
      <div class="setcard" id="simrec" hidden></div>
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
    box.querySelector("#simreset")?.addEventListener("click", () => { if (this._scn) this._simSetState(this._simFresh()); });
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
      // the first time an example is suggested (5 kWh), so that the charts show something; the reset clears it
      this._simSetState(saved ? this._simMigrate(saved) : { ...SIM_DEFAULTS, addcap: 5 }, false);
    }
    this._drawScenarioSim();
  }

  // nothing added: the plant as it is
  _simFresh() {
    return { ...SIM_DEFAULTS };
  }

  // older versions described the whole storage (size, power, efficiency, price, more production in percent): what is new is the part
  // above the storage of the plant
  _simMigrate(st) {
    if (st.addcap !== undefined) return { ...SIM_DEFAULTS, ...st };
    const today = this._scn?.usableNow || 0;
    return { ...SIM_DEFAULTS, addcap: Math.max((st.cap || 0) - today, 0), addpow: st.power || 0, addeff: st.eff || SIM_DEFAULTS.addeff, addprice: st.price || 0,
      addpct: st.pv || 0, pvprice: st.pvprice || 0, load: st.load || 0, from: st.from ?? SIM_DEFAULTS.from, len: st.len || SIM_DEFAULTS.len };
  }

  // puts the values into the form, remembers them and (unless it is the first drawing) calculates again
  _simSetState(state, redraw = true) {
    this._simState = state;
    for (const [id, key] of SIM_FIELDS) {
      const input = this._root.getElementById(id);
      if (input) input.value = Number.isFinite(state[key]) ? String(state[key]) : "";
    }
    try { localStorage.setItem("pv_assistant_sim", JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
    if (redraw) this._drawScenarioSim();
  }

  _simNum(id) {
    const v = parseFloat(this._root.getElementById(id)?.value);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }

  // the key figures of a scenario: a new storage next to the one of the plant, more production and an extra load, on the hours of the range
  _simMetrics(st) {
    const c = this._scn;
    const { hours, hod, nDays, pImp, pFeed, peakKwp } = c;
    const scale = nDays < 330 ? 365 / nDays : 1;
    // the storage of the plant (measured) and the new one (as entered); the surplus fills the plant's storage first
    const existing = { capacity: c.usableNow, efficiency: c.effMeasured, maxPower: c.powerMeasured };
    const added = st.addcap > 0 ? { capacity: st.addcap, efficiency: Math.min(1, Math.max(0.5, (st.addeff || 90) / 100)), maxPower: st.addpow || 0 } : null;
    const storages = added ? [existing, added] : [existing];
    // new PV: in kWp when the peaks of the plant are known, otherwise in percent; the yield is that of the existing PV
    const newKwp = peakKwp > 0 ? (st.addkwp > 0 ? st.addkwp : (peakKwp * (st.addpct || 0)) / 100) : 0;
    const pvF = 1 + (peakKwp > 0 ? newKwp / peakKwp : (st.addpct || 0) / 100);
    const len = Math.min(24, Math.max(1, Math.round(st.len || 1))), from = Math.min(23, Math.max(0, Math.round(st.from || 0)));
    const perHour = st.load > 0 ? st.load / len : 0;
    const inWindow = (h) => ((h - from + 24) % 24) < len;
    const build = (withExtra) => hours.map(([p, h], i) => [p * pvF, h + (withExtra && inWindow(hod[i]) ? perHour : 0)]);
    const base = simulateStorages(hours, []); // today's plant without any storage
    const today = simulateStorages(hours, [existing]); // today's plant as it is
    const noExtra = simulateStorages(build(false), storages);
    const withExtraHours = build(true);
    const run = perHour > 0 ? simulateStorages(withExtraHours, storages) : noExtra;
    const load = withExtraHours.reduce((a, [, h]) => a + h, 0), produced = withExtraHours.reduce((a, [p]) => a + p, 0);
    const extraTotal = perHour > 0 ? withExtraHours.reduce((a, [, h], i) => a + (h - hours[i][1]), 0) : 0;
    const money = (r) => (pImp ? ((base.imp - r.imp) * pImp - (base.feed - r.feed) * (pFeed || 0)) * scale : null);
    const investment = (st.addprice > 0 ? st.addprice * (st.addcap || 0) : 0) + (st.pvprice > 0 ? st.pvprice * newKwp : 0);
    // what the new things bring, without the extra load (whose cost is shown separately), against today's plant
    const gain = pImp ? money(noExtra) - money(today) : null;
    return {
      autarky: load > 0 ? (1 - run.imp / load) * 100 : 0, self: produced > 0 ? ((produced - run.feed) / produced) * 100 : 0,
      imp: run.imp * scale, feed: run.feed * scale, gain, investment, payback: investment > 0 && gain > 0 ? investment / gain : null, newKwp,
      extraYear: extraTotal * scale,
      extraPv: extraTotal > 0 ? Math.max(0, 1 - (run.imp - noExtra.imp) / extraTotal) * 100 : null,
      extraCost: extraTotal > 0 && pImp ? ((run.imp - noExtra.imp) * pImp + (noExtra.feed - run.feed) * (pFeed || 0)) * scale : null,
    };
  }

  // which is the better investment from today's plant: a new storage or more PV (steps of 2.5, 5 and 10 kWh against 10, 25 and 50 %)
  _simRecommend(st) {
    const c = this._scn;
    if (!c.pImp) return null;
    const base = { ...SIM_DEFAULTS, addeff: st.addeff, addpow: st.addpow }; // nothing new, but the efficiency and power of the new storage
    const storagePrice = st.addprice > 0 ? st.addprice : DEFAULT_STORAGE_PRICE, pvPrice = st.pvprice > 0 ? st.pvprice : DEFAULT_PV_PRICE;
    const storage = [2.5, 5, 10].map((kwh) => ({ kind: "storage", kwh, invest: kwh * storagePrice, gain: this._simMetrics({ ...base, addcap: kwh }).gain }));
    const pv = c.peakKwp > 0 ? [10, 25, 50].map((pct) => ({ kind: "pv", pct, kwp: (c.peakKwp * pct) / 100, invest: ((c.peakKwp * pct) / 100) * pvPrice, gain: this._simMetrics({ ...base, addpct: pct }).gain })) : [];
    const bestS = bestPayback(storage), bestP = bestPayback(pv);
    return { bestS, bestP, winner: recommend(bestS, bestP, PAYBACK_LIMIT), storagePrice, pvPrice, assumedS: !(st.addprice > 0), assumedP: !(st.pvprice > 0), noPeak: !(c.peakKwp > 0),
      topS: storage.at(-1), topP: pv.at(-1) };
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
    const st = this._simState || { ...SIM_DEFAULTS };
    const lang = this._hass.locale?.language || this._hass.language;
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const tl = { summary: this._t("table"), time: "kWh" };
    const { hours, nDays, usableNow, pImp, peakKwp } = c;
    const m = this._simMetrics(st);
    const years = (v) => (v == null ? "–" : this._t("simYears").replace("{y}", num(v, 1)));
    // the plant as it is: nothing to enter, the new things are added to it
    const today = [usableNow > 0 ? this._t("simTodayStorage").replace("{c}", num(usableNow, 1)).replace("{e}", num(c.effMeasured * 100, 0)).replace("{p}", num(c.powerMeasured, 1)) : this._t("simTodayNoStorage"),
      peakKwp > 0 ? this._t("simTodayPv").replace("{k}", num(peakKwp, 1)) : this._t("simTodayNoPeak")].join(" ");
    root.getElementById("simtoday").textContent = `${this._t("simToday")} ${today}`;
    // the new PV is entered in kWp when the peaks of the plant are known, otherwise in percent
    root.getElementById("simkwprow").hidden = !(peakKwp > 0);
    root.getElementById("simpvrow").hidden = peakKwp > 0;
    const hint = root.getElementById("simpvhint");
    if (hint) hint.textContent = peakKwp > 0 && m.newKwp > 0 ? this._t("simKwpPct").replace("{p}", num((m.newKwp / peakKwp) * 100, 0)) : "";
    const tiles = [[`${num(m.autarky, 0)} %`, this._t("autarky")], [`${num(m.self, 0)} %`, this._t("selfShare")],
      [`${num(m.imp, 0)} kWh`, this._t("simImp")], [`${num(m.feed, 0)} kWh`, this._t("simFeed")]];
    if (m.gain != null) tiles.push([`${m.gain > 0 ? "+" : ""}${num(m.gain, 0)} €`, this._t("simGain")]);
    if (m.gain != null && st.addcap > 1) tiles.push([`${num(m.gain - this._simMetrics({ ...st, addcap: st.addcap - 1, load: 0 }).gain, 0)} €`, this._t("simMarg")]);
    if (m.investment > 0) tiles.push([`${num(m.investment, 0)} €`, this._t("simInvest")], [years(m.payback), this._t("simPayback")]);
    if (m.extraYear > 0) {
      tiles.push([`${num(m.extraYear, 0)} kWh`, this._t("simExtraYear")], [`${num(m.extraPv, 0)} %`, this._t("simExtraPv")]);
      if (m.extraCost != null) tiles.push([`${num(m.extraCost, 0)} €`, this._t("simExtraCost")], [`${num(m.extraCost / m.extraYear, 3)} €`, this._t("simExtraKwh")]);
    }
    root.getElementById("simtiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    // the recommendation: a bigger storage or more PV
    const recBox = root.getElementById("simrec");
    const rec = this._simRecommend(st);
    recBox.hidden = !rec;
    if (rec) {
      const eur = (v) => `${num(v, 0)} €`;
      const lineS = rec.bestS
        ? this._t("recStorage").replace("{k}", num(rec.bestS.kwh, 1)).replace("{g}", eur(rec.bestS.gain)).replace("{i}", eur(rec.bestS.invest)).replace("{y}", years(rec.bestS.payback))
        : this._t("recStorageNone").replace("{k}", num(rec.topS.kwh, 1)).replace("{g}", eur(rec.topS.gain));
      const lineP = rec.noPeak ? this._t("recPvNoPeak")
        : rec.bestP ? this._t("recPv").replace("{p}", num(rec.bestP.pct, 0)).replace("{k}", num(rec.bestP.kwp, 1)).replace("{g}", eur(rec.bestP.gain)).replace("{i}", eur(rec.bestP.invest)).replace("{y}", years(rec.bestP.payback))
          : this._t("recPvNone").replace("{p}", num(rec.topP.pct, 0)).replace("{g}", eur(rec.topP.gain));
      const assumed = rec.assumedS || rec.assumedP ? `<p class="note">${esc(this._t("recAssumed").replace("{s}", eur(rec.storagePrice)).replace("{p}", eur(rec.pvPrice)))}</p>` : "";
      recBox.innerHTML = `<h3>${esc(this._t("recTitle"))}</h3><p class="recwin">${esc(this._t({ pv: "recWin_pv", storage: "recWin_storage", none: "recWin_none" }[rec.winner]).replace("{y}", String(PAYBACK_LIMIT)))}</p>
        <ul class="scnlist"><li>${esc(lineS)}</li><li>${esc(lineP)}</li></ul>${assumed}<p class="note">${esc(this._t("recNote"))}</p>`;
    }
    // check: the same model with the real storage against the measured grid import
    const hints = [];
    if (usableNow > 0 && c.measuredImp > 0) {
      const real = simulateStorage(hours, usableNow, c.effMeasured, c.powerMeasured);
      const dev = ((real.imp - c.measuredImp) / c.measuredImp) * 100;
      hints.push(this._t("simCalib").replace("{m}", num(c.measuredImp, 0)).replace("{s}", num(real.imp, 0)).replace("{d}", `${dev > 0 ? "+" : ""}${num(dev, 0)}`) + (Math.abs(dev) > 15 ? ` ${this._t("simCalibWarn")}` : ""));
    }
    root.getElementById("simhints").innerHTML = hints.map((h) => `<li class="info">${esc(h)}</li>`).join("");
    // over the size of the new storage: the usual steps plus the size of the calculator (the new PV and the extra load come along)
    const steps = [0, 2.5, 5, 7.5, 10, 12.5, 15, 20, 30];
    const mine = st.addcap > 0 ? Math.round(st.addcap * 10) / 10 : null;
    const sizes = [...new Set([...steps, ...(mine ? [mine] : [])])].filter((v) => v <= Math.max(30, (mine || 0) * 1.5)).sort((a, b) => a - b);
    const at = (size, extra = {}) => this._simMetrics({ ...st, addcap: size, ...extra });
    const results = sizes.map((v) => at(v));
    const cats = sizes.map((v) => `+${num(v, 1)}${v === mine ? " ◆" : ""}`);
    categoryBarChart(root.getElementById("sosimaut"), {
      categories: cats, series: [{ name: this._t("autarky"), color: "--pva-pos", values: results.map((r) => r.autarky) }],
      fmtValue: (v, axis) => `${num(v, 0)}${axis ? "" : " %"}`, empty: this._t("noData"), tableLabels: tl, label: this._t("stoSimAut"),
    });
    const benBox = root.getElementById("sosimbenbox");
    benBox.hidden = !pImp;
    if (pImp) {
      const bens = results.map((r) => r.gain);
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
    const myPct = peakKwp > 0 ? (m.newKwp / peakKwp) * 100 : st.addpct || 0; // the new PV of the calculator in percent
    const matrix = (field, fmt) => {
      const grid = rowsKwh.map((r) => cols.map((cpv) => at(r, { addpct: cpv, addkwp: 0, load: 0 })[field]));
      const flat = grid.flat().filter((v) => v != null), lo = Math.min(...flat), hi = Math.max(...flat);
      const head = `<tr><th>${esc(this._t("simMatrixRows"))}</th>${cols.map((cpv) => `<th>+${cpv} %${peakKwp > 0 ? ` (${num((peakKwp * cpv) / 100, 1)} kWp)` : ""}</th>`).join("")}</tr>`;
      const body = grid.map((row, ri) => `<tr><th>${esc(num(rowsKwh[ri], 1))}</th>${row.map((v, ci) => {
        const level = hi > lo ? (v - lo) / (hi - lo) : 0, mark = rowsKwh[ri] === st.addcap && Math.abs(cols[ci] - myPct) < 0.5;
        return `<td style="background:color-mix(in srgb, var(--pva-pos) ${Math.round(8 + level * 52)}%, transparent)${mark ? ";outline:2px solid var(--g-accent)" : ""}">${esc(fmt(v))}</td>`;
      }).join("")}</tr>`).join("");
      return `<table class="dtable"><thead>${head}</thead><tbody>${body}</tbody></table>`;
    };
    root.getElementById("simmat1").innerHTML = matrix("autarky", (v) => `${num(v, 0)} %`);
    root.getElementById("simmat2box").hidden = !pImp;
    if (pImp) root.getElementById("simmat2").innerHTML = matrix("gain", (v) => `${num(v, 0)} €`);
    // saved scenarios side by side
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem("pv_assistant_sim_saved") || "[]"); } catch (e) { saved = []; }
    const savedBox = root.getElementById("simsavedbox");
    savedBox.hidden = !saved.length;
    if (saved.length) {
      const name = (x) => [x.addcap > 0 ? `+${num(x.addcap, 1)} kWh${x.addeff ? ` (${num(x.addeff, 0)} %)` : ""}` : "", x.addkwp > 0 ? `+${num(x.addkwp, 1)} kWp` : x.addpct > 0 ? `+${num(x.addpct, 0)} % PV` : "", x.load > 0 ? `+${num(x.load, 0)} kWh/${this._t("simPerDay")}` : ""].filter(Boolean).join(" · ") || this._t("simNothing");
      const head = ["simName", "autarky", "selfShare", "simImp", "simFeed", "simGainShort", "simInvestShort", "simPayback"].map((k) => `<th>${esc(this._t(k))}</th>`).join("") + "<th></th>";
      const rows = saved.map((x, i) => {
        const st2 = this._simMigrate(x.st);
        const r = this._simMetrics(st2);
        return `<tr><th>${esc(name(st2))}</th><td>${num(r.autarky, 0)} %</td><td>${num(r.self, 0)} %</td><td>${num(r.imp, 0)}</td><td>${num(r.feed, 0)}</td>`
          + `<td>${r.gain == null ? "–" : `${num(r.gain, 0)} €`}</td><td>${r.investment > 0 ? `${num(r.investment, 0)} €` : "–"}</td><td>${esc(years(r.payback))}</td>`
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
          this._simSetState(this._simMigrate(saved[idx].st), false);
        }
        this._drawScenarioSim();
      }));
    }
    root.getElementById("sosimnote").textContent = `${this._t("stoSimNote").replace("{n}", String(nDays))} ${this._t("simNote2")}`;
  }
}
