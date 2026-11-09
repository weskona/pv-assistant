// Settings tab.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let groupsOf, invertersOf;
export function init(ctx) {
  ({ groupsOf, invertersOf } = ctx);
}

export class SettingsPart {
  _buildSettings() {
    const box = this._root.getElementById("setsec");
    const { P, E } = this._keys();
    box.replaceChildren();
    if (!P.prod.length && !E.prod.length) return;
    const isAdmin = !!this._hass.user?.is_admin;
    const strings = this._cfg.settings?.strings || {};
    const inputs = []; // {id, name, peak, take}
    const cards = new Map(); // sensor id -> its settings card (placed under its plant)
    const mk = (tag, attrs = {}, text) => {
      const n = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      if (text !== undefined) n.textContent = text; // names are untrusted: textContent / value only
      return n;
    };
    box.append(mk("h2", {}, this._t("setStrings")), mk("p", { class: "note" }, this._t("setIntro")));
    if (!isAdmin) box.append(mk("p", { class: "note warn" }, this._t("setAdmin")));

    const card = (id, kind, withPeak) => {
      const st = this._hass.states[id];
      const c = mk("details", { class: "setcard sensor" });
      const heading = mk("h3", {}, strings[id]?.name || st?.attributes.friendly_name || id);
      c.append(mk("summary", {}, ""));
      c.firstChild.append(heading, mk("span", { class: "eid" }, `${id} · ${this._t(kind)}`));
      const nameRow = mk("div", { class: "setrow" });
      const nameId = `set-name-${id}`;
      const name = mk("input", { type: "text", id: nameId, maxlength: "60", placeholder: st?.attributes.friendly_name || id });
      name.value = strings[id]?.name || "";
      name.disabled = !isAdmin;
      name.addEventListener("input", () => { heading.textContent = name.value.trim() || st?.attributes.friendly_name || id; });
      nameRow.append(mk("label", { for: nameId }, this._t("setName")), name);
      c.append(nameRow);
      let peak = null, mppts = null, moduleWp = null, take = null, groups = null;
      if (withPeak) {
        const num2 = (key, label, step, hintKey) => {
          const r = mk("div", { class: "setrow" });
          const oid = `set-${key}-${id}`;
          const input = mk("input", { type: "number", id: oid, min: "0", step: String(step), inputmode: "decimal" });
          input.value = strings[id]?.[key] > 0 ? String(strings[id][key]) : "";
          input.disabled = !isAdmin;
          r.append(mk("label", { for: oid }, this._t(label)), input, mk("div", { class: "hint" }, hintKey ? this._t(hintKey) : ""));
          c.append(r);
          return input;
        };
        moduleWp = num2("module_wp", "setModuleWp", 5, "setModulesHint");
        const row = mk("div", { class: "setrow" });
        const peakId = `set-peak-${id}`;
        peak = mk("input", { type: "number", id: peakId, min: "0", step: "10", inputmode: "decimal" });
        peak.value = strings[id]?.peak > 0 ? String(strings[id].peak) : "";
        peak.disabled = !isAdmin;
        const hint = mk("div", { class: "hint" });
        take = mk("button", { type: "button", class: "setbtn" }, this._t("setTake"));
        take.disabled = !isAdmin;
        hint.append(mk("span", { "data-measured": id }, ""), take);
        row.append(mk("label", { for: peakId }, this._t("setPeak")), peak, hint);
        c.append(row);
        const groupRows = [];
        const fromModules = () => {
          const n = groupRows.reduce((acc, r) => acc + (parseFloat(r.m.value.replace(",", ".")) || 0), 0), w = parseFloat(moduleWp.value.replace(",", "."));
          const derived = n > 0 && w > 0;
          if (derived) peak.value = String(Math.round(n * w));
          // with module counts and module power the peak is calculated, so the field and "use" are locked
          peak.disabled = derived || !isAdmin;
          take.disabled = derived || !isAdmin;
        };
        moduleWp.addEventListener("input", fromModules);
        take.addEventListener("click", () => { const m = this._pmax?.[id]; if (m > 0) peak.value = String(Math.round(m)); });
        mppts = num2("mppts", "setMppts", 1, "setMpptsHint");
        // module strings: modules, orientation and tilt, MPPT of the inverter they hang on
        c.append(mk("div", { class: "setsub" }, this._t("setGroups")), mk("div", { class: "hint setgh" }, this._t("setGroupsHint")));
        const gwrap = mk("div", { class: "setgroups" });
        const addBtn = mk("button", { type: "button", class: "setbtn" }, this._t("gAdd"));
        addBtn.disabled = !isAdmin;
        c.append(gwrap, addBtn);
        const renumber = () => groupRows.forEach((r, i) => { r.title.textContent = this._t("gTitle").replace("{n}", String(i + 1)); });
        const addGroup = (g) => {
          const el = mk("div", { class: "setgroup" });
          const title = mk("div", { class: "gtitle" });
          const rm = mk("button", { type: "button", class: "setbtn" }, this._t("gRemove"));
          rm.disabled = !isAdmin;
          const head = mk("div", { class: "ghead" });
          head.append(title, rm);
          const grid = mk("div", { class: "ggrid" });
          const field = (key, label, min, max, step, signed) => {
            const w = mk("label", { class: "gfield" }, this._t(label));
            const input = mk("input", { type: "number", min: String(min), max: String(max), step: String(step), inputmode: "decimal" });
            input.value = g && g[key] != null && (signed || g[key] > 0) ? String(g[key]) : "";
            input.disabled = !isAdmin;
            input.addEventListener("input", fromModules);
            w.append(input);
            grid.append(w);
            return input;
          };
          // orientation as a compass bearing (phone compass: north = 0, east = 90, south = 180, west = 270); the settings keep the
          // azimuth like Forecast.Solar (south = 0, east = -90, west = 90), the widget converts in both directions
          const compassField = () => {
            const toHeading = (az) => ((Math.round(az) + 180) % 360 + 360) % 360;
            const toAzimuth = (h) => ((h - 180 + 540) % 360) - 180;
            const w = mk("div", { class: "gfield gcompass" });
            w.append(mk("span", {}, this._t("gAz")));
            const box = mk("div", { class: "compassrow" });
            const NS = "http://www.w3.org/2000/svg";
            const svgNode = (tag, attrs = {}, text) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text !== undefined) n.textContent = text; return n; };
            const svg = svgNode("svg", { viewBox: "-40 -40 80 80", width: "76", height: "76", class: "compass", role: "img", "aria-label": this._t("gAz") });
            svg.append(svgNode("circle", { r: "34", class: "ring" }));
            const letters = this._t("compassLetters");
            letters.forEach((l, i) => svg.append(svgNode("text", { x: String([0, 26, 0, -26][i]), y: String([-24, 3, 31, 3][i]), class: "tickl" }, l)));
            const needle = svgNode("g", { class: "needle" });
            needle.append(svgNode("line", { x1: "0", y1: "8", x2: "0", y2: "-18" }), svgNode("polygon", { points: "0,-27 -6,-15 6,-15" }));
            svg.append(needle);
            const input = mk("input", { type: "number", min: "0", max: "360", step: "1", inputmode: "decimal", placeholder: "°" });
            const label = mk("div", { class: "hint" });
            input.disabled = !isAdmin;
            input.value = g && g.azimuth != null ? String(toHeading(g.azimuth)) : "";
            const refresh = () => {
              const h = parseFloat(input.value.replace(",", "."));
              needle.style.display = Number.isNaN(h) ? "none" : "";
              needle.setAttribute("transform", `rotate(${Number.isNaN(h) ? 0 : h})`);
              label.textContent = Number.isNaN(h) ? this._t("gAzEmpty") : `${this._t("compass8")[Math.round((((h % 360) + 360) % 360) / 45) % 8]} (${Math.round(h)}°)`;
            };
            const pick = (ev) => {
              const r = svg.getBoundingClientRect();
              const dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
              if (!dx && !dy) return;
              input.value = String(Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360) % 360); // 0 = north (up), clockwise
              refresh();
            };
            if (isAdmin) {
              svg.addEventListener("pointerdown", (ev) => { try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* no active pointer (synthetic event): picking still works */ } pick(ev); });
              svg.addEventListener("pointermove", (ev) => { if (ev.buttons) pick(ev); });
            }
            input.addEventListener("input", refresh);
            refresh();
            box.append(svg, mk("div", { class: "compassval" }));
            box.lastChild.append(input, label);
            w.append(box);
            grid.append(w);
            // read like the other fields: the azimuth as text, empty when no bearing is entered
            return { get value() { const h = parseFloat(input.value.replace(",", ".")); return Number.isNaN(h) ? "" : String(toAzimuth(((h % 360) + 360) % 360)); } };
          };
          const row = { el, title, m: field("modules", "gModules", 0, 10000, 1), a: compassField(), t: field("tilt", "gTilt", 0, 90, 5, true), p: field("mppt", "gMppt", 0, 64, 1) };
          rm.addEventListener("click", () => { groupRows.splice(groupRows.indexOf(row), 1); el.remove(); renumber(); fromModules(); });
          el.append(head, grid);
          gwrap.append(el);
          groupRows.push(row);
          renumber();
          fromModules();
        };
        const initial = groupsOf(strings[id]);
        (initial.length ? initial : [null]).forEach(addGroup);
        addBtn.addEventListener("click", () => addGroup(null));
        groups = groupRows;
      }
      cards.set(id, c);
      inputs.push({ id, name, peak, mppts, moduleWp, groups });
    };
    P.prod.forEach((id) => card(id, "setPower", true));
    E.prod.forEach((id) => card(id, "setEnergy", false));

    // plants (inverters): name, max. power and the power sensors (MPPT inputs, strings) that belong to it; the sensor cards sit inside their plant.
    // A sensor without a plant counts as a plant of its own.
    const invBox = mk("div", { class: "setcard" });
    invBox.append(mk("h3", {}, this._t("invTitle")), mk("div", { class: "hint setgh" }, this._t("invHint")));
    const invList = mk("div", { class: "setgroups" });
    const invAdd = mk("button", { type: "button", class: "setbtn" }, this._t("invAdd"));
    invAdd.disabled = !isAdmin;
    const solo = mk("div", { class: "setgroups" });
    const soloHead = mk("div", { class: "setsub" }, this._t("invSolo"));
    const soloHint = mk("div", { class: "hint setgh" }, this._t("invSoloHint"));
    invBox.append(invList, invAdd, soloHead, soloHint, solo);
    const invRows = [];
    // puts every sensor card into the plant that has the sensor ticked (the first one wins), otherwise into the list of single plants
    const layout = () => {
      const owner = new Map();
      for (const r of invRows) for (const b of r.boxes) if (b.cb.checked && !owner.has(b.sid)) owner.set(b.sid, r);
      for (const r of invRows) r.sensorsBox.replaceChildren();
      solo.replaceChildren();
      for (const sid of [...P.prod].sort((a, b) => collator.compare(liveName(a), liveName(b)))) (owner.get(sid)?.sensorsBox || solo).append(cards.get(sid));
      soloHead.hidden = soloHint.hidden = !solo.childElementCount;
      invRows.forEach(retitle);
    };
    // plants and sensors are listed alphabetically; the name currently typed counts, not only the saved one
    const collator = new Intl.Collator(this._hass.locale?.language || this._hass.language, { sensitivity: "base", numeric: true });
    const liveName = (sid) => inputs.find((i) => i.id === sid)?.name.value.trim() || this._hass.states[sid]?.attributes.friendly_name || sid;
    const plantLabel = (r) => r.nameIn.value.trim() || r.boxes.filter((b) => b.cb.checked).map((b) => liveName(b.sid)).join(" + ");
    const retitle = (r) => {
      r.title.textContent = plantLabel(r) || this._t("invTitleN").replace("{n}", String(invRows.indexOf(r) + 1));
      r.count.textContent = ` · ${this._t("invCount").replace("{n}", String(r.boxes.filter((b) => b.cb.checked).length))}`;
    };
    const sortPlants = () => {
      invRows.sort((a, b) => collator.compare(plantLabel(a) || "\uffff", plantLabel(b) || "\uffff")); // empty plants last
      invList.append(...invRows.map((r) => r.el));
    };
    const sensorName = (sid) => strings[sid]?.name || this._hass.states[sid]?.attributes.friendly_name || sid;
    const addInverter = (inv) => {
      const el = mk("details", { class: "setgroup plant" });
      el.open = !inv; // a new plant is open, saved ones are collapsed
      const title = mk("span", { class: "gtitle" });
      const count = mk("span", { class: "muted" });
      const sum = mk("summary", {}, "");
      sum.append(title, count);
      const rm = mk("button", { type: "button", class: "setbtn" }, this._t("gRemove"));
      rm.disabled = !isAdmin;
      const head = mk("div", { class: "ghead" });
      head.append(rm);
      const grid = mk("div", { class: "ggrid" });
      const nameWrap = mk("label", { class: "gfield" }, this._t("invName"));
      const nameIn = mk("input", { type: "text", maxlength: "60" });
      nameIn.value = inv?.name || "";
      nameIn.disabled = !isAdmin;
      nameIn.addEventListener("input", () => retitle(row));
      nameIn.addEventListener("change", sortPlants); // re-sort when the name is finished, not while typing
      nameWrap.append(nameIn);
      const maxWrap = mk("label", { class: "gfield" }, this._t("invMax"));
      const maxIn = mk("input", { type: "number", min: "0", step: "10", inputmode: "decimal" });
      maxIn.value = inv?.max_w > 0 ? String(inv.max_w) : "";
      maxIn.disabled = !isAdmin;
      maxWrap.append(maxIn);
      grid.append(nameWrap, maxWrap);
      const list = mk("div", { class: "invsensors" });
      list.append(mk("div", { class: "hint" }, this._t("invSensors")));
      const boxes = P.prod.map((sid) => {
        const l = mk("label", { class: "invsensor" });
        const cb = mk("input", { type: "checkbox" });
        cb.checked = !!inv?.sensors?.includes(sid);
        cb.disabled = !isAdmin;
        cb.addEventListener("change", layout);
        l.append(cb, mk("span", {}, sensorName(sid)));
        list.append(l);
        return { sid, cb };
      });
      const sensorsBox = mk("div", { class: "invcards" });
      const row = { el, title, count, nameIn, maxIn, boxes, sensorsBox };
      rm.addEventListener("click", () => { invRows.splice(invRows.indexOf(row), 1); el.remove(); layout(); });
      el.append(sum, head, grid, list, sensorsBox);
      invList.append(el);
      invRows.push(row);
      layout();
    };
    invertersOf(this._cfg.settings, P.prod).forEach(addInverter);
    sortPlants();
    invAdd.addEventListener("click", () => addInverter(null));
    layout();
    if (P.prod.length) box.append(invBox);
    E.prod.forEach((id) => box.append(cards.get(id)));

    // plant-wide numbers
    const general = this._cfg.settings?.general || {};
    const genInputs = {};
    const gc = mk("div", { class: "setcard" });
    gc.append(mk("h3", {}, this._t("genTitle")));
    const rowByKey = {};
    const priceRefresh = [];
    this._refreshPrices = () => priceRefresh.forEach((f) => f());
    const priceSensor = { price_import: this._keys().G.priceImp, price_feed_in: this._keys().G.priceFeed };
    for (const [key, label, step, ph] of [
      ["storage_capacity_kwh", "genCap", "0.1", ""], ["battery_min_soc", "genMinSoc", "1", ""], ["price_import", "genPriceImport", "0.001", ""], ["price_feed_in", "genPriceFeed", "0.001", ""],
      ["system_cost_eur", "genCost", "100", ""], ["co2_g_per_kwh", "genCo2", "1", "380"],
      ["latitude", "genLat", "0.0001", this._hass.config?.latitude != null ? String(Number(this._hass.config.latitude).toFixed(4)) : ""],
      ["longitude", "genLon", "0.0001", this._hass.config?.longitude != null ? String(Number(this._hass.config.longitude).toFixed(4)) : ""],
    ]) {
      const row = mk("div", { class: "setrow" });
      const id = `set-gen-${key}`;
      const signed = key === "latitude" || key === "longitude";
      const input = mk("input", { type: "number", id, min: signed ? (key === "latitude" ? "-90" : "-180") : "0", step, inputmode: "decimal", placeholder: ph });
      input.value = general[key] ? String(general[key]) : "";
      input.disabled = !isAdmin;
      row.append(mk("label", { for: id }, this._t(label)), input);
      const sid = priceSensor[key];
      if (sid) { // a price sensor from the config flow is in use: show its price, not editable (the fixed value is only the fallback)
        const hint = mk("div", { class: "hint" });
        const show = () => {
          const st = this._hass.states[sid];
          const val = parseFloat(st?.state);
          input.value = Number.isNaN(val) ? "" : String(val);
          hint.textContent = this._t("genFromSensor")
            .replace("{name}", st?.attributes?.friendly_name || sid)
            .replace("{value}", Number.isNaN(val) ? this._t("missing") : `${val.toLocaleString(this._hass.locale?.language || this._hass.language, { maximumFractionDigits: 4 })} ${st?.attributes?.unit_of_measurement || "€/kWh"}`);
        };
        show();
        input.disabled = true;
        input.dataset.fromSensor = "1";
        row.append(hint);
        priceRefresh.push(show);
      }
      gc.append(row);
      genInputs[key] = input;
      rowByKey[key] = row;
    }
    // usable capacity from capacity and minimum level
    const usableHint = mk("div", { class: "hint" });
    rowByKey.battery_min_soc.append(usableHint);
    const updUsable = () => {
      const c = parseFloat(genInputs.storage_capacity_kwh.value.replace(",", ".")), m = parseFloat(genInputs.battery_min_soc.value.replace(",", "."));
      usableHint.textContent = c > 0 ? this._t("genUsable").replace("{kwh}", (c * (1 - (m > 0 ? Math.min(m, 100) : 0) / 100)).toLocaleString(this._hass.locale?.language || this._hass.language, { maximumFractionDigits: 2 })) : this._t("genMinSocHint");
    };
    genInputs.storage_capacity_kwh.addEventListener("input", updUsable);
    genInputs.battery_min_soc.addEventListener("input", updUsable);
    updUsable();
    gc.append(mk("p", { class: "note" }, this._t("genHint")));
    box.append(gc);

    const bar = mk("div", { class: "setbar" });
    const save = mk("button", { type: "button", class: "setbtn primary" }, this._t("setSave"));
    save.disabled = !isAdmin;
    const status = mk("span", { class: "muted", role: "status" });
    bar.append(save, status);
    box.append(bar);
    this._setMeasured = () => {
      box.querySelectorAll("[data-measured]").forEach((el) => {
        const m = this._pmax?.[el.getAttribute("data-measured")];
        el.textContent = m > 0 ? `${this._t("setMeasured")}: ${this._fmt(m)} W` : "";
      });
    };
    this._setMeasured();
    save.addEventListener("click", async () => {
      const payload = {};
      for (const { id, name, peak, mppts, moduleWp, groups } of inputs) {
        const e = {};
        if (name.value.trim()) e.name = name.value.trim();
        const pv = peak ? parseFloat(peak.value.replace(",", ".")) : NaN;
        if (pv > 0) e.peak = pv;
        if (mppts) {
          const mv = parseFloat(mppts.value.replace(",", "."));
          e.mppts = mv > 0 ? Math.round(mv) : null;
          e.inverter_w = null; // the inverter power now belongs to the inverters section
        }
        if (groups) {
          const wv = parseFloat(moduleWp.value.replace(",", "."));
          e.module_wp = wv > 0 ? wv : null;
          const val = (el) => { const v = parseFloat(el.value.replace(",", ".")); return Number.isNaN(v) ? null : v; };
          const pos = (el) => { const v = val(el); return v > 0 ? Math.round(v) : null; };
          // 0 is valid for azimuth and tilt (south, flat); empty rows are dropped
          e.groups = groups.map((r) => ({ modules: pos(r.m), azimuth: val(r.a), tilt: val(r.t), mppt: pos(r.p) }))
            .filter((g) => g.modules != null || g.azimuth != null || g.tilt != null || g.mppt != null);
          // values of older versions are replaced by the module strings
          for (const k of ["modules", "azimuth", "tilt", "azimuth2", "tilt2", "modules2", "share2"]) e[k] = null;
        }
        payload[id] = e;
      }
      save.disabled = true;
      status.textContent = "";
      try {
        const used = new Set();
        const inverters = invRows.map((r) => {
          const sensors = r.boxes.filter((b) => b.cb.checked && !used.has(b.sid)).map((b) => b.sid);
          sensors.forEach((sid) => used.add(sid));
          const mw = parseFloat(r.maxIn.value.replace(",", "."));
          return { name: r.nameIn.value.trim(), max_w: mw > 0 ? mw : 0, sensors };
        }).filter((i) => i.sensors.length || i.max_w > 0 || i.name);
        const generalPayload = {};
        for (const [key, input] of Object.entries(genInputs)) {
          if (input.dataset.fromSensor) continue; // shown from the price sensor, the stored fallback stays untouched
          const v = parseFloat(input.value.replace(",", "."));
          generalPayload[key] = key === "latitude" || key === "longitude" ? (Number.isNaN(v) ? 0 : v) : v > 0 ? v : 0; // 0 clears the value
        }
        const res = await this._hass.callWS({ type: "pv_assistant/set_settings", strings: payload, general: generalPayload, inverters });
        this._cfg.settings = res;
        status.textContent = this._t("setSaved");
        this._lastPwr = null; this._last = null;
        this._render(); this._renderPower(); this._draw(); this._drawYears(); this._drawStorage(); this._drawForecast();
      } catch (err) {
        status.textContent = `${this._t("setError")}: ${err?.message || err}`;
      }
      save.disabled = false;
    });
  }
}
