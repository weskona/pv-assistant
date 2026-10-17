// Small dependency-free SVG charts (line + grouped bars) with crosshair/tooltip,
// legend, direct end labels on lines and a table view. Colors come from CSS custom
// properties set by the panel (--pva-prod, --pva-feed, --pva-bin, --pva-bout, --pva-direct, ...); text/grid use the HA theme.

const NS = "http://www.w3.org/2000/svg";
const M = { l: 48, r: 8, t: 10, b: 24 };
let clipCount = 0;

const el = (tag, attrs = {}, text) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text; // labels are untrusted: textContent only
  return n;
};
const html = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

export function niceTicks(min, max, count = 4) {
  if (!(max > min)) { max = min + 1; }
  const raw = (max - min) / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}


// A redraw replaces the chart contents; keep the table view open if the reader opened it.
function wasTableOpen(container) {
  return !!container.querySelector("details.tableview")?.open;
}
function restoreTable(container, open) {
  if (open) container.querySelector("details.tableview")?.setAttribute("open", "");
}

function legend(series, kind) {
  const box = html("div", "legend");
  for (const s of series.flatMap((x) => x.legendItems || [x])) {
    const item = html("span", "legend-item");
    const key = html("i", `key ${kind}`);
    key.style.background = `var(${s.color})`;
    item.append(key, html("span", "", s.name));
    box.append(item);
  }
  return box;
}

function tooltipShell() {
  const t = html("div", "tip");
  t.hidden = true;
  return t;
}

function fillTip(tip, title, rows, fmt) {
  tip.replaceChildren(html("div", "tip-title", title));
  for (const r of rows) {
    const row = html("div", "tip-row");
    const key = html("i", "key line");
    key.style.background = `var(${r.color})`;
    row.append(key, html("b", "", r.value == null ? "–" : fmt(r.value)), html("span", "", r.name));
    tip.append(row);
    // source split: the sensors / components behind this value (names are untrusted: textContent)
    for (const p of r.parts || []) {
      const sub = html("div", "tip-sub");
      sub.append(html("span", "", fmt(p.value)), html("span", "", p.name));
      if (p.note) sub.append(html("b", "tip-note", p.note));
      tip.append(sub);
    }
  }
}

/** Parts of series `s` at `key` (Map key or array index); only for series with >= 2 sources, non-zero only. */
function partsAt(s, key) {
  if (!s.parts || s.parts.length < 2) return undefined;
  const out = s.parts
    .map((p) => {
      const value = p.values instanceof Map ? p.values.get(key) : p.values[key];
      return { name: p.name, value, note: p.peak > 0 && value != null ? `${Math.round((value / p.peak) * 100)} %` : undefined };
    })
    .filter((p) => p.value != null && p.value !== 0 && !Number.isNaN(p.value));
  return out.length ? out : undefined;
}

function placeTip(tip, wrap, x, y) {
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let left = x + 14;
  if (left + w > wrap.clientWidth) left = x - w - 14;
  tip.style.left = `${Math.max(0, left)}px`;
  tip.style.top = `${Math.max(0, Math.min(y - h / 2, wrap.clientHeight - h))}px`;
}

function table(headers, rows) {
  const d = html("details", "tableview");
  d.append(html("summary", "", headers.summary));
  const t = html("table");
  const head = html("tr");
  for (const h of headers.cols) head.append(html("th", "", h));
  t.append(head);
  for (const r of rows) {
    const tr = html("tr");
    r.forEach((c, i) => tr.append(html(i ? "td" : "th", "", c)));
    t.append(tr);
  }
  d.append(t);
  return d;
}

/**
 * opts: { series:[{name,color,points:[[ts,value]...], parts?:[{name,values:Map}]}], t0, t1, unit, height,
 *         fmtValue(v), fmtTime(ts), fmtTick(ts), tickStep, step (bucket ms), tableLabels }
 */
export function lineChart(container, opts) {
  const { series, t0, t1, height = 240, fmtValue, fmtTime, fmtTick, tickStep, step } = opts;
  const tableOpen = wasTableOpen(container);
  container.replaceChildren();
  const live = series.filter((s) => s.points.length);
  if (!live.length) { container.append(html("p", "empty", opts.empty)); return; }
  const W = Math.max(280, container.clientWidth || 600), H = height;
  const labelW = W > 520 ? 78 : 0; // direct labels need room
  const pw = W - M.l - M.r - labelW, ph = H - M.t - M.b;
  let lo = Math.min(0, ...live.flatMap((s) => s.points.map((p) => p[1])));
  let hi = Math.max(...live.flatMap((s) => s.points.map((p) => p[1])), 0);
  const ticks = niceTicks(lo, hi);
  lo = ticks[0]; hi = ticks[ticks.length - 1];
  const x = (t) => M.l + ((t - t0) / (t1 - t0)) * pw;
  const y = (v) => M.t + (1 - (v - lo) / (hi - lo)) * ph;

  const wrap = html("div", "chartwrap");
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": opts.label });
  for (const v of ticks) {
    svg.append(el("line", { x1: M.l, x2: M.l + pw, y1: y(v), y2: y(v), class: v === 0 ? "axis" : "grid" }));
    svg.append(el("text", { x: M.l - 6, y: y(v) + 4, class: "tick", "text-anchor": "end" }, fmtValue(v, true)));
  }
  for (let t = t0; t <= t1 + 1; t += tickStep) {
    svg.append(el("text", { x: x(t), y: H - 6, class: "tick", "text-anchor": t === t0 ? "start" : t + tickStep > t1 + 1 && t1 - t < 1 ? "end" : "middle" }, fmtTick(t)));
  }
  live.forEach((s, i) => {
    // break the line where data is missing for more than 1.5 buckets
    const segs = [];
    let cur = [];
    s.points.forEach((p, k) => {
      if (k && p[0] - s.points[k - 1][0] > step * 1.5) { segs.push(cur); cur = []; }
      cur.push(p);
    });
    segs.push(cur);
    for (const seg of segs) {
      const d = seg.map((p, k) => `${k ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
      if (i === 0 && seg.length > 1) {
        svg.append(el("path", { d: `${d}L${x(seg.at(-1)[0]).toFixed(1)},${y(0)}L${x(seg[0][0]).toFixed(1)},${y(0)}Z`, fill: `var(${s.color})`, opacity: 0.12 }));
      }
      if (s.colorNeg) {
        // sign-dependent color: the same line twice, clipped above / below the zero line
        const id = `pva-clip-${++clipCount}`;
        const defs = el("defs");
        defs.append(
          el("clipPath", { id: `${id}-p` }, undefined),
          el("clipPath", { id: `${id}-n` }, undefined),
        );
        defs.children[0].append(el("rect", { x: 0, y: 0, width: W, height: y(0) }));
        defs.children[1].append(el("rect", { x: 0, y: y(0), width: W, height: H - y(0) }));
        svg.append(defs);
        for (const [suffix, color] of [["p", s.color], ["n", s.colorNeg]]) {
          svg.append(el("path", { d, fill: "none", stroke: `var(${color})`, "stroke-width": 2, "stroke-linejoin": "round", "clip-path": `url(#${id}-${suffix})` }));
        }
      } else {
        svg.append(el("path", { d, fill: "none", stroke: `var(${s.color})`, "stroke-width": 2, "stroke-linejoin": "round" }));
      }
    }
  });
  // direct end labels (value stays in the tooltip), nudged apart
  if (labelW) {
    const ends = live.map((s) => ({ s, y: y(s.points.at(-1)[1]) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
    const over = ends.at(-1).y - (M.t + ph + 8); // keep the labels inside the chart area
    if (over > 0) ends.forEach((e) => { e.y -= over; });
    for (const e of ends) svg.append(el("text", { x: M.l + pw + 6, y: e.y + 4, class: "endlabel" }, e.s.short || e.s.name));
  }
  const hair = el("line", { y1: M.t, y2: M.t + ph, class: "hair", visibility: "hidden" });
  const dots = live.map((s) => el("circle", { r: 4, fill: `var(${s.color})`, class: "dot", visibility: "hidden" }));
  svg.append(hair, ...dots);
  const hit = el("rect", { x: M.l, y: M.t, width: pw, height: ph, fill: "transparent" });
  svg.append(hit);
  const tip = tooltipShell();
  const times = [...new Set(live.flatMap((s) => s.points.map((p) => p[0])))].sort((a, b) => a - b);
  const maps = live.map((s) => new Map(s.points));
  const show = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const t = t0 + ((px - M.l) / pw) * (t1 - t0);
    let lo2 = 0, hi2 = times.length - 1;
    while (hi2 - lo2 > 1) { const m = (lo2 + hi2) >> 1; if (times[m] < t) lo2 = m; else hi2 = m; }
    const ts = Math.abs(times[lo2] - t) <= Math.abs(times[hi2] - t) ? times[lo2] : times[hi2];
    hair.setAttribute("x1", x(ts)); hair.setAttribute("x2", x(ts)); hair.setAttribute("visibility", "visible");
    live.forEach((s, i) => {
      const v = maps[i].get(ts);
      dots[i].setAttribute("visibility", v == null ? "hidden" : "visible");
      if (v != null) {
        dots[i].setAttribute("cx", x(ts)); dots[i].setAttribute("cy", y(v));
        dots[i].setAttribute("fill", `var(${s.colorNeg && v < 0 ? s.colorNeg : s.color})`);
      }
    });
    fillTip(tip, fmtTime(ts), live.map((s, i) => { const v = maps[i].get(ts); return { name: s.name, color: s.colorNeg && v < 0 ? s.colorNeg : s.color, value: v, parts: partsAt(s, ts) }; }), fmtValue);
    placeTip(tip, wrap, (x(ts) / W) * r.width, ((ev.clientY - r.top)));
  };
  const hide = () => { tip.hidden = true; hair.setAttribute("visibility", "hidden"); dots.forEach((d) => d.setAttribute("visibility", "hidden")); };
  hit.addEventListener("pointermove", show);
  hit.addEventListener("pointerleave", hide);
  wrap.append(svg, tip);
  container.append(legend(live, "line"), wrap);

  // table view: hourly means
  const byHour = new Map();
  live.forEach((s, i) => s.points.forEach(([ts, v]) => {
    const h = ts - (ts % 3600000);
    const e = byHour.get(h) || live.map(() => [0, 0]);
    e[i][0] += v; e[i][1] += 1; byHour.set(h, e);
  }));
  const rows = [...byHour.entries()].sort((a, b) => a[0] - b[0]).map(([h, e]) =>
    [fmtTime(h), ...e.map(([sum, n]) => (n ? fmtValue(sum / n) : "–"))]);
  container.append(table({ summary: opts.tableLabels.summary, cols: [opts.tableLabels.time, ...live.map((s) => s.name)] }, rows));
  restoreTable(container, tableOpen);
}

/**
 * opts: { series:[{name,color,values:Map(ts->v)}], t0, t1, bucket (ms), unit, height,
 *         fmtValue, fmtTime, fmtTick, tickStep }
 */
export function barChart(container, opts) {
  const { series, t0, t1, bucket, height = 240, fmtValue, fmtTime, fmtTick, tickStep } = opts;
  const tableOpen = wasTableOpen(container);
  container.replaceChildren();
  const live = series.filter((s) => s.values.size);
  if (!live.length) { container.append(html("p", "empty", opts.empty)); return; }
  const W = Math.max(280, container.clientWidth || 600), H = height;
  const pw = W - M.l - M.r, ph = H - M.t - M.b;
  const times = [...new Set(live.flatMap((s) => [...s.values.keys()]))].sort((a, b) => a - b);
  const maxV = Math.max(...live.flatMap((s) => [...s.values.values()]), 0);
  const ticks = niceTicks(0, maxV || 1);
  const hi = ticks.at(-1);
  const x = (t) => M.l + ((t - t0) / (t1 - t0)) * pw;
  const y = (v) => M.t + (1 - v / hi) * ph;
  const slot = (bucket / (t1 - t0)) * pw;
  const gap = 2, n = live.length;
  const barW = Math.max(1.5, (slot - 4 - gap * (n - 1)) / n);

  const wrap = html("div", "chartwrap");
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": opts.label });
  for (const v of ticks) {
    svg.append(el("line", { x1: M.l, x2: M.l + pw, y1: y(v), y2: y(v), class: v === 0 ? "axis" : "grid" }));
    svg.append(el("text", { x: M.l - 6, y: y(v) + 4, class: "tick", "text-anchor": "end" }, fmtValue(v, true)));
  }
  for (let t = t0; t < t1; t += tickStep) {
    svg.append(el("text", { x: x(t) + slot / 2, y: H - 6, class: "tick", "text-anchor": "middle" }, fmtTick(t)));
  }
  const wash = el("rect", { y: M.t, height: ph, width: slot, class: "wash", visibility: "hidden" });
  svg.append(wash);
  const r = Math.min(4, barW / 2);
  for (const ts of times) {
    live.forEach((s, i) => {
      const v = s.values.get(ts);
      if (!v || v <= 0) return;
      const bx = x(ts) + 2 + i * (barW + gap), top = y(v), bottom = y(0);
      const h = Math.max(1, bottom - top), rr = Math.min(r, h);
      // rounded data end (top), flat baseline
      const d = `M${bx},${bottom}V${top + rr}Q${bx},${top} ${bx + rr},${top}H${bx + barW - rr}Q${bx + barW},${top} ${bx + barW},${top + rr}V${bottom}Z`;
      svg.append(el("path", { d, fill: `var(${s.color})` }));
    });
  }
  const tip = tooltipShell();
  for (const ts of times) {
    const hit = el("rect", { x: x(ts), y: M.t, width: slot, height: ph, fill: "transparent", tabindex: 0 });
    const show = () => {
      wash.setAttribute("x", x(ts)); wash.setAttribute("visibility", "visible");
      fillTip(tip, fmtTime(ts), live.map((s) => ({ name: s.name, color: s.color, value: s.values.get(ts) ?? 0, parts: partsAt(s, ts) })), fmtValue);
      const rect = svg.getBoundingClientRect();
      placeTip(tip, wrap, ((x(ts) + slot / 2) / W) * rect.width, ph / 2);
    };
    hit.addEventListener("pointermove", show);
    hit.addEventListener("focus", show);
    hit.addEventListener("pointerleave", () => { tip.hidden = true; wash.setAttribute("visibility", "hidden"); });
    hit.addEventListener("blur", () => { tip.hidden = true; wash.setAttribute("visibility", "hidden"); });
    svg.append(hit);
  }
  wrap.append(svg, tip);
  container.append(legend(live, "bar"), wrap);
  container.append(table({ summary: opts.tableLabels.summary, cols: [opts.tableLabels.time, ...live.map((s) => s.name)] },
    times.map((ts) => [fmtTime(ts), ...live.map((s) => fmtValue(s.values.get(ts) ?? 0))])));
  restoreTable(container, tableOpen);
}

/**
 * Bars per category (e.g. months); values may be negative or null.
 * opts: { categories:[str], series:[{name,color,values:[v|null],colorOf?(v)->cssvar}],
 *         legendItems?:[{name,color}], fmtValue, label, empty, tableLabels, height }
 */
export function categoryBarChart(container, opts) {
  const { categories, series, height = 240, fmtValue } = opts;
  const tableOpen = wasTableOpen(container);
  container.replaceChildren();
  const all = series.flatMap((s) => s.values.filter((v) => v != null));
  if (!all.length) { container.append(html("p", "empty", opts.empty)); return; }
  const W = Math.max(280, container.clientWidth || 600), H = height;
  const pw = W - M.l - M.r, ph = H - M.t - M.b;
  const ticks = niceTicks(Math.min(0, ...all), Math.max(0, ...all));
  const lo = ticks[0], hi = ticks.at(-1);
  const y = (v) => M.t + (1 - (v - lo) / (hi - lo)) * ph;
  const slot = pw / categories.length;
  const gap = 2, n = series.length;
  const barW = Math.max(2, Math.min(28, (slot - 6 - gap * (n - 1)) / n));
  const groupW = barW * n + gap * (n - 1);

  const wrap = html("div", "chartwrap");
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": opts.label });
  for (const v of ticks) {
    svg.append(el("line", { x1: M.l, x2: M.l + pw, y1: y(v), y2: y(v), class: v === 0 ? "axis" : "grid" }));
    svg.append(el("text", { x: M.l - 6, y: y(v) + 4, class: "tick", "text-anchor": "end" }, fmtValue(v, true)));
  }
  categories.forEach((c, i) => svg.append(el("text", { x: M.l + slot * (i + 0.5), y: H - 6, class: "tick", "text-anchor": "middle" }, c)));
  const wash = el("rect", { y: M.t, height: ph, width: slot, class: "wash", visibility: "hidden" });
  svg.append(wash);
  const r = Math.min(4, barW / 2);
  categories.forEach((_, i) => {
    series.forEach((s, k) => {
      const v = s.values[i];
      if (v == null || v === 0) return;
      const bx = M.l + slot * i + (slot - groupW) / 2 + k * (barW + gap);
      const base = y(0), end = y(v), up = v > 0;
      const h = Math.max(1, Math.abs(base - end)), rr = Math.min(r, h);
      // rounded data end, flat baseline
      const d = up
        ? `M${bx},${base}V${end + rr}Q${bx},${end} ${bx + rr},${end}H${bx + barW - rr}Q${bx + barW},${end} ${bx + barW},${end + rr}V${base}Z`
        : `M${bx},${base}V${end - rr}Q${bx},${end} ${bx + rr},${end}H${bx + barW - rr}Q${bx + barW},${end} ${bx + barW},${end - rr}V${base}Z`;
      svg.append(el("path", { d, fill: `var(${s.colorOf ? s.colorOf(v) : s.color})` }));
    });
  });
  const tip = tooltipShell();
  categories.forEach((c, i) => {
    const hit = el("rect", { x: M.l + slot * i, y: M.t, width: slot, height: ph, fill: "transparent", tabindex: 0 });
    const show = () => {
      wash.setAttribute("x", M.l + slot * i); wash.setAttribute("visibility", "visible");
      fillTip(tip, c, series.map((s) => ({ name: s.name, color: s.colorOf && s.values[i] != null ? s.colorOf(s.values[i]) : s.color, value: s.values[i], parts: partsAt(s, i) })), fmtValue);
      placeTip(tip, wrap, ((M.l + slot * (i + 0.5)) / W) * svg.getBoundingClientRect().width, ph / 2);
    };
    const off = () => { tip.hidden = true; wash.setAttribute("visibility", "hidden"); };
    hit.addEventListener("pointermove", show); hit.addEventListener("focus", show);
    hit.addEventListener("pointerleave", off); hit.addEventListener("blur", off);
    svg.append(hit);
  });
  wrap.append(svg, tip);
  container.append(legend(opts.legendItems || series, "bar"), wrap);
  container.append(table({ summary: opts.tableLabels.summary, cols: [opts.tableLabels.time, ...series.map((s) => s.name)] },
    categories.map((c, i) => [c, ...series.map((s) => (s.values[i] == null ? "–" : fmtValue(s.values[i])))])));
  restoreTable(container, tableOpen);
}
