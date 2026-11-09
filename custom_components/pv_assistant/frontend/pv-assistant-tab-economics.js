// Economics tab.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, mergedChange, pad2, dateKey, parsePeriod, lineChart, categoryBarChart;
export function init(ctx) {
  ({ esc, mergedChange, pad2, dateKey, parsePeriod, lineChart, categoryBarChart } = ctx);
}

export class EconomicsPart {
  _buildMoney() {
    const { E } = this._keys();
    const box = this._root.getElementById("mon");
    this._moneyOn = !!(E.prod.length && E.feed.length);
    if (!this._moneyOn) { box.replaceChildren(); return; }
    if (!this._mrange) this._mrange = "y12";
    box.innerHTML = `<div class="filters" id="mranges"></div><div class="tiles" id="mtiles"></div><p class="note" id="mnote"></p>
      <div id="mben"><h3 class="ch" id="mbenh">${esc(this._t("monBenefit"))}</h3><div class="chart" id="mbenc"></div></div>
      <div id="mcum"><h3 class="ch">${esc(this._t("monCum"))}</h3><div class="chart" id="mcumc"></div></div>
      <div id="msto"><h3 class="ch" id="mstoh">${esc(this._t("monSto"))}</h3><div class="chart" id="mstoc"></div></div>`;
    this._picker(box.querySelector("#mranges"), () => this._mrange, (v) => { this._mrange = v; this._loadMoney(); });
  }

  async _loadMoney() {
    if (!this._moneyOn || !this._hass || !this._root.getElementById("mranges")) return;
    const token = (this._mtoken = (this._mtoken || 0) + 1);
    const { E } = this._keys();
    const filt = this._cfg.filtered || {};
    const ids = [...E.prod, ...E.feed, ...E.sin, ...E.sout, ...E.comb];
    this._root.querySelectorAll("#mon .chart").forEach((c) => c.classList.add("loading"));
    const all = ids.concat(ids.map((i) => filt[i]).filter(Boolean));
    // the day, week, month and the last n days are shown per day, the long ranges per month
    const win = this._window(this._mrange);
    const perDay = ["day", "week", "month", "roll"].includes(parsePeriod(this._mrange, this._dataStart).kind);
    let res = {}, dres = {};
    [res, dres] = await Promise.all([
      this._ltMonthly("money", all, "change", { energy: "kWh" }).catch(() => ({})),
      perDay ? this._hass.callWS({ type: "recorder/statistics_during_period", start_time: win.start.toISOString(), end_time: win.end.toISOString(),
        statistic_ids: [...new Set(all)], period: "day", types: ["change"], units: { energy: "kWh" } }).catch(() => ({})) : {},
    ]);
    if (token !== this._mtoken) return;
    this._mdata = { res, dres, filt };
    this._drawMoney();
  }

  _drawMoney() {
    const d = this._mdata;
    const root = this._root;
    if (!d || !this._moneyOn || !root.getElementById("mranges")) return;
    const { res, dres, filt } = d;
    const { E } = this._keys();
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const num = (v, dec = 0) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const eur = (v, dec = 0) => `${num(v, dec)} €`;
    const gen = this._cfg.settings?.general || {};
    const Gk = this._keys().G;
    const numOf = (id) => { const v = parseFloat(this._hass.states[id]?.state); return Number.isNaN(v) ? null : v; };
    const pImp = (Gk.priceImp && numOf(Gk.priceImp)) || gen.price_import || null;
    const pFeed = (Gk.priceFeed && numOf(Gk.priceFeed)) || gen.price_feed_in || null;
    root.querySelectorAll("#mon .chart").forEach((c) => c.classList.remove("loading"));
    const hide = (hidden) => ["mben", "mcum", "msto"].forEach((id) => { root.getElementById(id).hidden = hidden; });
    if (!pImp && !pFeed) {
      hide(true);
      root.getElementById("mtiles").replaceChildren();
      root.getElementById("mnote").textContent = this._t("monNoPrice");
      return;
    }
    root.getElementById("mnote").textContent = this._t("monNote");
    // energy per period summed over the sensors (the filtered copy wins); the long ranges use the monthly statistics, the short
    // ones (today ... 90 days) the daily ones
    const ym = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "numeric", timeZone: tz });
    const monthKey = (ts) => { const p = Object.fromEntries(ym.formatToParts(ts).map((x) => [x.type, x.value])); return `${p.year}-${String(p.month).padStart(2, "0")}`; };
    const dayFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz });
    const dayKey = (ts) => dayFmt.format(ts); // YYYY-MM-DD
    const flip = (inv) => (v) => (inv ? -v : v), nz = (v) => Math.max(v, 0);
    const merge = (a, b) => { const m = new Map(a); for (const [k, v] of b) m.set(k, (m.get(k) || 0) + v); return m; };
    const dataset = (src, keyOf) => {
      const sumMap = (ids, fn = (v) => v) => {
        const m = new Map();
        for (const id of ids) for (const [ts, v] of mergedChange(src || {}, id, filt)) { const k = keyOf(ts); m.set(k, (m.get(k) || 0) + fn(v)); }
        return m;
      };
      const set = { prod: sumMap(E.prod), feed: sumMap(E.feed) };
      set.sIn = merge(sumMap(E.sin), sumMap(E.comb, (v) => nz(-flip(E.inv)(v))));
      set.sOut = merge(sumMap(E.sout), sumMap(E.comb, (v) => nz(flip(E.inv)(v))));
      set.keys = [...set.prod.keys()].filter((k) => set.feed.has(k)).sort();
      set.saving = (k) => nz(set.prod.get(k) - set.feed.get(k)) * (pImp || 0);
      set.revenue = (k) => set.feed.get(k) * (pFeed || 0);
      set.sto = (k) => (set.sOut.get(k) || 0) * pImp - (set.sIn.get(k) || 0) * (pFeed || 0);
      return set;
    };
    const M = dataset(res, monthKey), D = dataset(dres, dayKey);
    const pm = parsePeriod(this._mrange, this._dataStart);
    const daily = ["day", "week", "month", "roll"].includes(pm.kind);
    const cur = daily ? D : M; // the data of the chosen range
    const all = M.keys; // months, for the cumulative curve
    const nowKey = monthKey(Date.now()), todayKey = dayKey(Date.now());
    const monthLabel = (k, withYear) => new Intl.DateTimeFormat(lang, withYear ? { month: "short", year: "2-digit" } : { month: "short" }).format(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 15));
    // periods of the chosen range
    let keys;
    if (daily) {
      keys = D.keys.filter((k) => k >= dateKey(pm.start) && k < dateKey(pm.end));
    } else {
      const cutoff12 = `${pm.start.getFullYear()}-${pad2(pm.start.getMonth() + 1)}`;
      keys = M.keys.filter((k) => (pm.kind === "year" ? k.slice(0, 4) === String(pm.start.getFullYear()) : pm.kind === "y12" ? k >= cutoff12 : true));
    }
    const withYear = keys.length && keys[0].slice(0, 4) !== keys.at(-1).slice(0, 4);
    const dayLabel = (k) => new Intl.DateTimeFormat(lang, { day: "numeric", month: "numeric" }).format(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10))));
    const cats = keys.map((k) => (daily ? `${dayLabel(k)}${k === todayKey ? "*" : ""}` : `${monthLabel(k, withYear)}${k === nowKey ? "*" : ""}`));
    root.getElementById("mbenh").textContent = this._t(daily ? "monBenefitDay" : "monBenefit");
    root.getElementById("mstoh").textContent = this._t(daily ? "monStoDay" : "monSto");
    const axisEur = (v) => num(v, Math.abs(v) < 1 ? 2 : Math.abs(v) < 10 ? 1 : 0); // small ranges (a single day) need decimals on the axis
    const tl = { summary: this._t("table"), time: this._t("time") };
    hide(false);
    categoryBarChart(root.getElementById("mbenc"), {
      categories: cats, stacked: true,
      series: [...(pImp ? [{ name: this._t("monSaving"), color: "--pva-direct", values: keys.map(cur.saving) }] : []), ...(pFeed ? [{ name: this._t("monRevenue"), color: "--pva-feed", values: keys.map(cur.revenue) }] : [])],
      fmtValue: (v, axis) => (axis ? axisEur(v) : `${num(v, 2)} €`), empty: this._t("noData"), tableLabels: tl, label: this._t("monBenefit"),
    });

    // cumulative benefit since the first recorded month against the plant cost, with the extrapolation to the payback
    const cost = gen.system_cost_eur > 0 ? gen.system_cost_eur : 0;
    const monthTs = (k) => new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1).getTime();
    let run = 0;
    const cumPts = all.map((k) => { run += M.saving(k) + M.revenue(k); return [monthTs(k) + 31 * 86400e3, run]; }); // value at the end of the month
    const done = all.filter((k) => k !== nowKey);
    const last12 = done.slice(-12);
    const avg12 = last12.length >= 6 ? last12.reduce((a, k) => a + M.saving(k) + M.revenue(k), 0) / last12.length : 0;
    let payTs = null;
    if (cost > 0 && cumPts.length && avg12 > 0 && run < cost) {
      const monthsLeft = (cost - run) / avg12;
      if (monthsLeft <= 12 * 40) payTs = cumPts.at(-1)[0] + monthsLeft * (365.25 / 12) * 86400e3;
    }
    const cumBox = root.getElementById("mcumc");
    if (cumPts.length >= 2) {
      const t0 = cumPts[0][0], t1 = Math.max(cumPts.at(-1)[0], payTs || 0, 1);
      const fY = new Intl.DateTimeFormat(lang, { month: "short", year: "2-digit", timeZone: tz });
      const series = [{ name: this._t("monCumLabel"), short: this._t("monCumLabel"), color: "--pva-prod", points: cumPts }];
      if (cost > 0) series.push({ name: this._t("monCost"), short: this._t("monCost"), color: "--pva-neg", points: this._linePoints([t0, cost], [t1, cost], 30 * 86400e3) });
      if (payTs) series.push({ name: this._t("monPayDate"), short: this._t("monPayDate"), color: "--pva-s1", points: this._linePoints(cumPts.at(-1), [payTs, cost], 30 * 86400e3) });
      lineChart(cumBox, {
        series, t0, t1, step: 40 * 86400e3, tickStep: Math.max(30 * 86400e3, Math.round((t1 - t0) / 5 / (30 * 86400e3)) * 30 * 86400e3),
        fmtValue: (v, axis) => `${num(v, axis ? 0 : 2)}${axis ? "" : " €"}`, fmtTime: (t) => fY.format(t), fmtTick: (t) => fY.format(t),
        empty: this._t("noData"), tableLabels: tl, label: this._t("monCum"),
      });
    } else cumBox.innerHTML = `<p class="empty">${esc(this._t("noData"))}</p>`;

    // storage benefit per period: discharged energy replaces bought energy, charged energy would otherwise have been fed in
    const stoBox = root.getElementById("msto");
    const hasSto = !!(pImp && (cur.sIn.size || cur.sOut.size));
    stoBox.hidden = !hasSto;
    if (hasSto) categoryBarChart(root.getElementById("mstoc"), {
      categories: cats,
      series: [{ name: this._t("stoBenefit"), color: "--pva-bout", colorOf: (v) => (v >= 0 ? "--pva-bout" : "--pva-neg"), values: keys.map(cur.sto) }],
      fmtValue: (v, axis) => (axis ? axisEur(v) : `${num(v, 2)} €`), empty: this._t("noData"), tableLabels: tl, label: this._t("monSto"),
    });

    // tiles
    const tiles = [];
    const total = keys.reduce((a, k) => a + cur.saving(k) + cur.revenue(k), 0);
    if (keys.length) {
      tiles.push([eur(total, daily ? 2 : 0), this._t("monTotal")]);
      if (keys.length > 1) tiles.push([eur(total / keys.length, daily ? 2 : 0), this._t(daily ? "monAvgDay" : "monAvg")]);
    }
    if (cost > 0 && run > 0) {
      tiles.push([`${num((run / cost) * 100)} %`, this._t("monPaid")]);
      if (payTs) {
        tiles.push([new Intl.DateTimeFormat(lang, { month: "long", year: "numeric", timeZone: tz }).format(payTs), this._t("monPayDate")]);
      }
    }
    if (hasSto && keys.length) tiles.push([eur(keys.reduce((a, k) => a + cur.sto(k), 0), daily ? 2 : 0), this._t("stoBenefit")]);
    root.getElementById("mtiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
  }
}
