// Power tab (and the power figures of the Now tab).
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, lineChart;
export function init(ctx) {
  ({ esc, lineChart } = ctx);
}

export class PowerPart {
  async _loadPowerMax() {
    const ids = this._keys().P.prod;
    if (!ids.length || !this._hass) return;
    let res = {};
    try { res = await this._ltMonthly("pmax", ids, "max", { power: "W" }); } catch (e) { res = {}; }
    const max = {};
    for (const id of ids) {
      const vals = (res[id] || []).map((r) => r.max).filter((v) => v != null && !isNaN(v));
      if (vals.length) max[id] = Math.max(...vals);
    }
    this._pmax = max;
    this._renderPower();
    if (this._setMeasured) this._setMeasured();
  }

  _renderPower() {
    if (!this._root || !this._cfg || !this._hass) return;
    const box = this._root.getElementById("pwr");
    const ids = this._keys().P.prod;
    if (!ids.length) return;
    const cards = ids.map((id) => {
      const r = this._read(id);
      const cur = isNaN(r.base) ? null : Math.max(r.base, 0);
      const stat = this._pmax?.[id];
      const peak = this._cfg.settings?.strings?.[id]?.peak; // entered by the user, wins over the measured maximum
      const max = peak > 0 ? peak : cur == null ? stat : Math.max(stat ?? 0, cur);
      const pct = cur != null && max > 0 ? Math.min(100, (cur / max) * 100) : 0;
      const val = cur == null ? `<span class="muted">${esc(this._t("missing"))}</span>` : `${esc(this._fmt(cur))} W`;
      const sub = max != null
        ? `<span>${esc(this._t("ofMax"))} ${esc(this._fmt(max))} W</span><span>${esc(String(Math.round(pct)))} %</span>`
        : `<span class="muted">–</span>`;
      return `<div class="card"><h3><span title="${esc(id)}">${esc(r.name)}</span></h3>
        <div class="pw-val">${val}</div>
        <div class="gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct.toFixed(1)}%"></i></div>
        <div class="pw-sub">${sub}</div></div>`;
    }).join("");
    // whole plant: always shown; the percentage only counts strings with an entered peak
    const withPeak = ids.filter((id) => this._cfg.settings?.strings?.[id]?.peak > 0);
    const nowW = (id) => { const b = this._read(id).base; return isNaN(b) ? 0 : Math.max(b, 0); };
    const allCur = ids.reduce((a, id) => a + nowW(id), 0);
    let total;
    if (withPeak.length) {
      const sumPeak = withPeak.reduce((a, id) => a + this._cfg.settings.strings[id].peak, 0);
      const sumCur = withPeak.reduce((a, id) => a + nowW(id), 0);
      const pct = Math.min(100, (sumCur / sumPeak) * 100);
      total = `<div class="card"><h3><span>${esc(this._t("effTotal"))}</span><small>${withPeak.length}/${ids.length} ${esc(this._t("peakCount"))}</small></h3>
        <div class="pw-val">${esc(this._fmt(allCur))} W</div>
        <div class="gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct.toFixed(1)}%"></i></div>
        <div class="pw-sub"><span>${esc(this._t("ofPeakSum"))} ${esc(this._fmt(sumPeak))} W</span><span>${esc(String(Math.round(pct)))} %</span></div></div>`;
    } else {
      total = `<div class="card"><h3><span>${esc(this._t("effTotal"))}</span></h3>
        <div class="pw-val">${esc(this._fmt(allCur))} W</div>
        <div class="gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i style="width:0%"></i></div>
        <div class="pw-sub"><span class="muted">${esc(this._t("setNoPeakShort"))}</span></div></div>`;
    }
    const html = `<div class="grid">${total}${cards}</div>`;
    if (!this._pwrInit) { // cards on top are re-rendered with every value, the chart below is built once
      this._pwrInit = true;
      box.innerHTML = `<div id="pwrcards"></div><h3 class="ch">${esc(this._t("pwrChart"))} (W)</h3><div class="filters" id="pwranges"></div><div class="chart" id="pwrchart"></div><p class="note">${esc(this._t("pwrTipNote"))}</p><p class="note">${esc(this._t("pwrNote"))}</p>`;
      if (!this._prange) this._prange = "today";
      const ranges = box.querySelector("#pwranges");
      this._picker(ranges, () => this._prange, (v) => { this._prange = v; this._loadPowerChart(); });
    }
    if (html !== this._lastPwr) { this._lastPwr = html; box.querySelector("#pwrcards").innerHTML = html; }
  }

  async _loadPowerChart() {
    const box = this._root?.getElementById("pwrchart");
    if (!box || !this._hass) return;
    const token = (this._pctoken = (this._pctoken || 0) + 1);
    const rd = this._rangeDef(this._prange);
    box.classList.add("loading");
    const res = await this._stats(this._keys().P.prod, rd.pPeriod, "mean", { power: "W" }, rd);
    if (token !== this._pctoken) return;
    this._pcdata = { rd, res };
    this._drawPowerChart();
  }

  _drawPowerChart() {
    const d = this._pcdata;
    const box = this._root?.getElementById("pwrchart");
    if (!d || !box) return;
    const { rd, res } = d;
    const ids = this._keys().P.prod;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const fm = (o) => new Intl.DateTimeFormat(lang, { ...o, timeZone: tz });
    const fDT = fm({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const fD = fm({ weekday: "short", day: "numeric", month: "numeric" });
    const fH = fm({ hour: "2-digit", minute: "2-digit" });
    const fDM = fm({ day: "numeric", month: "numeric" });
    const fMon = fm(new Date(rd.t0).getFullYear() === new Date(rd.t1 - 1).getFullYear() ? { month: "short" } : { month: "short", year: "2-digit" });
    const num = (v, axis) => v.toLocaleString(lang, { maximumFractionDigits: axis ? 1 : 0 });
    const perId = ids.map((id) => {
      const m = new Map();
      for (const r of res[id] || []) if (r.mean != null) m.set(r.start, Math.max(r.mean, 0));
      return { id, name: this._read(id).name, peak: this._cfg.settings?.strings?.[id]?.peak, values: m };
    });
    const total = new Map();
    for (const s of perId) for (const [ts, v] of s.values) total.set(ts, (total.get(ts) || 0) + v);
    const toPts = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]);
    // percentages in the tooltip: a string = share of its own peak, the plant = share of the sum of the peaks,
    // the split below the plant = share of the plant power (adds up to 100 %)
    const pct = (v, ref) => (ref > 0 ? `${Math.round((v / ref) * 100)} %` : undefined);
    const sumPeak = perId.filter((s) => s.peak > 0).reduce((a, s) => a + s.peak, 0);
    const series = perId.map((s, k) => ({ name: s.name, short: `${s.name.slice(0, 11)}${s.name.length > 11 ? "…" : ""}`, color: `--pva-s${(k % 7) + 1}`, points: toPts(s.values), rowNote: (v) => pct(v, s.peak) }));
    if (perId.length > 1) series.push({ name: this._t("effTotal"), short: this._t("effTotal"), color: "--pva-prod", points: toPts(total),
      rowNote: (v) => pct(v, sumPeak), partNote: (v, ts) => pct(v, total.get(ts)),
      parts: perId.map((s) => ({ name: s.name, values: s.values })) });
    box.classList.remove("loading");
    lineChart(box, {
      series, t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis)}${axis ? "" : " W"}`,
      fmtTime: (t) => fDT.format(t),
      fmtTick: rd.long ? (t) => fMon.format(t + 15 * 24 * 3600e3) : rd.days === 1 ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t),
      empty: this._t("noData"), tableLabels: { summary: this._t("table"), time: this._t("time") }, label: `${this._t("pwrChart")} (W)`,
    });
  }
}
