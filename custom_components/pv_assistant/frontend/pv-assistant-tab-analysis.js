// Analysis tab.
// Part of the panel class: the methods are added to the PVAssistantPanel prototype by pv-assistant-panel.js (so `this` is the
// panel). Shared helpers are handed over by init(ctx) because the modules are loaded with the ?v=<version> of the panel.

let esc, mergedRows, groupsOf, invertersOf, plantsOf, parsePeriod, MAX_ALL_YEARS, localKeyFn, median, plateauDays, heatmap, orientationFactor, expectedYield, suddenDrops, sunPosition, estimateClipped, shadingDips;
export function init(ctx) {
  ({ esc, mergedRows, groupsOf, invertersOf, plantsOf, parsePeriod, MAX_ALL_YEARS, localKeyFn, median, plateauDays, heatmap, orientationFactor, expectedYield, suddenDrops, sunPosition, estimateClipped, shadingDips } = ctx);
}

export class AnalysisPart {
  _buildAnalysis() {
    const box = this._root.getElementById("ana");
    const { P } = this._keys();
    box.replaceChildren();
    if (!P.prod.length) return;
    if (!this._adays) this._adays = 30;
    box.innerHTML = `<div class="filters" id="aranges"></div><ul class="hints" id="ahints"></ul><div class="tiles" id="atiles"></div>
      <h3 class="ch">${esc(this._t("anaStrings"))}</h3><div class="chart" id="astrings"></div>

      <h3 class="ch" id="aheath">${esc(this._t("anaHeat"))}</h3><div class="chart" id="aheat"></div>
      <h3 class="ch">${esc(this._t("anaDays"))}</h3><div class="two" id="adays"></div>`;
    const ranges = box.querySelector("#aranges");
    this._picker(ranges, () => this._adays, (v) => { this._adays = v; this._loadAnalysis(); });
  }

  async _loadAnalysis() {
    if (!this._hass || !this._root.getElementById("astrings")) return;
    const token = (this._atoken = (this._atoken || 0) + 1);
    const { P, E, G } = this._keys();
    const filt = this._cfg.filtered || {};
    const { start, end, capped } = this._window(this._adays);
    const call = async (ids, from, period, type, units) => {
      ids = [...new Set(ids)];
      if (!ids.length) return {};
      try {
        return await this._hass.callWS({ type: "recorder/statistics_during_period", start_time: from.toISOString(), end_time: end.toISOString(), statistic_ids: ids, period, types: [type], units });
      } catch (e) { return {}; }
    };
    this._root.querySelectorAll("#ana .chart").forEach((c) => c.classList.add("loading"));
    const eids = E.prod.concat(E.prod.map((i) => filt[i]).filter(Boolean));
    const [pres, eres] = await Promise.all([
      call([...P.prod, ...G.irr], start, "hour", "mean", { power: "W" }),
      call(eids, start, "day", "change", { energy: "kWh" }),
    ]);
    if (token !== this._atoken) return;
    this._adata = { pres, eres, start, capped };
    this._drawAnalysis();
  }

  // Forecast of past days from the long-term statistics of the "forecast today" sensors (daily value: the last value of the day for a
  // counter, otherwise the maximum or mean); a day only counts when every sensor has a value. Sensors without a state class have none.
  _forecastFromStats(ids, res) {
    if (!ids.length) return {};
    const key = localKeyFn(this._hass.config?.time_zone);
    const perId = ids.map((id) => {
      const m = new Map();
      for (const r of (res || {})[id] || []) {
        const v = r.state ?? r.max ?? r.mean;
        if (v != null && !Number.isNaN(Number(v))) m.set(key(r.start).day, Number(v));
      }
      return m;
    });
    const out = {};
    for (const day of perId[0].keys()) {
      if (!perId.every((m) => m.has(day))) continue;
      const total = perId.reduce((a, m) => a + m.get(day), 0);
      if (total > 0) out[day] = Math.round(total * 100) / 100;
    }
    return out;
  }

  // Forecast of past days from the recorder history of the "forecast today" sensors (last value of each day);
  // makes the comparison available right after setup. The log kept by the integration takes precedence.
  async _forecastFromHistory(ids) {
    const tz = this._hass.config?.time_zone;
    const key = localKeyFn(tz);
    const start = new Date(); start.setDate(start.getDate() - 60); start.setHours(0, 0, 0, 0); // as far back as the recorder keeps states (purge_keep_days)
    let res;
    try {
      res = await this._hass.callWS({ type: "history/history_during_period", start_time: start.toISOString(), end_time: new Date().toISOString(),
        entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false });
    } catch (e) { return {}; }
    const days = [];
    for (let t = start.getTime() + 12 * 3600e3; t < Date.now(); t += 24 * 3600e3) days.push(key(t).day);
    const today = key(Date.now()).day;
    const perId = ids.map((id) => {
      const unit = this._hass.states[id]?.attributes?.unit_of_measurement;
      const f = { Wh: 0.001, MWh: 1000 }[unit] ?? 1;
      const last = new Map();
      for (const r of res?.[id] || []) {
        const v = parseFloat(r.s), ts = (r.lu ?? r.lc ?? 0) * 1000;
        if (!isNaN(v) && ts) last.set(key(ts).day, v * f);
      }
      let carry = null;
      const out = new Map();
      for (const day of days) { if (last.has(day)) carry = last.get(day); if (carry != null) out.set(day, carry); }
      return out;
    });
    const log = {};
    for (const day of days) {
      if (day === today || !perId.every((m) => m.has(day))) continue;
      const total = perId.reduce((a, m) => a + m.get(day), 0);
      if (total > 0) log[day] = Math.round(total * 100) / 100;
    }
    return log;
  }

  // Hourly mean power per power sensor and per plant (inverter with its sensors; a sensor without an inverter is a plant of its own).
  // pres: statistics result of the power sensors. Returns { sensors, series }: series are the plants with m (Map hour start -> W,
  // only hours in which every sensor of the plant has data), peak (null if a sensor has no peak), kwh, max_w, groups and members.
  _buildPlantSeries(pres) {
    const { P } = this._keys();
    const strs = this._cfg.settings?.strings || {};
    const peakOf = (id) => { const v = strs[id]?.peak; return v > 0 ? v : null; };
    const sensors = P.prod.map((id) => {
      const m = new Map();
      for (const r of pres[id] || []) if (r.mean != null) m.set(r.start, Math.max(r.mean, 0));
      return { id, name: this._read(id).name, peak: peakOf(id), m, groups: groupsOf(strs[id]) };
    });
    for (const s of sensors) s.kwh = [...s.m.values()].reduce((a, v) => a + v, 0) / 1000;
    const series = plantsOf(this._cfg.settings, P.prod).map((p) => {
      const members = p.sensors.map((id) => sensors.find((s) => s.id === id)).filter(Boolean);
      const m = new Map();
      for (const ts of members[0].m.keys()) if (members.every((s) => s.m.has(ts))) m.set(ts, members.reduce((a, s) => a + s.m.get(ts), 0));
      return {
        id: `plant:${p.sensors.join("+")}`, members, m, max_w: p.max_w || 0,
        name: p.name || (members.length === 1 ? members[0].name : members.map((s) => s.name).join(" + ")),
        peak: members.every((s) => s.peak) ? members.reduce((a, s) => a + s.peak, 0) : null,
        kwh: members.reduce((a, s) => a + s.kwh, 0),
        groups: members.flatMap((s) => s.groups),
      };
    }).filter((s) => s.members.length);
    return { sensors, series };
  }

  // Yield per plant and month in kWh/kWp for the plants that have a peak. The running month and a first month that starts inside
  // the range are incomplete and left out. Returns { plants, months: ["YYYY-MM"], val(i, month) -> kWh/kWp | null }.
  _monthlyYield(series, start, key, todayKey) {
    const plants = series.filter((s) => s.peak);
    const skip = new Set([todayKey.slice(0, 7)]);
    const startDay = key(start.getTime()).day;
    if (startDay.slice(8, 10) !== "01") skip.add(startDay.slice(0, 7));
    const perPlant = plants.map((s) => {
      const mm = new Map(); // Wh per month
      for (const [ts, w] of s.m) { const k = key(ts).day.slice(0, 7); mm.set(k, (mm.get(k) || 0) + w); }
      return mm;
    });
    const months = [...new Set(perPlant.flatMap((mm) => [...mm.keys()]))].filter((k) => !skip.has(k)).sort();
    return { plants, months, val: (i, k) => (perPlant[i].has(k) ? perPlant[i].get(k) / plants[i].peak : null) }; // Wh / W = kWh/kWp
  }

  _drawAnalysis() {
    const d = this._adata;
    if (!d || !this._root.getElementById("astrings")) return;
    const { P, E, G } = this._keys();
    const { pres, eres, start } = d;
    const filt = this._cfg.filtered || {};
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const key = localKeyFn(tz);
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const root = this._root;
    const dayLabel = (day) => `${day.slice(8, 10)}.${day.slice(5, 7)}.`;
    const dayLabelY = (day) => `${day.slice(8, 10)}.${day.slice(5, 7)}.${day.slice(0, 4)}`; // with year where a range can span years
    const todayKey = key(Date.now()).day;

    // daily production from the energy statistics (counters; the filtered copy wins)
    const actual = new Map();
    for (const id of E.prod) {
      const rows = mergedRows(eres, id, filt, "change");
      for (const r of rows) if (r.change != null) { const day = key(r.start).day; actual.set(day, (actual.get(day) || 0) + r.change); }
    }

    const { sensors, series } = this._buildPlantSeries(pres);
    const strs = this._cfg.settings?.strings || {};

    // plant location: own value from the settings, otherwise the Home Assistant home location
    const genSet = this._cfg.settings?.general || {};
    const lat = genSet.latitude || this._hass.config?.latitude, lon = genSet.longitude || this._hass.config?.longitude;
    const located = typeof lat === "number" && typeof lon === "number";
    const hints = [];
    const infoSet = new Set(); // hints shown as plain information (not as a warning)
    // Compares units (plants, or the sensors inside one plant) by kWh/kWp, corrected for the orientation of their module strings.
    // Adds the hints for units that fall behind; plantLevel only selects the wording.
    const compareUnits = (units, plantLevel) => {
      const peaked = units.filter((s) => s.peak);
      const weak = new Set();
      // like-for-like: only hours in which every unit with a peak has data
      let common = null;
      if (peaked.length) {
        common = [...peaked[0].m.keys()].filter((ts) => peaked.every((s) => s.m.has(ts)));
        for (const s of peaked) s.spec = common.reduce((a, ts) => a + s.m.get(ts), 0) / 1000 / (s.peak / 1000);
      }
      // expected yield of the orientation (azimuth / tilt of the module strings); units without it count as 1
      const refYield = located && common ? expectedYield(common, lat, lon, 0, 35) : 0;
      for (const s of peaked) {
        const gs = s.groups.filter((g) => g.azimuth != null && g.tilt != null);
        const factorOf = (az, tl) => (refYield > 0 ? expectedYield(common, lat, lon, az, tl) / refYield : orientationFactor(az, tl));
        // weighted mix of the module strings (by module count; equal weights if a count is missing)
        const weights = gs.every((g) => g.modules > 0) ? gs.map((g) => g.modules) : gs.map(() => 1);
        const wsum = weights.reduce((x, y) => x + y, 0);
        // with the location: clear-sky irradiance on the plane over exactly the hours compared (follows the season of the range); without it: rough annual table
        s.factor = gs.length ? gs.reduce((acc, g, i) => acc + weights[i] * factorOf(g.azimuth, g.tilt), 0) / wsum : null;
        s.eff = s.spec / (s.factor || 1);
      }
      const usesOrient = peaked.some((s) => s.factor);
      if (peaked.length >= 2 && common.length >= 24) {
        const med = median(peaked.map((s) => s.eff));
        for (const s of peaked) if (med > 0 && s.eff < med * 0.85) {
          weak.add(s.id);
          const top = peaked.reduce((a, x) => (x.eff > a.eff ? x : a), peaked[0]);
          hints.push(this._t(plantLevel ? "anaWeakPlantHint" : "anaWeakHint").replace(/\{name\}/g, s.name).replace("{rel}", String(Math.round((s.eff / top.eff) * 100))).replace("{best}", top.name)
            .replace("{own}", num(s.spec)).replace("{top}", num(top.spec)).replace("{med}", num(median(peaked.map((x) => x.spec))))
            + (usesOrient ? ` ${this._t("anaOrientUsed")}` : ""));
          // improvement suggestion from the time of day in which the unit falls behind
          // sector of the sun (east / south / west) with the location, otherwise the time of day
          const part = (ts) => {
            if (located) { const { el, az } = sunPosition(ts + 1800e3, lat, lon); return el < 3 ? -1 : az < -20 ? 0 : az <= 20 ? 1 : 2; }
            const h = key(ts).hour; return h <= 10 ? 0 : h <= 14 ? 1 : 2;
          };
          const sums = [[0, 0], [0, 0], [0, 0]];
          for (const ts of common) {
            const k = part(ts);
            if (k < 0) continue;
            sums[k][0] += s.m.get(ts) / s.peak / (s.factor || 1);
            sums[k][1] += top.m.get(ts) / top.peak / (top.factor || 1);
          }
          const all = sums.reduce((x, [u]) => x + u, 0) / (sums.reduce((x, [, v]) => x + v, 0) || 1);
          const ratios = sums.map(([u, v]) => (v > 0 ? u / v : null));
          const low = ratios.findIndex((r) => r != null && r < all * 0.85);
          let advice = this._t(low >= 0 ? ["anaAdvMorning", "anaAdvMidday", "anaAdvEvening"][low] : "anaAdvFlat");
          if (!s.factor) advice += ` ${this._t("anaAdvOrient")}`;
          const text = `${this._t("anaAdvPrefix").replace("{name}", s.name)} ${advice}`;
          hints.push(text);
          infoSet.add(text);
        }
      }
      return { peaked, common, weak, usesOrient };
    };
    const { peaked, common, weak } = compareUnits(series, true);
    // inside a plant with several sensors the sensors are compared with each other (e.g. the two strings of one inverter)
    for (const p of series) if (p.members.length > 1) compareUnits(p.members, false);
    // orientation potential: a plant whose module strings face away from the optimum (south, about 35 degrees) expects less than the best case
    for (const s of peaked) {
      if (s.factor && s.factor < 0.93) {
        const text = this._t("anaOrientPotential").replace("{name}", s.name).replace("{pct}", String(Math.round(s.factor * 100))).replace("{gain}", num((1 / s.factor - 1) * 100, 0));
        hints.push(text);
        infoSet.add(text);
      }
    }

    // string cards
    const sorted = [...series].sort((a, b) => (b.eff ?? -1) - (a.eff ?? -1) || b.kwh - a.kwh);
    const bestSpec = Math.max(0, ...peaked.map((s) => s.eff));
    const box = root.getElementById("astrings");
    box.classList.remove("loading");
    const rowHtml = (s, best, cls) => {
      const w = s.eff && best ? (s.eff / best) * 100 : 0;
      const sub = s.spec != null
        ? `${esc(num(s.spec))} ${esc(this._t("anaSpec"))} · ${esc(String(Math.round(w)))} % ${esc(this._t("anaRel"))}${s.factor ? ` · ${esc(this._t("anaFactor").replace("{pct}", String(Math.round(s.factor * 100))))}` : ""}${weak.has(s.id) ? ` · <span class="weak">${esc(this._t("anaWeak"))}</span>` : ""}`
        : `<span class="muted">–</span>`;
      return `<div class="strow${cls}"><div><div>${esc(s.name)}</div><div class="muted" style="font-size:.85em">${sub}</div></div>
        <div class="gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(w)}"><i style="width:${w.toFixed(1)}%"></i></div>
        <div><b>${esc(num(s.kwh))} kWh</b></div></div>`;
    };
    // a plant with several sensors lists its strings (MPPT inputs) below it, each compared with the best of the plant
    const memberRows = (p) => {
      if (p.members.length < 2) return "";
      const list = [...p.members].sort((a, b) => (b.eff ?? -1) - (a.eff ?? -1) || b.kwh - a.kwh);
      const best = Math.max(0, ...list.filter((m) => m.peak).map((m) => m.eff ?? 0));
      return list.map((m) => rowHtml(m, best, " sub")).join("");
    };
    box.innerHTML = sorted.map((s) => rowHtml(s, bestSpec, "") + memberRows(s)).join("") + (peaked.length ? (peaked.some((s) => !s.factor) && peaked.length >= 2 ? `<p class="note">${esc(this._t("anaNoOrient"))}</p>` : "") : `<p class="note">${esc(this._t("anaNoPeak"))}</p>`);

    // plant totals per local day and hour
    const total = new Map();
    for (const s of sensors) for (const [ts, v] of s.m) total.set(ts, (total.get(ts) || 0) + v);
    const byDay = new Map();
    for (const [ts, w] of total) {
      const k = key(ts);
      if (!byDay.has(k.day)) byDay.set(k.day, Array(24).fill(0));
      byDay.get(k.day)[k.hour] += w;
    }
    const days = [...byDay.keys()].sort();
    // up to 90 days one row per day; longer ranges one row per week (average per day) so that the year stays readable
    let heatDays;
    if (days.length <= 90) {
      heatDays = days.map((day) => ({ label: dayLabel(day), cells: byDay.get(day).map((w) => w / 1000) }));
    } else {
      heatDays = [];
      for (let i = 0; i < days.length; i += 7) {
        const block = days.slice(i, i + 7);
        heatDays.push({ label: dayLabel(block[0]), cells: Array.from({ length: 24 }, (_, h) => block.reduce((a, day) => a + byDay.get(day)[h], 0) / 1000 / block.length) });
      }
    }
    heatmap(root.getElementById("aheat"), {
      days: heatDays, colorVar: "--pva-prod", fmt: (v) => `${num(v, 2)} kWh`, hourLabel: (h) => `${String(h).padStart(2, "0")}:00`,
      empty: this._t("noData"), label: days.length > 90 ? `${this._t("anaHeat")} – ${this._t("anaHeatWeek")}` : this._t("anaHeat"),
    });
    root.getElementById("aheath").textContent = days.length > 90 ? `${this._t("anaHeat")} – ${this._t("anaHeatWeek")}` : this._t("anaHeat");
    root.getElementById("aheat").classList.remove("loading");

    // best / weakest complete days
    const sumPeak = series.every((s) => s.peak) && series.length ? series.reduce((a, s) => a + s.peak, 0) : null;
    // daily yields from the energy counters (same basis as the total); the power sum is the fallback
    const startDayKey = key(start.getTime()).day;
    const fromCounters = [...actual].filter(([day]) => day >= startDayKey && day !== todayKey).map(([day, kwh]) => ({ day, kwh })).filter((x) => x.kwh >= 0.1);
    const complete = fromCounters.length ? fromCounters : days.filter((day) => day !== todayKey).map((day) => ({ day, kwh: byDay.get(day).reduce((a, w) => a + w, 0) / 1000 })).filter((x) => x.kwh >= 0.1); // days that show as 0 kWh (outage, no data) are left out
    const rows = (list) => `<table class="dtable"><thead><tr><th>${esc(this._t("anaDay"))}</th><th>kWh</th>${sumPeak ? `<th>${esc(this._t("anaSpec"))}</th>` : ""}</tr></thead><tbody>${
      list.map((x) => `<tr><td>${esc(dayLabelY(x.day))}</td><td>${esc(num(x.kwh))}</td>${sumPeak ? `<td>${esc(num(x.kwh / (sumPeak / 1000), 2))}</td>` : ""}</tr>`).join("")}</tbody></table>`;
    const bySize = [...complete].sort((a, b) => b.kwh - a.kwh);
    root.getElementById("adays").innerHTML = complete.length
      ? `<div class="chart"><h3 class="ch" style="margin-top:0">${esc(this._t("anaBest"))}</h3>${rows(bySize.slice(0, 5))}</div><div class="chart"><h3 class="ch" style="margin-top:0">${esc(this._t("anaWorst"))}</h3>${rows(bySize.slice(-5).reverse())}</div>`
      : `<p class="empty">${esc(this._t("noData"))}</p>`;

    // plateau days
    if (sumPeak) {
      const flat = plateauDays(byDay, sumPeak).filter((day) => day !== todayKey);
      if (flat.length >= 3) hints.push(this._t("anaPlateauHint").replace("{n}", String(flat.length)));
    }
    // inverter per string: clipping at its limit and oversizing; several MPPTs vs. two orientations
    const overbuildText = (name, peak, inv) => {
      const ratio = Math.round((peak / inv) * 100);
      return this._t("anaOverbuild").replace("{name}", name).replace("{peak}", this._fmt(peak)).replace("{pct}", String(ratio)).replace("{inv}", this._fmt(inv))
        + (ratio >= 130 ? this._t("anaOverbuildHigh") : ratio <= 100 ? this._t("anaOverbuildLow") : "");
    };
    const invs = invertersOf(this._cfg.settings, sensors.map((x) => x.id));
    for (const inv of invs) {
      const members = sensors.filter((x) => inv.sensors.includes(x.id));
      if (!members.length || !(inv.max_w > 0)) continue;
      const invName = inv.name || members.map((x) => x.name).join(" + ");
      // clipping: the plant power of the inverter stays at its limit for hours
      const own = new Map();
      for (const m of members) for (const [ts, w] of m.m) {
        const k = key(ts);
        if (!own.has(k.day)) own.set(k.day, Array(24).fill(0));
        own.get(k.day)[k.hour] += w;
      }
      const limited = plateauDays(own, inv.max_w, 0.9).filter((day) => day !== todayKey);
      if (limited.length >= 3) hints.push(this._t("anaInvLimitHint").replace("{name}", invName).replace("{n}", String(limited.length)).replace("{inv}", this._fmt(inv.max_w)));
      const peak = members.reduce((acc, m) => acc + (strs[m.id]?.peak > 0 ? strs[m.id].peak : 0), 0);
      if (peak > 0) { const text = overbuildText(invName, peak, inv.max_w); hints.push(text); infoSet.add(text); }
    }
    for (const s of sensors) {
      const o = strs[s.id] || {};
      const inInv = invs.find((i) => i.sensors.includes(s.id));
      // an inverter with several sensors: every sensor is one MPPT input; module strings with different orientations on the same MPPT share one operating point
      const nMppt = o.mppts > 0 ? o.mppts : inInv && inInv.sensors.length > 1 ? 1 : 0;
      const byMppt = new Map();
      for (const g of groupsOf(o)) {
        const m = g.mppt > 0 ? g.mppt : nMppt === 1 ? 1 : null;
        if (m == null || g.azimuth == null) continue;
        if (!byMppt.has(m)) byMppt.set(m, []);
        byMppt.get(m).push(g);
      }
      for (const [m, list] of byMppt) {
        if (list.length > 1 && list.some((g) => Math.abs(g.azimuth - list[0].azimuth) > 15 || Math.abs((g.tilt ?? 0) - (list[0].tilt ?? 0)) > 10)) {
          const text = this._t("anaMpptMismatch").replace("{name}", s.name).replace("{mppt}", String(m));
          hints.push(text);
          infoSet.add(text);
        }
      }
    }
    // legacy plant-wide inverter value (older versions) when no string has its own
    const legacyInv = this._cfg.settings?.general?.inverter_max_w || 0;
    if (legacyInv > 0 && sumPeak && !invs.length) {
      const text = overbuildText(this._t("anaPlant"), sumPeak, legacyInv);
      hints.push(text);
      infoSet.add(text);
    }

    // energy lost at the inverter limit and possible shading per plant (both need the plant location)
    let curtailKwh = 0;
    const compassOf = (az) => this._t("compass")[((Math.round(az / 45) % 8) + 8) % 8];
    if (located) {
      for (const s of series) {
        const gs = s.groups.filter((g) => g.azimuth != null && g.tilt != null);
        if (s.max_w > 0) {
          // without orientation a south-facing plane at 30 degrees stands in; only the daily shape matters for the estimate
          const est = estimateClipped(s.m, s.max_w, gs.length ? gs : [{ azimuth: 0, tilt: 30 }], lat, lon, key);
          if (est.days >= 3 && est.kwh >= 0.5) {
            curtailKwh += est.kwh;
            const text = this._t("anaCurtail").replace("{name}", s.name).replace("{kwh}", num(est.kwh)).replace("{pct}", num(s.kwh > 0 ? (est.kwh / s.kwh) * 100 : 0));
            hints.push(text);
            infoSet.add(text);
          }
        }
        if (gs.length) {
          for (const dip of shadingDips(s.m, s.max_w, gs, lat, lon, key)) {
            const text = this._t("anaShade").replace("{name}", s.name).replace("{from}", String(dip.from)).replace("{to}", String(dip.to + 1)).replace("{dir}", compassOf(dip.az));
            hints.push(text);
            infoSet.add(text);
          }
        }
      }
    }

    // yield per plant and month (chart on the Plants tab): a hint if a plant is clearly below the others in some months
    const pa = parsePeriod(this._adays, this._dataStart);
    const longRange = ["year", "y12", "all"].includes(pa.kind) || (pa.kind === "roll" && pa.days >= 90);
    const my = this._monthlyYield(series, start, key, todayKey);
    if (longRange && my.plants.length >= 2) {
      const sameYear = my.months.length && my.months[0].slice(0, 4) === my.months.at(-1).slice(0, 4);
      const monthFmt = new Intl.DateTimeFormat(lang, sameYear ? { month: "short" } : { month: "short", year: "2-digit" });
      const monthName = (k) => monthFmt.format(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 15));
      const weakMonths = my.plants.map(() => ({ months: [], worst: 100 }));
      for (const k of my.months) {
        const eff = my.plants.map((s, i) => { const v = my.val(i, k); return v == null ? null : v / (s.factor || 1); });
        const known = eff.filter((v) => v != null);
        if (known.length < 2) continue;
        const med = median(known);
        eff.forEach((v, i) => { if (v != null && med > 0 && v < med * 0.85) { weakMonths[i].months.push(monthName(k)); weakMonths[i].worst = Math.min(weakMonths[i].worst, (v / med) * 100); } });
      }
      weakMonths.forEach((w, i) => {
        if (w.months.length) hints.push(this._t("anaMonthWeak").replace("{name}", my.plants[i].name).replace("{months}", w.months.slice(0, 4).join(", ")).replace("{pct}", num(w.worst, 0)));
      });
    }

    // a sudden drop: a plant that delivers clearly less than usual compared with the others over the last days
    const perDay = series.filter((x) => x.peak).map((x) => {
      const kwh = new Map(), hours = new Map();
      for (const [ts, w] of x.m) { const day = key(ts).day; if (day !== todayKey) { kwh.set(day, (kwh.get(day) || 0) + w / 1000); hours.set(day, (hours.get(day) || 0) + 1); } }
      const spec = new Map();
      for (const [day, v] of kwh) if (hours.get(day) >= 20) spec.set(day, v / (x.peak / 1000));
      return { name: x.name, spec };
    });
    for (const drop of suddenDrops(perDay)) hints.push(this._t("anaDropHint").replace("{name}", drop.name).replace("{n}", String(drop.n)).replace("{pct}", num(drop.pct, 0)));

    if (d.capped) { const text = this._t("rangeCapped").replace("{n}", String(MAX_ALL_YEARS)); hints.push(text); infoSet.add(text); }

    // tiles: production, plant yield (kWh/kWp), best day, performance ratio
    const tiles = [];
    const powerTotal = sensors.reduce((a, s) => a + s.kwh, 0);
    // the total comes from the energy counters (same as the Energy dashboard); the power sum is the fallback
    const startDay = key(start.getTime()).day;
    const energyDays = [...actual].filter(([day]) => day >= startDay);
    const energyTotal = energyDays.reduce((a, [, v]) => a + v, 0);
    const prodTotal = energyTotal > 0 ? energyTotal : powerTotal;
    tiles.push([`${num(prodTotal)} kWh`, this._t("anaTotal")]);
    if (curtailKwh > 0) tiles.push([`${num(curtailKwh)} kWh`, this._t("anaCurtailTile")]);
    if (energyTotal > 0 && powerTotal > 0 && Math.abs(powerTotal - energyTotal) / energyTotal > 0.03) {
      hints.push(this._t("anaPowerDiff").replace("{p}", num(powerTotal, 0)).replace("{e}", num(energyTotal, 0)).replace("{d}", `${powerTotal > energyTotal ? "+" : ""}${num(((powerTotal - energyTotal) / energyTotal) * 100, 1)}`));
    }
    if (peaked.length && common.length) {
      const e = peaked.reduce((a, s) => a + common.reduce((b, ts) => b + s.m.get(ts), 0) / 1000, 0);
      const kwp = peaked.reduce((a, s) => a + s.peak, 0) / 1000;
      tiles.push([`${num(e / kwp, 2)} kWh/kWp`, this._t("anaPlant")]);
      const irrId = G.irr[0];
      if (irrId) {
        const irr = new Map((pres[irrId] || []).filter((r) => r.mean != null).map((r) => [r.start, Math.max(r.mean, 0)]));
        const both = common.filter((ts) => irr.has(ts));
        const h = both.reduce((a, ts) => a + irr.get(ts), 0) / 1000; // kWh/m2
        const eb = peaked.reduce((a, s) => a + both.reduce((b, ts) => b + s.m.get(ts), 0) / 1000, 0);
        if (h > 0.5 && eb > 0) {
          const pr = (eb / (h * kwp)) * 100;
          tiles.push([`${num(pr, 0)} %`, this._t("anaPr")]);
          const verdict = this._t(pr < 75 ? "anaPrLow" : pr > 85 ? "anaPrHigh" : "anaPrOk");
          const prText = this._t("anaPrHint").replace("{pr}", num(pr, 0)).replace("{verdict}", verdict);
          infoSet.add(prText);
          hints.push(prText);
        }
      }
    }
    if (bySize.length) tiles.push([`${num(bySize[0].kwh)} kWh · ${dayLabelY(bySize[0].day)}`, this._t("anaBestDay")]);
    if (bySize.length > 1) { const w = bySize[bySize.length - 1]; tiles.push([`${num(w.kwh)} kWh · ${dayLabelY(w.day)}`, this._t("anaWorstDay")]); }
    root.getElementById("atiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    root.getElementById("ahints").innerHTML = hints.map((h) => `<li${infoSet.has(h) ? ' class="info"' : ""}>${esc(h)}</li>`).join("");
  }
}
