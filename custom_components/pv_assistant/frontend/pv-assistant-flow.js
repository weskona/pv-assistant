// Energy flow diagram and the key figure strip of the Now tab.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, plantsOf;
export function init(ctx) {
  ({ esc, plantsOf } = ctx);
}

export class FlowPart {
  _flowValues() {
    const { P, G } = this._keys();
    const w = (id) => { const b = this._read(id).base; return Number.isNaN(b) ? null : b; };
    const sumOf = (ids, fn) => ids.reduce((a, id) => { const v = w(id); return v == null ? a : a + fn(v); }, 0);
    const pos = (v) => Math.max(v, 0);
    const prod = sumOf(P.prod, pos);
    const feed = sumOf(P.feed, P.invFeed ? (v) => pos(-v) : pos);
    const imp = G.impP.length ? sumOf(G.impP, pos) : P.invFeed && P.feed.length ? sumOf(P.feed, pos) : 0;
    const ns = P.absStorage ? Math.abs : pos;
    const sgn = (v) => (P.inv ? -v : v); // default positive = from storage
    const out = sumOf(P.sout, ns) + sumOf(P.comb, (v) => pos(sgn(v)));
    const inn = sumOf(P.sin, ns) + sumOf(P.comb, (v) => pos(-sgn(v)));
    const measured = G.houseP.length ? G.houseP.map(w).filter((v) => v != null) : [];
    const house = measured.length ? measured.reduce((a, v) => a + pos(v), 0) : pos(prod + imp + out - feed - inn);
    const soc = G.soc.length ? w(G.soc[0]) : null;
    return { prod, feed, imp, out, inn, house, soc,
      hasGrid: P.feed.length > 0 || G.impP.length > 0, hasBat: P.sin.length + P.sout.length + P.comb.length > 0 };
  }

  _renderFlow() {
    const box = this._root.getElementById("flow");
    if (!box || !this._cfg) return;
    const P = this._keys().P;
    if (!P.prod.length) { box.replaceChildren(); this._flowBuilt = false; return; }
    const NS = "http://www.w3.org/2000/svg";
    const el = (tag, attrs = {}, text) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text !== undefined) n.textContent = text; return n; };
    const cut = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
    // the plants (inverters) in rows on top, the home in the middle, grid left and storage right; the drawing is as wide as its
    // box (at most 640), so the text keeps its size on a phone and the plants wrap into more rows
    const plants = plantsOf(this._cfg.settings, P.prod).map((p) => ({
      sensors: p.sensors,
      name: p.name || p.sensors.map((id) => this._read(id).name).join(" + "),
    }));
    const avail = box.clientWidth ? box.clientWidth - 26 : 640; // the card has 12 px padding and a border
    const W = Math.max(250, Math.min(640, Math.round(avail / 20) * 20));
    const layoutKey = `${W}|${plants.map((p) => p.sensors.join("+") + p.name).join("|")}`;
    if (this._flowBuilt && this._flowKey !== layoutKey) this._flowBuilt = false;
    const wide = W >= 500;
    if (!this._flowBuilt) {
      this._flowBuilt = true;
      this._flowKey = layoutKey;
      this._flow = { plants: [] };
      box.innerHTML = `<h2>${esc(this._t("flowTitle"))}</h2>`;
      const card = document.createElement("div");
      card.className = "card flowcard";
      const n = plants.length;
      const want = wide ? 132 : 92;
      const cols = Math.max(1, Math.min(n, Math.floor((W - 16) / want)));
      const rows = Math.ceil(n / cols);
      const slot = (W - 16) / cols, bw = Math.min(132, slot - 8);
      const frameH = rows * 66 + 8, frameBottom = 24 + frameH;
      const HUB = [W / 2, frameBottom + 92], R = wide ? 42 : 36;
      const H = HUB[1] + 56 + (wide ? 28 : 44);
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "flow", role: "img", "aria-label": this._t("flowTitle"), style: `max-width:${W}px` });
      svg.append(el("rect", { x: 4, y: 24, width: W - 8, height: frameH, rx: 18, class: "pvframe" }));
      this._flow.total = el("text", { x: 18, y: 18, class: "flowtotal" });
      svg.append(this._flow.total);
      plants.forEach((p, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const inRow = Math.min(cols, n - r * cols); // the last row is centered
        const cx = 8 + (W - 16 - inRow * slot) / 2 + slot * (c + 0.5);
        const top = 32 + r * 66;
        const d = `M${cx},${top + 58} C${cx},${frameBottom + 40} ${HUB[0]},${frameBottom + 10} ${HUB[0]},${HUB[1] - R}`;
        svg.append(el("path", { d, class: "track" }));
        const run = el("path", { d, class: "run", stroke: "var(--pva-prod)", visibility: "hidden" });
        svg.append(run);
        const g = el("g", { class: "flownode" });
        g.append(el("rect", { x: cx - bw / 2, y: top, width: bw, height: 58, rx: 14, class: "flowbox", stroke: "var(--pva-prod)" }));
        const val = el("text", { x: cx, y: top + 26, "text-anchor": "middle", class: "flowpv" });
        g.append(val, el("text", { x: cx, y: top + 46, "text-anchor": "middle", class: "flowsub" }, cut(p.name, Math.max(6, Math.floor(bw / 7)))));
        svg.append(g);
        this._flow.plants.push({ run, val, sensors: p.sensors });
      });
      svg.append(el("circle", { cx: HUB[0], cy: HUB[1], r: R, class: "flowbox", stroke: "var(--pva-house)" }));
      svg.append(el("text", { x: HUB[0], y: HUB[1] - 8, "text-anchor": "middle", class: "flowname" }, this._t("flowHome")));
      this._flow.home = el("text", { x: HUB[0], y: HUB[1] + 14, "text-anchor": "middle", class: "flowpv hub" });
      svg.append(this._flow.home);
      const sw = wide ? 124 : 92;
      const side = (key, x, name, color) => {
        const g = el("g", { class: "flownode" });
        g.append(el("rect", { x: x - sw / 2, y: HUB[1] - 36, width: sw, height: 72, rx: 18, class: "flowbox", stroke: `var(${color})` }));
        g.append(el("text", { x, y: HUB[1] - 14, "text-anchor": "middle", class: "flowname" }, name));
        const val = el("text", { x, y: HUB[1] + 10, "text-anchor": "middle", class: wide ? "flowval" : "flowpv" });
        const sub = el("text", { x, y: HUB[1] + 27, "text-anchor": "middle", class: "flowsub" });
        g.append(val, sub);
        const edge = x < HUB[0] ? x + sw / 2 : x - sw / 2;
        const track = el("path", { d: `M${edge},${HUB[1]} L${HUB[0]},${HUB[1]}`, class: "track" });
        const run = el("path", { class: "run", visibility: "hidden" });
        const label = el("text", { x: (x + HUB[0]) / 2 + (x < HUB[0] ? -8 : 8), y: HUB[1] - 10, "text-anchor": "middle", class: "flowlbl" });
        svg.append(track, run, g, label);
        this._flow[key] = { g, val, sub, run, label, track, x, edge };
      };
      side("grid", sw / 2 + 4, this._t("flowGrid"), "--pva-grid");
      side("bat", W - sw / 2 - 4, this._t("flowBattery"), "--pva-bout");
      this._flow.R = R;
      this._flow.HUB = HUB;
      this._flow.sw = sw;
      this._flow.wide = wide;
      this._flow.split = [el("text", { x: HUB[0], y: H - (wide ? 12 : 30), "text-anchor": "middle", class: "flowsub" })];
      if (!wide) this._flow.split.push(el("text", { x: HUB[0], y: H - 12, "text-anchor": "middle", class: "flowsub" }));
      svg.append(...this._flow.split);
      card.append(svg);
      box.append(card);
    }
    const { HUB, R } = this._flow;
    const v = this._flowValues();
    this._renderKpis(v);
    const fmt = (x) => (x >= 1000 ? `${(x / 1000).toLocaleString(this._hass.locale?.language || this._hass.language, { maximumFractionDigits: 2 })} kW` : `${Math.round(x)} W`);
    const watts = (id) => { const b = this._read(id).base; return Number.isNaN(b) ? 0 : Math.max(b, 0); };
    const pw = this._flow.plants.map((p) => p.sensors.reduce((a, id) => a + watts(id), 0));
    const pmax = Math.max(1, ...pw);
    this._flow.plants.forEach((p, i) => {
      p.val.textContent = fmt(pw[i]);
      p.run.setAttribute("visibility", pw[i] >= 5 ? "visible" : "hidden");
      p.run.setAttribute("stroke-width", (2 + 4 * Math.min(1, pw[i] / pmax)).toFixed(1));
    });
    this._flow.total.textContent = `${this._t("flowSolar")} ${fmt(v.prod)}`;
    this._flow.home.textContent = fmt(v.house);
    const feeding = v.feed > v.imp, charging = v.inn > v.out;
    const line = (key, value, intoHub, color, show) => {
      const f = this._flow[key];
      f.g.style.display = show ? "" : "none";
      f.track.style.display = show ? "" : "none";
      const on = show && value >= 5;
      const inner = HUB[0] + (f.x < HUB[0] ? -R : R);
      f.run.setAttribute("d", intoHub ? `M${f.edge},${HUB[1]} L${inner},${HUB[1]}` : `M${inner},${HUB[1]} L${f.edge},${HUB[1]}`);
      f.run.setAttribute("stroke", `var(${color})`);
      f.run.setAttribute("stroke-width", (3 + 5 * Math.min(1, value / Math.max(pmax, 1))).toFixed(1));
      f.run.setAttribute("visibility", on ? "visible" : "hidden");
      f.label.textContent = on && this._flow.wide ? fmt(value) : ""; // on a phone the boxes show the values, there is no room between them
      f.g.querySelector("rect").setAttribute("stroke", `var(${color})`);
    };
    const grid = Math.max(v.imp, v.feed), bat = Math.max(v.out, v.inn);
    line("grid", grid, !feeding, feeding ? "--pva-feed" : "--pva-grid", v.hasGrid);
    line("bat", bat, !charging, charging ? "--pva-bin" : "--pva-bout", v.hasBat);
    if (v.hasGrid) { this._flow.grid.val.textContent = fmt(grid); this._flow.grid.sub.textContent = feeding ? `↑ ${this._t("feed")}` : v.imp > 0 ? `↓ ${this._t("gridImp")}` : ""; }
    if (v.hasBat) {
      this._flow.bat.val.textContent = fmt(bat);
      this._flow.bat.sub.textContent = [charging ? `↓ ${this._t("sin")}` : v.out > 0 ? `↑ ${this._t("sout")}` : "", v.soc != null ? `${Math.round(v.soc)} %` : ""].filter(Boolean).join(" · ");
    }
    // where the solar power goes
    const direct = Math.max(0, Math.min(v.prod, v.prod - v.feed - v.inn));
    const toBat = Math.min(v.inn, Math.max(0, v.prod - v.feed));
    const parts = [`${this._t("flowSolar")} → ${this._t("flowHome")} ${fmt(direct)}`, v.hasGrid ? `${this._t("feed")} ${fmt(v.feed)}` : "", v.hasBat ? `${this._t("sin")} ${fmt(toBat)}` : ""].filter(Boolean);
    if (this._flow.wide) this._flow.split[0].textContent = parts.join(" · ");
    else { this._flow.split[0].textContent = parts[0]; this._flow.split[1].textContent = parts.slice(1).join(" · "); }
  }

  _renderKpis(v) {
    const box = this._root.getElementById("kpis");
    if (!box) return;
    const loc = this._hass.locale?.language || this._hass.language;
    const fmt = (x) => (x >= 1000 ? `${(x / 1000).toLocaleString(loc, { maximumFractionDigits: 2 })} kW` : `${Math.round(x)} W`);
    const k = [[this._t("flowSolar"), fmt(v.prod), "--pva-prod", ""], [this._t("flowHome"), fmt(v.house), "--pva-house", ""]];
    if (v.hasGrid) k.push([this._t("flowGrid"), fmt(Math.max(v.imp, v.feed)), v.feed > v.imp ? "--pva-feed" : "--pva-grid", v.feed > v.imp ? `↑ ${this._t("feed")}` : v.imp > 0 ? `↓ ${this._t("gridImp")}` : ""]);
    if (v.hasBat) k.push([this._t("flowBattery"), fmt(Math.max(v.out, v.inn)), v.inn > v.out ? "--pva-bin" : "--pva-bout", v.soc != null ? `${Math.round(v.soc)} %` : ""]);
    if (v.house > 0 && v.hasGrid) k.push([this._t("autarky"), `${Math.round((1 - Math.min(v.imp, v.house) / v.house) * 100)} %`, "--pva-pos", ""]);
    const html = k.map(([n, val, c, sub]) => `<div class="kpi" style="--kc:var(${c})"><span>${esc(n)}</span><b>${esc(val)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div>`).join("");
    if (html !== this._kpiHtml) { this._kpiHtml = html; box.innerHTML = html; }
  }
}
