import { lineChart, barChart, categoryBarChart } from "./pv-assistant-charts.js";

const T = {
  de: {
    title: "PV Assistant", energy: "Energiesensoren (kWh)", power: "Leistungssensoren (W)",
    production: "Erzeugung", feed: "Einspeisung", sin: "In Speicher", sout: "Aus Speicher",
    comb: "Kombi-Speicher", total: "Summe", none: "Keine Sensoren konfiguriert.",
    fromStorage: "aus Speicher", intoStorage: "in Speicher", missing: "nicht verfügbar",
    posFrom: "positiv = aus Speicher", posInto: "positiv = in Speicher",
    now: "Aktuell", history: "Verlauf", powerChart: "Leistung", energyChart: "Energie",
    today: "Heute", yesterday: "Gestern", d7: "7 Tage", d30: "30 Tage",
    years: "Jahresübersicht", avgOver: "Schnitt über", yearsUnit: "Jahre", all: "alle", yearProd: "Erzeugung", sofar: "bisher",
    forecast: "Jahresprognose", avgMonth: "Ø Monat", monthly: "Erzeugung je Monat (kWh)", deviation: "Abweichung zum Schnitt (%)",
    avg: "Ø", above: "über Schnitt", below: "unter Schnitt", running: "laufender Monat",
    yearNote: "Der Schnitt je Monat nutzt nur echte, abgeschlossene Monate der gewählten Jahre. Die Jahresprognose ist die Summe dieser Monatsschnitte. Der laufende Monat und künftige Monate zählen nicht mit.",
    prevYear: "Vorheriges Jahr", nextYear: "Nächstes Jahr",
    direct: "Direkt verbraucht", directShort: "Direkt",
    forecast: "Prognose (kWh)", fcToday: "Prognose heute", fcTomorrow: "Prognose morgen", fcRemaining: "Prognose Rest heute",
    fcReached: "Von Prognose erreicht", directShare: "Anteil an Erzeugung",
    storage: "Speicher", storageNet: "Speicher (+ Entladen / − Laden)", loading: "Lade …", noData: "Keine Daten im Zeitraum.",
    table: "Als Tabelle anzeigen", time: "Zeit", totals: "Summen im Zeitraum",
  },
  en: {
    title: "PV Assistant", energy: "Energy sensors (kWh)", power: "Power sensors (W)",
    production: "Production", feed: "Feed-in", sin: "Into storage", sout: "From storage",
    comb: "Combined storage", total: "Total", none: "No sensors configured.",
    fromStorage: "from storage", intoStorage: "into storage", missing: "unavailable",
    posFrom: "positive = from storage", posInto: "positive = into storage",
    now: "Now", history: "History", powerChart: "Power", energyChart: "Energy",
    today: "Today", yesterday: "Yesterday", d7: "7 days", d30: "30 days",
    years: "Yearly overview", avgOver: "Average over", yearsUnit: "years", all: "all", yearProd: "Production", sofar: "so far",
    forecast: "Year forecast", avgMonth: "Avg. month", monthly: "Production per month (kWh)", deviation: "Deviation from average (%)",
    avg: "Avg", above: "above average", below: "below average", running: "current month",
    yearNote: "The monthly average only uses real, completed months of the selected years. The year forecast is the sum of these monthly averages. The current and future months do not count.",
    prevYear: "Previous year", nextYear: "Next year",
    direct: "Used directly", directShort: "Direct",
    forecast: "Forecast (kWh)", fcToday: "Forecast today", fcTomorrow: "Forecast tomorrow", fcRemaining: "Forecast rest of today",
    fcReached: "Of forecast reached", directShare: "Share of production",
    storage: "Storage", storageNet: "Storage (+ discharge / − charge)", loading: "Loading …", noData: "No data in this range.",
    table: "Show as table", time: "Time", totals: "Totals in range",
  },
};

// Config keys per sensor group (see const.py).
const GROUPS = [
  { id: "energy", base: "kWh", keys: {
      production: "production_energy_sensors", feed: "feed_in_energy_sensor",
      sin: "storage_in_energy_sensors", sout: "storage_out_energy_sensors",
      comb: "storage_combined_energy_sensors", inv: "invert_storage_combined" } },
  { id: "power", base: "W", keys: {
      production: "production_power_sensors", feed: "feed_in_power_sensor",
      sin: "storage_in_power_sensors", sout: "storage_out_power_sensors",
      comb: "storage_combined_power_sensors", inv: "invert_storage_combined_power" } },
];
// Unit -> factor to base unit (kWh or W).
const FACTOR = { Wh: 0.001, kWh: 1, MWh: 1000, W: 1, kW: 1000, MW: 1e6 };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);

class PVAssistantPanel extends HTMLElement {
  connectedCallback() {
    if (!this._root) {
      this._root = this.attachShadow({ mode: "open" });
      this._root.innerHTML = `
        <style>
          :host { display:block; background:var(--primary-background-color);
                  color:var(--primary-text-color); min-height:100vh; box-sizing:border-box; }
          header { display:flex; align-items:center; gap:8px; height:56px; padding:0 12px;
                   background:var(--app-header-background-color, var(--primary-color));
                   color:var(--app-header-text-color, #fff); font-size:20px; }
          nav { display:flex; overflow-x:auto; background:var(--app-header-background-color, var(--primary-color));
                color:var(--app-header-text-color, #fff); padding:0 8px; }
          nav button { font:inherit; color:inherit; background:transparent; border:0; border-bottom:3px solid transparent;
                padding:10px 16px 8px; opacity:.75; cursor:pointer; white-space:nowrap; }
          nav button:hover { opacity:1; }
          nav button[aria-selected="true"] { opacity:1; border-bottom-color:currentColor; font-weight:500; }
          [role="tabpanel"][hidden] { display:none; }
          main { padding:16px; max-width:1100px; margin:0 auto; }
          h2 { font-weight:400; font-size:1.2em; margin:24px 0 8px; }
          .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); }
          .card { background:var(--card-background-color); border-radius:12px; padding:16px;
                  box-shadow:var(--ha-card-box-shadow,none); }
          .card h3 { margin:0 0 8px; font-size:1em; font-weight:500; display:flex; justify-content:space-between; }
          .card h3 small { color:var(--secondary-text-color); font-weight:400; }
          .row { display:flex; justify-content:space-between; gap:8px; padding:4px 0;
                 border-top:1px solid var(--divider-color); }
          .row span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .sum { font-weight:500; }
          .muted { color:var(--secondary-text-color); }
          /* categorical slots 1-4 (blue, orange, aqua, yellow), light / dark stepped */
          /* entity colors (same as the Energy dashboard); --pva-grid is reserved for grid import */
          :host { --pva-prod:#ff9800; --pva-feed:#8353d1; --pva-grid:#488fc2; --pva-direct:#ffd700;
                  --pva-bout:#4db6ac; --pva-bin:#f06292;
                  --pva-avg:color-mix(in srgb, #ff9800 45%, var(--card-background-color));
                  --pva-pos:#2a78d6; --pva-neg:#e34948; }
          :host([data-dark]) { --pva-pos:#3987e5; --pva-neg:#e66767; }
          .filters { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 12px; }
          .filters button { font:inherit; color:var(--primary-text-color); background:transparent;
                  border:1px solid var(--divider-color); border-radius:16px; padding:4px 14px; cursor:pointer; }
          .filters button:hover { background:var(--secondary-background-color); }
          .filters button[aria-pressed="true"] { border-color:var(--primary-color); color:var(--primary-color); font-weight:500; }
          .tiles { display:flex; gap:12px; flex-wrap:wrap; margin:0 0 12px; }
          .tile { background:var(--card-background-color); border-radius:12px; padding:10px 14px; min-width:120px; }
          .tile b { display:block; font-size:1.4em; font-weight:500; }
          .tile span { color:var(--secondary-text-color); font-size:.85em; }
          .chart { background:var(--card-background-color); border-radius:12px; padding:12px 12px 8px;
                   margin-bottom:16px; transition:opacity .15s; }
          .chart.loading { opacity:.5; }
          h3.ch { font-weight:500; font-size:1em; margin:16px 0 8px; }
          .legend { display:flex; gap:16px; flex-wrap:wrap; margin:0 0 6px; font-size:.85em; color:var(--secondary-text-color); }
          .legend-item { display:inline-flex; align-items:center; gap:6px; }
          .key { display:inline-block; }
          .key.line { width:12px; height:3px; border-radius:2px; }
          .key.bar { width:10px; height:10px; border-radius:2px; }
          .chartwrap { position:relative; }
          .chartwrap svg { display:block; max-width:100%; touch-action:pan-y; }
          svg .grid { stroke:var(--divider-color); stroke-width:1; opacity:.6; }
          svg .axis { stroke:var(--secondary-text-color); stroke-width:1; opacity:.6; }
          svg .tick, svg .endlabel { fill:var(--secondary-text-color); font-size:11px; }
          svg .hair { stroke:var(--secondary-text-color); stroke-width:1; stroke-dasharray:3 3; }
          svg .dot { stroke:var(--card-background-color); stroke-width:2; }
          svg .wash { fill:var(--secondary-text-color); opacity:.12; }
          .tip { position:absolute; pointer-events:none; z-index:2; background:var(--card-background-color);
                 border:1px solid var(--divider-color); border-radius:8px; padding:8px 10px; font-size:.85em;
                 box-shadow:0 2px 8px rgba(0,0,0,.25); white-space:nowrap; }
          .tip-title { color:var(--secondary-text-color); margin-bottom:4px; }
          .tip-row { display:flex; align-items:center; gap:8px; }
          .tip-row b { font-weight:600; color:var(--primary-text-color); }
          .tip-row span { color:var(--secondary-text-color); }
          details.tableview { margin-top:8px; font-size:.85em; }
          details.tableview summary { cursor:pointer; color:var(--secondary-text-color); }
          details.tableview table { border-collapse:collapse; margin-top:6px; width:100%; }
          details.tableview th, details.tableview td { text-align:right; padding:3px 8px; border-top:1px solid var(--divider-color); }
          details.tableview th:first-child { text-align:left; font-weight:400; }
          .yearnav { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin:0 0 12px; }
          .yearnav button { font:inherit; color:var(--primary-text-color); background:transparent; border:1px solid var(--divider-color);
                  border-radius:16px; width:36px; height:32px; cursor:pointer; }
          .yearnav button:hover:not(:disabled) { background:var(--secondary-background-color); }
          .yearnav button:disabled { opacity:.35; cursor:default; }
          .yearnav b { font-size:1.2em; font-weight:500; min-width:3.5em; text-align:center; }
          .yearnav label { color:var(--secondary-text-color); margin-left:auto; }
          .yearnav select { font:inherit; color:var(--primary-text-color); background:var(--card-background-color);
                  border:1px solid var(--divider-color); border-radius:8px; padding:4px 8px; }
          .note { color:var(--secondary-text-color); font-size:.85em; margin:0 0 16px; }
          p.empty { color:var(--secondary-text-color); margin:16px 0; }
        </style>
        <header><span id="menu"></span><span id="title"></span></header>
        <nav id="tabs" role="tablist"></nav>
        <main><div id="now" role="tabpanel"></div><div id="hist" role="tabpanel"></div><div id="yearsec" role="tabpanel"></div></main>`;
      const menu = document.createElement("ha-menu-button");
      this._root.getElementById("menu").appendChild(menu);
      this._menu = menu;
    }
    this._ro = new ResizeObserver(() => {
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => { if (this._tab === "history") this._draw(); if (this._tab === "years") this._drawYears(); });
    });
    this._ro.observe(this);
    this._timer = setInterval(() => { if (this._hist) this._loadHistory(); if (this._yearsOn) this._loadYears(); }, 5 * 60 * 1000);
    this._load();
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    clearInterval(this._timer);
  }

  async _load() {
    if (!this._hass) { this._wantLoad = true; return; }
    try {
      this._cfg = await this._hass.callWS({ type: "pv_assistant/config" });
    } catch (e) {
      this._cfg = {};
    }
    this._last = null;
    this._buildHistory();
    this._buildYears();
    this._buildTabs();
    this._render();
    this._loadHistory();
    this._loadYears();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    this.toggleAttribute("data-dark", !!hass.themes?.darkMode);
    if (this._menu) this._menu.hass = hass;
    if (first && this._wantLoad) { this._wantLoad = false; this._load(); return; }
    this._render();
  }
  set narrow(v) { this._narrow = v; if (this._menu) this._menu.narrow = v; }
  set panel(_) {}
  set route(_) {}

  _t(k) { return (T[this._hass?.language?.slice(0, 2)] || T.en)[k]; }
  _fmt(n) { return n.toLocaleString(this._hass.locale?.language || this._hass.language, { maximumFractionDigits: 2 }); }

  _read(id) {
    // Energy sensors: show the glitch-filtered copy when it exists.
    const src = this._hass.states[id];
    const s = this._hass.states[this._cfg.filtered?.[id]] || src;
    const name = src?.attributes.friendly_name || id;
    const n = s ? parseFloat(s.state) : NaN;
    const unit = s?.attributes.unit_of_measurement || "";
    return { id, name, unit, value: n, base: isNaN(n) ? NaN : n * (FACTOR[unit] ?? 1) };
  }

  _card(title, ids, base, hint = "", signed = null) {
    if (!ids.length) return "";
    const rows = ids.map((id) => this._read(id));
    const ok = rows.filter((r) => !isNaN(r.base));
    const total = ok.reduce((a, r) => a + r.base, 0);
    const body = rows.map((r) => {
      let val = isNaN(r.value) ? `<span class="muted">${esc(this._t("missing"))}</span>` : `${this._fmt(r.value)} ${esc(r.unit)}`;
      if (signed && !isNaN(r.value) && r.value !== 0) {
        const from = (r.value > 0) !== signed.invert;
        val += ` <span class="muted">(${esc(this._t(from ? "fromStorage" : "intoStorage"))})</span>`;
      }
      return `<div class="row"><span title="${esc(r.id)}">${esc(r.name)}</span><span>${val}</span></div>`;
    }).join("");
    const sum = rows.length > 1 && ok.length
      ? `<div class="row sum"><span>${esc(this._t("total"))}</span><span>${this._fmt(total)} ${base}</span></div>` : "";
    return `<div class="card"><h3><span>${esc(title)}</span><small>${esc(hint)}</small></h3>${body}${sum}</div>`;
  }

  _render() {
    if (!this._hass || !this._cfg) return;
    this._root.getElementById("title").textContent = this._t("title");
    const c = this._cfg;
    let html = "";
    for (const g of GROUPS) {
      const k = g.keys;
      const invert = !!c[k.inv];
      const cards = [
        this._card(this._t("production"), list(c[k.production]), g.base),
        this._card(this._t("feed"), list(c[k.feed]), g.base),
        this._card(this._t("sin"), list(c[k.sin]), g.base),
        this._card(this._t("sout"), list(c[k.sout]), g.base),
        this._card(this._t("comb"), list(c[k.comb]), g.base,
          this._t(invert ? "posInto" : "posFrom"), { invert }),
      ].join("");
      if (cards) html += `<h2>${esc(this._t(g.id))}</h2><div class="grid">${cards}</div>`;
    }
    const fc = [["fcToday", "forecast_today_energy_sensors"], ["fcTomorrow", "forecast_tomorrow_energy_sensors"], ["fcRemaining", "forecast_remaining_energy_sensors"]]
      .map(([label, key]) => this._card(this._t(label), list(c[key]), "kWh")).join("");
    if (fc) html += `<h2>${esc(this._t("forecast"))}</h2><div class="grid">${fc}</div>`;
    if (!html) html = `<p class="muted">${esc(this._t("none"))}</p>`;
    if (html !== this._last) { this._last = html; this._root.getElementById("now").innerHTML = html; }
  }

  // ---------------------------------------------------------------- history

  _keys() {
    const c = this._cfg || {};
    const g = (suffix) => ({
      prod: list(c[`production_${suffix}_sensors`]),
      feed: list(c[`feed_in_${suffix}_sensor`]),
      sin: list(c[`storage_in_${suffix}_sensors`]),
      sout: list(c[`storage_out_${suffix}_sensors`]),
      comb: list(c[`storage_combined_${suffix}_sensors`]),
      inv: !!c[suffix === "power" ? "invert_storage_combined_power" : "invert_storage_combined"],
    });
    return { P: g("power"), E: g("energy") };
  }

  _buildHistory() {
    const { P, E } = this._keys();
    const any = (x) => x.prod.length || x.feed.length || x.sin.length || x.sout.length || x.comb.length;
    const h = this._root.getElementById("hist");
    this._hist = !!(any(P) || any(E));
    if (!this._hist) { h.replaceChildren(); return; }
    if (!this._range) this._range = "today";
    h.innerHTML = `<div class="filters" id="ranges"></div>
      <div class="tiles" id="tiles"></div>
      <h3 class="ch">${esc(this._t("powerChart"))} (W)</h3><div class="chart" id="pchart"></div>
      <h3 class="ch">${esc(this._t("energyChart"))} (kWh)</h3><div class="chart" id="echart"></div>`;
    const box = h.querySelector("#ranges");
    for (const r of ["today", "yesterday", "d7", "d30"]) {
      const b = document.createElement("button");
      b.textContent = this._t(r);
      b.dataset.range = r;
      b.setAttribute("aria-pressed", String(r === this._range));
      b.addEventListener("click", () => {
        this._range = r;
        box.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.range === r)));
        this._loadHistory();
      });
      box.append(b);
    }
  }

  _rangeDef() {
    const day = new Date(); day.setHours(0, 0, 0, 0);
    const at = (back) => { const d = new Date(day); d.setDate(d.getDate() - back); return d; };
    const r = this._range;
    const start = r === "yesterday" ? at(1) : r === "d7" ? at(6) : r === "d30" ? at(29) : at(0);
    const days = r === "d7" ? 7 : r === "d30" ? 30 : 1;
    const t0 = start.getTime();
    const t1 = new Date(start); t1.setDate(t1.getDate() + days);
    const end = r === "yesterday" ? t1.getTime() : Math.min(Date.now(), t1.getTime());
    const H = 3600e3;
    return { t0, t1: t1.getTime(), end, days,
      pPeriod: days === 1 ? "5minute" : "hour", pStep: days === 1 ? 300e3 : H,
      eBucket: days === 1 ? H : 24 * H, eStep: days === 1 ? H : 24 * H,
      tickStep: days === 1 ? 3 * H : days === 7 ? 24 * H : 5 * 24 * H };
  }

  async _stats(ids, period, type, units, rd) {
    ids = [...new Set(ids)];
    if (!ids.length) return {};
    try {
      return await this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: new Date(rd.t0).toISOString(), end_time: new Date(rd.end).toISOString(),
        statistic_ids: ids, period, types: [type], units,
      });
    } catch (e) {
      return {};
    }
  }

  async _loadHistory() {
    if (!this._hist) return;
    const token = (this._token = (this._token || 0) + 1);
    const rd = this._rangeDef();
    const { P, E } = this._keys();
    const filt = this._cfg.filtered || {};
    const powerIds = [...P.prod, ...P.feed, ...P.sin, ...P.sout, ...P.comb];
    const energyIds = [...E.prod, ...E.feed, ...E.sin, ...E.sout, ...E.comb];
    const energyAll = energyIds.concat(energyIds.map((i) => filt[i]).filter(Boolean));
    this._root.querySelectorAll(".chart").forEach((c) => c.classList.add("loading"));
    const [pres, eres] = await Promise.all([
      this._stats(powerIds, rd.pPeriod, "mean", { power: "W" }, rd),
      this._stats(energyAll, rd.eBucket === 3600e3 ? "hour" : "day", "change", { energy: "kWh" }, rd),
    ]);
    if (token !== this._token) return; // a newer range was requested meanwhile
    this._data = { rd, P, E, pres, eres, filt };
    this._draw();
  }

  _draw() {
    const d = this._data;
    if (!d || !this._hist) return;
    const { rd, P, E, pres, eres, filt } = d;
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
    const pick = (id, field) => { const f = filt[id]; const a = f && get(eres, f, field).length ? get(eres, f, field) : get(eres, id, field); return a; };
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
    const merge = (a, b, sign = 1) => { const m = new Map(a); for (const [k, v] of b) add(m, k, sign * v); return m; };

    // ---- power lines
    const pr = (id) => get(pres, id, "mean");
    const pProd = sum(P.prod, pr, "mean"), pFeed = sum(P.feed, pr, "mean");
    const pSin = sum(P.sin, pr, "mean"), pSout = sum(P.sout, pr, "mean");
    const pComb = sum(P.comb, pr, "mean", (v) => (P.inv ? -v : v));
    let pNet = merge(merge(pSout, pSin, -1), pComb);
    // PV used directly = production - feed-in - charging power (never below 0)
    const cP = comb(P.comb, pr, "mean", P.inv);
    const pCharge = merge(pSin, cP.neg);
    const pDirect = new Map();
    for (const [ts, v] of pProd) pDirect.set(ts, Math.max(0, v - (pFeed.get(ts) || 0) - (pCharge.get(ts) || 0)));
    const hasStorageP = P.sin.length || P.sout.length || P.comb.length;
    const toPts = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]);
    const lines = [
      { name: this._t("production"), short: this._t("production"), color: "--pva-prod", points: toPts(pProd) },
      { name: this._t("feed"), short: this._t("feed"), color: "--pva-feed", points: toPts(pFeed) },
      { name: this._t("storageNet"), short: this._t("storage"), color: "--pva-bout", points: hasStorageP ? toPts(pNet) : [] },
      { name: this._t("direct"), short: this._t("directShort"), color: "--pva-direct", points: toPts(pDirect) },
    ];
    const timeLabels = { summary: this._t("table"), time: this._t("time") };
    const tickFmt = rd.days === 1 ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t);
    lineChart(this._root.getElementById("pchart"), {
      series: lines, t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis, 0)}${axis ? "" : " W"}`,
      fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
      empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("powerChart")} (W)`,
    });

    // ---- energy bars
    const er = (field) => (id) => pick(id, field);
    const eProd = sum(E.prod, er("change"), "change"), eFeed = sum(E.feed, er("change"), "change");
    const c = comb(E.comb, er("change"), "change", E.inv);
    const eSin = merge(sum(E.sin, er("change"), "change"), c.neg);
    const eSout = merge(sum(E.sout, er("change"), "change"), c.pos);
    const eDirect = new Map();
    for (const [ts, v] of eProd) eDirect.set(ts, Math.max(0, v - (eFeed.get(ts) || 0) - (eSin.get(ts) || 0)));
    const bars = [
      { name: this._t("production"), color: "--pva-prod", values: eProd },
      { name: this._t("feed"), color: "--pva-feed", values: eFeed },
      { name: this._t("sin"), color: "--pva-bin", values: eSin },
      { name: this._t("sout"), color: "--pva-bout", values: eSout },
      { name: this._t("direct"), color: "--pva-direct", values: eDirect },
    ];
    const hourly = rd.eBucket === 3600e3;
    barChart(this._root.getElementById("echart"), {
      series: bars, t0: rd.t0, t1: rd.t1, bucket: rd.eBucket, tickStep: hourly ? 3 * 3600e3 : rd.days === 7 ? 24 * 3600e3 : 5 * 24 * 3600e3,
      fmtValue: (v, axis) => `${num(v, axis)}${axis ? "" : " kWh"}`,
      fmtTime: (t) => (hourly ? fDT.format(t) : fD.format(t)),
      fmtTick: hourly ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t),
      empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("energyChart")} (kWh)`,
    });

    // ---- totals
    const tot = (m) => [...m.values()].reduce((a, v) => a + v, 0);
    const tiles = bars.filter((b) => b.values.size).map((b) =>
      `<div class="tile"><b>${esc(num(tot(b.values)))} kWh</b><span>${esc(b.name)}</span></div>`).join("");
    const prodTot = tot(eProd);
    const share = prodTot > 0 ? `<div class="tile"><b>${esc(num(tot(eDirect) / prodTot * 100, false, 0))} %</b><span>${esc(this._t("directShare"))}</span></div>` : "";
    let fcTiles = "";
    const fcToday = list(this._cfg.forecast_today_energy_sensors).map((id) => this._read(id).base).filter((v) => !isNaN(v));
    if (this._range === "today" && fcToday.length) {
      const fcSum = fcToday.reduce((a, v) => a + v, 0);
      fcTiles = `<div class="tile"><b>${esc(num(fcSum, false, 1))} kWh</b><span>${esc(this._t("fcToday"))}</span></div>`;
      if (fcSum > 0 && prodTot > 0) fcTiles += `<div class="tile"><b>${esc(num(prodTot / fcSum * 100, false, 0))} %</b><span>${esc(this._t("fcReached"))}</span></div>`;
    }
    this._root.getElementById("tiles").innerHTML = tiles + share + fcTiles;
    this._root.querySelectorAll(".chart").forEach((x) => x.classList.remove("loading"));
  }

  // ---------------------------------------------------------------- yearly overview

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
      <p class="note">${esc(this._t("yearNote"))}</p>`;
    box.querySelector("#yprev").addEventListener("click", () => { this._yy -= 1; this._drawYears(); });
    box.querySelector("#ynext").addEventListener("click", () => { this._yy += 1; this._drawYears(); });
    box.querySelector("#ynum").addEventListener("change", (e) => { this._yn = Number(e.target.value); this._saveYearPrefs(); this._drawYears(); });
  }

  async _loadYears() {
    if (!this._yearsOn) return;
    const filt = this._cfg.filtered || {};
    const ids = this._keys().E.prod;
    const all = ids.concat(ids.map((i) => filt[i]).filter(Boolean));
    const start = new Date(); start.setFullYear(start.getFullYear() - 15, 0, 1); start.setHours(0, 0, 0, 0);
    let res = {};
    try {
      res = await this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: start.toISOString(), end_time: new Date().toISOString(),
        statistic_ids: [...new Set(all)], period: "month", types: ["change"], units: { energy: "kWh" },
      });
    } catch (e) { res = {}; }
    const tz = this._hass.config?.time_zone;
    const fmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "numeric", timeZone: tz });
    const ym = (ts) => { const p = Object.fromEntries(fmt.formatToParts(ts).map((x) => [x.type, x.value])); return [Number(p.year), Number(p.month) - 1]; };
    // month -> kWh, summed over the production sensors; the filtered copy wins per month
    const months = new Map();
    for (const id of ids) {
      const own = new Map();
      for (const r of res[id] || []) if (r.change != null) own.set(r.start, r.change);
      for (const r of res[filt[id]] || []) if (r.change != null) own.set(r.start, r.change);
      for (const [ts, v] of own) { const [y, m] = ym(ts); const k = `${y}-${m}`; months.set(k, (months.get(k) || 0) + v); }
    }
    this._ydata = { months };
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
    const first = this._yn ? Y - this._yn + 1 : minY;
    const years = []; for (let y = Math.max(first, minY); y <= Y; y++) years.push(y);
    const avg = [], used = new Set();
    for (let m = 0; m < 12; m++) {
      const vs = years.filter((y) => complete(y, m) && val(y, m) != null).map((y) => { used.add(y); return val(y, m); });
      avg.push(vs.length ? vs.reduce((a, v) => a + v, 0) / vs.length : null);
    }
    const cur = [], dev = [];
    for (let m = 0; m < 12; m++) {
      const v = val(Y, m);
      cur.push(v);
      dev.push(complete(Y, m) && v != null && avg[m] ? ((v - avg[m]) / avg[m]) * 100 : null);
    }
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
        { name: String(Y), color: "--pva-prod", values: cur },
        { name: `${this._t("avg")} (${used.size} ${this._t("yearsUnit")})`, color: "--pva-avg", values: avg },
      ],
      fmtValue: fv, empty: this._t("noData"), tableLabels: tl, label: this._t("monthly"),
    });
    categoryBarChart(root.getElementById("dchart"), {
      categories: names,
      series: [{ name: this._t("deviation"), color: "--pva-pos", colorOf: (v) => (v >= 0 ? "--pva-pos" : "--pva-neg"), values: dev }],
      legendItems: [{ name: this._t("above"), color: "--pva-pos" }, { name: this._t("below"), color: "--pva-neg" }],
      fmtValue: (v, axis) => `${num(v, axis, 1)} %`, empty: this._t("noData"), tableLabels: tl, label: this._t("deviation"),
    });
    if (Y === cy) root.getElementById("ychart").append(Object.assign(document.createElement("p"), { className: "note", textContent: `* ${this._t("running")}` }));
  }

  // ---------------------------------------------------------------- tabs

  _buildTabs() {
    const list = [["now", "now", "now"]];
    if (this._hist) list.push(["history", "hist", "history"]);
    if (this._yearsOn) list.push(["years", "yearsec", "years"]);
    this._tabs = list;
    let saved = null;
    try { saved = localStorage.getItem("pv_assistant_tab"); } catch (e) { /* storage unavailable */ }
    if (!this._tab || !list.some((t) => t[2] === this._tab)) this._tab = list.some((t) => t[2] === saved) ? saved : "now";
    const nav = this._root.getElementById("tabs");
    nav.replaceChildren();
    for (const [label, , id] of list) {
      const b = document.createElement("button");
      b.setAttribute("role", "tab");
      b.dataset.tab = id;
      b.textContent = this._t(label);
      b.addEventListener("click", () => this._showTab(id));
      b.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const ids = list.map((t) => t[2]);
        const next = ids[(ids.indexOf(id) + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length];
        this._showTab(next);
        nav.querySelector(`[data-tab="${next}"]`).focus();
      });
      nav.append(b);
    }
    this._showTab(this._tab, false);
  }

  _showTab(id, remember = true) {
    this._tab = id;
    if (remember) { try { localStorage.setItem("pv_assistant_tab", id); } catch (e) { /* storage unavailable */ } }
    for (const [, section, tid] of this._tabs) this._root.getElementById(section).hidden = tid !== id;
    this._root.getElementById("tabs").querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.tab === id));
      b.tabIndex = b.dataset.tab === id ? 0 : -1;
    });
    // charts measure their container; hidden tabs have no width, so draw once visible
    if (id === "history") this._draw();
    if (id === "years") this._drawYears();
  }
}
customElements.define("pv-assistant-panel", PVAssistantPanel);
