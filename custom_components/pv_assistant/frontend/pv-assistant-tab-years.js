// Yearly overview tab.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, mergedChange, lineChart, categoryBarChart;
export function init(ctx) {
  ({ esc, mergedChange, lineChart, categoryBarChart } = ctx);
}

export class YearsPart {
  _yearPrefs() {
    try { return JSON.parse(localStorage.getItem("pv_assistant_years") || "{}"); } catch (e) { return {}; }
  }

  _saveYearPrefs() {
    try { localStorage.setItem("pv_assistant_years", JSON.stringify({ n: this._yn })); } catch (e) { /* storage unavailable */ }
  }

  _buildYears() {
    const prod = this._keys().E.prod;
    const box = this._root.getElementById("yearsec");
    this._yearsOn = prod.length > 0;
    if (!this._yearsOn) { box.replaceChildren(); return; }
    const saved = this._yearPrefs();
    this._yn = saved.n ?? 4;           // years in the average (0 = all)
    this._yy = new Date().getFullYear(); // displayed year
    const opts = [1, 2, 3, 4, 5, 10, 0].map((v) =>
      `<option value="${v}"${v === this._yn ? " selected" : ""}>${v ? v : esc(this._t("all"))}</option>`).join("");
    box.innerHTML = `<div class="yearnav">
        <button id="yprev" aria-label="${esc(this._t("prevYear"))}">‹</button><b id="ylabel"></b>
        <button id="ynext" aria-label="${esc(this._t("nextYear"))}">›</button>
        <label>${esc(this._t("avgOver"))} <select id="ynum">${opts}</select> ${esc(this._t("yearsUnit"))}</label>
      </div>
      <div class="tiles" id="ytiles"></div>
      <h3 class="ch">${esc(this._t("monthly"))}</h3><div class="chart" id="ychart"></div>
      <h3 class="ch">${esc(this._t("deviation"))}</h3><div class="chart" id="dchart"></div>
      <h3 class="ch">${esc(this._t("yearTotal"))}</h3><div class="chart" id="achart"></div>
      <h3 class="ch">${esc(this._t("yearDev"))}</h3><div class="chart" id="adchart"></div>
      <h3 class="ch">${esc(this._t("yearRoll"))}</h3><div class="chart" id="rollchart"></div>
      <p class="note">${esc(this._t("yearNote"))}</p>`;
    box.querySelector("#yprev").addEventListener("click", () => { this._yy -= 1; this._drawYears(); });
    box.querySelector("#ynext").addEventListener("click", () => { this._yy += 1; this._drawYears(); });
    box.querySelector("#ynum").addEventListener("change", (e) => { this._yn = Number(e.target.value); this._saveYearPrefs(); this._drawYears(); });
  }

  async _loadYears() {
    if (!this._yearsOn) return;
    const filt = this._cfg.filtered || {};
    const ids = this._keys().E.prod;
    const fids = this._keys().E.feed;
    const all = [...ids, ...fids].concat([...ids, ...fids].map((i) => filt[i]).filter(Boolean));
    let res = {};
    try { res = await this._ltMonthly("years", all, "change", { energy: "kWh" }); } catch (e) { res = {}; }
    const tz = this._hass.config?.time_zone;
    const fmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "numeric", timeZone: tz });
    const ym = (ts) => { const p = Object.fromEntries(fmt.formatToParts(ts).map((x) => [x.type, x.value])); return [Number(p.year), Number(p.month) - 1]; };
    // month -> kWh, summed over the production sensors; the filtered copy wins per month
    const months = new Map();
    const byId = new Map(); // sensor -> month -> kWh (source split for the tooltips)
    for (const id of ids) {
      const own = mergedChange(res, id, filt);
      const mine = new Map();
      for (const [ts, v] of own) { const [y, m] = ym(ts); const k = `${y}-${m}`; months.set(k, (months.get(k) || 0) + v); mine.set(k, v); }
      byId.set(id, mine);
    }
    const feedMonths = new Map(); // feed-in energy per month (needed for savings and revenue)
    for (const id of fids) {
      const own = mergedChange(res, id, filt);
      for (const [ts, v] of own) { const [y, m] = ym(ts); const k = `${y}-${m}`; feedMonths.set(k, (feedMonths.get(k) || 0) + v); }
    }
    this._ydata = { months, byId, ids, feedMonths, hasFeed: fids.length > 0 };
    this._drawYears();
  }

  _drawYears() {
    const d = this._ydata;
    if (!d || !this._yearsOn) return;
    const lang = this._hass.locale?.language || this._hass.language;
    const now = new Date();
    const cy = now.getFullYear(), cm = now.getMonth();
    const keys = [...d.months.keys()].map((k) => Number(k.split("-")[0]));
    const minY = keys.length ? Math.min(...keys) : cy;
    this._yy = Math.max(minY, Math.min(cy, this._yy));
    const Y = this._yy;
    const val = (y, m) => d.months.get(`${y}-${m}`) ?? null;
    const complete = (y, m) => y < cy || (y === cy && m < cm);
    // the average always covers the LAST n recorded years (up to the latest year with data), not the
    // n years before the displayed year; otherwise older years would be compared with almost nothing
    const latest = keys.length ? Math.max(...keys) : cy;
    const first = this._yn ? latest - this._yn + 1 : minY;
    const years = []; for (let y = Math.max(first, minY); y <= latest; y++) years.push(y);
    const avg = [], used = new Set(), yrsOf = [];
    for (let m = 0; m < 12; m++) {
      const ys = years.filter((y) => complete(y, m) && val(y, m) != null);
      ys.forEach((y) => used.add(y));
      yrsOf.push(ys);
      const vs = ys.map((y) => val(y, m));
      avg.push(vs.length ? vs.reduce((a, v) => a + v, 0) / vs.length : null);
    }
    const cur = [], dev = [];
    for (let m = 0; m < 12; m++) {
      const v = val(Y, m);
      cur.push(v);
      dev.push(complete(Y, m) && v != null && avg[m] ? ((v - avg[m]) / avg[m]) * 100 : null);
    }
    // source split per sensor of the monthly average: same years as the total average, a missing month counts as 0 (so the parts add up to the total)
    const sensorVal = (id, y, m) => d.byId.get(id)?.get(`${y}-${m}`) ?? null;
    const parts = (fn) => d.ids.map((id) => ({ name: this._read(id).name, values: Array.from({ length: 12 }, (_, m) => fn(id, m)) }));
    const sensorAvg = (id, m) => (yrsOf[m].length ? yrsOf[m].reduce((a, y) => a + (sensorVal(id, y, m) || 0), 0) / yrsOf[m].length : null);
    const curParts = parts((id, m) => sensorVal(id, Y, m));
    const avgParts = parts((id, m) => sensorAvg(id, m));
    // deviation per sensor: compare with the sensor's OWN recorded years only (a year without data
    // is not a year with 0 kWh, otherwise a newly added sensor shows +200 % / +300 % ...); a sensor
    // needs at least two recorded years for a comparison
    const ownAvg = (id, m) => {
      const ys = yrsOf[m].filter((y) => sensorVal(id, y, m) != null);
      return ys.length >= 2 ? ys.reduce((a, y) => a + sensorVal(id, y, m), 0) / ys.length : null;
    };
    const devParts = parts((id, m) => {
      const v = sensorVal(id, Y, m), a = ownAvg(id, m);
      return complete(Y, m) && v != null && a ? ((v - a) / a) * 100 : null;
    });
    const num = (v, axis, max = 1) => v.toLocaleString(lang, { maximumFractionDigits: axis ? 1 : max });
    const names = Array.from({ length: 12 }, (_, m) => new Intl.DateTimeFormat(lang, { month: "short" }).format(new Date(2000, m, 1)));
    const root = this._root;
    root.getElementById("ylabel").textContent = String(Y);
    root.getElementById("yprev").disabled = Y <= minY;
    root.getElementById("ynext").disabled = Y >= cy;

    const sofar = cur.reduce((a, v) => a + (v || 0), 0);
    const have = avg.filter((v) => v != null);
    const forecast = have.reduce((a, v) => a + v, 0);
    const tile = (v, l) => `<div class="tile"><b>${esc(num(v, false, 0))} kWh</b><span>${esc(l)}</span></div>`;
    root.getElementById("ytiles").innerHTML = cur.some((v) => v != null) || have.length
      ? tile(sofar, `${this._t("yearProd")} ${Y} ${this._t("sofar")}`)
        + (have.length ? tile(forecast, `${this._t("forecast")} (${used.size} ${this._t("yearsUnit")})`) + tile(forecast / have.length, this._t("avgMonth")) : "") : "";

    const tl = { summary: this._t("table"), time: this._t("time") };
    const fv = (v, axis) => `${num(v, axis, 1)}${axis ? "" : " kWh"}`;
    categoryBarChart(root.getElementById("ychart"), {
      categories: names.map((n, m) => (Y === cy && m === cm ? `${n}*` : n)),
      series: [
        { name: String(Y), color: "--pva-prod", values: cur, parts: curParts },
        { name: `${this._t("avg")} (${used.size} ${this._t("yearsUnit")})`, color: "--pva-avg", values: avg, parts: avgParts },
      ],
      fmtValue: fv, empty: this._t("noData"), tableLabels: tl, label: this._t("monthly"),
    });
    categoryBarChart(root.getElementById("dchart"), {
      categories: names,
      series: [{ name: this._t("deviation"), color: "--pva-pos", colorOf: (v) => (v >= 0 ? "--pva-pos" : "--pva-neg"), values: dev, parts: devParts }],
      legendItems: [{ name: this._t("above"), color: "--pva-pos" }, { name: this._t("below"), color: "--pva-neg" }],
      fmtValue: (v, axis) => `${v > 0 ? "+" : ""}${num(v, axis, 1)} %`, empty: this._t("noData"), tableLabels: tl, label: this._t("deviation"),
    });
    // ---- yearly totals and their deviation (like-for-like: only months that are complete and recorded
    // for that year, compared with the same months of the monthly average)
    const monthsOf = (y) => Array.from({ length: 12 }, (_, m) => m).filter((m) => complete(y, m) && val(y, m) != null && avg[m] != null);
    const yearList = [];
    for (let y = minY; y <= latest; y++) if (monthsOf(y).length) yearList.push(y);
    const sumOver = (ms, f) => ms.reduce((a, m) => a + (f(m) || 0), 0);
    const yCats = yearList.map((y) => (monthsOf(y).length < 12 ? `${y}*` : String(y)));
    const yTot = yearList.map((y) => sumOver(monthsOf(y), (m) => val(y, m)));
    const yRef = yearList.map((y) => sumOver(monthsOf(y), (m) => avg[m]));
    const yDev = yTot.map((t, i) => (yRef[i] > 0 ? ((t - yRef[i]) / yRef[i]) * 100 : null));
    const yPart = (fn) => d.ids.map((id) => ({ name: this._read(id).name, values: yearList.map((y) => fn(id, y, monthsOf(y))) }));
    const totParts = yPart((id, y, ms) => sumOver(ms, (m) => sensorVal(id, y, m)));
    const refParts = yPart((id, y, ms) => sumOver(ms, (m) => sensorAvg(id, m)));
    const devOwnParts = yPart((id, y, ms) => {
      let s = 0, r = 0;
      for (const m of ms) { const v = sensorVal(id, y, m), a = ownAvg(id, m); if (v != null && a) { s += v; r += a; } }
      return r > 0 ? ((s - r) / r) * 100 : null;
    });
    categoryBarChart(root.getElementById("achart"), {
      categories: yCats,
      series: [
        { name: this._t("yearProd"), color: "--pva-prod", values: yTot, parts: totParts },
        { name: this._t("avgSame"), color: "--pva-avg", values: yRef, parts: refParts },
      ],
      fmtValue: fv, empty: this._t("noData"), tableLabels: tl, label: this._t("yearTotal"),
    });
    categoryBarChart(root.getElementById("adchart"), {
      categories: yCats,
      series: [{ name: this._t("yearDev"), color: "--pva-pos", colorOf: (v) => (v >= 0 ? "--pva-pos" : "--pva-neg"), values: yDev, parts: devOwnParts }],
      legendItems: [{ name: this._t("above"), color: "--pva-pos" }, { name: this._t("below"), color: "--pva-neg" }],
      fmtValue: (v, axis) => `${v > 0 ? "+" : ""}${num(v, axis, 1)} %`, empty: this._t("noData"), tableLabels: tl, label: this._t("yearDev"),
    });
    if (yCats.some((c) => c.endsWith("*"))) {
      for (const id of ["achart", "adchart"]) root.getElementById(id).append(Object.assign(document.createElement("p"), { className: "note", textContent: this._t("yearStar") }));
    }
    // tile: deviation of the selected year
    const yi = yearList.indexOf(Y);
    if (yi >= 0 && yDev[yi] != null) {
      root.getElementById("ytiles").insertAdjacentHTML("beforeend",
        `<div class="tile"><b>${esc(`${yDev[yi] > 0 ? "+" : ""}${num(yDev[yi], false, 1)} %`)}</b><span>${esc(`${this._t("devTile")} ${Y}${yCats[yi].endsWith("*") ? "*" : ""}`)}</span></div>`);
    }

    // ---- benefit, payback and trend
    const extra = [];
    const gen = this._cfg.settings?.general || {};
    const Gk = this._keys().G;
    const numOf = (id) => { const v = parseFloat(this._hass.states[id]?.state); return Number.isNaN(v) ? null : v; };
    const priceImp = (Gk.priceImp && numOf(Gk.priceImp)) || gen.price_import || null;
    const priceFeed = (Gk.priceFeed && numOf(Gk.priceFeed)) || gen.price_feed_in || null;
    if (d.hasFeed && (priceImp || priceFeed)) {
      const benefit = (y, m) => {
        const prod = val(y, m), feed = d.feedMonths.get(`${y}-${m}`);
        if (prod == null || feed == null) return null;
        return Math.max(prod - feed, 0) * (priceImp || 0) + feed * (priceFeed || 0);
      };
      const eur = (v) => `${num(v, false, 0)} €`;
      let yearSum = 0, yearHas = false;
      for (let m = 0; m < 12; m++) { const b = benefit(Y, m); if (b != null) { yearSum += b; yearHas = true; } }
      if (yearHas) extra.push([eur(yearSum) + (Y === cy ? "*" : ""), `${this._t("yBenefit")} ${Y}`]);
      // last 12 completed months and everything recorded so far
      const done = [];
      for (let y = minY; y <= latest; y++) for (let m = 0; m < 12; m++) if (complete(y, m)) { const b = benefit(y, m); if (b != null) done.push(b); }
      // the last 12 completed calendar months, only when every one of them has data
      const lastMonths = Array.from({ length: 12 }, (_, i) => { const t = new Date(cy, cm - 12 + i, 1); return benefit(t.getFullYear(), t.getMonth()); });
      if (lastMonths.every((b) => b != null)) {
        const last12 = lastMonths.reduce((a, v) => a + v, 0);
        extra.push([eur(last12), this._t("yBenefit12")]);
        if (gen.system_cost_eur > 0 && last12 > 0) {
          const paid = done.reduce((a, v) => a + v, 0);
          extra.push([`${num((paid / gen.system_cost_eur) * 100, false, 0)} %`, this._t("yPaidPct")]);
          if (paid < gen.system_cost_eur) extra.push([`${num((gen.system_cost_eur - paid) / last12, false, 1)} ${this._t("yYears")}`, this._t("yPaidLeft")]);
        }
      }
    }
    // selected year against the year before, only months that are complete and recorded in both years
    if (Y > minY) {
      const both = Array.from({ length: 12 }, (_, m) => m).filter((m) => complete(Y, m) && complete(Y - 1, m) && val(Y, m) != null && val(Y - 1, m) != null);
      const prevSum = sumOver(both, (m) => val(Y - 1, m));
      if (both.length >= 6 && prevSum > 0) {
        const yoy = ((sumOver(both, (m) => val(Y, m)) - prevSum) / prevSum) * 100;
        extra.push([`${yoy > 0 ? "+" : ""}${num(yoy, false, 1)} %${both.length < 12 ? "*" : ""}`, `${this._t("yearYoY")}`]);
      }
    }
    // trend of the yearly total (least squares over years with at least 9 months; depends on the weather)
    const trendYears = yearList.map((y, i) => [y, yDev[i], monthsOf(y).length]).filter(([, dv, n]) => dv != null && n >= 9);
    if (trendYears.length >= 3) {
      const mx = trendYears.reduce((a, [y]) => a + y, 0) / trendYears.length, my = trendYears.reduce((a, [, dv]) => a + dv, 0) / trendYears.length;
      const sxx = trendYears.reduce((a, [y]) => a + (y - mx) ** 2, 0), sxy = trendYears.reduce((a, [y, dv]) => a + (y - mx) * (dv - my), 0);
      if (sxx > 0) {
        extra.push([`${sxy / sxx > 0 ? "+" : ""}${num(sxy / sxx, false, 1)} % ${this._t("yTrendUnit")}`, this._t("yTrend")]);
        // a steady loss beyond the usual module ageing is worth a look; the weather scatters more than this, so it stays a hint
        if (sxy / sxx <= -0.7) root.getElementById("adchart").append(Object.assign(document.createElement("p"), { className: "note", textContent: this._t("yearDegr").replace("{pct}", num(-sxy / sxx, false, 1)) }));
      }
    }
    if (extra.length) {
      root.getElementById("ytiles").insertAdjacentHTML("beforeend", extra.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join(""));
    }

    // production of the last 12 months as a rolling sum: smooths the seasons, a steady slope shows ageing or a lasting problem
    {
      const first = keys.length ? minY : cy;
      const seq = [];
      for (let y = first; y <= cy; y++) for (let m = 0; m < 12; m++) if (complete(y, m)) seq.push([y, m]);
      const pts = [];
      for (let i = 11; i < seq.length; i++) {
        const win = seq.slice(i - 11, i + 1);
        if (win.every(([y, m]) => val(y, m) != null)) pts.push([new Date(seq[i][0], seq[i][1] + 1, 1).getTime(), win.reduce((a, [y, m]) => a + val(y, m), 0)]);
      }
      const rollBox = root.getElementById("rollchart");
      if (pts.length >= 2) {
        const fRoll = new Intl.DateTimeFormat(lang, { month: "short", year: "2-digit" });
        const t0 = pts[0][0], t1 = pts.at(-1)[0];
        lineChart(rollBox, {
          series: [{ name: this._t("yearRoll"), short: "12 M", color: "--pva-prod", points: pts }], t0, t1, step: 40 * 86400e3,
          tickStep: Math.max(30 * 86400e3, Math.round((t1 - t0) / 5 / (30 * 86400e3)) * 30 * 86400e3),
          fmtValue: (v, axis) => `${num(v, axis, 0)}${axis ? "" : " kWh"}`, fmtTime: (t) => fRoll.format(t - 86400e3), fmtTick: (t) => fRoll.format(t - 86400e3),
          empty: this._t("noData"), tableLabels: tl, label: this._t("yearRoll"),
        });
      } else rollBox.innerHTML = `<p class="empty">${esc(this._t("noData"))}</p>`;
    }

    if (Y === cy) root.getElementById("ychart").append(Object.assign(document.createElement("p"), { className: "note", textContent: `* ${this._t("running")}` }));
  }
}
