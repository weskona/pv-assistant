// Report: the monthly figures of the whole recorded time as a CSV file (opens in a spreadsheet).
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let mergedChange;
export function init(ctx) {
  ({ mergedChange } = ctx);
}

/** One CSV text: fields separated by ";", quoted where needed, dot as decimal separator. */
export function toCsv(header, rows) {
  const cell = (v) => {
    if (v == null || Number.isNaN(v)) return "";
    if (typeof v === "number") return String(Math.round(v * 1000) / 1000);
    return /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  return [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
}

export class ReportPart {
  async _exportReport() {
    const note = this._root.getElementById("mexportnote");
    const button = this._root.getElementById("mexport");
    if (button) button.disabled = true;
    try {
      const { E, G } = this._keys();
      const filt = this._cfg.filtered || {};
      const ids = [...E.prod, ...E.feed, ...E.sin, ...E.sout, ...E.comb, ...G.impE, ...G.houseE];
      const all = ids.concat(ids.map((i) => filt[i]).filter(Boolean));
      const res = await this._ltMonthly("report", all, "change", { energy: "kWh" });
      const tz = this._hass.config?.time_zone;
      const ym = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: tz });
      const monthKey = (ts) => { const q = Object.fromEntries(ym.formatToParts(ts).map((x) => [x.type, x.value])); return `${q.year}-${q.month}`; };
      const flip = (inv) => (v) => (inv ? -v : v), nz = (v) => Math.max(v, 0);
      const sumMap = (list, fn = (v) => v) => {
        const m = new Map();
        for (const id of list) for (const [ts, v] of mergedChange(res, id, filt)) { const k = monthKey(ts); m.set(k, (m.get(k) || 0) + fn(v)); }
        return m;
      };
      const prod = sumMap(E.prod), feed = sumMap(E.feed), imp = sumMap(G.impE), house = sumMap(G.houseE);
      const sIn = sumMap(E.sin), sOut = sumMap(E.sout);
      for (const [k, v] of sumMap(E.comb, (x) => nz(-flip(E.inv)(x)))) sIn.set(k, (sIn.get(k) || 0) + v);
      for (const [k, v] of sumMap(E.comb, (x) => nz(flip(E.inv)(x)))) sOut.set(k, (sOut.get(k) || 0) + v);
      const gen = this._cfg.settings?.general || {};
      const numOf = (id) => { const v = parseFloat(this._hass.states[id]?.state); return Number.isNaN(v) ? null : v; };
      const pImp = (G.priceImp && numOf(G.priceImp)) || gen.price_import || null, pFeed = (G.priceFeed && numOf(G.priceFeed)) || gen.price_feed_in || null;
      const months = [...prod.keys()].sort();
      const rows = months.map((k) => {
        const p = prod.get(k) || 0, f = E.feed.length ? feed.get(k) ?? null : null;
        const toStore = f != null ? Math.min(sIn.get(k) || 0, nz(p - f)) : null;
        const direct = f != null ? nz(p - f - toStore) : null;
        const used = f != null ? nz(p - f) : null;
        const consumption = G.houseE.length ? house.get(k) ?? null : f != null && G.impE.length ? direct + (sOut.get(k) || 0) + (imp.get(k) || 0) : null;
        return [k, p, f, imp.get(k) ?? null, consumption, sIn.get(k) ?? null, sOut.get(k) ?? null, direct,
          f != null && p > 0 ? (used / p) * 100 : null,
          consumption > 0 && G.impE.length ? (nz(consumption - (imp.get(k) || 0)) / consumption) * 100 : null,
          used != null && pImp ? used * pImp : null, f != null && pFeed ? f * pFeed : null,
          f != null && (pImp || pFeed) ? used * (pImp || 0) + f * (pFeed || 0) : null];
      });
      if (!rows.length) { if (note) note.textContent = this._t("repNone"); return; }
      const header = ["repMonth", "repProd", "repFeed", "repImport", "repHouse", "repStoreIn", "repStoreOut", "repDirect", "repSelf", "repAutarky", "repSavings", "repRevenue", "repBenefit"].map((k) => this._t(k));
      const blob = new Blob([`﻿${toCsv(header, rows)}\r\n`], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pv-assistant-report-${new Date().toISOString().slice(0, 10)}.csv`;
      this._root.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      if (note) note.textContent = this._t("repDone").replace("{n}", String(rows.length));
    } finally {
      if (button) button.disabled = false;
    }
  }
}
