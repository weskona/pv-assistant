// Helpers for the analysis tab: local day/hour keys, plateau detection and a heat map.

const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, text) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
};

/** Builds a function ts -> {day:"YYYY-MM-DD", hour:0..23} in the given time zone. */
export function localKeyFn(tz) {
  const f = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", timeZone: tz });
  const cache = new Map();
  return (ts) => {
    let v = cache.get(ts);
    if (!v) {
      const p = Object.fromEntries(f.formatToParts(ts).map((x) => [x.type, x.value]));
      v = { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
      cache.set(ts, v);
    }
    return v;
  };
}

export function median(values) {
  const a = [...values].sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/**
 * Days on which the hourly power stays flat at the top (>= 3 consecutive hours within 1.5 % of the
 * day's maximum while the maximum is at least minShare of the total peak): a hint for a limiting
 * inverter or feed-in limit. byDay: Map(day -> number[24] of hourly mean power in W).
 */
export function plateauDays(byDay, totalPeak, minShare = 0.6) {
  const out = [];
  for (const [day, hours] of byDay) {
    const max = Math.max(...hours);
    if (!(max > 0) || max < totalPeak * minShare) continue;
    let run = 0, best = 0;
    for (const v of hours) {
      run = v >= max * 0.985 ? run + 1 : 0;
      best = Math.max(best, run);
    }
    if (best >= 3) out.push(day);
  }
  return out;
}

/**
 * Heat map: one row per day, one column per hour.
 * opts: { days:[{label, cells:number[24]}], colorVar, fmt(v), unit, hourLabel(h), empty }
 */
export function heatmap(container, opts) {
  container.replaceChildren();
  const { days, colorVar, fmt } = opts;
  const max = Math.max(0, ...days.flatMap((d) => d.cells));
  if (!days.length || !(max > 0)) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = opts.empty;
    container.append(p);
    return;
  }
  const W = Math.max(300, container.clientWidth || 700);
  const left = 56, top = 6, bottom = 18, right = 6;
  const cw = (W - left - right) / 24;
  const ch = Math.max(5, Math.min(16, 360 / days.length));
  const H = top + days.length * ch + bottom;
  const wrap = document.createElement("div");
  wrap.className = "chartwrap";
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": opts.label });
  days.forEach((d, i) => {
    if (i % Math.max(1, Math.ceil(13 / ch)) === 0) { // keep the labels readable (about 13 px per label)
      svg.append(svgEl("text", { x: left - 6, y: top + i * ch + ch * 0.75, class: "tick", "text-anchor": "end" }, d.label));
    }
    d.cells.forEach((v, h) => {
      const level = v > 0 ? Math.max(0.06, v / max) : 0;
      svg.append(svgEl("rect", { x: left + h * cw + 0.5, y: top + i * ch + 0.5, width: Math.max(1, cw - 1), height: Math.max(1, ch - 1), rx: 2,
        fill: `var(${colorVar})`, "fill-opacity": level.toFixed(3), class: v > 0 ? "" : "heat-empty" }));
    });
  });
  for (let h = 0; h < 24; h += 3) {
    svg.append(svgEl("text", { x: left + h * cw + cw / 2, y: H - 4, class: "tick", "text-anchor": "middle" }, opts.hourLabel(h)));
  }
  const frame = svgEl("rect", { x: left + 0.5, y: top, width: 0, height: ch, fill: "none", stroke: "var(--primary-text-color)", "stroke-width": 1.5, visibility: "hidden", rx: 2, "pointer-events": "none" });
  svg.append(frame);
  const hit = svgEl("rect", { x: left, y: top, width: W - left - right, height: days.length * ch, fill: "transparent" });
  svg.append(hit);
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.hidden = true;
  const move = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W, py = ((ev.clientY - r.top) / r.height) * H;
    const h = Math.floor((px - left) / cw), i = Math.floor((py - top) / ch);
    if (h < 0 || h > 23 || i < 0 || i >= days.length) { tip.hidden = true; frame.setAttribute("visibility", "hidden"); return; }
    frame.setAttribute("x", left + h * cw + 0.5); frame.setAttribute("y", top + i * ch); frame.setAttribute("width", cw - 1); frame.setAttribute("visibility", "visible");
    tip.replaceChildren();
    const t = document.createElement("div"); t.className = "tip-title"; t.textContent = `${days[i].label}, ${opts.hourLabel(h)}`;
    const row = document.createElement("div"); row.className = "tip-row";
    const b = document.createElement("b"); b.textContent = fmt(days[i].cells[h]);
    row.append(b);
    tip.append(t, row);
    tip.hidden = false;
    const x = ev.clientX - r.left, y = ev.clientY - r.top;
    tip.style.left = `${Math.min(x + 14, wrap.clientWidth - tip.offsetWidth)}px`;
    tip.style.top = `${Math.max(0, y - tip.offsetHeight - 8)}px`;
  };
  hit.addEventListener("pointermove", move);
  hit.addEventListener("pointerleave", () => { tip.hidden = true; frame.setAttribute("visibility", "hidden"); });
  wrap.append(svg, tip);
  // color scale
  const scale = document.createElement("div");
  scale.className = "legend";
  const lo = document.createElement("span"); lo.textContent = fmt(0);
  const bar = document.createElement("i"); bar.className = "scalebar"; bar.style.background = `linear-gradient(to right, transparent, var(${colorVar}))`;
  const hi = document.createElement("span"); hi.textContent = fmt(max);
  scale.append(lo, bar, hi);
  container.append(wrap, scale);
}

// Rough annual yield of a module orientation relative to the optimum (central Europe, in %/100):
// rows = deviation from south (0, 45, 90, 135, 180 degrees), columns = tilt (0, 15, 30, 45, 60, 90 degrees).
const OR_DEV = [0, 45, 90, 135, 180];
const OR_TILT = [0, 15, 30, 45, 60, 90];
const OR_TABLE = [
  [0.87, 0.96, 1.0, 0.99, 0.93, 0.70],
  [0.87, 0.94, 0.97, 0.94, 0.87, 0.66],
  [0.87, 0.91, 0.85, 0.80, 0.73, 0.55],
  [0.87, 0.87, 0.78, 0.70, 0.62, 0.42],
  [0.87, 0.82, 0.68, 0.57, 0.47, 0.32],
];
const interp = (axis, x) => {
  const v = Math.max(axis[0], Math.min(axis.at(-1), x));
  let i = 0;
  while (i < axis.length - 2 && v > axis[i + 1]) i++;
  return [i, (v - axis[i]) / (axis[i + 1] - axis[i])];
};
/** Expected relative yield (0..1) of a string; azimuth like Forecast.Solar (south = 0, east = -90, west = 90). */
export function orientationFactor(azimuth, tilt) {
  const [i, fi] = interp(OR_DEV, Math.min(180, Math.abs(azimuth)));
  const [j, fj] = interp(OR_TILT, tilt);
  const row = (r) => OR_TABLE[r][j] * (1 - fj) + OR_TABLE[r][j + 1] * fj;
  return row(i) * (1 - fi) + row(i + 1) * fi;
}
