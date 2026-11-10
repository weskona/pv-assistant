// the helper modules are loaded with the same ?v=<version> as this file, so an update never mixes new and cached modules
const version = new URL(import.meta.url).search;
// No top-level await here: Home Assistant creates the panel element as soon as the load event of this script fires, and for
// a module with a top-level await that is BEFORE the module has run to the end. The element would be created as a plain
// HTMLElement, hass and panel would end up as own properties and shadow the setters of the class once it is defined: the
// panel never gets hass and stays empty. So the element is defined synchronously, the helper modules load in parallel in
// the background (one round trip instead of two in a row) and _load() waits for them.
//
// The panel is split into modules: this file holds the shell (element, the Now tab, tab bar); the energy flow, the range picker
// and every tab live in their own file as a class (*Part) whose methods are added to the panel class below.
// timing log for the browser console: localStorage.setItem("pv_assistant_debug", "1") and reload
const DBG = (() => { try { return localStorage.getItem("pv_assistant_debug") === "1"; } catch (e) { return false; } })();
const dbg = (...a) => { if (DBG) console.info(`[pv-assistant ${Math.round(performance.now())} ms]`, ...a); };


// handed over by the loaded modules (see the end of the file)
let GROUPS, FACTOR, esc, list, T;

class PVAssistantPanel extends HTMLElement {
  connectedCallback() {
    // properties set on the element before it was upgraded (see the top of the file) would shadow the setters
    for (const k of ["hass", "panel", "narrow", "route"]) {
      if (Object.prototype.hasOwnProperty.call(this, k)) {
        const v = this[k];
        delete this[k];
        this[k] = v;
      }
    }
    if (!this._root) {
      this._root = this.attachShadow({ mode: "open" });
      this._root.innerHTML = `
        <style>
          /* design tokens: layout and look follow the Glow dashboard (dark cards, large radii, glow bar);
             in light mode the same shapes use the Home Assistant theme colors */
          :host { --g-bg:var(--primary-background-color); --g-panel:var(--card-background-color);
                  --g-panel-bg:var(--card-background-color); --g-line:var(--divider-color);
                  --g-tile:var(--secondary-background-color); --g-tileb:var(--divider-color);
                  --g-text:var(--primary-text-color); --g-muted:var(--secondary-text-color);
                  --g-dim:var(--disabled-text-color, var(--secondary-text-color)); --g-accent:var(--primary-color);
                  display:block; background:var(--g-bg); color:var(--g-text); min-height:100vh; box-sizing:border-box;
                  font-family:'Outfit','Plus Jakarta Sans','Segoe UI',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
          :host([data-dark]) { --g-bg:#0b0d12; --g-panel:#14171e; --g-panel-bg:linear-gradient(180deg,#161920,#12151b);
                  --g-line:rgba(255,255,255,.065); --g-tile:rgba(255,255,255,.032); --g-tileb:rgba(255,255,255,.07);
                  --g-text:#f3f5f9; --g-muted:#8b91a1; --g-dim:#5d6373; --g-accent:#f7b733;
                  --card-background-color:#14171e; --divider-color:rgba(255,255,255,.065);
                  --secondary-background-color:rgba(255,255,255,.05); --primary-text-color:#f3f5f9; --secondary-text-color:#8b91a1; }
          .top { position:sticky; top:0; z-index:20; background:color-mix(in srgb, var(--g-bg) 86%, transparent);
                 backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border-bottom:1px solid var(--g-line); }
          header { display:flex; align-items:center; gap:8px; height:52px; padding:0 12px; max-width:1100px; margin:0 auto; box-sizing:border-box;
                   color:var(--g-text); font-size:19px; font-weight:700; letter-spacing:-.01em; }
          nav { display:flex; gap:2px; padding:0 10px; max-width:1100px; margin:0 auto; box-sizing:border-box; overflow-x:auto; scrollbar-width:none; }
          nav::-webkit-scrollbar { display:none; }
          nav button { font:inherit; font-size:14px; font-weight:600; color:var(--g-muted); background:transparent; border:0;
                border-bottom:2px solid transparent; border-radius:0; padding:10px 11px 11px; cursor:pointer; white-space:nowrap; flex:none; }
          nav button:hover { color:var(--g-text); }
          nav button[aria-selected="true"] { color:var(--g-accent); border-bottom-color:var(--g-accent); }
          nav button:focus-visible, .filters button:focus-visible, .setbtn:focus-visible { outline:2px solid var(--g-accent); outline-offset:-2px; }
          [role="tabpanel"][hidden] { display:none; }
          main { padding:20px 16px 40px; max-width:1100px; margin:0 auto; }
          h2 { font-weight:600; font-size:13px; letter-spacing:.12em; text-transform:uppercase; color:var(--g-muted); margin:26px 0 10px 4px; }
          .grid { display:grid; gap:14px; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); align-items:start; }
          .card { background:var(--g-panel-bg); border:1px solid var(--g-line); border-radius:22px; padding:16px 20px;
                  box-shadow:var(--ha-card-box-shadow,none); }
          .card h3 { margin:0 0 8px; font-size:13px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--g-muted);
                     display:flex; justify-content:space-between; gap:8px; }
          .card h3 small { color:var(--g-text); font-weight:500; letter-spacing:0; text-transform:none; font-size:15px; }
          .row { display:flex; justify-content:space-between; gap:8px; padding:5px 0; border-top:1px solid var(--g-line); }
          .row span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .sum { font-weight:600; }
          .muted { color:var(--g-muted); }
          /* categorical slots 1-4 (blue, orange, aqua, yellow), light / dark stepped */
          /* entity colors (same as the Energy dashboard); --pva-grid is reserved for grid import */
          :host { --pva-prod:#ff9800; --pva-feed:#8353d1; --pva-grid:#488fc2; --pva-direct:#ffd700;
                  --pva-bout:#4db6ac; --pva-bin:#f06292;
                  --pva-avg:color-mix(in srgb, #ff9800 45%, var(--card-background-color));
                  --pva-house:#8d8d8d; --pva-pos:#008300; --pva-neg:#e34948;
                  --pva-s1:#2a78d6; --pva-s2:#1baf7a; --pva-s3:#e87ba4; --pva-s4:#6250d6; --pva-s5:#008300; --pva-s6:#e34948; --pva-s7:#eda100; }
          :host([data-dark]) { --pva-house:#bdbdbd; --pva-pos:#34d399; --pva-neg:#f87171;
                  --pva-s1:#3987e5; --pva-s2:#199e70; --pva-s3:#d55181; --pva-s4:#9085e9; --pva-s5:#34d399; --pva-s6:#f87171; --pva-s7:#c98500; }
          .filters { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 12px; }
          .filters button { font:inherit; font-weight:600; color:var(--g-muted); background:var(--g-tile);
                  border:1px solid var(--g-tileb); border-radius:14px; padding:7px 15px; cursor:pointer; }
          /* range picker: unit buttons, arrows with the date, quick ranges and a small calendar */
          .picker { display:flex; flex-wrap:wrap; align-items:center; gap:8px 12px; margin:0 0 12px; position:relative; }
          .pk-seg, .pk-nav { display:inline-flex; align-items:stretch; border:1px solid var(--g-tileb); border-radius:14px; background:var(--g-tile); overflow:hidden; }
          .pk-seg button, .pk-nav button { font:inherit; font-weight:600; color:var(--g-muted); background:transparent; border:0; padding:7px 14px; cursor:pointer; }
          .pk-seg { max-width:100%; }
          .pk-seg button + button { border-left:1px solid var(--g-tileb); }
          @media (max-width:520px) { .pk-seg, .pk-nav, .pk-quick { width:100%; box-sizing:border-box; } .pk-seg button { flex:1; padding:7px 4px; font-size:.92em; } .pk-label { min-width:0; flex:1; } }
          .pk-seg button:hover, .pk-nav button:hover:not(:disabled) { color:var(--g-text); }
          .pk-seg button[aria-pressed="true"] { color:var(--g-accent); background:color-mix(in srgb, var(--g-accent) 14%, transparent); }
          .pk-nav button[hidden] { display:none; }
          .pk-nav button:disabled { opacity:.35; cursor:default; }
          .pk-nav button:not(.pk-label) { font-size:1.25em; line-height:1; font-weight:700; padding:4px 12px; }
          .pk-label { min-width:11em; color:var(--g-text) !important; font-variant-numeric:tabular-nums; }
          .pk-label:disabled { opacity:1 !important; cursor:default !important; }
          .pk-quick { font:inherit; font-weight:600; color:var(--g-muted); background:var(--g-tile); border:1px solid var(--g-tileb); border-radius:14px; padding:7px 12px; cursor:pointer; }
          .pk-seg button:focus-visible, .pk-nav button:focus-visible, .pk-quick:focus-visible, .pk-pop button:focus-visible { outline:2px solid var(--g-accent); outline-offset:1px; }
          .pk-pop { position:absolute; top:100%; left:0; z-index:30; margin-top:6px; padding:12px; width:min(310px, 100%); box-sizing:border-box;
                    background:var(--card-background-color, #1c1c1c); border:1px solid var(--g-line); border-radius:18px; box-shadow:0 14px 34px rgba(0,0,0,.55); }
          .pk-pop[hidden] { display:none; }
          .pk-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
          .pk-title { font-weight:600; }
          .pk-pop button { font:inherit; color:var(--g-text); background:transparent; border:1px solid transparent; border-radius:10px; cursor:pointer; }
          .pk-head button { font-size:1.2em; padding:2px 10px; color:var(--g-muted); }
          .pk-pop button:hover:not(:disabled) { background:var(--g-tile); }
          .pk-pop button:disabled { opacity:.3; cursor:default; }
          .pk-cal { display:grid; grid-template-columns:2em repeat(7, 1fr); gap:2px; }
          .pk-dow { text-align:center; font-size:.72em; color:var(--secondary-text-color); padding:2px 0; text-transform:uppercase; }
          .pk-cal .pk-wk { font-size:.72em; color:var(--secondary-text-color); padding:0; }
          .pk-day { padding:6px 0; font-variant-numeric:tabular-nums; }
          .pk-day.out { opacity:.4; }
          .pk-day.today { border-color:var(--g-accent); }
          .pk-pop .sel { background:color-mix(in srgb, var(--g-accent) 24%, transparent); color:var(--g-accent); font-weight:700; }
          .pk-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; }
          .pk-grid button { padding:10px 0; }
          .pk-foot { margin-top:8px; display:flex; justify-content:flex-end; }
          .pk-foot button { color:var(--g-accent); padding:4px 10px; }
          .filters button:hover { background:var(--secondary-background-color); }
          .filters button[aria-pressed="true"] { border-color:color-mix(in srgb, var(--g-accent) 40%, transparent); color:var(--g-accent); background:color-mix(in srgb, var(--g-accent) 14%, transparent); }
          /* all key figures of a tab sit together in one card */
          .tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:16px 20px; margin:0 0 16px; padding:18px 22px;
                   background:var(--g-panel-bg); border:1px solid var(--g-line); border-radius:22px; }
          .tiles:empty { display:none; }
          .chart { overflow-x:auto; }
          .tile { display:flex; flex-direction:column; gap:3px; min-width:0; }
          .tile b { display:block; font-size:1.35em; font-weight:700; font-variant-numeric:tabular-nums; }
          .tile span { color:var(--g-muted); font-size:.75em; letter-spacing:.06em; text-transform:uppercase; font-weight:600; }
          .chart { background:var(--g-panel-bg); border:1px solid var(--g-line); border-radius:22px; padding:16px 18px 10px;
                   margin-bottom:16px; transition:opacity .15s; }
          .chart.loading { opacity:.5; }
          h3.ch { font-weight:600; font-size:13px; letter-spacing:.12em; text-transform:uppercase; color:var(--g-muted); margin:22px 0 10px; }
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
                 border:1px solid var(--g-tileb); border-radius:14px; padding:8px 10px; font-size:.85em;
                 box-shadow:0 2px 8px rgba(0,0,0,.25); white-space:nowrap; }
          .tip-title { color:var(--secondary-text-color); margin-bottom:4px; }
          .tip-row { display:flex; align-items:center; gap:8px; }
          .tip-row b { font-weight:600; color:var(--primary-text-color); }
          .tip-row span { color:var(--secondary-text-color); }
          .tip-sub { display:flex; gap:8px; padding-left:20px; font-size:.9em; color:var(--secondary-text-color); }
          .tip-note { margin-left:4px; font-weight:600; color:var(--primary-text-color); }
          .tip-sub span:first-child { min-width:4.5em; text-align:right; }
          details.tableview { margin-top:8px; font-size:.85em; }
          details.tableview summary { cursor:pointer; color:var(--secondary-text-color); }
          details.tableview table { border-collapse:collapse; margin-top:6px; width:100%; }
          details.tableview th, details.tableview td { text-align:right; padding:3px 8px; border-top:1px solid var(--divider-color); }
          details.tableview th:first-child { text-align:left; font-weight:400; }
          .yearnav { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin:0 0 12px; }
          .yearnav button { font:inherit; color:var(--g-text); background:var(--g-tile); border:1px solid var(--g-tileb);
                  border-radius:13px; width:36px; height:32px; cursor:pointer; }
          .yearnav button:hover:not(:disabled) { background:var(--secondary-background-color); }
          .yearnav button:disabled { opacity:.35; cursor:default; }
          .yearnav b { font-size:1.2em; font-weight:500; min-width:3.5em; text-align:center; }
          .yearnav label { color:var(--secondary-text-color); margin-left:auto; }
          .yearnav select { font:inherit; color:var(--primary-text-color); background:var(--card-background-color);
                  border:1px solid var(--divider-color); border-radius:8px; padding:4px 8px; }
          .note { color:var(--secondary-text-color); font-size:.85em; margin:0 0 16px; }
          .note.warn { color:var(--primary-text-color); border-left:3px solid var(--pva-neg); padding-left:8px; margin:8px 0 0; }
          .grid + .note { margin-top:16px; }
          /* energy flow */
          .kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin:0 0 6px; }
          .kpi { position:relative; overflow:hidden; background:var(--g-panel-bg); border:1px solid var(--g-line); border-radius:20px; padding:14px 16px 14px 20px; }
          .kpi::before { content:""; position:absolute; left:0; top:12px; bottom:12px; width:4px; border-radius:0 4px 4px 0; background:var(--kc, var(--g-accent)); }
          .kpi span { display:block; color:var(--g-muted); font-size:12px; letter-spacing:.1em; text-transform:uppercase; font-weight:600; }
          .kpi b { display:block; font-size:1.7em; font-weight:700; letter-spacing:-.02em; font-variant-numeric:tabular-nums; margin-top:2px; }
          .kpi small { color:var(--g-muted); font-size:.85em; }
          @media (max-width:520px) { .tiles { grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; padding:14px 16px; } .tile b { font-size:1.2em; } }
          @media (max-width:520px) { .kpis { grid-template-columns:repeat(auto-fit,minmax(104px,1fr)); gap:8px; } .kpi { padding:10px 10px 10px 14px; border-radius:16px; } .kpi b { font-size:1.3em; } .kpi span { font-size:11px; letter-spacing:.06em; } }
          .nowtop { display:grid; grid-template-columns:minmax(0,3fr) minmax(0,2fr); gap:0 16px; align-items:start; }
          .nowtop:has(#nowside:empty) { grid-template-columns:minmax(0,640px); }
          .grid.side { grid-template-columns:1fr; }
          @media (max-width:820px) { .nowtop { grid-template-columns:1fr; } }
          .flowcard { padding:8px 12px; }
          svg.flow { display:block; width:100%; margin:0 auto; color:var(--g-text); }
          svg.flow .track { fill:none; stroke:currentColor; stroke-width:3; opacity:.12; stroke-linecap:round; }
          svg.flow .run { fill:none; stroke-linecap:round; stroke-dasharray:1 14; animation:pvaflow 1.1s linear infinite; }
          @keyframes pvaflow { to { stroke-dashoffset:-15; } }
          @media (prefers-reduced-motion: reduce) { svg.flow .run { animation:none; stroke-dasharray:none; opacity:.8; } }
          svg.flow .flowlbl { font-size:12px; font-weight:600; }
          svg.flow .flowpv { font-size:15px; font-weight:700; }
          svg.flow .flowpv.hub { font-size:17px; }
          svg.flow .flowtotal { fill:var(--pva-prod); font-size:13px; font-weight:700; }
          svg.flow .pvframe { fill:none; stroke:var(--pva-prod); stroke-opacity:.35; stroke-width:1.5; }
          svg.flow .flowbox { fill:var(--g-tile); stroke-width:2; }
          svg.flow text { fill:var(--g-text); font-family:inherit; }
          svg.flow .flowname { fill:var(--g-muted); font-size:12px; letter-spacing:.1em; text-transform:uppercase; font-weight:600; }
          svg.flow .flowval { font-size:22px; font-weight:700; }
          svg.flow .flowsub { fill:var(--g-muted); font-size:12px; }
          .gauge { height:10px; border-radius:6px; background:rgba(127,127,127,.18); overflow:hidden; margin:10px 0 6px; }
          .gauge i { display:block; height:100%; border-radius:6px; background:var(--pva-prod); box-shadow:0 0 12px color-mix(in srgb, var(--pva-prod) 55%, transparent); }
          .pw-val { font-size:2.4em; font-weight:800; letter-spacing:-.02em; line-height:1.1; }
          .pw-sub { color:var(--secondary-text-color); font-size:.9em; display:flex; justify-content:space-between; gap:8px; }
          .setcard { background:var(--g-panel-bg); border:1px solid var(--g-line); border-radius:22px; padding:20px 22px; margin-bottom:16px; }
          .setcard h3 { margin:0 0 2px; font-size:13px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--g-muted); }
          .setcard .eid { color:var(--secondary-text-color); font-size:.85em; margin-bottom:10px; word-break:break-all; }
          .setrow { display:grid; grid-template-columns:minmax(120px,200px) 1fr; gap:8px 12px; align-items:center; margin:6px 0; }
          .setrow label { color:var(--secondary-text-color); }
          .setrow input { font:inherit; color:var(--primary-text-color); background:var(--secondary-background-color);
                  border:1px solid var(--g-tileb); border-radius:12px; padding:8px 12px; min-width:0; max-width:320px; box-sizing:border-box; width:100%; }
          .setrow input:disabled { opacity:.6; }
          /* plain number entry without the up / down arrows */
          .setrow input[type="number"] { -moz-appearance:textfield; appearance:textfield; }
          .setrow input[type="number"]::-webkit-outer-spin-button, .setrow input[type="number"]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
          .setrow .hint { grid-column:2; color:var(--secondary-text-color); font-size:.85em; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
          .setsub { margin:14px 0 2px; font-weight:600; }
          .setgh { margin-bottom:8px; color:var(--secondary-text-color); font-size:.85em; }
          .scnlist { margin:6px 0 0; padding-left:20px; color:var(--g-text); } .scnlist li { margin:6px 0; }
          dl.scnterms { margin:6px 0 0; } dl.scnterms dt { font-weight:600; margin-top:10px; } dl.scnterms dd { margin:2px 0 0; color:var(--g-muted); }
          details.scnhelp { margin-bottom:10px; }
          .recwin { font-weight:600; font-size:1.05em; margin:6px 0 4px; }
          .setgroup { border:1px solid var(--g-line); border-radius:16px; padding:10px 14px; margin:8px 0; }
          .setgroup .ghead { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px; }
          .setgroup .gtitle { font-weight:600; }
          .setgroup .ggrid { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:8px 12px; }
          .setgroup .gfield { display:flex; flex-direction:column; gap:4px; color:var(--secondary-text-color); font-size:.9em; }
          .setcard.sensor { border-radius:16px; padding:10px 16px; margin:8px 0 0; }
          .setcard.sensor h3 { margin:0; font-size:14px; letter-spacing:.08em; }
          .setcard.sensor .eid { margin:0; }
          details.setcard > summary, details.plant > summary { cursor:pointer; list-style:none; display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 10px; }
          details.setcard > summary::-webkit-details-marker, details.plant > summary::-webkit-details-marker { display:none; }
          details.setcard > summary::before, details.plant > summary::before { content:"▸"; color:var(--g-muted); }
          details.setcard[open] > summary::before, details.plant[open] > summary::before { content:"▾"; }
          details.setcard[open] > summary, details.plant[open] > summary { margin-bottom:10px; }
          details.plant { padding:8px 14px; margin:6px 0; }
          .gcompass { grid-column:span 2; }
          .compassrow { display:flex; align-items:center; gap:12px; }
          .compassval { display:flex; flex-direction:column; gap:4px; min-width:0; flex:1; }
          .compass { flex:none; cursor:pointer; touch-action:none; }
          .compass .ring { fill:var(--secondary-background-color); stroke:var(--g-tileb); stroke-width:1.5; }
          .compass .tickl { font-size:9px; fill:var(--secondary-text-color); text-anchor:middle; pointer-events:none; }
          .compass .needle line { stroke:var(--pva-prod); stroke-width:3; stroke-linecap:round; }
          .compass .needle polygon { fill:var(--pva-prod); }
          .invsensors { display:flex; flex-direction:column; gap:6px; margin-top:10px; }
          .invsensor { display:flex; align-items:center; gap:8px; }
          .setgroup input[type="checkbox"] { width:auto; }
          .setgroup input { font:inherit; color:var(--primary-text-color); background:var(--secondary-background-color); border:1px solid var(--g-tileb); border-radius:12px; padding:8px 12px; min-width:0; width:100%; box-sizing:border-box; }
          .setgroup input[type="number"] { -moz-appearance:textfield; appearance:textfield; }
          .setgroup input[type="number"]::-webkit-outer-spin-button, .setgroup input[type="number"]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
          .setgroup input:disabled { opacity:.6; }
          .setbtn { font:inherit; font-weight:600; color:var(--g-text); background:var(--g-tile); border:1px solid var(--g-tileb);
                  border-radius:13px; padding:5px 14px; cursor:pointer; }
          .setbtn:hover:not(:disabled) { background:var(--secondary-background-color); }
          .setbtn.primary { background:color-mix(in srgb, var(--g-accent) 16%, transparent); border-color:color-mix(in srgb, var(--g-accent) 40%, transparent); color:var(--g-accent); font-weight:700; padding:8px 22px; }
          .setbtn:disabled { opacity:.5; cursor:default; }
          .setbar { display:flex; gap:12px; align-items:center; margin-top:8px; }
          @media (max-width:560px) { .setrow { grid-template-columns:1fr; } .setrow .hint { grid-column:1; } }
          .two { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }
          .hints { margin:0 0 12px; padding:0; list-style:none; }
          .hints li { border-left:3px solid var(--pva-neg); padding:8px 14px; margin:6px 0; background:var(--g-tile); border-radius:0 15px 15px 0; }
          .hints li.info { border-left-color:var(--pva-s1); color:var(--secondary-text-color); }
          .strow { display:grid; grid-template-columns:minmax(120px,220px) 1fr auto; gap:12px; align-items:center; padding:6px 0; border-top:1px solid var(--divider-color); }
          .strow:first-child { border-top:0; }
          .strow .gauge { margin:0; }
          .strow.sub { padding-left:22px; font-size:.92em; border-top-style:dotted; }
          .strow.sub .gauge i { opacity:.7; }
          .strow .weak { color:var(--pva-neg); font-weight:600; }
          .dtable { width:100%; border-collapse:collapse; font-size:.9em; }
          .dtable th, .dtable td { padding:4px 8px; text-align:right; border-top:1px solid var(--divider-color); }
          .dtable th:first-child, .dtable td:first-child { text-align:left; }
          .dtable thead th { border-top:0; color:var(--secondary-text-color); font-weight:400; }
          .scalebar { display:inline-block; width:120px; height:8px; border-radius:4px; border:1px solid var(--divider-color); }
          svg .heat-empty { fill:var(--divider-color); fill-opacity:.25; }
          @media (max-width:560px) { .strow { grid-template-columns:1fr; } }
          p.empty { color:var(--secondary-text-color); margin:16px 0; }
        </style>
        <div class="top"><header><span id="menu"></span><span id="title"></span></header>
        <nav id="tabs" role="tablist"></nav></div>
        <main><div id="now" role="tabpanel"></div><div id="pwr" role="tabpanel"></div><div id="plt" role="tabpanel"></div><div id="ana" role="tabpanel"></div><div id="bal" role="tabpanel"></div><div id="con" role="tabpanel"></div><div id="scn" role="tabpanel"></div><div id="sto" role="tabpanel"></div><div id="mon" role="tabpanel"></div><div id="fcs" role="tabpanel"></div><div id="hist" role="tabpanel"></div><div id="yearsec" role="tabpanel"></div><div id="setsec" role="tabpanel"></div></main>`;
      const menu = document.createElement("ha-menu-button");
      this._root.getElementById("menu").appendChild(menu);
      this._menu = menu;
    }
    this._ro = new ResizeObserver(() => {
      // only a width change needs a redraw; opening the table view only changes the height
      const w = this.clientWidth;
      if (w === this._lastW) return;
      this._lastW = w;
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => { if (this._tab === "history") this._draw(); if (this._tab === "years") this._drawYears(); if (this._tab === "consumption") this._drawConsumption(); if (this._tab === "scenarios") this._drawScenarios(); if (this._tab === "analysis") this._drawAnalysis(); if (this._tab === "storage") this._drawStorage(); if (this._tab === "forecast") this._drawForecast(); if (this._tab === "power") this._drawPowerChart(); });
    });
    this._ro.observe(this);
    this._timer = setInterval(() => { if (this._hist) this._loadHistory(); if (this._yearsOn && this._tab === "years") this._loadYears(); if (this._tab === "storage") this._loadStorage(); if (this._tab === "forecast") this._loadForecast(); if (this._tab === "power") this._loadPowerChart(); if (this._tab === "power" || this._tab === "settings") this._loadPowerMax(); }, 5 * 60 * 1000);
    this._load();
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    clearInterval(this._timer);
  }

  async _load() {
    if (!this._hass) { this._wantLoad = true; return; }
    dbg("load: waiting for the configuration");
    let cfg;
    try {
      cfg = await this._hass.callWS({ type: "pv_assistant/config" });
    } catch (e) {
      cfg = {};
      dbg("configuration failed", e);
    }
    await modulesReady; // _render() and the charts need the helper modules; this._cfg stays unset until they are there
    this._cfg = cfg;
    dbg("configuration received, building tabs");
    this._last = null;
    this._buildHistory();
    this._buildYears();
    this._buildSettings();
    this._buildPlants();
    this._buildBalance();
    this._buildConsumption();
    this._buildScenarios();
    this._buildMoney();
    this._buildAnalysis();
    this._buildStorage();
    this._buildForecast();
    this._flowBuilt = false;
    this._buildTabs();
    this._render();
    dbg("first render done");
    this._loadHistory();
    // the long-term queries (years, peak power) start when their tab is opened (see _showTab), not at
    // startup: on a large database they take seconds and delayed the chart that is visible first
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
    const name = this._cfg.settings?.strings?.[id]?.name || src?.attributes.friendly_name || id;
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
    const side = fc ? `<h2>${esc(this._t("fcGroup"))}</h2><div class="grid side">${fc}</div>` : "";
    if (!html && !side) html = `<p class="muted">${esc(this._t("none"))}</p>`;
    const now = this._root.getElementById("now");
    if (!now.querySelector("#nowcards")) now.innerHTML = '<div class="kpis" id="kpis"></div><div class="nowtop"><div id="flow"></div><div id="nowside"></div></div><div id="nowcards"></div>';
    if (html !== this._last) { this._last = html; now.querySelector("#nowcards").innerHTML = html; }
    if (side !== this._lastSide) { this._lastSide = side; now.querySelector("#nowside").innerHTML = side; }
    this._renderFlow();
    this._renderPower();
  }

  _keys() {
    const c = this._cfg || {};
    const g = (suffix) => ({
      prod: list(c[`production_${suffix}_sensors`]),
      feed: list(c[`feed_in_${suffix}_sensor`]),
      sin: list(c[`storage_in_${suffix}_sensors`]),
      sout: list(c[`storage_out_${suffix}_sensors`]),
      comb: list(c[`storage_combined_${suffix}_sensors`]),
      inv: !!c[suffix === "power" ? "invert_storage_combined_power" : "invert_storage_combined"],
      invFeed: suffix === "power" && !!c.invert_feed_in_power,
      absStorage: suffix === "power" && !!c.abs_storage_power,
    });
    const G = {
      impE: list(c.grid_import_energy_sensors), impP: list(c.grid_import_power_sensors),
      houseE: list(c.house_energy_sensors), houseP: list(c.house_power_sensors),
      soc: list(c.battery_soc_sensor), irr: list(c.irradiance_sensor),
      priceImp: c.price_import || null, priceFeed: c.price_feed_in || null,
    };
    return { P: g("power"), E: g("energy"), G };
  }

  _buildTabs() {
    const list = [["now", "now", "now"]];
    if (this._keys().P.prod.length) list.push(["powerTab", "pwr", "power"]);
    if (this._plantsOn) list.push(["plantsTab", "plt", "plants"]);
    if (this._keys().P.prod.length) list.push(["analysisTab", "ana", "analysis"]);
    if (this._hist) list.push(["history", "hist", "history"]);
    if (this._balanceOn) list.push(["balanceTab", "bal", "balance"]);
    if (this._consumptionOn) list.push(["consumptionTab", "con", "consumption"]);
    if (this._storageOn) list.push(["storageTab", "sto", "storage"]);
    if (this._forecastOn) list.push(["forecastTab", "fcs", "forecast"]);
    if (this._moneyOn) list.push(["moneyTab", "mon", "money"]);
    if (this._yearsOn) list.push(["years", "yearsec", "years"]);
    if (this._scenariosOn) list.push(["scenariosTab", "scn", "scenarios"]);
    if (this._keys().P.prod.length || this._keys().E.prod.length) list.push(["settingsTab", "setsec", "settings"]);
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
    if (id === "plants") this._loadPlants();
    if (id === "balance") this._loadBalance();
    if (id === "consumption") this._loadConsumption();
    if (id === "scenarios") this._loadScenarios();
    if (id === "money") { if (!this._mdata) this._loadMoney(); else this._drawMoney(); }
    if (id === "analysis") this._loadAnalysis();
    if (id === "history") this._draw();
    if (id === "storage") this._loadStorage();
    if (id === "forecast") this._loadForecast();
    if (id === "power") this._loadPowerChart();
    if (id === "settings") this._refreshPrices?.();
    if (id === "years") { if (!this._ydata) this._loadYears(); this._drawYears(); }
    if ((id === "power" || id === "settings") && !this._pmax) this._loadPowerMax();
  }
}

// all modules load in parallel; _load() waits for this before it renders anything
const modulesReady = Promise.all([
  import(`./pv-assistant-texts.js${version}`),
  import(`./pv-assistant-util.js${version}`),
  import(`./pv-assistant-charts.js${version}`),
  import(`./pv-assistant-analysis.js${version}`),
  import(`./pv-assistant-flow.js${version}`),
  import(`./pv-assistant-range.js${version}`),
  import(`./pv-assistant-tab-history.js${version}`),
  import(`./pv-assistant-tab-storage.js${version}`),
  import(`./pv-assistant-tab-forecast.js${version}`),
  import(`./pv-assistant-tab-years.js${version}`),
  import(`./pv-assistant-tab-power.js${version}`),
  import(`./pv-assistant-tab-settings.js${version}`),
  import(`./pv-assistant-tab-plants.js${version}`),
  import(`./pv-assistant-tab-balance.js${version}`),
  import(`./pv-assistant-tab-consumption.js${version}`),
  import(`./pv-assistant-tab-scenarios.js${version}`),
  import(`./pv-assistant-tab-economics.js${version}`),
  import(`./pv-assistant-tab-analysis.js${version}`),
  import(`./pv-assistant-report.js${version}`),
]).then(([texts, util, charts, analysis, ...parts]) => {
  dbg("modules loaded");
  const ctx = { ...util, ...charts, ...analysis, T: texts.T, dbg, DBG };
  ({ GROUPS, FACTOR, esc, list, T } = ctx);
  for (const mod of parts) {
    mod.init(ctx);
    const Part = Object.values(mod).find((v) => typeof v === "function" && v.prototype && v !== mod.init);
    // the methods of the part become methods of the panel
    for (const name of Object.getOwnPropertyNames(Part.prototype)) {
      if (name !== "constructor") Object.defineProperty(PVAssistantPanel.prototype, name, Object.getOwnPropertyDescriptor(Part.prototype, name));
    }
  }
});
customElements.define("pv-assistant-panel", PVAssistantPanel);
