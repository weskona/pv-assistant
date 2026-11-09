// Forecast tab.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, list, mergedRows, categoryBarChart, localKeyFn;
export function init(ctx) {
  ({ esc, list, mergedRows, categoryBarChart, localKeyFn } = ctx);
}

export class ForecastPart {
  _buildForecast() {
    const c = this._cfg || {};
    this._forecastOn = !!(list(c.forecast_today_energy_sensors).length || list(c.forecast_tomorrow_energy_sensors).length || list(c.forecast_remaining_energy_sensors).length);
    const box = this._root.getElementById("fcs");
    if (!this._forecastOn) { box.replaceChildren(); return; }
    if (!this._fdays) this._fdays = 30;
    box.innerHTML = `<div class="filters" id="franges"></div><div class="tiles" id="ftiles"></div><p class="note" id="fcnote"></p>
      <h3 class="ch" id="fchead">${esc(this._t("anaForecast"))}</h3><div class="chart" id="fcchart"></div>
      <h3 class="ch">${esc(this._t("anaForecastDev"))}</h3><div class="chart" id="fcdev"></div>
      <div id="fcdaybox"><h3 class="ch">${esc(this._t("fcHourChart"))}</h3><div class="chart" id="fcday"></div></div>
      <div id="fcbbox"><h3 class="ch">${esc(this._t("fcBuckets"))}</h3><div class="chart" id="fcbchart"></div><div class="chart" id="fcbuckets"></div></div>`;
    const ranges = box.querySelector("#franges");
    this._picker(ranges, () => this._fdays, (v) => { this._fdays = v; this._loadForecast(); });
  }

  async _loadForecast() {
    if (!this._forecastOn || !this._hass || !this._root.getElementById("franges")) return;
    const token = (this._ftoken = (this._ftoken || 0) + 1);
    const { E, P } = this._keys();
    const filt = this._cfg.filtered || {};
    const profStart = new Date(); profStart.setHours(0, 0, 0, 0); profStart.setDate(profStart.getDate() - 14);
    const { start, end } = this._window(this._fdays);
    const ids = [...new Set(E.prod.concat(E.prod.map((i) => filt[i]).filter(Boolean)))];
    this._root.querySelectorAll("#fcs .chart").forEach((c) => c.classList.add("loading"));
    const todayIds = list(this._cfg.forecast_today_energy_sensors);
    const [eres, cfg, hist, pw, fstats] = await Promise.all([
      ids.length ? this._hass.callWS({ type: "recorder/statistics_during_period", start_time: start.toISOString(), end_time: end.toISOString(),
        statistic_ids: ids, period: "day", types: ["change"], units: { energy: "kWh" } }).catch(() => ({})) : {},
      this._hass.callWS({ type: "pv_assistant/config" }).catch(() => null), // fresh forecast log
      todayIds.length ? this._forecastFromHistory(todayIds) : {},
      // hourly power of the last 14 days: the typical daily curve for the best time of large consumers
      P.prod.length ? this._hass.callWS({ type: "recorder/statistics_during_period", start_time: profStart.toISOString(), end_time: new Date().toISOString(),
        statistic_ids: [...new Set(P.prod)], period: "hour", types: ["mean"], units: { power: "W" } }).catch(() => ({})) : {},
      // long-term statistics of the forecast sensors (only exist when the sensor has a state class): the oldest source
      todayIds.length ? this._hass.callWS({ type: "recorder/statistics_during_period", start_time: start.toISOString(), end_time: end.toISOString(),
        statistic_ids: todayIds, period: "day", types: ["state", "max", "mean"], units: { energy: "kWh" } }).catch(() => ({})) : {},
    ]);
    if (token !== this._ftoken) return;
    if (cfg?.settings) this._cfg.settings = cfg.settings;
    this._fdata = { eres, hist: { ...this._forecastFromStats(todayIds, fstats), ...hist }, start, pw };
    this._drawForecast();
  }

  _drawForecast() {
    const d = this._fdata;
    if (!d || !this._forecastOn || !this._root.getElementById("franges")) return;
    const { eres, hist, start, pw } = d;
    const { E, P } = this._keys();
    const filt = this._cfg.filtered || {};
    const root = this._root;
    const lang = this._hass.locale?.language || this._hass.language;
    const key = localKeyFn(this._hass.config?.time_zone);
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const dayLabel = (day) => `${day.slice(8, 10)}.${day.slice(5, 7)}.`;
    const todayKey = key(Date.now()).day;
    const actual = new Map(); // daily production from the energy counters (the filtered copy wins)
    for (const id of E.prod) {
      const rows = mergedRows(eres, id, filt, "change");
      for (const r of rows) if (r.change != null) { const day = key(r.start).day; actual.set(day, (actual.get(day) || 0) + r.change); }
    }
    const log = { ...(hist || {}), ...(this._cfg.settings?.forecast_log || {}) };
    const startDay = key(start.getTime()).day;
    const fcDays = Object.keys(log).filter((day) => day >= startDay && day !== todayKey && actual.has(day) && log[day] > 0).sort();

    // current forecast sensors
    const tiles = [];
    const sumOf = (k) => { const v = list(this._cfg[k]).map((id) => this._read(id).base).filter((x) => !isNaN(x)); return v.length ? v.reduce((a, x) => a + x, 0) : null; };
    const fToday = sumOf("forecast_today_energy_sensors"), fTom = sumOf("forecast_tomorrow_energy_sensors"), fRest = sumOf("forecast_remaining_energy_sensors");
    if (fToday != null) tiles.push([`${num(fToday)} kWh`, this._t("fcToday")]);
    if (fTom != null) tiles.push([`${num(fTom)} kWh`, this._t("fcTomorrow")]);
    if (fRest != null) tiles.push([`${num(fRest)} kWh`, this._t("fcRemaining")]);
    const soFar = actual.get(todayKey);
    if (fToday != null && soFar > 0) {
      tiles.push([`${num(soFar)} kWh`, this._t("fcSoFar")]);
      if (fToday > 0) tiles.push([`${num((soFar / fToday) * 100, 0)} %`, this._t("fcReached")]);
    }

    // best 3-hour window from the typical daily curve (average share of every hour over the last full days) and the forecast
    const byDayH = new Map();
    for (const id of P.prod) for (const r of (pw || {})[id] || []) {
      if (r.mean == null) continue;
      const k = key(r.start);
      if (!byDayH.has(k.day)) byDayH.set(k.day, Array(24).fill(0));
      byDayH.get(k.day)[k.hour] += Math.max(r.mean, 0);
    }
    const share = Array(24).fill(0);
    let profDays = 0;
    for (const [day, hours] of byDayH) {
      const tot = hours.reduce((a, v) => a + v, 0);
      if (day === todayKey || !(tot > 0)) continue;
      hours.forEach((v, h) => { share[h] += v / tot; });
      profDays++;
    }
    let notePart = "";
    if (profDays >= 3) {
      share.forEach((v, h) => { share[h] = v / profDays; });
      const window = (from, kwh) => {
        const room = share.slice(from).reduce((a, v) => a + v, 0);
        if (!(kwh > 0) || !(room > 0) || from > 21) return null;
        let best = -1, at = from;
        for (let h = from; h <= 21; h++) { const w = share[h] + share[h + 1] + share[h + 2]; if (w > best) { best = w; at = h; } }
        return { from: at, to: at + 3, kwh: (kwh * best) / room };
      };
      const show = (w, label) => { if (w) tiles.push([this._t("fcBestVal").replace("{from}", String(w.from)).replace("{to}", String(w.to)).replace("{kwh}", num(w.kwh)), label]); };
      const wTom = window(0, fTom);
      show(wTom, this._t("fcBestTom"));
      // expected production tomorrow per hour; the best window is highlighted
      const hoursOn = share.map((v, h) => [v, h]).filter(([v]) => v > 0.003).map(([, h]) => h);
      const dayBox = root.getElementById("fcdaybox");
      dayBox.hidden = !(wTom && hoursOn.length);
      if (!dayBox.hidden) {
        const inWin = (h) => h >= wTom.from && h < wTom.to;
        categoryBarChart(root.getElementById("fcday"), {
          categories: hoursOn.map((h) => `${String(h).padStart(2, "0")}`), stacked: true,
          series: [{ name: this._t("fcWindow"), color: "--pva-prod", values: hoursOn.map((h) => (inWin(h) ? fTom * share[h] : null)) },
                   { name: this._t("fcOtherHours"), color: "--pva-avg", values: hoursOn.map((h) => (inWin(h) ? null : fTom * share[h])) }],
          fmtValue: (v, axis) => `${num(v, axis ? 1 : 2)}${axis ? "" : " kWh"}`, empty: this._t("noData"), tableLabels: { summary: this._t("table"), time: this._t("time") }, label: this._t("fcHourChart"),
        });
      }
      show(window(key(Date.now()).hour + 1, fRest), this._t("fcBestRest"));
      if (tiles.some(([, l]) => l === this._t("fcBestTom") || l === this._t("fcBestRest"))) notePart = this._t("fcBestNote");
    }
    if (profDays < 3) root.getElementById("fcdaybox").hidden = true;
    // the forecast history is as long as its sources reach: say where it starts when the chosen range asks for more
    const firstDay = Object.keys(log).sort()[0];
    if (firstDay && firstDay > startDay) notePart = [notePart, this._t("fcHorizon").replace("{date}", `${firstDay.slice(8, 10)}.${firstDay.slice(5, 7)}.${firstDay.slice(0, 4)}`)].filter(Boolean).join(" ");
    root.getElementById("fcnote").textContent = notePart;

    const tl = { summary: this._t("table"), time: this._t("time") };
    const fv = (v, axis) => `${num(v, axis ? 1 : 2)}${axis ? "" : " kWh"}`;
    const fcBox = root.getElementById("fcchart"), fdBox = root.getElementById("fcdev");
    root.querySelectorAll("#fcs .chart").forEach((c) => c.classList.remove("loading")); // all of them: the hour chart and the quality chart are hidden or drawn conditionally
    if (!fcDays.length) {
      root.getElementById("fcbbox").hidden = true;
      for (const b of [fcBox, fdBox]) b.innerHTML = `<p class="empty">${esc(this._t(list(this._cfg.forecast_today_energy_sensors).length ? "anaNoForecastYet" : "anaNoForecast"))}</p>`;
    } else {
      const fc = fcDays.map((day) => log[day]), ist = fcDays.map((day) => actual.get(day));
      const dev = fcDays.map((day, i) => ((ist[i] - fc[i]) / fc[i]) * 100);
      // up to 90 days one bar group per day, beyond that per month (sums), otherwise it is unreadable
      let cats = fcDays.map(dayLabel), fcBars = fc, istBars = ist, devBars = dev;
      if (fcDays.length > 90) {
        const groups = new Map();
        fcDays.forEach((day, i) => { const k = day.slice(0, 7); const g = groups.get(k) || [0, 0]; g[0] += fc[i]; g[1] += ist[i]; groups.set(k, g); });
        const monthFmt = new Intl.DateTimeFormat(lang, fcDays[0].slice(0, 4) === fcDays.at(-1).slice(0, 4) ? { month: "short" } : { month: "short", year: "2-digit" });
        cats = [...groups.keys()].map((k) => monthFmt.format(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 15)));
        fcBars = [...groups.values()].map((g) => g[0]);
        istBars = [...groups.values()].map((g) => g[1]);
        devBars = [...groups.values()].map((g) => ((g[1] - g[0]) / g[0]) * 100);
      }
      root.getElementById("fchead").textContent = this._t(fcDays.length > 90 ? "anaForecastMonth" : "anaForecast");
      categoryBarChart(fcBox, {
        categories: cats,
        series: [{ name: this._t("fcForecast"), color: "--pva-s1", values: fcBars }, { name: this._t("fcActual"), color: "--pva-prod", values: istBars }],
        fmtValue: fv, empty: this._t("noData"), tableLabels: tl, label: this._t("anaForecast"),
      });
      categoryBarChart(fdBox, {
        categories: cats,
        series: [{ name: this._t("anaForecastDev"), color: "--pva-pos", colorOf: (v) => (v >= 0 ? "--pva-pos" : "--pva-neg"), values: devBars }],
        legendItems: [{ name: this._t("aboveFc"), color: "--pva-pos" }, { name: this._t("belowFc"), color: "--pva-neg" }],
        fmtValue: (v, axis) => `${v > 0 ? "+" : ""}${num(v, axis ? 0 : 1)} %`, empty: this._t("noData"), tableLabels: tl, label: this._t("anaForecastDev"),
      });
      const mean = dev.reduce((a, v) => a + v, 0) / dev.length;
      const hit = (dev.filter((v) => Math.abs(v) <= 20).length / dev.length) * 100;
      tiles.push([`${mean > 0 ? "+" : ""}${num(mean)} %`, this._t("fcAvgDev")], [`${num(hit, 0)} %`, this._t("fcHit")], [String(fcDays.length), this._t("fcDays")]);
      // forecast quality by size of the forecast: weak, medium and strong forecast days in three equal groups
      const bbox = root.getElementById("fcbbox");
      bbox.hidden = fcDays.length < 9;
      if (!bbox.hidden) {
        const order = fcDays.map((_, i) => i).sort((a, b) => fc[a] - fc[b]);
        const size = Math.floor(order.length / 3);
        const groups = [order.slice(0, size), order.slice(size, order.length - size), order.slice(order.length - size)];
        const rowsHtml = groups.map((g, gi) => {
          const avgFc = g.reduce((a, i) => a + fc[i], 0) / g.length, avgDev = g.reduce((a, i) => a + dev[i], 0) / g.length;
          return `<tr><td>${esc(this._t(["fcBLow", "fcBMid", "fcBHigh"][gi]))}</td><td>${g.length}</td><td>${esc(num(avgFc))}</td><td>${esc(`${avgDev > 0 ? "+" : ""}${num(avgDev)} %`)}</td></tr>`;
        }).join("");
        root.getElementById("fcbuckets").classList.remove("loading");
        categoryBarChart(root.getElementById("fcbchart"), {
          categories: groups.map((_, gi) => this._t(["fcBLow", "fcBMid", "fcBHigh"][gi])),
          series: [{ name: this._t("fcBDev"), color: "--pva-pos", colorOf: (v) => (v >= 0 ? "--pva-pos" : "--pva-neg"), values: groups.map((g) => g.reduce((a, i) => a + dev[i], 0) / g.length) }],
          legendItems: [{ name: this._t("aboveFc"), color: "--pva-pos" }, { name: this._t("belowFc"), color: "--pva-neg" }],
          fmtValue: (v, axis) => `${v > 0 ? "+" : ""}${num(v, axis ? 0 : 1)} %`, empty: this._t("noData"), tableLabels: tl, label: this._t("fcBChart"),
        });
        root.getElementById("fcbuckets").innerHTML = `<table class="dtable"><thead><tr><th></th><th>${esc(this._t("fcBDays"))}</th><th>${esc(this._t("fcBAvg"))}</th><th>${esc(this._t("fcBDev"))}</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
      }
    }
    root.getElementById("ftiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
  }
}
