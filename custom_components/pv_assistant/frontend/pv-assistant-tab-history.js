// History tab.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, mergedRows, lineChart, barChart, categoryBarChart, localKeyFn, dbg;
export function init(ctx) {
  ({ esc, mergedRows, lineChart, barChart, categoryBarChart, localKeyFn, dbg } = ctx);
}

export class HistoryPart {
  _buildHistory() {
    const { P, E } = this._keys();
    const any = (x) => x.prod.length || x.feed.length || x.sin.length || x.sout.length || x.comb.length;
    const h = this._root.getElementById("hist");
    this._hist = !!(any(P) || any(E));
    if (!this._hist) { h.replaceChildren(); return; }
    if (!this._range) this._range = "today";
    h.innerHTML = `<div class="filters" id="ranges"></div>
      <div class="tiles" id="tiles"></div>
      <h3 class="ch" id="pchead">${esc(this._t("powerChart"))} (W)</h3><div class="chart" id="pchart"></div>
      <h3 class="ch" id="xchead">${esc(this._t("effChart"))}</h3><div class="chart" id="xchart"></div>
      <h3 class="ch">${esc(this._t("energyChart"))} (kWh)</h3><div class="chart" id="echart"></div>`;
    this._picker(h.querySelector("#ranges"), () => this._range, (v) => { this._range = v; this._loadHistory(); });
  }

  async _loadHistory() {
    if (!this._hist) return;
    const token = (this._token = (this._token || 0) + 1);
    const rd = this._rangeDef();
    const { P, E, G } = this._keys();
    const filt = this._cfg.filtered || {};
    const powerIds = [...P.prod, ...P.feed, ...P.sin, ...P.sout, ...P.comb, ...G.impP, ...G.houseP, ...G.soc, ...G.irr];
    const energyIds = [...E.prod, ...E.feed, ...E.sin, ...E.sout, ...E.comb, ...G.impE, ...G.houseE];
    const energyAll = energyIds.concat(energyIds.map((i) => filt[i]).filter(Boolean));
    this._root.querySelectorAll(".chart").forEach((c) => c.classList.add("loading"));
    const [pres, eres, hres, dres] = await Promise.all([
      this._stats(powerIds, rd.pPeriod, "mean", { power: "W" }, rd),
      this._stats(energyAll, rd.long ? "month" : rd.eBucket === 3600e3 ? "hour" : "day", "change", { energy: "kWh" }, rd),
      rd.long ? this._stats(P.prod, rd.all ? "day" : "hour", rd.all ? "max" : "mean", { power: "W" }, rd) : null, // for the daily peaks of the effective power (Total: the daily maximum itself)
      rd.long ? this._stats(energyAll, "day", "change", { energy: "kWh" }, rd) : null, // daily mean power = daily energy / 24 h
    ]);
    if (token !== this._token) return; // a newer range was requested meanwhile
    this._data = { rd, P, E, G, pres, eres, filt, hres, dres };
    dbg("history data received", rd.days, "day(s)");
    this._priceTilesHtml = "";
    this._draw();
    dbg("history drawn");
    this._loadPriceTiles(rd, token); // not awaited: the history is already shown, the price figures are added when they arrive
  }

  // Average prices weighted by the energy: what the bought energy really cost per kWh and what the fed-in energy really earned.
  // Needs price sensors with long-term statistics (state class); without them nothing is added. The comparison with the plain
  // time average of the price shows whether the energy was bought at cheap or at expensive hours (dynamic tariffs).
  async _loadPriceTiles(rd, token) {
    if (rd.all) return; // hourly prices for years would be too much
    const { E, G } = this._keys();
    const wanted = [];
    if (G.priceImp && G.impE.length) wanted.push([G.priceImp, G.impE, "hisEffImp"]);
    if (G.priceFeed && E.feed.length) wanted.push([G.priceFeed, E.feed, "hisEffFeed"]);
    if (!wanted.length) return;
    const filt = this._cfg.filtered || {};
    const energyIds = wanted.flatMap((w) => w[1]);
    const [pres, eres] = await Promise.all([
      this._stats(wanted.map((w) => w[0]), "hour", "mean", {}, rd),
      this._stats(energyIds.concat(energyIds.map((i) => filt[i]).filter(Boolean)), "hour", "change", { energy: "kWh" }, rd),
    ]);
    if (token !== this._token) return;
    const lang = this._hass.locale?.language || this._hass.language;
    const num = (v, dec) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    let html = "";
    for (const [priceId, ids, label] of wanted) {
      const price = new Map((pres[priceId] || []).filter((r) => r.mean != null).map((r) => [r.start, r.mean]));
      if (price.size < 24) continue; // no usable price statistics
      const energy = new Map();
      for (const id of ids) for (const r of mergedRows(eres, id, filt, "change")) energy.set(r.start, (energy.get(r.start) || 0) + r.change);
      let wSum = 0, eSum = 0;
      for (const [ts, e] of energy) if (e > 0 && price.has(ts)) { wSum += e * price.get(ts); eSum += e; }
      if (!(eSum > 0)) continue;
      const weighted = wSum / eSum, plain = [...price.values()].reduce((a, v) => a + v, 0) / price.size;
      const delta = plain !== 0 ? ((weighted - plain) / Math.abs(plain)) * 100 : 0;
      const unit = this._hass.states[priceId]?.attributes?.unit_of_measurement || "€/kWh";
      html += `<div class="tile"><b>${esc(`${num(weighted, 3)} ${unit}`)}</b><span>${esc(`${this._t(label)} · ${this._t("hisEffVs").replace("{pct}", `${delta > 0 ? "+" : ""}${num(delta, 0)}`)}`)}</span></div>`;
    }
    if (!html) return;
    this._priceTilesHtml = html;
    this._root.getElementById("tiles")?.insertAdjacentHTML("beforeend", html);
  }

  _draw() {
    const d = this._data;
    if (!d || !this._hist) return;
    const { rd, P, E, G, pres, eres, filt, hres, dres } = d;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const fm = (o) => new Intl.DateTimeFormat(lang, { ...o, timeZone: tz });
    const fDT = fm({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const fD = fm({ weekday: "short", day: "numeric", month: "numeric" });
    const fH = fm({ hour: "2-digit", minute: "2-digit" });
    const fDM = fm({ day: "numeric", month: "numeric" });
    const num = (v, axis, max = 2) => v.toLocaleString(lang, { maximumFractionDigits: axis ? 1 : max });

    // sums of per-bucket values across sensors; value fn may map the raw number
    const get = (res, id, field) => (res[id] || []).filter((r) => r[field] != null);
    const pick = (id, field) => mergedRows(eres, id, filt, field);
    const add = (m, ts, v) => m.set(ts, (m.get(ts) || 0) + v);
    const sum = (ids, rows, field, fn = (v) => v) => {
      const m = new Map();
      for (const id of ids) for (const r of rows(id)) add(m, r.start, fn(r[field]));
      return m;
    };
    const comb = (ids, rows, field, inv) => { // default positive = from storage
      const pos = new Map(), neg = new Map();
      for (const id of ids) for (const r of rows(id)) {
        const w = inv ? -r[field] : r[field];
        add(w >= 0 ? pos : neg, r.start, Math.abs(w));
      }
      return { pos, neg };
    };
    // one entry per sensor (source split for the tooltips): [{name, values: Map}]
    const each = (ids, rows, field, fn = (v) => v) => ids.map((id) => {
      const m = new Map();
      for (const r of rows(id)) add(m, r.start, fn(r[field]));
      return { name: this._read(id).name, values: m };
    });
    const neg = (m) => new Map([...m].map(([k, v]) => [k, -v]));
    // A measured house consumption is only trusted in buckets where it is plausible (at least what came from the grid
    // and the storage); missing or too small buckets (e.g. a young sensor) use the energy balance of the production side.
    const reconcile = (measured, imp, dis, prod, feed, chg, tol) => {
      const house = new Map(), direct = new Map();
      let fallback = 0;
      for (const [ts, v] of prod) {
        const i = imp.get(ts) || 0, o = dis.get(ts) || 0, m = measured.get(ts);
        if (m != null && m >= i + o - tol) {
          house.set(ts, m);
          direct.set(ts, Math.min(v, Math.max(0, m - i - o)));
        } else {
          house.set(ts, Math.max(0, v + i + o - (feed.get(ts) || 0) - (chg.get(ts) || 0)));
          fallback++;
        }
      }
      for (const [ts, m] of measured) if (!house.has(ts)) house.set(ts, m);
      return { house, direct, mixed: fallback > 0 };
    };
    const merge = (a, b, sign = 1) => { const m = new Map(a); for (const [k, v] of b) add(m, k, sign * v); return m; };

    // ---- power lines
    // year ranges: the mean power of a day is its energy / 24 h. That is exact and keeps the direction of signed sensors
    // (a daily mean of a signed power sensor would cancel import against export and charging against discharging)
    const Pp = rd.long ? E : P;
    const Gp = rd.long ? { ...G, impP: G.impE, houseP: G.houseE } : G;
    const pr = rd.long
      ? (id) => mergedRows(dres || {}, id, filt, "change").map((r) => ({ start: r.start, mean: (r.change * 1000) / 24 }))
      : (id) => get(pres, id, "mean");
    // feed-in power: a sensor that reports feed-in as negative values is inverted; the other
    // direction (import) is not feed-in and counts as 0
    const feedFn = Pp.invFeed ? (v) => Math.max(-v, 0) : (v) => Math.max(v, 0);
    // single-direction sensors (production, storage in, storage out) only count positive values;
    // sensors with a sign belong in the combined storage field
    const nz = (v) => Math.max(v, 0);
    // storage in/out sensors that report their direction as negative values: use the magnitude
    const ns = Pp.absStorage ? (v) => Math.abs(v) : nz;
    const pProd = sum(Pp.prod, pr, "mean", nz), pFeed = sum(Pp.feed, pr, "mean", feedFn);
    const pSin = sum(Pp.sin, pr, "mean", ns), pSout = sum(Pp.sout, pr, "mean", ns);
    const pComb = sum(Pp.comb, pr, "mean", (v) => (Pp.inv ? -v : v));
    let pNet = merge(merge(pSout, pSin, -1), pComb);
    // PV used directly = production - feed-in - charging power (never below 0)
    const cP = comb(Pp.comb, pr, "mean", Pp.inv);
    const pCharge = merge(pSin, cP.neg);
    const pDirect = new Map();
    for (const [ts, v] of pProd) pDirect.set(ts, Math.min(v, Math.max(0, v - (pFeed.get(ts) || 0) - (pCharge.get(ts) || 0)))); // never above the production
    const pNetParts = [...each(Pp.sout, pr, "mean", ns), ...each(Pp.sin, pr, "mean", (v) => -ns(v)), ...each(Pp.comb, pr, "mean", (v) => (Pp.inv ? -v : v))];
    let pDirectParts = [
      { name: this._t("production"), values: pProd },
      { name: `− ${this._t("feed")}`, values: neg(pFeed) },
      { name: `− ${this._t("sin")}`, values: neg(pCharge) },
    ];
    const hasStorageP = Pp.sin.length || Pp.sout.length || Pp.comb.length;
    const toPts = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]);
    // grid import: own sensors, otherwise the positive part of a feed-in sensor that also reports import
    const impP = Gp.impP.length ? sum(Gp.impP, pr, "mean", nz)
      : Pp.invFeed && Pp.feed.length ? sum(Pp.feed, pr, "mean", (v) => Math.max(v, 0)) : null;
    const pDis = merge(pSout, cP.pos); // discharge incl. the discharging part of combined sensors
    const houseMeasuredP = Gp.houseP.length ? sum(Gp.houseP, pr, "mean", nz) : null;
    let houseP = houseMeasuredP;
    if (!houseP && impP) { // energy balance: production + import + discharge - feed-in - charge
      houseP = new Map();
      for (const [ts, v] of pProd) houseP.set(ts, Math.max(0, v + (impP.get(ts) || 0) + (pDis.get(ts) || 0) - (pFeed.get(ts) || 0) - (pCharge.get(ts) || 0)));
    }
    let houseMixedP = false;
    if (houseMeasuredP && impP) { // measured consumption makes the direct consumption exact (where it is plausible)
      const r = reconcile(houseMeasuredP, impP, pDis, pProd, pFeed, pCharge, 50);
      for (const [ts, v] of r.direct) pDirect.set(ts, v);
      houseP = r.house;
      houseMixedP = r.mixed;
      if (!r.mixed) pDirectParts = [
        { name: this._t("house"), values: houseMeasuredP },
        { name: `− ${this._t("gridImp")}`, values: neg(impP) },
        { name: `− ${this._t("sout")}`, values: neg(pDis) },
      ];
    }
    const lines = [
      { name: this._t("production"), short: this._t("production"), color: "--pva-prod", points: toPts(pProd), parts: each(Pp.prod, pr, "mean", nz).map((part, i) => ({ ...part, peak: this._cfg.settings?.strings?.[Pp.prod[i]]?.peak })) },
      { name: this._t("feed"), short: this._t("feed"), color: "--pva-feed", points: toPts(pFeed), parts: each(Pp.feed, pr, "mean", feedFn) },
      { name: this._t("storageNet"), short: this._t("storage"), color: "--pva-bout", colorNeg: "--pva-bin",
        legendItems: [{ name: `${this._t("sout")} (+)`, color: "--pva-bout" }, { name: `${this._t("sin")} (−)`, color: "--pva-bin" }],
        points: hasStorageP ? toPts(pNet) : [], parts: pNetParts },
      { name: this._t("direct"), short: this._t("directShort"), color: "--pva-direct", points: toPts(pDirect), parts: pDirectParts },
      { name: this._t("gridImp"), short: this._t("gridImpShort"), color: "--pva-grid", points: impP ? toPts(impP) : [] },
      { name: houseMeasuredP ? this._t(houseMixedP ? "houseMixed" : "house") : this._t("houseDerived"), short: this._t("houseShort"), color: "--pva-house", points: houseP ? toPts(houseP) : [] },
    ];
    const timeLabels = { summary: this._t("table"), time: this._t("time") };
    const fMon = fm(new Date(rd.t0).getFullYear() === new Date(rd.t1 - 1).getFullYear() ? { month: "short" } : { month: "short", year: "2-digit" });
    const tickFmt = rd.long ? (t) => fMon.format(t + 15 * 24 * 3600e3) : // ticks sit near the start of a month
       rd.days === 1 ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t);
    lineChart(this._root.getElementById("pchart"), {
      series: lines, t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis, 0)}${axis ? "" : " W"}`,
      fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
      empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("powerChart")} (W)`,
    });

    this._root.getElementById("pchead").textContent = `${this._t(rd.long ? "powerChartMean" : "powerChart")} (W)`;
    this._root.getElementById("xchead").textContent = this._t(rd.long ? "effChartPeak" : "effChart");
    // ---- effective power in % of the entered peak (only strings with a peak)
    const peakOf = (id) => { const v = this._cfg.settings?.strings?.[id]?.peak; return v > 0 ? v : null; };
    const peaked = P.prod.filter(peakOf);
    // year ranges: a daily mean includes the night and never gets near the peak, so the highest hourly mean of each day is shown
    const dkey = localKeyFn(tz);
    const dailyMax = (m) => {
      const best = new Map(), first = new Map();
      for (const [ts, v] of m) {
        const day = dkey(ts).day;
        if (v > (best.get(day) ?? -1)) best.set(day, v);
        if (!first.has(day) || ts < first.get(day)) first.set(day, ts);
      }
      return new Map([...best].map(([day, v]) => [first.get(day), v]));
    };
    const peakField = rd.all ? "max" : "mean";
    const hourlyOf = (id) => new Map(get(hres || {}, id, peakField).map((r) => [r.start, Math.max(r[peakField], 0)]));
    const effSrc = (id) => (rd.long ? dailyMax(hourlyOf(id)) : each([id], pr, "mean", nz)[0].values);
    const effSeries = peaked.map((id, k) => {
      const m = effSrc(id);
      return { name: this._read(id).name, short: `${this._read(id).name.slice(0, 11)}${this._read(id).name.length > 11 ? "…" : ""}`, color: `--pva-s${(k % 7) + 1}`, id,
        points: toPts(new Map([...m].map(([ts, v]) => [ts, (v / peakOf(id)) * 100]))) };
    });
    if (peaked.length) {
      const sumPeak = peaked.reduce((a, id) => a + peakOf(id), 0), tot = new Map();
      if (rd.long) { // daily peak of the plant: highest hourly sum of the day
        const hourlyTot = new Map();
        for (const id of peaked) for (const [ts, v] of hourlyOf(id)) add(hourlyTot, ts, v);
        for (const [ts, v] of dailyMax(hourlyTot)) tot.set(ts, v);
      } else for (const id of peaked) for (const [ts, v] of each([id], pr, "mean", nz)[0].values) add(tot, ts, v);
      effSeries.push({ name: this._t("effTotal"), short: this._t("effTotal"), color: "--pva-prod", points: toPts(new Map([...tot].map(([ts, v]) => [ts, (v / sumPeak) * 100]))) });
    }
    lineChart(this._root.getElementById("xchart"), {
      series: effSeries, t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis, 0)} %`,
      fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
      empty: this._t("setNoPeak"), tableLabels: timeLabels, label: this._t("effChart"),
    });
    if (peaked.length) {
      const n = document.createElement("p");
      n.className = "note";
      n.textContent = this._t(rd.long ? "effNoteLong" : "effNote");
      this._root.getElementById("xchart").append(n);
    }

    // hint when a single-direction sensor reports negative values (misplaced signed sensor)
    const neg1 = [...P.prod, ...(P.absStorage ? [] : [...P.sin, ...P.sout])].filter((id) => pr(id).some((r) => r.mean < -1)).map((id) => this._read(id).name);
    if (neg1.length) {
      const warn = document.createElement("p");
      warn.className = "note warn";
      warn.textContent = this._t("negWarn").replace("{names}", neg1.join(", "));
      this._root.getElementById("pchart").append(warn);
    }

    // ---- energy bars
    const er = (field) => (id) => pick(id, field);
    const eProd = sum(E.prod, er("change"), "change"), eFeed = sum(E.feed, er("change"), "change");
    const c = comb(E.comb, er("change"), "change", E.inv);
    const eSin = merge(sum(E.sin, er("change"), "change"), c.neg);
    const eSout = merge(sum(E.sout, er("change"), "change"), c.pos);
    const eDirect = new Map();
    for (const [ts, v] of eProd) eDirect.set(ts, Math.min(v, Math.max(0, v - (eFeed.get(ts) || 0) - (eSin.get(ts) || 0))));
    const wfn = (v) => (E.inv ? -v : v); // default positive = from storage
    const eSinParts = [...each(E.sin, er("change"), "change"), ...each(E.comb, er("change"), "change", (v) => Math.max(-wfn(v), 0))];
    const eSoutParts = [...each(E.sout, er("change"), "change"), ...each(E.comb, er("change"), "change", (v) => Math.max(wfn(v), 0))];
    let eDirectParts = [
      { name: this._t("production"), values: eProd },
      { name: `− ${this._t("feed")}`, values: neg(eFeed) },
      { name: `− ${this._t("sin")}`, values: neg(eSin) },
    ];
    const impE = G.impE.length ? sum(G.impE, er("change"), "change") : null;
    const houseMeasuredE = G.houseE.length ? sum(G.houseE, er("change"), "change") : null;
    let houseE = houseMeasuredE;
    if (!houseE && impE) {
      houseE = new Map();
      for (const [ts, v] of eProd) houseE.set(ts, Math.max(0, v + (impE.get(ts) || 0) + (eSout.get(ts) || 0) - (eFeed.get(ts) || 0) - (eSin.get(ts) || 0)));
    }
    let houseMixedE = false;
    if (houseMeasuredE && impE) {
      const r = reconcile(houseMeasuredE, impE, eSout, eProd, eFeed, eSin, 0.05);
      for (const [ts, v] of r.direct) eDirect.set(ts, v);
      houseE = r.house;
      houseMixedE = r.mixed;
      if (!r.mixed) eDirectParts = [
        { name: this._t("house"), values: houseMeasuredE },
        { name: `− ${this._t("gridImp")}`, values: neg(impE) },
        { name: `− ${this._t("sout")}`, values: neg(eSout) },
      ];
    }
    const bars = [
      { name: this._t("production"), color: "--pva-prod", values: eProd, parts: each(E.prod, er("change"), "change") },
      { name: this._t("feed"), color: "--pva-feed", values: eFeed, parts: each(E.feed, er("change"), "change") },
      { name: this._t("sin"), color: "--pva-bin", values: eSin, parts: eSinParts },
      { name: this._t("sout"), color: "--pva-bout", values: eSout, parts: eSoutParts },
      { name: this._t("direct"), color: "--pva-direct", values: eDirect, parts: eDirectParts },
    ];
    if (impE) bars.push({ name: this._t("gridImp"), color: "--pva-grid", values: impE, parts: each(G.impE, er("change"), "change") });
    if (houseE) bars.push({ name: houseMeasuredE ? this._t(houseMixedE ? "houseMixed" : "house") : this._t("houseDerived"), color: "--pva-house", values: houseE, parts: houseMeasuredE && !houseMixedE ? each(G.houseE, er("change"), "change") : undefined });
    if (rd.long) {
      // one group of bars per month (daily bars would be far too dense for a year)
      const { categories, toArr } = this._monthAxis(rd, tz, fMon);
      categoryBarChart(this._root.getElementById("echart"), {
        categories,
        series: bars.map((b) => ({ name: b.name, color: b.color, values: toArr(b.values), parts: b.parts && b.parts.map((x) => ({ ...x, values: toArr(x.values) })) })),
        fmtValue: (v, axis) => `${num(v, axis)}${axis ? "" : " kWh"}`,
        empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("energyChart")} (kWh)`,
      });
    } else {
      const hourly = rd.eBucket === 3600e3;
      barChart(this._root.getElementById("echart"), {
        series: bars, t0: rd.t0, t1: rd.t1, bucket: rd.eBucket, tickStep: hourly ? 3 * 3600e3 : rd.days === 7 ? 24 * 3600e3 : 5 * 24 * 3600e3,
        fmtValue: (v, axis) => `${num(v, axis)}${axis ? "" : " kWh"}`,
        fmtTime: (t) => (hourly ? fDT.format(t) : fD.format(t)),
        fmtTick: hourly ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t),
        empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("energyChart")} (kWh)`,
      });
    }

    // ---- totals
    const tot = (m) => [...m.values()].reduce((a, v) => a + v, 0);
    const tiles = bars.filter((b) => b.values.size).map((b) =>
      `<div class="tile"><b>${esc(num(tot(b.values)))} kWh</b><span>${esc(b.name)}</span></div>`).join("");
    const prodTot = tot(eProd);
    const share = prodTot > 0 ? `<div class="tile"><b>${esc(num(tot(eDirect) / prodTot * 100, false, 0))} %</b><span>${esc(this._t("directShare"))}</span></div>` : "";
    // derived key figures of the range
    const kwh = (m) => (m ? tot(m) : null);
    const T = { prod: prodTot, feed: tot(eFeed), sin: tot(eSin), sout: tot(eSout), imp: kwh(impE), house: kwh(houseE) };
    const gen = this._cfg.settings?.general || {};
    const numOf = (id) => { const v = parseFloat(this._hass.states[id]?.state); return Number.isNaN(v) ? null : v; };
    const priceImp = (G.priceImp && numOf(G.priceImp)) || gen.price_import || null;
    const priceFeed = (G.priceFeed && numOf(G.priceFeed)) || gen.price_feed_in || null;
    const more = [];
    if (T.house > 0 && T.imp != null) more.push([`${num((1 - Math.min(T.imp, T.house) / T.house) * 100, false, 0)} %`, this._t("autarky")]);
    if (T.prod > 0) more.push([`${num(((T.prod - Math.min(T.feed, T.prod)) / T.prod) * 100, false, 0)} %`, this._t("selfShare")]);
    if (T.imp != null && T.feed > 0) more.push([`${num(Math.min(T.imp, T.feed))} kWh`, this._t("shift")]);
    if (priceImp && T.prod > 0) more.push([`${num((T.prod - Math.min(T.feed, T.prod)) * priceImp, false, 2)} €`, this._t("saving")]);
    if (priceFeed && T.feed > 0) more.push([`${num(T.feed * priceFeed, false, 2)} €`, this._t("revenue")]);
    if (T.prod > 0) more.push([`${num((T.prod * (gen.co2_g_per_kwh || 380)) / 1000, false, 1)} kg`, this._t("co2")]);
    const moreTiles = more.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    this._root.getElementById("tiles").innerHTML = tiles + share + moreTiles + (this._priceTilesHtml || "");
    this._root.querySelectorAll(".chart").forEach((x) => x.classList.remove("loading"));
  }
}
