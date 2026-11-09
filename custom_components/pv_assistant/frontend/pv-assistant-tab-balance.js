// Balance tab (energy balance and the day profile).
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, mergedRows, addDays, categoryBarChart, areaChart;
export function init(ctx) {
  ({ esc, mergedRows, addDays, categoryBarChart, areaChart } = ctx);
}

export class BalancePart {
  _buildBalance() {
    const { E, G } = this._keys();
    const box = this._root.getElementById("bal");
    this._balanceOn = !!(E.prod.length && (E.feed.length || G.impE.length || E.sin.length || E.sout.length || E.comb.length));
    if (!this._balanceOn) { box.replaceChildren(); return; }
    if (!this._brange) this._brange = "d30";
    box.innerHTML = `<div class="filters" id="branges"></div><div class="tiles" id="btiles"></div>
      <div id="bprof"><h3 class="ch" id="bproft"></h3><div class="chart" id="bprofc"></div><p class="note">${esc(this._t("balProfNote"))}</p></div>
      <div id="buse"><h3 class="ch">${esc(this._t("balUse"))}</h3><div class="chart" id="busec"></div></div>
      <div id="bcov"><h3 class="ch">${esc(this._t("balCover"))}</h3><div class="chart" id="bcovc"></div></div>
      <div id="brat"><h3 class="ch">${esc(this._t("balRates"))}</h3><div class="chart" id="bratc"></div></div>
      <p class="note">${esc(this._t("balNote"))}</p>`;
    this._picker(box.querySelector("#branges"), () => this._brange, (v) => { this._brange = v; this._loadBalance(); });
  }

  async _loadBalance() {
    if (!this._balanceOn || !this._hass || !this._root.getElementById("branges")) return;
    const token = (this._btoken = (this._btoken || 0) + 1);
    const rd = this._rangeDef(this._brange);
    const { E, G } = this._keys();
    const filt = this._cfg.filtered || {};
    const ids = [...E.prod, ...E.feed, ...E.sin, ...E.sout, ...E.comb, ...G.impE, ...G.houseE];
    this._root.querySelectorAll("#bal .chart").forEach((c) => c.classList.add("loading"));
    const eres = await this._stats(ids.concat(ids.map((i) => filt[i]).filter(Boolean)), rd.long ? "month" : rd.eBucket === 3600e3 ? "hour" : "day", "change", { energy: "kWh" }, rd);
    if (token !== this._btoken) return;
    this._bdata = { rd, eres, filt };
    this._drawBalance();
    this._loadProfile(rd, token);
  }

  // hourly profile: the chosen day, otherwise the average day of the (at most last 31) days of the range
  async _loadProfile(rd, token) {
    const { E, G } = this._keys();
    const box = this._root.getElementById("bprof");
    if (!box) return;
    box.hidden = !E.prod.length;
    if (!E.prod.length) return;
    const day = 24 * 3600e3;
    const end = rd.end;
    const t1 = rd.days === 1 && !rd.long ? rd.t1 : end;
    const t0 = rd.days === 1 && !rd.long ? rd.t0 : Math.max(rd.t0, addDays(new Date(new Date(end).setHours(0, 0, 0, 0)), -30).getTime());
    const filt = this._cfg.filtered || {};
    const ids = [...E.prod, ...E.feed, ...E.sin, ...E.sout, ...E.comb, ...G.impE, ...G.houseE];
    const pres = await this._stats(ids.concat(ids.map((i) => filt[i]).filter(Boolean)), "hour", "change", { energy: "kWh" }, { t0, end: t1 });
    if (token !== this._btoken) return;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const hf = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: tz });
    const hourOf = (ts) => Number(hf.format(ts));
    const flip = (inv) => (v) => (inv ? -v : v), nz = (v) => Math.max(v, 0);
    const bins = (ids2, fn = (v) => v) => {
      const sum = Array(24).fill(0), cnt = Array(24).fill(0);
      const per = new Map();
      for (const id of ids2) for (const r of mergedRows(pres, id, filt, "change")) per.set(r.start, (per.get(r.start) || 0) + fn(r.change));
      for (const [ts, v] of per) { const h = hourOf(ts); sum[h] += v; cnt[h] += 1; }
      return { sum, cnt };
    };
    const prod = bins(E.prod), feed = bins(E.feed), imp = bins(G.impE), house = bins(G.houseE);
    const sIn = bins([...E.sin]), sOut = bins([...E.sout]);
    const cIn = bins(E.comb, (v) => nz(-flip(E.inv)(v))), cOut = bins(E.comb, (v) => nz(flip(E.inv)(v)));
    const days = Math.max(1, ...prod.cnt);
    const avg = (b, h) => (b.sum[h] || 0) / Math.max(1, days);
    const hours = [...Array(24).keys()];
    const g = (b, h) => avg(b, h), sI = (h) => g(sIn, h) + g(cIn, h), sO = (h) => g(sOut, h) + g(cOut, h);
    const toSt = hours.map((h) => Math.min(sI(h), nz(g(prod, h) - g(feed, h))));
    const direct = hours.map((h) => nz(g(prod, h) - g(feed, h) - toSt[h]));
    const outV = hours.map(sO), impV = hours.map((h) => g(imp, h));
    const houseV = hours.map((h, i) => (G.houseE.length ? g(house, h) : direct[i] + outV[i] + impV[i]));
    const num = (v, dec = 2) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const asDay = rd.days === 1 && !rd.long;
    this._root.getElementById("bproft").textContent = asDay ? this._t("balProfDay") : this._t("balProfAvg").replace("{n}", String(days));
    const series = [{ name: this._t("direct"), color: "--pva-direct", values: direct }];
    if (E.sout.length || E.comb.length) series.push({ name: this._t("sout"), color: "--pva-bout", values: outV });
    if (G.impE.length) series.push({ name: this._t("balFromGrid"), color: "--pva-grid", values: impV });
    if (E.sin.length || E.comb.length) series.push({ name: this._t("balToStorage"), color: "--pva-bin", values: toSt });
    if (E.feed.length) series.push({ name: this._t("feed"), color: "--pva-feed", values: hours.map((h) => g(feed, h)) });
    areaChart(this._root.getElementById("bprofc"), {
      categories: hours.map((h) => String(h).padStart(2, "0")), series,
      lines: [{ name: this._t("production"), color: "--pva-prod", values: hours.map((h) => g(prod, h)) }, { name: this._t("balProfHouse"), color: "--pva-house", dash: "6 4", values: houseV }],
      fmtValue: (v, axis) => (axis ? num(v, 1) : `${num(v)} kWh`), empty: this._t("noData"), label: this._t("balProfDay"),
      tableLabels: { summary: this._t("table"), time: this._t("time") },
    });
  }

  _drawBalance() {
    const d = this._bdata;
    const root = this._root;
    if (!d || !this._balanceOn || !root.getElementById("branges")) return;
    const { rd, eres, filt } = d;
    const { E, G } = this._keys();
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const fm = (o) => new Intl.DateTimeFormat(lang, { ...o, timeZone: tz });
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const sumMap = (ids, fn = (v) => v) => {
      const m = new Map();
      for (const id of ids) for (const r of mergedRows(eres, id, filt, "change")) m.set(r.start, (m.get(r.start) || 0) + fn(r.change));
      return m;
    };
    const flip = (inv) => (v) => (inv ? -v : v), nz = (v) => Math.max(v, 0);
    const merge = (a, b) => { const m = new Map(a); for (const [k, v] of b) m.set(k, (m.get(k) || 0) + v); return m; };
    const prod = sumMap(E.prod), feed = sumMap(E.feed), imp = sumMap(G.impE), house = sumMap(G.houseE);
    const sIn = merge(sumMap(E.sin), sumMap(E.comb, (v) => nz(-flip(E.inv)(v))));
    const sOut = merge(sumMap(E.sout), sumMap(E.comb, (v) => nz(flip(E.inv)(v))));
    const keys = [...prod.keys()].sort((a, b) => a - b);
    const hourly = rd.eBucket === 3600e3 && !rd.long;
    const fMon = fm(new Date(rd.t0).getFullYear() === new Date(rd.t1 - 1).getFullYear() ? { month: "short" } : { month: "short", year: "2-digit" });
    const label = rd.long ? (t) => fMon.format(t + 15 * 24 * 3600e3) : hourly ? (t) => fm({ hour: "2-digit", minute: "2-digit" }).format(t) : (t) => fm({ day: "numeric", month: "numeric" }).format(t);
    const cats = keys.map(label);
    const at = (m, k) => m.get(k) ?? 0;
    // split of the production: into the storage (limited by what is not fed in), used directly, fed in
    const toStorage = keys.map((k) => Math.min(at(sIn, k), nz(at(prod, k) - at(feed, k))));
    const direct = keys.map((k, i) => nz(at(prod, k) - at(feed, k) - toStorage[i]));
    const feedV = keys.map((k) => at(feed, k));
    const tl = { summary: this._t("table"), time: this._t("time") };
    const fv = (v, axis) => `${num(v, axis ? 1 : 2)}${axis ? "" : " kWh"}`;
    root.querySelectorAll("#bal .chart").forEach((c) => c.classList.remove("loading"));

    const useBox = root.getElementById("buse");
    useBox.hidden = !E.feed.length;
    if (E.feed.length) categoryBarChart(root.getElementById("busec"), {
      categories: cats, stacked: true,
      series: [{ name: this._t("direct"), color: "--pva-direct", values: direct }, ...(sIn.size ? [{ name: this._t("balToStorage"), color: "--pva-bin", values: toStorage }] : []), { name: this._t("feed"), color: "--pva-feed", values: feedV }],
      fmtValue: fv, empty: this._t("noData"), tableLabels: tl, label: this._t("balUse"),
    });
    const outV = keys.map((k) => at(sOut, k)), impV = keys.map((k) => at(imp, k));
    const covBox = root.getElementById("bcov");
    const hasCover = G.impE.length || sOut.size;
    covBox.hidden = !hasCover;
    if (hasCover) categoryBarChart(root.getElementById("bcovc"), {
      categories: cats, stacked: true,
      series: [{ name: this._t("direct"), color: "--pva-direct", values: direct }, ...(sOut.size ? [{ name: this._t("sout"), color: "--pva-bout", values: outV }] : []), ...(G.impE.length ? [{ name: this._t("balFromGrid"), color: "--pva-grid", values: impV }] : [])],
      fmtValue: fv, empty: this._t("noData"), tableLabels: tl, label: this._t("balCover"),
    });
    // self-sufficiency: share of the consumption not taken from the grid; self-consumption: share of the production not fed in
    const covered = (i, k) => direct[i] + at(sOut, k);
    const autarky = keys.map((k, i) => {
      if (!G.impE.length) return null;
      const use = house.size ? at(house, k) : covered(i, k) + at(imp, k);
      return use > 0 ? (Math.max(use - at(imp, k), 0) / use) * 100 : null;
    });
    const selfCons = keys.map((k) => (E.feed.length && at(prod, k) > 0 ? (nz(at(prod, k) - at(feed, k)) / at(prod, k)) * 100 : null));
    const ratBox = root.getElementById("brat");
    ratBox.hidden = !(G.impE.length || E.feed.length);
    if (!ratBox.hidden) categoryBarChart(root.getElementById("bratc"), {
      categories: cats,
      series: [...(G.impE.length ? [{ name: this._t("autarky"), color: "--pva-pos", values: autarky }] : []), ...(E.feed.length ? [{ name: this._t("selfShare"), color: "--pva-prod", values: selfCons }] : [])],
      fmtValue: (v, axis) => `${num(v, 0)}${axis ? "" : " %"}`, empty: this._t("noData"), tableLabels: tl, label: this._t("balRates"),
    });

    // totals of the range
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const tProd = sum([...prod.values()]), tDirect = sum(direct), tFeed = sum(feedV), tStore = sum(toStorage), tOut = sum(outV), tImp = sum(impV);
    const tiles = [[tProd, this._t("production")]];
    if (E.feed.length) tiles.push([tDirect, this._t("direct")], [tFeed, this._t("feed")]);
    if (sIn.size) tiles.push([tStore, this._t("balToStorage")]);
    if (sOut.size) tiles.push([tOut, this._t("sout")]);
    if (G.impE.length) tiles.push([tImp, this._t("balFromGrid")]);
    let html = tiles.filter(([v]) => v > 0).map(([v, l]) => `<div class="tile"><b>${esc(num(v))} kWh</b><span>${esc(l)}</span></div>`).join("");
    const tHouse = house.size ? sum([...house.values()]) : tDirect + tOut + tImp;
    if (G.impE.length && tHouse > 0) html += `<div class="tile"><b>${esc(num((Math.max(tHouse - tImp, 0) / tHouse) * 100, 0))} %</b><span>${esc(this._t("autarky"))}</span></div>`;
    if (E.feed.length && tProd > 0) html += `<div class="tile"><b>${esc(num((tDirect + tStore) / tProd * 100, 0))} %</b><span>${esc(this._t("selfShare"))}</span></div>`;
    root.getElementById("btiles").innerHTML = html;
  }
}
