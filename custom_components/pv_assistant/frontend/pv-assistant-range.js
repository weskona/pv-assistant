// Shared by the tabs: range definitions, the range picker, statistics queries (short and long term).
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let pad2, dateKey, addDays, mondayOf, isoWeek, parsePeriod, MAX_ALL_YEARS;
export function init(ctx) {
  ({ pad2, dateKey, addDays, mondayOf, isoWeek, parsePeriod, MAX_ALL_YEARS } = ctx);
}

export class RangePart {
  _rangeDef(range) {
    const H = 3600e3;
    const p = parsePeriod(range || this._range, this._dataStart);
    const tomorrow = addDays(new Date(new Date().setHours(0, 0, 0, 0)), 1).getTime();
    if (["year", "y12", "all"].includes(p.kind)) { // calendar year / last 12 months / everything recorded: month aligned buckets, like the Energy dashboard
      const t1 = Math.min(p.end.getTime(), tomorrow);
      const months = Math.max(1, Math.round((t1 - p.start.getTime()) / (30.44 * 24 * H)));
      return { t0: p.start.getTime(), t1, end: Math.min(Date.now(), t1), days: Math.round((t1 - p.start.getTime()) / (24 * H)), long: true, all: p.kind === "all",
        pPeriod: "day", pStep: 24 * H, eBucket: "month", eStep: 30 * 24 * H, tickStep: Math.ceil(months / 12) * (365.25 / 12) * 24 * H }; // one tick per month, fewer for long ranges
    }
    const t0 = p.start.getTime(), t1 = p.end.getTime();
    const days = Math.round((t1 - t0) / (24 * H));
    return { t0, t1, end: Math.min(Date.now(), t1), days,
      pPeriod: days === 1 ? "5minute" : "hour", pStep: days === 1 ? 300e3 : H,
      eBucket: days === 1 ? H : 24 * H, eStep: days === 1 ? H : 24 * H,
      tickStep: days === 1 ? 3 * H : days === 7 ? 24 * H : days <= 31 ? 5 * 24 * H : 15 * 24 * H };
  }

  // Start of the recorded data (first month with production), needed for the range "Total". Read once from the long-term statistics.
  async _ensureDataStart() {
    if (this._dataStart) return this._dataStart;
    const { P, E } = this._keys();
    const energy = E.prod.length > 0;
    const ids = energy ? E.prod : P.prod;
    let first = Infinity;
    try {
      const res = await this._ltMonthly("start", ids, energy ? "change" : "mean", energy ? { energy: "kWh" } : { power: "W" });
      for (const id of ids) { const r = (res[id] || [])[0]; if (r && r.start < first) first = r.start; }
    } catch (e) { first = Infinity; }
    const fallback = new Date(); fallback.setFullYear(fallback.getFullYear() - 1);
    return (this._dataStart = Number.isFinite(first) ? first : fallback.getTime());
  }

  // categories (one per month of a long range) and a converter from {bucket start -> value} to one value per month
  _monthAxis(rd, tz, fMon) {
    const ymFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "numeric", timeZone: tz });
    const ymKey = (ts) => { const q = Object.fromEntries(ymFmt.formatToParts(ts).map((x) => [x.type, x.value])); return `${q.year}-${q.month}`; };
    const months = [];
    for (let t = new Date(rd.t0); t.getTime() < rd.t1; t = new Date(t.getFullYear(), t.getMonth() + 1, 1)) months.push(new Date(t.getFullYear(), t.getMonth(), 15, 12).getTime());
    const idx = new Map(months.map((ts, i) => [ymKey(ts), i]));
    const toArr = (m) => { const out = months.map(() => null); for (const [ts, v] of m) { const i = idx.get(ymKey(ts)); if (i != null) out[i] = (out[i] || 0) + v; } return out; };
    return { categories: months.map((ts) => fMon.format(ts)), toArr };
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

  // Range picker of a tab: the unit (Day, Week, Month, Year, Total), arrows and a label that opens a small calendar, and a list of
  // quick ranges (today, yesterday, the last 7 / 30 / 90 days, the last 12 months). get() returns the current range value, set(v)
  // stores the new one and reloads the tab (see parsePeriod for the values).
  _picker(box, get, set) {
    const t = (k) => this._t(k);
    const lang = () => this._hass?.locale?.language || this._hass?.language;
    const fmt = (o, d) => new Intl.DateTimeFormat(lang(), o).format(d);
    const mk = (tag, cls, text, attrs = {}) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
    box.classList.remove("filters");
    box.classList.add("picker");
    box.replaceChildren();
    const UNITS = [["day", "pkDay"], ["week", "pkWeek"], ["month", "month"], ["year", "pkYear"], ["all", "total"]];
    const seg = mk("div", "pk-seg", undefined, { role: "group", "aria-label": t("pkUnit") });
    const unitBtn = Object.fromEntries(UNITS.map(([u, label]) => { const b = mk("button", "", t(label), { type: "button" }); seg.append(b); return [u, b]; }));
    const nav = mk("div", "pk-nav");
    const prev = mk("button", "", "‹", { type: "button", "aria-label": t("pkPrev") });
    const next = mk("button", "", "›", { type: "button", "aria-label": t("pkNext") });
    const label = mk("button", "pk-label", "", { type: "button", "aria-haspopup": "dialog", "aria-expanded": "false" });
    nav.append(prev, label, next);
    const quick = mk("select", "pk-quick", undefined, { "aria-label": t("pkQuick") });
    const QUICK = [["today", "today"], ["yesterday", "yesterday"], ["roll:7", "pkLast7"], ["roll:30", "pkLast30"], ["roll:90", "pkLast90"], ["y12", "pkLast12m"]];
    quick.append(mk("option", "", t("pkQuick"), { value: "", disabled: "", hidden: "" }), ...QUICK.map(([v, key]) => mk("option", "", t(key), { value: v })));
    const pop = mk("div", "pk-pop", undefined, { role: "dialog", "aria-label": t("pkDate") });
    pop.hidden = true;
    box.append(seg, nav, quick, pop);

    const today = () => new Date(new Date().setHours(0, 0, 0, 0));
    const cur = () => parsePeriod(get(), this._dataStart);
    const first = () => { const d = new Date(this._dataStart || 0); return this._dataStart ? new Date(d.getFullYear(), d.getMonth(), 1) : null; }; // earliest month with data
    const valueOf = (u, anchor) => ({ day: `day:${dateKey(anchor)}`, week: `week:${dateKey(mondayOf(anchor))}`, month: `month:${anchor.getFullYear()}-${pad2(anchor.getMonth() + 1)}`, year: `year:${anchor.getFullYear()}`, all: "all" }[u]);
    const choose = async (v) => { if (v === "all") await this._ensureDataStart(); set(v); close(); render(); };
    const unitOf = (p) => (["day", "week", "month", "year", "all"].includes(p.kind) ? p.kind : null);

    const labelOf = (p) => {
      const dateStr = (d) => fmt({ weekday: "short", day: "numeric", month: "short", year: "numeric" }, d);
      if (p.kind === "day") {
        const diff = Math.round((today() - p.start) / 86400e3);
        return diff === 0 ? `${t("today")} · ${fmt({ day: "numeric", month: "short", year: "numeric" }, p.start)}` : diff === 1 ? `${t("yesterday")} · ${fmt({ day: "numeric", month: "short", year: "numeric" }, p.start)}` : dateStr(p.start);
      }
      if (p.kind === "week") return `${t("pkWeek")} ${isoWeek(p.start)} · ${fmt({ day: "numeric", month: "short" }, p.start)} – ${fmt({ day: "numeric", month: "short", year: "numeric" }, addDays(p.end, -1))}`;
      if (p.kind === "month") return fmt({ month: "long", year: "numeric" }, p.start);
      if (p.kind === "year") return String(p.start.getFullYear());
      if (p.kind === "roll") return t("pkLast").replace("{n}", String(p.days));
      if (p.kind === "y12") return t("pkLast12m");
      return `${t("total")}${this._dataStart ? ` · ${t("pkSince")} ${fmt({ month: "short", year: "numeric" }, p.start)}` : ""}`;
    };

    const render = () => {
      const p = cur();
      const unit = unitOf(p);
      for (const [u, b] of Object.entries(unitBtn)) { b.setAttribute("aria-pressed", String(u === unit)); b.title = u === unit && u !== "all" ? t("pkNow") : ""; }
      label.textContent = labelOf(p);
      const stepping = ["day", "week", "month", "year"].includes(p.kind);
      label.disabled = !stepping;
      prev.hidden = next.hidden = !stepping;
      next.disabled = p.end.getTime() > today().getTime() + 86400e3 - 1; // the period contains today: nothing newer
      const f = first();
      prev.disabled = !!f && p.start.getTime() <= f.getTime();
      quick.value = (p.kind === "roll" || p.kind === "y12") && QUICK.some(([v]) => v === p.value) ? p.value : "";
      label.setAttribute("aria-expanded", String(!pop.hidden));
    };

    const step = (dir) => {
      const p = cur();
      const d = p.start;
      const anchor = p.kind === "day" ? addDays(d, dir) : p.kind === "week" ? addDays(d, 7 * dir) : p.kind === "month" ? new Date(d.getFullYear(), d.getMonth() + dir, 1) : new Date(d.getFullYear() + dir, 0, 1);
      choose(valueOf(p.kind, anchor));
    };
    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    for (const [u, b] of Object.entries(unitBtn)) {
      b.addEventListener("click", () => {
        const p = cur();
        // the same unit again jumps to the current period; another unit keeps the date that is shown
        const anchor = unitOf(p) === u || !["day", "week", "month", "year"].includes(p.kind) ? today() : p.start;
        choose(valueOf(u, anchor.getTime() > today().getTime() ? today() : anchor));
      });
    }
    quick.addEventListener("change", () => { if (quick.value) choose(quick.value); });

    // ---- the calendar (depends on the unit)
    let view = null;
    const close = () => { pop.hidden = true; label.setAttribute("aria-expanded", "false"); this._root.removeEventListener("click", outside, true); };
    const outside = (ev) => { if (!ev.composedPath().includes(box)) close(); };
    const earlier = (d) => { const f = first(); return !!f && d.getTime() < f.getTime(); };
    const drawPop = () => {
      const p = cur();
      const unit = unitOf(p) || "day";
      pop.replaceChildren();
      const head = mk("div", "pk-head");
      const hp = mk("button", "", "‹", { type: "button", "aria-label": t("pkPrev") }), hn = mk("button", "", "›", { type: "button", "aria-label": t("pkNext") });
      const title = mk("span", "pk-title");
      head.append(hp, title, hn);
      pop.append(head);
      const now = today();
      if (unit === "day" || unit === "week") {
        title.textContent = fmt({ month: "long", year: "numeric" }, new Date(view.y, view.m, 1));
        hp.disabled = !!first() && new Date(view.y, view.m, 1).getTime() <= first().getTime();
        hn.disabled = view.y * 12 + view.m >= now.getFullYear() * 12 + now.getMonth();
        hp.addEventListener("click", () => { const n = new Date(view.y, view.m - 1, 1); view = { y: n.getFullYear(), m: n.getMonth() }; drawPop(); });
        hn.addEventListener("click", () => { const n = new Date(view.y, view.m + 1, 1); view = { y: n.getFullYear(), m: n.getMonth() }; drawPop(); });
        const grid = mk("div", "pk-cal");
        grid.append(mk("span", "pk-wk pk-dow", "#"));
        const monday = mondayOf(new Date(2024, 0, 1));
        for (let i = 0; i < 7; i++) grid.append(mk("span", "pk-dow", fmt({ weekday: "short" }, addDays(monday, i)).slice(0, 2)));
        const start = mondayOf(new Date(view.y, view.m, 1));
        for (let w = 0; w < 6; w++) {
          const wd = addDays(start, w * 7);
          const wk = mk("button", "pk-wk", String(isoWeek(wd)), { type: "button", "aria-label": `${t("pkWeek")} ${isoWeek(wd)}` });
          wk.disabled = wd.getTime() > now.getTime() || earlier(addDays(wd, 6));
          wk.addEventListener("click", () => choose(valueOf("week", wd)));
          grid.append(wk);
          for (let i = 0; i < 7; i++) {
            const d = addDays(wd, i);
            const b = mk("button", "pk-day", String(d.getDate()), { type: "button", "aria-label": fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }, d) });
            if (d.getMonth() !== view.m) b.classList.add("out");
            if (d.getTime() === now.getTime()) b.classList.add("today");
            const inSel = d >= p.start && d < p.end;
            if (inSel && (p.kind === "day" || p.kind === "week")) b.classList.add("sel");
            b.disabled = d.getTime() > now.getTime() || earlier(d);
            b.addEventListener("click", () => choose(valueOf(unit === "week" ? "week" : "day", d)));
            grid.append(b);
          }
        }
        pop.append(grid);
      } else if (unit === "month") {
        title.textContent = String(view.y);
        hp.disabled = !!first() && view.y <= first().getFullYear();
        hn.disabled = view.y >= now.getFullYear();
        hp.addEventListener("click", () => { view = { y: view.y - 1 }; drawPop(); });
        hn.addEventListener("click", () => { view = { y: view.y + 1 }; drawPop(); });
        const grid = mk("div", "pk-grid");
        for (let m = 0; m < 12; m++) {
          const d = new Date(view.y, m, 1);
          const b = mk("button", "", fmt({ month: "short" }, d), { type: "button" });
          if (p.kind === "month" && p.start.getTime() === d.getTime()) b.classList.add("sel");
          b.disabled = d.getTime() > now.getTime() || (!!first() && new Date(view.y, m + 1, 0).getTime() < first().getTime());
          b.addEventListener("click", () => choose(valueOf("month", d)));
          grid.append(b);
        }
        pop.append(grid);
      } else { // year
        title.textContent = t("pkYear");
        hp.hidden = hn.hidden = true;
        const grid = mk("div", "pk-grid");
        const y0 = first() ? first().getFullYear() : now.getFullYear() - 5;
        for (let y = y0; y <= now.getFullYear(); y++) {
          const b = mk("button", "", String(y), { type: "button" });
          if (p.kind === "year" && p.start.getFullYear() === y) b.classList.add("sel");
          b.addEventListener("click", () => choose(`year:${y}`));
          grid.append(b);
        }
        pop.append(grid);
      }
      const foot = mk("div", "pk-foot");
      const nowBtn = mk("button", "", t(unit === "week" ? "pkThisWeek" : unit === "month" ? "pkThisMonth" : unit === "year" ? "pkThisYear" : "today"), { type: "button" });
      nowBtn.addEventListener("click", () => choose(valueOf(unit, now)));
      foot.append(nowBtn);
      pop.append(foot);
    };
    label.addEventListener("click", () => {
      if (!pop.hidden) { close(); return; }
      const p = cur();
      view = p.kind === "month" || p.kind === "year" ? { y: p.start.getFullYear() } : { y: p.start.getFullYear(), m: p.start.getMonth() };
      if (p.kind === "week") { const mid = addDays(p.start, 3); view = { y: mid.getFullYear(), m: mid.getMonth() }; }
      drawPop();
      pop.hidden = false;
      pop.style.left = `${Math.max(0, Math.min(nav.offsetLeft, box.clientWidth - pop.offsetWidth))}px`; // under the date, but inside the tab
      label.setAttribute("aria-expanded", "true");
      this._root.addEventListener("click", outside, true);
      (pop.querySelector(".sel") || pop.querySelector(".today") || pop.querySelector("button:not(:disabled)"))?.focus();
    });
    box.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !pop.hidden) { close(); label.focus(); } });
    render();
    this._ensureDataStart().then(render); // the first month with data limits the arrows and the calendar
  }

  // points on the straight line from a to b ([ts, value] pairs), one per step: the line charts break a line where
  // the gap between two points is larger than 1.5 steps, so a long straight line needs intermediate points
  _linePoints(a, b, step) {
    const n = Math.max(1, Math.ceil((b[0] - a[0]) / step));
    return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  }

  // query window of a range (see parsePeriod). "all" is cut to MAX_ALL_YEARS years (the tabs that use this load hourly values): capped.
  _window(v) {
    const p = parsePeriod(v, this._dataStart);
    const end = new Date(Math.min(Date.now(), p.end.getTime()));
    if (p.kind === "all") {
      const day = new Date(new Date().setHours(0, 0, 0, 0));
      const limit = new Date(day.getFullYear() - MAX_ALL_YEARS, day.getMonth(), 1);
      return { start: new Date(Math.max(p.start.getTime(), limit.getTime())), end, capped: p.start < limit };
    }
    return { start: p.start, end };
  }

  // Long-term monthly statistics: completed months never change, so they are cached in the browser
  // (localStorage) and only the previous and the current month are queried again. The first call for a set
  // of sensors still reads the whole history (up to 15 years), later calls take a fraction of a second.
  async _ltMonthly(key, ids, type, units) {
    ids = [...new Set(ids)];
    if (!ids.length) return {};
    const ck = `pv_assistant_lt_${key}`;
    const sig = `${type}|${JSON.stringify(units)}|${[...ids].sort().join(",")}`;
    let cache = null;
    try {
      const c = JSON.parse(localStorage.getItem(ck) || "null");
      if (c && c.sig === sig && c.res) cache = c;
    } catch (e) { cache = null; }
    const now = new Date();
    const from = cache
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 15, 0, 1); d.setHours(0, 0, 0, 0); return d; })();
    let fresh;
    try {
      fresh = await this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: from.toISOString(), end_time: now.toISOString(),
        statistic_ids: ids, period: "month", types: [type], units,
      });
    } catch (e) { return cache ? cache.res : {}; }
    const res = {};
    for (const id of ids) {
      const old = cache ? (cache.res[id] || []).filter((r) => r.start < from.getTime()) : [];
      res[id] = old.concat(fresh[id] || []);
    }
    try { localStorage.setItem(ck, JSON.stringify({ sig, res })); } catch (e) { /* storage unavailable or full */ }
    return res;
  }
}
