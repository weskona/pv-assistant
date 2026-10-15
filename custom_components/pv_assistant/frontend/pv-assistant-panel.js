class PVAssistantPanel extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._root) {
      this._root = this.attachShadow({ mode: "open" });
      this._root.innerHTML = `
        <style>
          :host { display:block; padding:16px; background:var(--primary-background-color);
                  color:var(--primary-text-color); min-height:100vh; box-sizing:border-box; }
          h1 { font-weight:400; margin:0 0 16px; }
          .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); }
          .card { background:var(--card-background-color); border-radius:12px; padding:16px;
                  box-shadow:var(--ha-card-box-shadow,none); }
          .label { color:var(--secondary-text-color); font-size:.9em; }
          .value { font-size:2em; margin-top:4px; }
          .empty { color:var(--secondary-text-color); }
        </style>
        <h1>PV Assistant</h1><div class="grid" id="g"></div>`;
    }
    const entries = Object.values(hass.entities || {}).filter((e) => e.platform === "pv_assistant");
    const g = this._root.getElementById("g");
    if (!entries.length) { g.innerHTML = '<div class="empty">Keine Entitäten gefunden.</div>'; return; }
    g.innerHTML = entries.map((e) => {
      const s = hass.states[e.entity_id];
      const name = s?.attributes.friendly_name?.replace(/^PV Assistant /, "") ?? e.entity_id;
      const v = !s || ["unknown", "unavailable"].includes(s.state) ? "–"
        : `${s.state} ${s.attributes.unit_of_measurement ?? ""}`;
      return `<div class="card"><div class="label">${name}</div><div class="value">${v}</div></div>`;
    }).join("");
  }
}
customElements.define("pv-assistant-panel", PVAssistantPanel);
