// Plants tab.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, MAX_ALL_YEARS, lineChart, categoryBarChart, localKeyFn, heatmap, shadingProfile;
export function init(ctx) {
  ({ esc, MAX_ALL_YEARS, lineChart, categoryBarChart, localKeyFn, heatmap, shadingProfile } = ctx);
}

export class PlantsPart {
  _buildPlants() {
    const { P } = this._keys();
    const box = this._root.getElementById("plt");
    this._plantsOn = P.prod.length > 0;
    if (!this._plantsOn) { box.replaceChildren(); return; }
    if (!this._pdays) this._pdays = 90;
    box.innerHTML = `<div class="filters" id="pranges"></div><p class="note" id="pnote"></p><div class="tiles" id="pltiles"></div>
      <h3 class="ch">${esc(this._t("pltTable"))}</h3><div class="chart" id="plttable"></div>
      <h3 class="ch">${esc(this._t("pltDay"))}</h3><div class="chart" id="pltday"></div>
      <h3 class="ch">${esc(this._t("pltDur"))}</h3><div class="chart" id="pltdur"></div><p class="note">${esc(this._t("pltDurNote"))}</p>
      <h3 class="ch">${esc(this._t("pltShade"))}</h3><div class="chart" id="pltshade"></div><p class="note">${esc(this._t("pltShadeNote"))}</p>
      <h3 class="ch">${esc(this._t("anaMonthly"))}</h3><div class="chart" id="pltmonth"></div>
      <h3 class="ch">${esc(this._t("pltHeat"))}</h3><div class="filters" id="pltsel"></div><div class="chart" id="pltheat"></div>`;
    this._picker(box.querySelector("#pranges"), () => this._pdays, (v) => { this._pdays = v; this._loadPlants(); });
  }

  async _loadPlants() {
    if (!this._plantsOn || !this._hass || !this._root.getElementById("pranges")) return;
    const token = (this._pltoken = (this._pltoken || 0) + 1);
    const { P } = this._keys();
    const { start, end, capped } = this._window(this._pdays);
    this._root.querySelectorAll("#plt .chart").forEach((c) => c.classList.add("loading"));
    let pres = {};
    try {
      pres = await this._hass.callWS({ type: "recorder/statistics_during_period", start_time: start.toISOString(), end_time: end.toISOString(),
        statistic_ids: [...new Set(P.prod)], period: "hour", types: ["mean"], units: { power: "W" } });
    } catch (e) { pres = {}; }
    if (token !== this._pltoken) return;
    this._pldata = { pres, start, capped };
    this._drawPlants();
  }

  _drawPlants() {
    const d = this._pldata;
    const root = this._root;
    if (!d || !this._plantsOn || !root.getElementById("plttable")) return;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const key = localKeyFn(tz);
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const { series } = this._buildPlantSeries(d.pres);
    const H = 3600e3, AX0 = Date.UTC(2000, 0, 1);
    const tl = { summary: this._t("table"), time: this._t("time") };
    root.querySelectorAll("#plt .chart").forEach((c) => c.classList.remove("loading"));
    const hh = (h) => `${String(h).padStart(2, "0")}:00`;
    const color = (k) => `--pva-s${(k % 7) + 1}`;
    const short = (n) => `${n.slice(0, 11)}${n.length > 11 ? "…" : ""}`;
    const genSet = this._cfg.settings?.general || {};
    const lat = genSet.latitude || this._hass.config?.latitude, lon = genSet.longitude || this._hass.config?.longitude;
    const located = typeof lat === "number" && typeof lon === "number";

    root.getElementById("pnote").textContent = d.capped ? this._t("rangeCapped").replace("{n}", String(MAX_ALL_YEARS)) : "";

    // overview table
    const total = series.reduce((a, s) => a + s.kwh, 0);
    root.getElementById("pltiles").innerHTML = total > 0
      ? `<div class="tile"><b>${esc(num(total))} kWh</b><span>${esc(this._t("anaTotal"))}</span></div><div class="tile"><b>${esc(String(series.length))}</b><span>${esc(this._t("plantsTab"))}</span></div>` : "";
    const sorted = [...series].sort((a, b) => b.kwh - a.kwh);
    root.getElementById("plttable").innerHTML = series.length
      ? `<table class="dtable"><thead><tr><th>${esc(this._t("pltName"))}</th><th>${esc(this._t("pltStrings"))}</th><th>${esc(this._t("pltPeak"))}</th><th>${esc(this._t("pltInv"))}</th><th>${esc(this._t("pltKwh"))}</th><th>${esc(this._t("pltSpec"))}</th><th>${esc(this._t("pltShare"))}</th></tr></thead><tbody>${
        sorted.map((s) => `<tr><td>${esc(s.name)}</td><td>${s.members.length}</td><td>${s.peak ? esc(num(s.peak, 0)) : "–"}</td><td>${s.max_w > 0 ? esc(num(s.max_w, 0)) : "–"}</td><td>${esc(num(s.kwh))}</td><td>${s.peak ? esc(num(s.kwh / (s.peak / 1000), 1)) : "–"}</td><td>${total > 0 ? esc(num((s.kwh / total) * 100, 0)) : "–"} %</td></tr>`).join("")}</tbody></table>`
      : `<p class="empty">${esc(this._t("noData"))}</p>`;

    // typical day: average power per hour of the day
    const hourly = (m) => {
      const sums = Array(24).fill(0), n = Array(24).fill(0);
      for (const [ts, w] of m) { const h = key(ts).hour; sums[h] += w; n[h]++; }
      return sums.map((v, h) => (n[h] ? v / n[h] : 0));
    };
    const axisFmt = { t0: AX0, t1: AX0 + 23 * H, step: H, tickStep: 3 * H, fmtTime: (t) => hh((t - AX0) / H), fmtTick: (t) => hh((t - AX0) / H) };
    const wv = (v, axis) => `${num(v, 0)}${axis ? "" : " W"}`;
    lineChart(root.getElementById("pltday"), {
      series: series.map((s, k) => ({ name: s.name, short: short(s.name), color: color(k), points: hourly(s.m).map((v, h) => [AX0 + h * H, v]) })),
      ...axisFmt, fmtValue: wv, empty: this._t("noData"), tableLabels: tl, label: this._t("pltDay"),
    });

    // power duration curve: the hourly values sorted by size, with the inverter limit as a line
    const maxN = Math.max(0, ...series.map((s) => s.m.size));
    const thin = Math.max(1, Math.ceil(maxN / 240)); // at most about 240 points per curve
    const durSeries = [];
    series.forEach((s, k) => {
      const vals = [...s.m.values()].filter((v) => v > 0).sort((a, b) => b - a);
      const pts = [];
      for (let i = 0; i < vals.length; i += thin) pts.push([i * H, vals[i]]);
      if (pts.length) durSeries.push({ name: s.name, short: short(s.name), color: color(k), points: pts });
    });
    const durEnd = Math.max(H, ...durSeries.map((s) => s.points.at(-1)[0]));
    series.forEach((s, k) => {
      if (s.max_w > 0) durSeries.push({ name: `${this._t("pltLimit")}: ${s.name}`, short: this._t("pltLimit"), color: "--pva-neg", points: this._linePoints([0, s.max_w], [durEnd, s.max_w], thin * H) });
    });
    const durTick = Math.max(H, Math.round(durEnd / 5 / H / 10) * 10 * H || H);
    lineChart(root.getElementById("pltdur"), {
      series: durSeries, t0: 0, t1: durEnd, step: thin * H * 1.5, tickStep: durTick,
      fmtTime: (t) => `${num(t / H, 0)} ${this._t("pltHoursUnit")}`, fmtTick: (t) => `${num(t / H, 0)} ${this._t("pltHoursUnit")}`,
      fmtValue: wv, empty: this._t("noData"), tableLabels: tl, label: this._t("pltDur"),
    });

    // yield by time of day against the plant's own clear-sky curve (dips = possible shading)
    const shadeSeries = [];
    if (located) series.forEach((s, k) => {
      const gs = s.groups.filter((g) => g.azimuth != null && g.tilt != null);
      if (!gs.length) return;
      const sp = shadingProfile(s.m, s.max_w, gs, lat, lon, key);
      if (sp) shadeSeries.push({ name: s.name, short: short(s.name), color: color(k), points: sp.profile.map((x) => [AX0 + x.hour * H, x.pct]) });
    });
    lineChart(root.getElementById("pltshade"), {
      series: shadeSeries, ...axisFmt, fmtValue: (v, axis) => `${num(v, 0)}${axis ? "" : " %"}`,
      empty: this._t("noData"), tableLabels: tl, label: this._t("pltShade"),
    });

    // yield per month
    const my = this._monthlyYield(series, d.start, key, key(Date.now()).day);
    const sameYear = my.months.length && my.months[0].slice(0, 4) === my.months.at(-1).slice(0, 4);
    const monthFmt = new Intl.DateTimeFormat(lang, sameYear ? { month: "short" } : { month: "short", year: "2-digit" });
    const monthName = (k) => monthFmt.format(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 15));
    categoryBarChart(root.getElementById("pltmonth"), {
      categories: my.months.map(monthName),
      series: my.plants.map((s, i) => ({ name: s.name, color: color(series.indexOf(s)), values: my.months.map((k) => my.val(i, k)) })),
      fmtValue: (v, axis) => `${num(v, axis ? 0 : 1)}${axis ? "" : " kWh/kWp"}`, empty: this._t("noData"), tableLabels: tl, label: this._t("anaMonthly"),
    });

    // typical day per month as a heat map, for the whole system or one plant
    const selBox = root.getElementById("pltsel");
    const options = [["all", this._t("pltAll")], ...series.map((s) => [s.id, s.name])];
    if (!options.some(([v]) => v === this._pplant)) this._pplant = "all";
    const sel = document.createElement("select");
    sel.setAttribute("aria-label", this._t("pltHeat"));
    for (const [v, label] of options) { const o = document.createElement("option"); o.value = v; o.textContent = label; o.selected = v === this._pplant; sel.append(o); }
    sel.addEventListener("change", () => { this._pplant = sel.value; this._drawPlants(); });
    selBox.replaceChildren(sel);
    const chosen = this._pplant === "all" ? series : series.filter((s) => s.id === this._pplant);
    const cells = new Map(); // month -> {sum[24], n[24]}
    for (const s of chosen) for (const [ts, w] of s.m) {
      const k = key(ts); const mk = k.day.slice(0, 7);
      if (!cells.has(mk)) cells.set(mk, { sum: Array(24).fill(0), n: Array(24).fill(0) });
      const c = cells.get(mk); c.sum[k.hour] += w; c.n[k.hour] += 1 / chosen.length; // the plants add up, the samples count once per hour
    }
    const heatMonths = [...cells.keys()].sort();
    heatmap(root.getElementById("pltheat"), {
      days: heatMonths.map((mk) => ({ label: monthName(mk), cells: cells.get(mk).sum.map((v, h) => (cells.get(mk).n[h] ? v / cells.get(mk).n[h] / 1000 : 0)) })),
      colorVar: "--pva-prod", fmt: (v) => `${num(v, 2)} kWh`, hourLabel: hh, empty: this._t("noData"), label: this._t("pltHeat"),
    });
    root.getElementById("pltheat").classList.remove("loading");
  }
}
