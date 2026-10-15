const T = {
  de: {
    title: "PV Assistant", energy: "Energiesensoren (kWh)", power: "Leistungssensoren (W)",
    production: "Erzeugung", feed: "Einspeisung", sin: "In Speicher", sout: "Aus Speicher",
    comb: "Kombi-Speicher", total: "Summe", none: "Keine Sensoren konfiguriert.",
    fromStorage: "aus Speicher", intoStorage: "in Speicher", missing: "nicht verfügbar",
    posFrom: "positiv = aus Speicher", posInto: "positiv = in Speicher",
  },
  en: {
    title: "PV Assistant", energy: "Energy sensors (kWh)", power: "Power sensors (W)",
    production: "Production", feed: "Feed-in", sin: "Into storage", sout: "From storage",
    comb: "Combined storage", total: "Total", none: "No sensors configured.",
    fromStorage: "from storage", intoStorage: "into storage", missing: "unavailable",
    posFrom: "positive = from storage", posInto: "positive = into storage",
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
        </style>
        <header><span id="menu"></span><span id="title"></span></header>
        <main id="main"></main>`;
      const menu = document.createElement("ha-menu-button");
      this._root.getElementById("menu").appendChild(menu);
      this._menu = menu;
    }
    this._load();
  }

  async _load() {
    if (!this._hass) { this._wantLoad = true; return; }
    try {
      this._cfg = await this._hass.callWS({ type: "pv_assistant/config" });
    } catch (e) {
      this._cfg = {};
    }
    this._last = null;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
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
    const s = this._hass.states[id];
    const name = s?.attributes.friendly_name || id;
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
    if (!html) html = `<p class="muted">${esc(this._t("none"))}</p>`;
    if (html !== this._last) { this._last = html; this._root.getElementById("main").innerHTML = html; }
  }
}
customElements.define("pv-assistant-panel", PVAssistantPanel);
