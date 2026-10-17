import { lineChart, barChart, categoryBarChart } from "./pv-assistant-charts.js";
import { localKeyFn, median, plateauDays, heatmap } from "./pv-assistant-analysis.js";

const T = {
  de: {
    title: "PV Assistant", energy: "Energiesensoren (kWh)", power: "Leistungssensoren (W)",
    production: "Erzeugung", feed: "Einspeisung", sin: "In Speicher", sout: "Aus Speicher",
    comb: "Kombi-Speicher", total: "Summe", none: "Keine Sensoren konfiguriert.",
    fromStorage: "aus Speicher", intoStorage: "in Speicher", missing: "nicht verfügbar",
    posFrom: "positiv = aus Speicher", posInto: "positiv = in Speicher",
    now: "Aktuell", history: "Verlauf", powerChart: "Leistung", energyChart: "Energie",
    today: "Heute", yesterday: "Gestern", d7: "7 Tage", d30: "30 Tage",
    years: "Jahresübersicht", avgOver: "Schnitt über", yearsUnit: "Jahre", all: "alle", yearProd: "Erzeugung", sofar: "bisher",
    forecast: "Jahresprognose", avgMonth: "Ø Monat", monthly: "Erzeugung je Monat (kWh)", deviation: "Abweichung zum Schnitt (%)",
    avg: "Ø", above: "über Schnitt", below: "unter Schnitt", running: "laufender Monat",
    yearNote: "Der Schnitt je Monat nutzt nur echte, abgeschlossene Monate der letzten Jahre (Anzahl einstellbar) bis zum aktuellsten Jahr mit Daten, unabhängig vom angezeigten Jahr. Die Jahresprognose ist die Summe dieser Monatsschnitte. Der laufende Monat und künftige Monate zählen nicht mit. Nutzen und Amortisation rechnen mit den aktuellen Preisen (Ersparnis = nicht eingespeiste Erzeugung × Strompreis, plus Einspeiseerlös); der Trend der Jahressumme ist wetterabhängig.",
    prevYear: "Vorheriges Jahr", nextYear: "Nächstes Jahr",
    direct: "Direkt verbraucht", directShort: "Direkt",
    effChart: "Effektive Leistung (%)", effTotal: "Gesamtanlage", effNote: "Effektive Leistung = Leistung ÷ eingetragener Peak × 100, nur für Strings mit eingetragenem Peak (Einstellungen).",
    setNoPeakShort: "Peak in den Einstellungen eintragen für die %-Anzeige",
    setNoPeak: "Trage in den Einstellungen für die Strings die Max.-Leistung (Peak) ein, dann erscheint hier die effektive Leistung in %.", ofPeakSum: "von Σ Peak", peakCount: "Strings mit Peak",
    yearTotal: "Gesamterzeugung je Jahr (kWh)", yearDev: "Abweichung der Jahressumme zum Schnitt (%)", avgSame: "Ø (gleiche Monate)", devTile: "Abweichung",
    yearStar: "* nur Monate mit Daten (laufendes Jahr: abgeschlossene Monate); verglichen wird mit denselben Monaten im Schnitt.",
    gridImp: "Netzbezug", gridImpShort: "Netz", house: "Hausverbrauch", houseDerived: "Hausverbrauch (berechnet)", houseShort: "Haus",
    socChart: "Batterieladestand (%)", socName: "Ladestand", autarky: "Autarkie", selfShare: "Eigenverbrauchsquote", shift: "Verschiebepotenzial",
    storEff: "Speicher-Wirkungsgrad", cycles: "Speicher-Zyklen", saving: "Ersparnis (Eigenverbrauch)", revenue: "Einspeiseerlös", co2: "CO₂ vermieden",
    socRange: "Ladestand min–max", pr: "Performance Ratio",
    analysisTab: "Analyse", d90: "90 Tage", d365: "Jahr", anaHeatWeek: "Ø je Tag und Woche", anaStrings: "String-Vergleich", anaHeat: "Ertrag je Stunde (kWh)", anaDays: "Beste und schwächste Tage", anaForecast: "Prognose gegen Ist (kWh je Tag)", anaForecastDev: "Abweichung Ist zur Prognose (%)",
    anaYield: "Ertrag", anaSpec: "kWh/kWp", anaRel: "vom besten String", anaWeak: "schwächer", anaBest: "Beste Tage", anaWorst: "Schwächste Tage", anaDay: "Tag",
    anaPowerDiff: "Die Leistungssensoren ergeben summiert {p} kWh, die Energiezähler {e} kWh ({d} %). Gezeigt wird der Zähler; der String-Vergleich nutzt die Leistung. Abweichungen entstehen durch Aktualisierungsintervalle der Leistungssensoren und Ausfälle.",
    anaTotal: "Erzeugung", anaPlant: "Ertrag der Anlage", anaBestDay: "Bester Tag", anaWorstDay: "Schwächster Tag", anaPr: "Performance Ratio", anaNoPeak: "Trage in den Einstellungen für jeden String den Peak ein, dann werden die Strings nach kWh/kWp verglichen.",
    anaWeakHint: "{name} erzeugt pro installiertem kWp nur {rel} % des besten Strings ({best}): {own} gegen {top} kWh/kWp. Der typische String liegt bei {med} kWh/kWp. Mögliche Ursachen: Verschattung, Verschmutzung, andere Ausrichtung oder Neigung, falsch eingetragener Peak, Defekt.",
    anaPlateauHint: "An {n} Tagen bleibt die Leistung mehrere Stunden flach auf dem Höchstwert. Mögliche Begrenzung durch Wechselrichter oder Einspeisebegrenzung (nur ein Hinweis, keine Diagnose).",
    anaPrHint: "Performance Ratio {pr} % – {verdict} Sie vergleicht den Ertrag mit dem, was bei der gemessenen Einstrahlung theoretisch möglich wäre (typisch 75 bis 85 %).", anaPrLow: "das liegt unter dem typischen Bereich. Mögliche Ursachen: Verschattung, Verschmutzung, Wechselrichter-Begrenzung, zu hoch eingetragene Peaks oder ein ungenauer Einstrahlungssensor.", anaPrOk: "das liegt im typischen Bereich.", anaPrHigh: "das liegt über dem typischen Bereich (prüfe, ob die Peaks zu niedrig eingetragen sind).",
    anaNoForecastYet: "Noch keine abgeschlossenen Tage mit Prognose. Das Panel liest die Prognose der letzten Tage aus dem Verlauf der „Prognose heute“-Sensoren und merkt sie sich ab jetzt täglich; der Vergleich erscheint spätestens morgen. Prüfe, ob „Prognose heute“ in Schritt 3 gewählt ist (nicht nur „morgen“ oder „Rest heute“).",
    anaNoForecast: "Noch keine Prognose-Daten. Wähle im Config Flow (Schritt 3) Prognose-Sensoren; das Panel merkt sich die Prognose dann täglich.",
    yBenefit: "Nutzen", yBenefit12: "Nutzen (letzte 12 Monate)", yPaidPct: "Amortisiert zu", yPaidLeft: "Noch bis zur Amortisation", yYears: "Jahre", yTrend: "Trend der Jahressumme", yTrendUnit: "pro Jahr",
    aboveFc: "über Prognose", belowFc: "unter Prognose",
    fcAvgDev: "Ø Abweichung", fcHit: "Trefferquote (±20 %)", fcDays: "Tage mit Prognose", fcForecast: "Prognose", fcActual: "Ist", anaLoading: "Lade Analyse …",
    genTitle: "Anlage", genCap: "Speicherkapazität (kWh)", genPriceImport: "Strompreis Netzbezug (€/kWh)", genPriceFeed: "Einspeisevergütung (€/kWh)",
    genCost: "Anlagenkosten (€)", genCo2: "CO₂-Faktor des Strommix (g/kWh)",
    genHint: "Die Preise gelten nur, wenn im Config Flow kein Preis-Sensor gewählt wurde. Kapazität: für die Zyklen des Speichers. Kosten: für die Amortisation. CO₂-Faktor: Standard 380 g/kWh.",
    settingsTab: "Einstellungen", setStrings: "Strings", setIntro: "Eigene Namen ersetzen die Anzeigenamen aus Home Assistant überall im Panel. Die Max.-Leistung (Peak) ersetzt in „Leistung“ das gemessene Maximum.",
    setName: "Anzeigename", setPeak: "Max. Leistung / Peak (W)", setMeasured: "Gemessen", setTake: "übernehmen", setSave: "Speichern", setSaved: "Gespeichert.",
    setError: "Speichern fehlgeschlagen", setAdmin: "Nur Administratoren können Einstellungen ändern.", setPower: "Leistungssensor", setEnergy: "Energiesensor",
    setNone: "Keine Erzeugungssensoren konfiguriert.", setReset: "Zurücksetzen",
    negWarn: "Achtung: {names} liefert negative Werte und wird nur mit den positiven Werten gezählt. Meldet der Sensor das Laden bzw. Entladen als negative Werte, aktiviere im Schritt „Leistungssensoren“ die Option „In-/Aus-Speicher-Sensoren liefern negative Werte“. Sensoren mit beiden Vorzeichen (Laden und Entladen in einem) gehören in „Kombi-Speichersensoren“.",
    powerTab: "Leistung", ofMax: "von max.", pwrNote: "Maximum = die in den Einstellungen eingetragene Max.-Leistung (Peak) des Strings, sonst die höchste je gemessene Leistung (Langzeitstatistik, mindestens der aktuelle Wert).", noString: "Keine Erzeugungs-Leistungssensoren konfiguriert.",
    fcGroup: "Prognose (kWh)", fcToday: "Prognose heute", fcTomorrow: "Prognose morgen", fcRemaining: "Prognose Rest heute",
    fcReached: "Von Prognose erreicht", directShare: "Anteil an Erzeugung",
    storage: "Speicher", storageNet: "Speicher (+ Entladen / − Laden)", loading: "Lade …", noData: "Keine Daten im Zeitraum.",
    table: "Als Tabelle anzeigen", time: "Zeit", totals: "Summen im Zeitraum",
  },
  en: {
    title: "PV Assistant", energy: "Energy sensors (kWh)", power: "Power sensors (W)",
    production: "Production", feed: "Feed-in", sin: "Into storage", sout: "From storage",
    comb: "Combined storage", total: "Total", none: "No sensors configured.",
    fromStorage: "from storage", intoStorage: "into storage", missing: "unavailable",
    posFrom: "positive = from storage", posInto: "positive = into storage",
    now: "Now", history: "History", powerChart: "Power", energyChart: "Energy",
    today: "Today", yesterday: "Yesterday", d7: "7 days", d30: "30 days",
    years: "Yearly overview", avgOver: "Average over", yearsUnit: "years", all: "all", yearProd: "Production", sofar: "so far",
    forecast: "Year forecast", avgMonth: "Avg. month", monthly: "Production per month (kWh)", deviation: "Deviation from average (%)",
    avg: "Avg", above: "above average", below: "below average", running: "current month",
    yearNote: "The monthly average only uses real, completed months of the last years (number selectable) up to the latest year with data, independent of the displayed year. The year forecast is the sum of these monthly averages. The current and future months do not count. Benefit and payback use the current prices (savings = production not fed in × import price, plus feed-in revenue); the trend of the yearly total depends on the weather.",
    prevYear: "Previous year", nextYear: "Next year",
    direct: "Used directly", directShort: "Direct",
    effChart: "Effective power (%)", effTotal: "Whole system", effNote: "Effective power = power ÷ entered peak × 100, only for strings with an entered peak (settings).",
    setNoPeakShort: "Enter the peak in the settings for the % display",
    setNoPeak: "Enter the max. power (peak) of the strings in the settings and the effective power in % appears here.", ofPeakSum: "of Σ peak", peakCount: "strings with peak",
    yearTotal: "Total production per year (kWh)", yearDev: "Deviation of the yearly total from the average (%)", avgSame: "Avg. (same months)", devTile: "Deviation",
    yearStar: "* only months with data (current year: completed months); compared with the same months of the average.",
    gridImp: "Grid import", gridImpShort: "Grid", house: "House consumption", houseDerived: "House consumption (calculated)", houseShort: "House",
    socChart: "Battery level (%)", socName: "Level", autarky: "Autarky", selfShare: "Self-consumption rate", shift: "Shifting potential",
    storEff: "Storage efficiency", cycles: "Storage cycles", saving: "Savings (self-consumption)", revenue: "Feed-in revenue", co2: "CO₂ avoided",
    socRange: "Level min–max", pr: "Performance ratio",
    analysisTab: "Analysis", d90: "90 days", d365: "Year", anaHeatWeek: "avg per day and week", anaStrings: "String comparison", anaHeat: "Yield per hour (kWh)", anaDays: "Best and weakest days", anaForecast: "Forecast vs actual (kWh per day)", anaForecastDev: "Deviation of actual from forecast (%)",
    anaYield: "Yield", anaSpec: "kWh/kWp", anaRel: "of the best string", anaWeak: "weaker", anaBest: "Best days", anaWorst: "Weakest days", anaDay: "Day",
    anaPowerDiff: "The power sensors add up to {p} kWh, the energy counters to {e} kWh ({d} %). The counter is shown; the string comparison uses power. Differences come from the update intervals of the power sensors and outages.",
    anaTotal: "Production", anaPlant: "Plant yield", anaBestDay: "Best day", anaWorstDay: "Weakest day", anaPr: "Performance ratio", anaNoPeak: "Enter the peak of each string in the settings and the strings are compared by kWh/kWp.",
    anaWeakHint: "{name} produces only {rel} % per installed kWp of the best string ({best}): {own} vs {top} kWh/kWp. The typical string is at {med} kWh/kWp. Possible causes: shading, dirt, different orientation or tilt, wrong peak entered, defect.",
    anaPlateauHint: "On {n} days the power stays flat at its maximum for several hours. Possible limit by the inverter or a feed-in limit (only a hint, not a diagnosis).",
    anaPrHint: "Performance ratio {pr} % – {verdict} It compares the yield with what would be theoretically possible at the measured irradiance (typically 75 to 85 %).", anaPrLow: "that is below the typical range. Possible causes: shading, dirt, inverter limiting, peaks entered too high or an inaccurate irradiance sensor.", anaPrOk: "that is within the typical range.", anaPrHigh: "that is above the typical range (check whether the peaks are entered too low).",
    anaNoForecastYet: "No completed days with a forecast yet. The panel reads the forecast of the last days from the history of the \"forecast today\" sensors and remembers it daily from now on; the comparison appears tomorrow at the latest. Check that \"forecast today\" is selected in step 3 (not only \"tomorrow\" or \"remaining today\").",
    anaNoForecast: "No forecast data yet. Choose forecast sensors in the config flow (step 3); the panel then remembers the forecast every day.",
    yBenefit: "Benefit", yBenefit12: "Benefit (last 12 months)", yPaidPct: "Paid back", yPaidLeft: "Still until payback", yYears: "years", yTrend: "Trend of the yearly total", yTrendUnit: "per year",
    aboveFc: "above forecast", belowFc: "below forecast",
    fcAvgDev: "Avg. deviation", fcHit: "Hit rate (±20 %)", fcDays: "Days with forecast", fcForecast: "Forecast", fcActual: "Actual", anaLoading: "Loading analysis …",
    genTitle: "Plant", genCap: "Storage capacity (kWh)", genPriceImport: "Grid import price (€/kWh)", genPriceFeed: "Feed-in tariff (€/kWh)",
    genCost: "System cost (€)", genCo2: "CO₂ factor of the power mix (g/kWh)",
    genHint: "The prices only apply when no price sensor was chosen in the config flow. Capacity: for the storage cycles. Cost: for the payback. CO₂ factor: default 380 g/kWh.",
    settingsTab: "Settings", setStrings: "Strings", setIntro: "Custom names replace the Home Assistant display names everywhere in the panel. The max. power (peak) replaces the measured maximum in \"Power\".",
    setName: "Display name", setPeak: "Max. power / peak (W)", setMeasured: "Measured", setTake: "use", setSave: "Save", setSaved: "Saved.",
    setError: "Saving failed", setAdmin: "Only administrators can change settings.", setPower: "Power sensor", setEnergy: "Energy sensor",
    setNone: "No production sensors configured.", setReset: "Reset",
    negWarn: "Note: {names} reports negative values and only its positive values are counted. If the sensor reports charging or discharging as negative values, enable the option \"Storage in/out sensors report negative values\" in the power step. Sensors with both signs (charge and discharge in one) belong in the combined storage sensors.",
    powerTab: "Power", ofMax: "of max.", pwrNote: "Maximum = the max. power (peak) of the string entered in the settings, otherwise the highest power ever measured (long-term statistics, at least the current value).", noString: "No production power sensors configured.",
    fcGroup: "Forecast (kWh)", fcToday: "Forecast today", fcTomorrow: "Forecast tomorrow", fcRemaining: "Forecast rest of today",
    fcReached: "Of forecast reached", directShare: "Share of production",
    storage: "Storage", storageNet: "Storage (+ discharge / − charge)", loading: "Loading …", noData: "No data in this range.",
    table: "Show as table", time: "Time", totals: "Totals in range",
  },
};

// Config keys per sensor group (see const.py).
const GROUPS = [
  { id: "energy", base: "kWh", keys: {
      production: "production_energy_sensors", feed: "feed_in_energy_sensor",
      sin: "storage_in_energy_sensors", sout: "storage_out_energy_sensors",
      comb: "storage_combined_energy_sensors", inv: "invert_storage_combined" } },
  { id: "power", base: "W", keys: {
      production: "production_power_sensors", feed: "feed_in_power_sensor",
      sin: "storage_in_power_sensors", sout: "storage_out_power_sensors",
      comb: "storage_combined_power_sensors", inv: "invert_storage_combined_power" } },
];
// Unit -> factor to base unit (kWh or W).
const FACTOR = { Wh: 0.001, kWh: 1, MWh: 1000, W: 1, kW: 1000, MW: 1e6 };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);

class PVAssistantPanel extends HTMLElement {
  connectedCallback() {
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
          header { display:flex; align-items:center; gap:8px; height:56px; padding:0 12px; background:var(--g-bg); color:var(--g-text);
                   font-size:20px; font-weight:600; }
          nav { display:flex; gap:8px; overflow-x:auto; background:var(--g-bg); padding:0 16px 4px; max-width:1100px; margin:0 auto; box-sizing:border-box; }
          nav button { font:inherit; font-size:14px; font-weight:600; letter-spacing:.04em; color:var(--g-muted); background:var(--g-tile);
                border:1px solid var(--g-tileb); border-radius:16px; padding:8px 16px; cursor:pointer; white-space:nowrap; }
          nav button:hover { color:var(--g-text); }
          nav button[aria-selected="true"] { color:var(--g-accent); background:color-mix(in srgb, var(--g-accent) 14%, transparent);
                border-color:color-mix(in srgb, var(--g-accent) 38%, transparent); }
          nav button:focus-visible, .filters button:focus-visible, .setbtn:focus-visible { outline:2px solid var(--g-accent); outline-offset:2px; }
          [role="tabpanel"][hidden] { display:none; }
          main { padding:16px; max-width:1100px; margin:0 auto; }
          h2 { font-weight:600; font-size:15px; letter-spacing:.14em; text-transform:uppercase; color:var(--g-muted); margin:28px 0 10px; }
          .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); }
          .card { background:var(--g-panel-bg); border:1px solid var(--g-line); border-radius:30px; padding:20px 22px;
                  box-shadow:var(--ha-card-box-shadow,none); }
          .card h3 { margin:0 0 10px; font-size:15px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--g-muted);
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
          .filters button:hover { background:var(--secondary-background-color); }
          .filters button[aria-pressed="true"] { border-color:color-mix(in srgb, var(--g-accent) 40%, transparent); color:var(--g-accent); background:color-mix(in srgb, var(--g-accent) 14%, transparent); }
          .tiles { display:flex; gap:12px; flex-wrap:wrap; margin:0 0 12px; }
          .tile { background:var(--g-tile); border:1px solid var(--g-tileb); border-radius:15px; padding:9px 13px; min-width:120px; display:flex; flex-direction:column; gap:2px; }
          .tile b { display:block; font-size:1.35em; font-weight:700; font-variant-numeric:tabular-nums; }
          .tile span { color:var(--g-muted); font-size:.75em; letter-spacing:.06em; text-transform:uppercase; font-weight:600; }
          .chart { background:var(--g-panel-bg); border:1px solid var(--g-line); border-radius:30px; padding:16px 18px 10px;
                   margin-bottom:16px; transition:opacity .15s; }
          .chart.loading { opacity:.5; }
          h3.ch { font-weight:600; font-size:15px; letter-spacing:.14em; text-transform:uppercase; color:var(--g-muted); margin:22px 0 10px; }
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
          .gauge { height:10px; border-radius:6px; background:rgba(127,127,127,.18); overflow:hidden; margin:10px 0 6px; }
          .gauge i { display:block; height:100%; border-radius:6px; background:var(--pva-prod); box-shadow:0 0 12px color-mix(in srgb, var(--pva-prod) 55%, transparent); }
          .pw-val { font-size:2.4em; font-weight:800; letter-spacing:-.02em; line-height:1.1; }
          .pw-sub { color:var(--secondary-text-color); font-size:.9em; display:flex; justify-content:space-between; gap:8px; }
          .setcard { background:var(--g-panel-bg); border:1px solid var(--g-line); border-radius:30px; padding:20px 22px; margin-bottom:16px; }
          .setcard h3 { margin:0 0 2px; font-size:15px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--g-muted); }
          .setcard .eid { color:var(--secondary-text-color); font-size:.85em; margin-bottom:10px; word-break:break-all; }
          .setrow { display:grid; grid-template-columns:minmax(120px,200px) 1fr; gap:8px 12px; align-items:center; margin:6px 0; }
          .setrow label { color:var(--secondary-text-color); }
          .setrow input { font:inherit; color:var(--primary-text-color); background:var(--secondary-background-color);
                  border:1px solid var(--g-tileb); border-radius:12px; padding:8px 12px; min-width:0; max-width:320px; box-sizing:border-box; width:100%; }
          .setrow input:disabled { opacity:.6; }
          .setrow .hint { grid-column:2; color:var(--secondary-text-color); font-size:.85em; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
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
        <header><span id="menu"></span><span id="title"></span></header>
        <nav id="tabs" role="tablist"></nav>
        <main><div id="now" role="tabpanel"></div><div id="pwr" role="tabpanel"></div><div id="ana" role="tabpanel"></div><div id="hist" role="tabpanel"></div><div id="yearsec" role="tabpanel"></div><div id="setsec" role="tabpanel"></div></main>`;
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
      this._raf = requestAnimationFrame(() => { if (this._tab === "history") this._draw(); if (this._tab === "years") this._drawYears(); if (this._tab === "analysis") this._drawAnalysis(); });
    });
    this._ro.observe(this);
    this._timer = setInterval(() => { if (this._hist) this._loadHistory(); if (this._yearsOn) this._loadYears(); this._loadPowerMax(); }, 5 * 60 * 1000);
    this._load();
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    clearInterval(this._timer);
  }

  async _load() {
    if (!this._hass) { this._wantLoad = true; return; }
    try {
      this._cfg = await this._hass.callWS({ type: "pv_assistant/config" });
    } catch (e) {
      this._cfg = {};
    }
    this._last = null;
    this._buildHistory();
    this._buildYears();
    this._buildSettings();
    this._buildAnalysis();
    this._buildTabs();
    this._render();
    this._loadHistory();
    this._loadYears();
    this._loadPowerMax();
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
    if (fc) html += `<h2>${esc(this._t("fcGroup"))}</h2><div class="grid">${fc}</div>`;
    if (!html) html = `<p class="muted">${esc(this._t("none"))}</p>`;
    if (html !== this._last) { this._last = html; this._root.getElementById("now").innerHTML = html; }
    this._renderPower();
  }

  // ---------------------------------------------------------------- history

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

  _buildHistory() {
    const { P, E } = this._keys();
    const any = (x) => x.prod.length || x.feed.length || x.sin.length || x.sout.length || x.comb.length;
    const h = this._root.getElementById("hist");
    this._hist = !!(any(P) || any(E));
    if (!this._hist) { h.replaceChildren(); return; }
    if (!this._range) this._range = "today";
    h.innerHTML = `<div class="filters" id="ranges"></div>
      <div class="tiles" id="tiles"></div>
      <h3 class="ch">${esc(this._t("powerChart"))} (W)</h3><div class="chart" id="pchart"></div>
      <h3 class="ch">${esc(this._t("effChart"))}</h3><div class="chart" id="xchart"></div>${this._keys().G.soc.length ? `
      <h3 class="ch">${esc(this._t("socChart"))}</h3><div class="chart" id="schart"></div>` : ""}
      <h3 class="ch">${esc(this._t("energyChart"))} (kWh)</h3><div class="chart" id="echart"></div>`;
    const box = h.querySelector("#ranges");
    for (const r of ["today", "yesterday", "d7", "d30"]) {
      const b = document.createElement("button");
      b.textContent = this._t(r);
      b.dataset.range = r;
      b.setAttribute("aria-pressed", String(r === this._range));
      b.addEventListener("click", () => {
        this._range = r;
        box.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.range === r)));
        this._loadHistory();
      });
      box.append(b);
    }
  }

  _rangeDef() {
    const day = new Date(); day.setHours(0, 0, 0, 0);
    const at = (back) => { const d = new Date(day); d.setDate(d.getDate() - back); return d; };
    const r = this._range;
    const start = r === "yesterday" ? at(1) : r === "d7" ? at(6) : r === "d30" ? at(29) : at(0);
    const days = r === "d7" ? 7 : r === "d30" ? 30 : 1;
    const t0 = start.getTime();
    const t1 = new Date(start); t1.setDate(t1.getDate() + days);
    const end = r === "yesterday" ? t1.getTime() : Math.min(Date.now(), t1.getTime());
    const H = 3600e3;
    return { t0, t1: t1.getTime(), end, days,
      pPeriod: days === 1 ? "5minute" : "hour", pStep: days === 1 ? 300e3 : H,
      eBucket: days === 1 ? H : 24 * H, eStep: days === 1 ? H : 24 * H,
      tickStep: days === 1 ? 3 * H : days === 7 ? 24 * H : 5 * 24 * H };
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

  async _loadHistory() {
    if (!this._hist) return;
    const token = (this._token = (this._token || 0) + 1);
    const rd = this._rangeDef();
    const { P, E, G } = this._keys();
    const filt = this._cfg.filtered || {};
    const powerIds = [...P.prod, ...P.feed, ...P.sin, ...P.sout, ...P.comb, ...G.impP, ...G.houseP, ...G.soc, ...G.irr];
    const energyIds = [...E.prod, ...E.feed, ...E.sin, ...E.sout, ...E.comb, ...G.impE, ...G.houseE];
    const energyAll = energyIds.concat(energyIds.map((i) => filt[i]).filter(Boolean));
    this._root.querySelectorAll(".chart").forEach((c) => c.classList.add("loading"));
    const [pres, eres] = await Promise.all([
      this._stats(powerIds, rd.pPeriod, "mean", { power: "W" }, rd),
      this._stats(energyAll, rd.eBucket === 3600e3 ? "hour" : "day", "change", { energy: "kWh" }, rd),
    ]);
    if (token !== this._token) return; // a newer range was requested meanwhile
    this._data = { rd, P, E, G, pres, eres, filt };
    this._draw();
  }

  _draw() {
    const d = this._data;
    if (!d || !this._hist) return;
    const { rd, P, E, G, pres, eres, filt } = d;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const fm = (o) => new Intl.DateTimeFormat(lang, { ...o, timeZone: tz });
    const fDT = fm({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const fD = fm({ weekday: "short", day: "numeric", month: "numeric" });
    const fH = fm({ hour: "2-digit", minute: "2-digit" });
    const fDM = fm({ day: "numeric", month: "numeric" });
    const num = (v, axis, max = 2) => v.toLocaleString(lang, { maximumFractionDigits: axis ? 1 : max });

    // sums of per-bucket values across sensors; value fn may map the raw number
    const get = (res, id, field) => (res[id] || []).filter((r) => r[field] != null);
    const pick = (id, field) => { const f = filt[id]; const a = f && get(eres, f, field).length ? get(eres, f, field) : get(eres, id, field); return a; };
    const add = (m, ts, v) => m.set(ts, (m.get(ts) || 0) + v);
    const sum = (ids, rows, field, fn = (v) => v) => {
      const m = new Map();
      for (const id of ids) for (const r of rows(id)) add(m, r.start, fn(r[field]));
      return m;
    };
    const comb = (ids, rows, field, inv) => { // default positive = from storage
      const pos = new Map(), neg = new Map();
      for (const id of ids) for (const r of rows(id)) {
        const w = inv ? -r[field] : r[field];
        add(w >= 0 ? pos : neg, r.start, Math.abs(w));
      }
      return { pos, neg };
    };
    // one entry per sensor (source split for the tooltips): [{name, values: Map}]
    const each = (ids, rows, field, fn = (v) => v) => ids.map((id) => {
      const m = new Map();
      for (const r of rows(id)) add(m, r.start, fn(r[field]));
      return { name: this._read(id).name, values: m };
    });
    const neg = (m) => new Map([...m].map(([k, v]) => [k, -v]));
    const merge = (a, b, sign = 1) => { const m = new Map(a); for (const [k, v] of b) add(m, k, sign * v); return m; };

    // ---- power lines
    const pr = (id) => get(pres, id, "mean");
    // feed-in power: a sensor that reports feed-in as negative values is inverted; the other
    // direction (import) is not feed-in and counts as 0
    const feedFn = P.invFeed ? (v) => Math.max(-v, 0) : (v) => Math.max(v, 0);
    // single-direction sensors (production, storage in, storage out) only count positive values;
    // sensors with a sign belong in the combined storage field
    const nz = (v) => Math.max(v, 0);
    // storage in/out sensors that report their direction as negative values: use the magnitude
    const ns = P.absStorage ? (v) => Math.abs(v) : nz;
    const pProd = sum(P.prod, pr, "mean", nz), pFeed = sum(P.feed, pr, "mean", feedFn);
    const pSin = sum(P.sin, pr, "mean", ns), pSout = sum(P.sout, pr, "mean", ns);
    const pComb = sum(P.comb, pr, "mean", (v) => (P.inv ? -v : v));
    let pNet = merge(merge(pSout, pSin, -1), pComb);
    // PV used directly = production - feed-in - charging power (never below 0)
    const cP = comb(P.comb, pr, "mean", P.inv);
    const pCharge = merge(pSin, cP.neg);
    const pDirect = new Map();
    for (const [ts, v] of pProd) pDirect.set(ts, Math.min(v, Math.max(0, v - (pFeed.get(ts) || 0) - (pCharge.get(ts) || 0)))); // never above the production
    const pNetParts = [...each(P.sout, pr, "mean", ns), ...each(P.sin, pr, "mean", (v) => -ns(v)), ...each(P.comb, pr, "mean", (v) => (P.inv ? -v : v))];
    let pDirectParts = [
      { name: this._t("production"), values: pProd },
      { name: `− ${this._t("feed")}`, values: neg(pFeed) },
      { name: `− ${this._t("sin")}`, values: neg(pCharge) },
    ];
    const hasStorageP = P.sin.length || P.sout.length || P.comb.length;
    const toPts = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]);
    // grid import: own sensors, otherwise the positive part of a feed-in sensor that also reports import
    const impP = G.impP.length ? sum(G.impP, pr, "mean", nz)
      : P.invFeed && P.feed.length ? sum(P.feed, pr, "mean", (v) => Math.max(v, 0)) : null;
    const pDis = merge(pSout, cP.pos); // discharge incl. the discharging part of combined sensors
    const houseMeasuredP = G.houseP.length ? sum(G.houseP, pr, "mean", nz) : null;
    let houseP = houseMeasuredP;
    if (!houseP && impP) { // energy balance: production + import + discharge - feed-in - charge
      houseP = new Map();
      for (const [ts, v] of pProd) houseP.set(ts, Math.max(0, v + (impP.get(ts) || 0) + (pDis.get(ts) || 0) - (pFeed.get(ts) || 0) - (pCharge.get(ts) || 0)));
    }
    if (houseMeasuredP && impP) { // measured consumption makes the direct consumption exact
      for (const [ts, v] of pProd) pDirect.set(ts, Math.min(v, Math.max(0, (houseMeasuredP.get(ts) || 0) - (impP.get(ts) || 0) - (pDis.get(ts) || 0))));
      pDirectParts = [
        { name: this._t("house"), values: houseMeasuredP },
        { name: `− ${this._t("gridImp")}`, values: neg(impP) },
        { name: `− ${this._t("sout")}`, values: neg(pDis) },
      ];
    }
    const lines = [
      { name: this._t("production"), short: this._t("production"), color: "--pva-prod", points: toPts(pProd), parts: each(P.prod, pr, "mean", nz).map((part, i) => ({ ...part, peak: this._cfg.settings?.strings?.[P.prod[i]]?.peak })) },
      { name: this._t("feed"), short: this._t("feed"), color: "--pva-feed", points: toPts(pFeed), parts: each(P.feed, pr, "mean", feedFn) },
      { name: this._t("storageNet"), short: this._t("storage"), color: "--pva-bout", colorNeg: "--pva-bin",
        legendItems: [{ name: `${this._t("sout")} (+)`, color: "--pva-bout" }, { name: `${this._t("sin")} (−)`, color: "--pva-bin" }],
        points: hasStorageP ? toPts(pNet) : [], parts: pNetParts },
      { name: this._t("direct"), short: this._t("directShort"), color: "--pva-direct", points: toPts(pDirect), parts: pDirectParts },
      { name: this._t("gridImp"), short: this._t("gridImpShort"), color: "--pva-grid", points: impP ? toPts(impP) : [] },
      { name: houseMeasuredP ? this._t("house") : this._t("houseDerived"), short: this._t("houseShort"), color: "--pva-house", points: houseP ? toPts(houseP) : [] },
    ];
    const timeLabels = { summary: this._t("table"), time: this._t("time") };
    const tickFmt = rd.days === 1 ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t);
    lineChart(this._root.getElementById("pchart"), {
      series: lines, t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis, 0)}${axis ? "" : " W"}`,
      fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
      empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("powerChart")} (W)`,
    });

    // ---- effective power in % of the entered peak (only strings with a peak)
    const peakOf = (id) => { const v = this._cfg.settings?.strings?.[id]?.peak; return v > 0 ? v : null; };
    const peaked = P.prod.filter(peakOf);
    const effSeries = peaked.map((id, k) => {
      const m = each([id], pr, "mean", nz)[0].values;
      return { name: this._read(id).name, short: `${this._read(id).name.slice(0, 11)}${this._read(id).name.length > 11 ? "…" : ""}`, color: `--pva-s${(k % 7) + 1}`, id,
        points: toPts(new Map([...m].map(([ts, v]) => [ts, (v / peakOf(id)) * 100]))) };
    });
    if (peaked.length) {
      const sumPeak = peaked.reduce((a, id) => a + peakOf(id), 0), tot = new Map();
      for (const id of peaked) for (const [ts, v] of each([id], pr, "mean", nz)[0].values) add(tot, ts, v);
      effSeries.push({ name: this._t("effTotal"), short: this._t("effTotal"), color: "--pva-prod", points: toPts(new Map([...tot].map(([ts, v]) => [ts, (v / sumPeak) * 100]))) });
    }
    lineChart(this._root.getElementById("xchart"), {
      series: effSeries, t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis, 0)} %`,
      fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
      empty: this._t("setNoPeak"), tableLabels: timeLabels, label: this._t("effChart"),
    });
    if (peaked.length) {
      const n = document.createElement("p");
      n.className = "note";
      n.textContent = this._t("effNote");
      this._root.getElementById("xchart").append(n);
    }

    // ---- battery level
    const socBox = this._root.getElementById("schart");
    if (socBox && G.soc.length) {
      lineChart(socBox, {
        series: [{ name: this._t("socName"), short: this._t("socName"), color: "--pva-s1", points: toPts(new Map(pr(G.soc[0]).map((r) => [r.start, r.mean]))) }],
        t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
        fmtValue: (v, axis) => `${num(v, axis, 0)} %`, fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
        empty: this._t("noData"), tableLabels: timeLabels, label: this._t("socChart"),
      });
    }

    // hint when a single-direction sensor reports negative values (misplaced signed sensor)
    const neg1 = [...P.prod, ...(P.absStorage ? [] : [...P.sin, ...P.sout])].filter((id) => pr(id).some((r) => r.mean < -1)).map((id) => this._read(id).name);
    if (neg1.length) {
      const warn = document.createElement("p");
      warn.className = "note warn";
      warn.textContent = this._t("negWarn").replace("{names}", neg1.join(", "));
      this._root.getElementById("pchart").append(warn);
    }

    // ---- energy bars
    const er = (field) => (id) => pick(id, field);
    const eProd = sum(E.prod, er("change"), "change"), eFeed = sum(E.feed, er("change"), "change");
    const c = comb(E.comb, er("change"), "change", E.inv);
    const eSin = merge(sum(E.sin, er("change"), "change"), c.neg);
    const eSout = merge(sum(E.sout, er("change"), "change"), c.pos);
    const eDirect = new Map();
    for (const [ts, v] of eProd) eDirect.set(ts, Math.min(v, Math.max(0, v - (eFeed.get(ts) || 0) - (eSin.get(ts) || 0))));
    const wfn = (v) => (E.inv ? -v : v); // default positive = from storage
    const eSinParts = [...each(E.sin, er("change"), "change"), ...each(E.comb, er("change"), "change", (v) => Math.max(-wfn(v), 0))];
    const eSoutParts = [...each(E.sout, er("change"), "change"), ...each(E.comb, er("change"), "change", (v) => Math.max(wfn(v), 0))];
    let eDirectParts = [
      { name: this._t("production"), values: eProd },
      { name: `− ${this._t("feed")}`, values: neg(eFeed) },
      { name: `− ${this._t("sin")}`, values: neg(eSin) },
    ];
    const impE = G.impE.length ? sum(G.impE, er("change"), "change") : null;
    const houseMeasuredE = G.houseE.length ? sum(G.houseE, er("change"), "change") : null;
    let houseE = houseMeasuredE;
    if (!houseE && impE) {
      houseE = new Map();
      for (const [ts, v] of eProd) houseE.set(ts, Math.max(0, v + (impE.get(ts) || 0) + (eSout.get(ts) || 0) - (eFeed.get(ts) || 0) - (eSin.get(ts) || 0)));
    }
    if (houseMeasuredE && impE) {
      for (const [ts, v] of eProd) eDirect.set(ts, Math.min(v, Math.max(0, (houseMeasuredE.get(ts) || 0) - (impE.get(ts) || 0) - (eSout.get(ts) || 0))));
      eDirectParts = [
        { name: this._t("house"), values: houseMeasuredE },
        { name: `− ${this._t("gridImp")}`, values: neg(impE) },
        { name: `− ${this._t("sout")}`, values: neg(eSout) },
      ];
    }
    const bars = [
      { name: this._t("production"), color: "--pva-prod", values: eProd, parts: each(E.prod, er("change"), "change") },
      { name: this._t("feed"), color: "--pva-feed", values: eFeed, parts: each(E.feed, er("change"), "change") },
      { name: this._t("sin"), color: "--pva-bin", values: eSin, parts: eSinParts },
      { name: this._t("sout"), color: "--pva-bout", values: eSout, parts: eSoutParts },
      { name: this._t("direct"), color: "--pva-direct", values: eDirect, parts: eDirectParts },
    ];
    if (impE) bars.push({ name: this._t("gridImp"), color: "--pva-grid", values: impE, parts: each(G.impE, er("change"), "change") });
    if (houseE) bars.push({ name: houseMeasuredE ? this._t("house") : this._t("houseDerived"), color: "--pva-house", values: houseE, parts: houseMeasuredE ? each(G.houseE, er("change"), "change") : undefined });
    const hourly = rd.eBucket === 3600e3;
    barChart(this._root.getElementById("echart"), {
      series: bars, t0: rd.t0, t1: rd.t1, bucket: rd.eBucket, tickStep: hourly ? 3 * 3600e3 : rd.days === 7 ? 24 * 3600e3 : 5 * 24 * 3600e3,
      fmtValue: (v, axis) => `${num(v, axis)}${axis ? "" : " kWh"}`,
      fmtTime: (t) => (hourly ? fDT.format(t) : fD.format(t)),
      fmtTick: hourly ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t),
      empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("energyChart")} (kWh)`,
    });

    // ---- totals
    const tot = (m) => [...m.values()].reduce((a, v) => a + v, 0);
    const tiles = bars.filter((b) => b.values.size).map((b) =>
      `<div class="tile"><b>${esc(num(tot(b.values)))} kWh</b><span>${esc(b.name)}</span></div>`).join("");
    const prodTot = tot(eProd);
    const share = prodTot > 0 ? `<div class="tile"><b>${esc(num(tot(eDirect) / prodTot * 100, false, 0))} %</b><span>${esc(this._t("directShare"))}</span></div>` : "";
    let fcTiles = "";
    const fcToday = list(this._cfg.forecast_today_energy_sensors).map((id) => this._read(id).base).filter((v) => !isNaN(v));
    if (this._range === "today" && fcToday.length) {
      const fcSum = fcToday.reduce((a, v) => a + v, 0);
      fcTiles = `<div class="tile"><b>${esc(num(fcSum, false, 1))} kWh</b><span>${esc(this._t("fcToday"))}</span></div>`;
      if (fcSum > 0 && prodTot > 0) fcTiles += `<div class="tile"><b>${esc(num(prodTot / fcSum * 100, false, 0))} %</b><span>${esc(this._t("fcReached"))}</span></div>`;
    }
    // derived key figures of the range
    const kwh = (m) => (m ? tot(m) : null);
    const T = { prod: prodTot, feed: tot(eFeed), sin: tot(eSin), sout: tot(eSout), imp: kwh(impE), house: kwh(houseE) };
    const gen = this._cfg.settings?.general || {};
    const numOf = (id) => { const v = parseFloat(this._hass.states[id]?.state); return Number.isNaN(v) ? null : v; };
    const priceImp = (G.priceImp && numOf(G.priceImp)) || gen.price_import || null;
    const priceFeed = (G.priceFeed && numOf(G.priceFeed)) || gen.price_feed_in || null;
    const more = [];
    if (T.house > 0 && T.imp != null) more.push([`${num((1 - Math.min(T.imp, T.house) / T.house) * 100, false, 0)} %`, this._t("autarky")]);
    if (T.prod > 0) more.push([`${num(((T.prod - Math.min(T.feed, T.prod)) / T.prod) * 100, false, 0)} %`, this._t("selfShare")]);
    if (T.imp != null && T.feed > 0) more.push([`${num(Math.min(T.imp, T.feed))} kWh`, this._t("shift")]);
    if (T.sin > 0 && T.sout > 0) more.push([`${num((T.sout / T.sin) * 100, false, 0)} %`, this._t("storEff")]);
    if (gen.storage_capacity_kwh > 0 && T.sin > 0) more.push([num(T.sin / gen.storage_capacity_kwh, false, 1), this._t("cycles")]);
    if (priceImp && T.prod > 0) more.push([`${num((T.prod - Math.min(T.feed, T.prod)) * priceImp, false, 2)} €`, this._t("saving")]);
    if (priceFeed && T.feed > 0) more.push([`${num(T.feed * priceFeed, false, 2)} €`, this._t("revenue")]);
    if (T.prod > 0) more.push([`${num((T.prod * (gen.co2_g_per_kwh || 380)) / 1000, false, 1)} kg`, this._t("co2")]);
    if (socBox && G.soc.length) {
      const vals = pr(G.soc[0]).map((r) => r.mean).filter((v) => v != null);
      if (vals.length) more.push([`${num(Math.min(...vals), false, 0)}–${num(Math.max(...vals), false, 0)} %`, this._t("socRange")]);
    }
    const moreTiles = more.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    this._root.getElementById("tiles").innerHTML = tiles + share + moreTiles + fcTiles;
    this._root.querySelectorAll(".chart").forEach((x) => x.classList.remove("loading"));
  }

  // ---------------------------------------------------------------- yearly overview

  _yearPrefs() {
    try { return JSON.parse(localStorage.getItem("pv_assistant_years") || "{}"); } catch (e) { return {}; }
  }
  _saveYearPrefs() {
    try { localStorage.setItem("pv_assistant_years", JSON.stringify({ n: this._yn })); } catch (e) { /* storage unavailable */ }
  }

  _buildYears() {
    const prod = this._keys().E.prod;
    const box = this._root.getElementById("yearsec");
    this._yearsOn = prod.length > 0;
    if (!this._yearsOn) { box.replaceChildren(); return; }
    const saved = this._yearPrefs();
    this._yn = saved.n ?? 4;           // years in the average (0 = all)
    this._yy = new Date().getFullYear(); // displayed year
    const opts = [1, 2, 3, 4, 5, 10, 0].map((v) =>
      `<option value="${v}"${v === this._yn ? " selected" : ""}>${v ? v : esc(this._t("all"))}</option>`).join("");
    box.innerHTML = `<div class="yearnav">
        <button id="yprev" aria-label="${esc(this._t("prevYear"))}">‹</button><b id="ylabel"></b>
        <button id="ynext" aria-label="${esc(this._t("nextYear"))}">›</button>
        <label>${esc(this._t("avgOver"))} <select id="ynum">${opts}</select> ${esc(this._t("yearsUnit"))}</label>
      </div>
      <div class="tiles" id="ytiles"></div>
      <h3 class="ch">${esc(this._t("monthly"))}</h3><div class="chart" id="ychart"></div>
      <h3 class="ch">${esc(this._t("deviation"))}</h3><div class="chart" id="dchart"></div>
      <h3 class="ch">${esc(this._t("yearTotal"))}</h3><div class="chart" id="achart"></div>
      <h3 class="ch">${esc(this._t("yearDev"))}</h3><div class="chart" id="adchart"></div>
      <p class="note">${esc(this._t("yearNote"))}</p>`;
    box.querySelector("#yprev").addEventListener("click", () => { this._yy -= 1; this._drawYears(); });
    box.querySelector("#ynext").addEventListener("click", () => { this._yy += 1; this._drawYears(); });
    box.querySelector("#ynum").addEventListener("change", (e) => { this._yn = Number(e.target.value); this._saveYearPrefs(); this._drawYears(); });
  }

  async _loadYears() {
    if (!this._yearsOn) return;
    const filt = this._cfg.filtered || {};
    const ids = this._keys().E.prod;
    const fids = this._keys().E.feed;
    const all = [...ids, ...fids].concat([...ids, ...fids].map((i) => filt[i]).filter(Boolean));
    const start = new Date(); start.setFullYear(start.getFullYear() - 15, 0, 1); start.setHours(0, 0, 0, 0);
    let res = {};
    try {
      res = await this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: start.toISOString(), end_time: new Date().toISOString(),
        statistic_ids: [...new Set(all)], period: "month", types: ["change"], units: { energy: "kWh" },
      });
    } catch (e) { res = {}; }
    const tz = this._hass.config?.time_zone;
    const fmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "numeric", timeZone: tz });
    const ym = (ts) => { const p = Object.fromEntries(fmt.formatToParts(ts).map((x) => [x.type, x.value])); return [Number(p.year), Number(p.month) - 1]; };
    // month -> kWh, summed over the production sensors; the filtered copy wins per month
    const months = new Map();
    const byId = new Map(); // sensor -> month -> kWh (source split for the tooltips)
    for (const id of ids) {
      const own = new Map();
      for (const r of res[id] || []) if (r.change != null) own.set(r.start, r.change);
      for (const r of res[filt[id]] || []) if (r.change != null) own.set(r.start, r.change);
      const mine = new Map();
      for (const [ts, v] of own) { const [y, m] = ym(ts); const k = `${y}-${m}`; months.set(k, (months.get(k) || 0) + v); mine.set(k, v); }
      byId.set(id, mine);
    }
    const feedMonths = new Map(); // feed-in energy per month (needed for savings and revenue)
    for (const id of fids) {
      const own = new Map();
      for (const r of res[id] || []) if (r.change != null) own.set(r.start, r.change);
      for (const r of res[filt[id]] || []) if (r.change != null) own.set(r.start, r.change);
      for (const [ts, v] of own) { const [y, m] = ym(ts); const k = `${y}-${m}`; feedMonths.set(k, (feedMonths.get(k) || 0) + v); }
    }
    this._ydata = { months, byId, ids, feedMonths, hasFeed: fids.length > 0 };
    this._drawYears();
  }

  _drawYears() {
    const d = this._ydata;
    if (!d || !this._yearsOn) return;
    const lang = this._hass.locale?.language || this._hass.language;
    const now = new Date();
    const cy = now.getFullYear(), cm = now.getMonth();
    const keys = [...d.months.keys()].map((k) => Number(k.split("-")[0]));
    const minY = keys.length ? Math.min(...keys) : cy;
    this._yy = Math.max(minY, Math.min(cy, this._yy));
    const Y = this._yy;
    const val = (y, m) => d.months.get(`${y}-${m}`) ?? null;
    const complete = (y, m) => y < cy || (y === cy && m < cm);
    // the average always covers the LAST n recorded years (up to the latest year with data), not the
    // n years before the displayed year; otherwise older years would be compared with almost nothing
    const latest = keys.length ? Math.max(...keys) : cy;
    const first = this._yn ? latest - this._yn + 1 : minY;
    const years = []; for (let y = Math.max(first, minY); y <= latest; y++) years.push(y);
    const avg = [], used = new Set(), yrsOf = [];
    for (let m = 0; m < 12; m++) {
      const ys = years.filter((y) => complete(y, m) && val(y, m) != null);
      ys.forEach((y) => used.add(y));
      yrsOf.push(ys);
      const vs = ys.map((y) => val(y, m));
      avg.push(vs.length ? vs.reduce((a, v) => a + v, 0) / vs.length : null);
    }
    const cur = [], dev = [];
    for (let m = 0; m < 12; m++) {
      const v = val(Y, m);
      cur.push(v);
      dev.push(complete(Y, m) && v != null && avg[m] ? ((v - avg[m]) / avg[m]) * 100 : null);
    }
    // source split per sensor of the monthly average: same years as the total average, a missing month counts as 0 (so the parts add up to the total)
    const sensorVal = (id, y, m) => d.byId.get(id)?.get(`${y}-${m}`) ?? null;
    const parts = (fn) => d.ids.map((id) => ({ name: this._read(id).name, values: Array.from({ length: 12 }, (_, m) => fn(id, m)) }));
    const sensorAvg = (id, m) => (yrsOf[m].length ? yrsOf[m].reduce((a, y) => a + (sensorVal(id, y, m) || 0), 0) / yrsOf[m].length : null);
    const curParts = parts((id, m) => sensorVal(id, Y, m));
    const avgParts = parts((id, m) => sensorAvg(id, m));
    // deviation per sensor: compare with the sensor's OWN recorded years only (a year without data
    // is not a year with 0 kWh, otherwise a newly added sensor shows +200 % / +300 % ...); a sensor
    // needs at least two recorded years for a comparison
    const ownAvg = (id, m) => {
      const ys = yrsOf[m].filter((y) => sensorVal(id, y, m) != null);
      return ys.length >= 2 ? ys.reduce((a, y) => a + sensorVal(id, y, m), 0) / ys.length : null;
    };
    const devParts = parts((id, m) => {
      const v = sensorVal(id, Y, m), a = ownAvg(id, m);
      return complete(Y, m) && v != null && a ? ((v - a) / a) * 100 : null;
    });
    const num = (v, axis, max = 1) => v.toLocaleString(lang, { maximumFractionDigits: axis ? 1 : max });
    const names = Array.from({ length: 12 }, (_, m) => new Intl.DateTimeFormat(lang, { month: "short" }).format(new Date(2000, m, 1)));
    const root = this._root;
    root.getElementById("ylabel").textContent = String(Y);
    root.getElementById("yprev").disabled = Y <= minY;
    root.getElementById("ynext").disabled = Y >= cy;

    const sofar = cur.reduce((a, v) => a + (v || 0), 0);
    const have = avg.filter((v) => v != null);
    const forecast = have.reduce((a, v) => a + v, 0);
    const tile = (v, l) => `<div class="tile"><b>${esc(num(v, false, 0))} kWh</b><span>${esc(l)}</span></div>`;
    root.getElementById("ytiles").innerHTML = cur.some((v) => v != null) || have.length
      ? tile(sofar, `${this._t("yearProd")} ${Y} ${this._t("sofar")}`)
        + (have.length ? tile(forecast, `${this._t("forecast")} (${used.size} ${this._t("yearsUnit")})`) + tile(forecast / have.length, this._t("avgMonth")) : "") : "";

    const tl = { summary: this._t("table"), time: this._t("time") };
    const fv = (v, axis) => `${num(v, axis, 1)}${axis ? "" : " kWh"}`;
    categoryBarChart(root.getElementById("ychart"), {
      categories: names.map((n, m) => (Y === cy && m === cm ? `${n}*` : n)),
      series: [
        { name: String(Y), color: "--pva-prod", values: cur, parts: curParts },
        { name: `${this._t("avg")} (${used.size} ${this._t("yearsUnit")})`, color: "--pva-avg", values: avg, parts: avgParts },
      ],
      fmtValue: fv, empty: this._t("noData"), tableLabels: tl, label: this._t("monthly"),
    });
    categoryBarChart(root.getElementById("dchart"), {
      categories: names,
      series: [{ name: this._t("deviation"), color: "--pva-pos", colorOf: (v) => (v >= 0 ? "--pva-pos" : "--pva-neg"), values: dev, parts: devParts }],
      legendItems: [{ name: this._t("above"), color: "--pva-pos" }, { name: this._t("below"), color: "--pva-neg" }],
      fmtValue: (v, axis) => `${v > 0 ? "+" : ""}${num(v, axis, 1)} %`, empty: this._t("noData"), tableLabels: tl, label: this._t("deviation"),
    });
    // ---- yearly totals and their deviation (like-for-like: only months that are complete and recorded
    // for that year, compared with the same months of the monthly average)
    const monthsOf = (y) => Array.from({ length: 12 }, (_, m) => m).filter((m) => complete(y, m) && val(y, m) != null && avg[m] != null);
    const yearList = [];
    for (let y = minY; y <= latest; y++) if (monthsOf(y).length) yearList.push(y);
    const sumOver = (ms, f) => ms.reduce((a, m) => a + (f(m) || 0), 0);
    const yCats = yearList.map((y) => (monthsOf(y).length < 12 ? `${y}*` : String(y)));
    const yTot = yearList.map((y) => sumOver(monthsOf(y), (m) => val(y, m)));
    const yRef = yearList.map((y) => sumOver(monthsOf(y), (m) => avg[m]));
    const yDev = yTot.map((t, i) => (yRef[i] > 0 ? ((t - yRef[i]) / yRef[i]) * 100 : null));
    const yPart = (fn) => d.ids.map((id) => ({ name: this._read(id).name, values: yearList.map((y) => fn(id, y, monthsOf(y))) }));
    const totParts = yPart((id, y, ms) => sumOver(ms, (m) => sensorVal(id, y, m)));
    const refParts = yPart((id, y, ms) => sumOver(ms, (m) => sensorAvg(id, m)));
    const devOwnParts = yPart((id, y, ms) => {
      let s = 0, r = 0;
      for (const m of ms) { const v = sensorVal(id, y, m), a = ownAvg(id, m); if (v != null && a) { s += v; r += a; } }
      return r > 0 ? ((s - r) / r) * 100 : null;
    });
    categoryBarChart(root.getElementById("achart"), {
      categories: yCats,
      series: [
        { name: this._t("yearProd"), color: "--pva-prod", values: yTot, parts: totParts },
        { name: this._t("avgSame"), color: "--pva-avg", values: yRef, parts: refParts },
      ],
      fmtValue: fv, empty: this._t("noData"), tableLabels: tl, label: this._t("yearTotal"),
    });
    categoryBarChart(root.getElementById("adchart"), {
      categories: yCats,
      series: [{ name: this._t("yearDev"), color: "--pva-pos", colorOf: (v) => (v >= 0 ? "--pva-pos" : "--pva-neg"), values: yDev, parts: devOwnParts }],
      legendItems: [{ name: this._t("above"), color: "--pva-pos" }, { name: this._t("below"), color: "--pva-neg" }],
      fmtValue: (v, axis) => `${v > 0 ? "+" : ""}${num(v, axis, 1)} %`, empty: this._t("noData"), tableLabels: tl, label: this._t("yearDev"),
    });
    if (yCats.some((c) => c.endsWith("*"))) {
      for (const id of ["achart", "adchart"]) root.getElementById(id).append(Object.assign(document.createElement("p"), { className: "note", textContent: this._t("yearStar") }));
    }
    // tile: deviation of the selected year
    const yi = yearList.indexOf(Y);
    if (yi >= 0 && yDev[yi] != null) {
      root.getElementById("ytiles").insertAdjacentHTML("beforeend",
        `<div class="tile"><b>${esc(`${yDev[yi] > 0 ? "+" : ""}${num(yDev[yi], false, 1)} %`)}</b><span>${esc(`${this._t("devTile")} ${Y}${yCats[yi].endsWith("*") ? "*" : ""}`)}</span></div>`);
    }

    // ---- benefit, payback and trend
    const extra = [];
    const gen = this._cfg.settings?.general || {};
    const Gk = this._keys().G;
    const numOf = (id) => { const v = parseFloat(this._hass.states[id]?.state); return Number.isNaN(v) ? null : v; };
    const priceImp = (Gk.priceImp && numOf(Gk.priceImp)) || gen.price_import || null;
    const priceFeed = (Gk.priceFeed && numOf(Gk.priceFeed)) || gen.price_feed_in || null;
    if (d.hasFeed && (priceImp || priceFeed)) {
      const benefit = (y, m) => {
        const prod = val(y, m), feed = d.feedMonths.get(`${y}-${m}`);
        if (prod == null || feed == null) return null;
        return Math.max(prod - feed, 0) * (priceImp || 0) + feed * (priceFeed || 0);
      };
      const eur = (v) => `${num(v, false, 0)} €`;
      let yearSum = 0, yearHas = false;
      for (let m = 0; m < 12; m++) { const b = benefit(Y, m); if (b != null) { yearSum += b; yearHas = true; } }
      if (yearHas) extra.push([eur(yearSum) + (Y === cy ? "*" : ""), `${this._t("yBenefit")} ${Y}`]);
      // last 12 completed months and everything recorded so far
      const done = [];
      for (let y = minY; y <= latest; y++) for (let m = 0; m < 12; m++) if (complete(y, m)) { const b = benefit(y, m); if (b != null) done.push(b); }
      if (done.length >= 12) {
        const last12 = done.slice(-12).reduce((a, v) => a + v, 0);
        extra.push([eur(last12), this._t("yBenefit12")]);
        if (gen.system_cost_eur > 0 && last12 > 0) {
          const paid = done.reduce((a, v) => a + v, 0);
          extra.push([`${num((paid / gen.system_cost_eur) * 100, false, 0)} %`, this._t("yPaidPct")]);
          if (paid < gen.system_cost_eur) extra.push([`${num((gen.system_cost_eur - paid) / last12, false, 1)} ${this._t("yYears")}`, this._t("yPaidLeft")]);
        }
      }
    }
    // trend of the yearly total (least squares over years with at least 9 months; depends on the weather)
    const trendYears = yearList.map((y, i) => [y, yDev[i], monthsOf(y).length]).filter(([, dv, n]) => dv != null && n >= 9);
    if (trendYears.length >= 3) {
      const mx = trendYears.reduce((a, [y]) => a + y, 0) / trendYears.length, my = trendYears.reduce((a, [, dv]) => a + dv, 0) / trendYears.length;
      const sxx = trendYears.reduce((a, [y]) => a + (y - mx) ** 2, 0), sxy = trendYears.reduce((a, [y, dv]) => a + (y - mx) * (dv - my), 0);
      if (sxx > 0) extra.push([`${sxy / sxx > 0 ? "+" : ""}${num(sxy / sxx, false, 1)} % ${this._t("yTrendUnit")}`, this._t("yTrend")]);
    }
    if (extra.length) {
      root.getElementById("ytiles").insertAdjacentHTML("beforeend", extra.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join(""));
    }

    if (Y === cy) root.getElementById("ychart").append(Object.assign(document.createElement("p"), { className: "note", textContent: `* ${this._t("running")}` }));
  }

  // ---------------------------------------------------------------- tabs

  _buildTabs() {
    const list = [["now", "now", "now"]];
    if (this._keys().P.prod.length) list.push(["powerTab", "pwr", "power"]);
    if (this._keys().P.prod.length) list.push(["analysisTab", "ana", "analysis"]);
    if (this._hist) list.push(["history", "hist", "history"]);
    if (this._yearsOn) list.push(["years", "yearsec", "years"]);
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
    if (id === "analysis") this._loadAnalysis();
    if (id === "history") this._draw();
    if (id === "years") this._drawYears();
  }

  // ---------------------------------------------------------------- power per string

  async _loadPowerMax() {
    const ids = this._keys().P.prod;
    if (!ids.length || !this._hass) return;
    const start = new Date(); start.setFullYear(start.getFullYear() - 15, 0, 1); start.setHours(0, 0, 0, 0);
    let res = {};
    try {
      res = await this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: start.toISOString(), end_time: new Date().toISOString(),
        statistic_ids: ids, period: "month", types: ["max"], units: { power: "W" },
      });
    } catch (e) { res = {}; }
    const max = {};
    for (const id of ids) {
      const vals = (res[id] || []).map((r) => r.max).filter((v) => v != null && !isNaN(v));
      if (vals.length) max[id] = Math.max(...vals);
    }
    this._pmax = max;
    this._renderPower();
    if (this._setMeasured) this._setMeasured();
  }

  _renderPower() {
    if (!this._root || !this._cfg || !this._hass) return;
    const box = this._root.getElementById("pwr");
    const ids = this._keys().P.prod;
    if (!ids.length) return;
    const cards = ids.map((id) => {
      const r = this._read(id);
      const cur = isNaN(r.base) ? null : Math.max(r.base, 0);
      const stat = this._pmax?.[id];
      const peak = this._cfg.settings?.strings?.[id]?.peak; // entered by the user, wins over the measured maximum
      const max = peak > 0 ? peak : cur == null ? stat : Math.max(stat ?? 0, cur);
      const pct = cur != null && max > 0 ? Math.min(100, (cur / max) * 100) : 0;
      const val = cur == null ? `<span class="muted">${esc(this._t("missing"))}</span>` : `${esc(this._fmt(cur))} W`;
      const sub = max != null
        ? `<span>${esc(this._t("ofMax"))} ${esc(this._fmt(max))} W</span><span>${esc(String(Math.round(pct)))} %</span>`
        : `<span class="muted">–</span>`;
      return `<div class="card"><h3><span title="${esc(id)}">${esc(r.name)}</span></h3>
        <div class="pw-val">${val}</div>
        <div class="gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct.toFixed(1)}%"></i></div>
        <div class="pw-sub">${sub}</div></div>`;
    }).join("");
    // whole plant: always shown; the percentage only counts strings with an entered peak
    const withPeak = ids.filter((id) => this._cfg.settings?.strings?.[id]?.peak > 0);
    const nowW = (id) => { const b = this._read(id).base; return isNaN(b) ? 0 : Math.max(b, 0); };
    const allCur = ids.reduce((a, id) => a + nowW(id), 0);
    let total;
    if (withPeak.length) {
      const sumPeak = withPeak.reduce((a, id) => a + this._cfg.settings.strings[id].peak, 0);
      const sumCur = withPeak.reduce((a, id) => a + nowW(id), 0);
      const pct = Math.min(100, (sumCur / sumPeak) * 100);
      total = `<div class="card"><h3><span>${esc(this._t("effTotal"))}</span><small>${withPeak.length}/${ids.length} ${esc(this._t("peakCount"))}</small></h3>
        <div class="pw-val">${esc(this._fmt(allCur))} W</div>
        <div class="gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct.toFixed(1)}%"></i></div>
        <div class="pw-sub"><span>${esc(this._t("ofPeakSum"))} ${esc(this._fmt(sumPeak))} W</span><span>${esc(String(Math.round(pct)))} %</span></div></div>`;
    } else {
      total = `<div class="card"><h3><span>${esc(this._t("effTotal"))}</span></h3>
        <div class="pw-val">${esc(this._fmt(allCur))} W</div>
        <div class="gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i style="width:0%"></i></div>
        <div class="pw-sub"><span class="muted">${esc(this._t("setNoPeakShort"))}</span></div></div>`;
    }
    const html = `<div class="grid">${total}${cards}</div><p class="note">${esc(this._t("pwrNote"))}</p>`;
    if (html !== this._lastPwr) { this._lastPwr = html; box.innerHTML = html; }
  }

  // ---------------------------------------------------------------- settings tab

  _buildSettings() {
    const box = this._root.getElementById("setsec");
    const { P, E } = this._keys();
    box.replaceChildren();
    if (!P.prod.length && !E.prod.length) return;
    const isAdmin = !!this._hass.user?.is_admin;
    const strings = this._cfg.settings?.strings || {};
    const inputs = []; // {id, name, peak, take}
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
      const c = mk("div", { class: "setcard" });
      c.append(mk("h3", {}, st?.attributes.friendly_name || id), mk("div", { class: "eid" }, `${id} · ${this._t(kind)}`));
      const nameRow = mk("div", { class: "setrow" });
      const nameId = `set-name-${id}`;
      const name = mk("input", { type: "text", id: nameId, maxlength: "60", placeholder: st?.attributes.friendly_name || id });
      name.value = strings[id]?.name || "";
      name.disabled = !isAdmin;
      nameRow.append(mk("label", { for: nameId }, this._t("setName")), name);
      c.append(nameRow);
      let peak = null, take = null;
      if (withPeak) {
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
        take.addEventListener("click", () => { const m = this._pmax?.[id]; if (m > 0) peak.value = String(Math.round(m)); });
      }
      box.append(c);
      inputs.push({ id, name, peak });
    };
    P.prod.forEach((id) => card(id, "setPower", true));
    E.prod.forEach((id) => card(id, "setEnergy", false));

    // plant-wide numbers
    const general = this._cfg.settings?.general || {};
    const genInputs = {};
    const gc = mk("div", { class: "setcard" });
    gc.append(mk("h3", {}, this._t("genTitle")));
    for (const [key, label, step, ph] of [
      ["storage_capacity_kwh", "genCap", "0.1", ""], ["price_import", "genPriceImport", "0.001", ""], ["price_feed_in", "genPriceFeed", "0.001", ""],
      ["system_cost_eur", "genCost", "100", ""], ["co2_g_per_kwh", "genCo2", "1", "380"],
    ]) {
      const row = mk("div", { class: "setrow" });
      const id = `set-gen-${key}`;
      const input = mk("input", { type: "number", id, min: "0", step, inputmode: "decimal", placeholder: ph });
      input.value = general[key] > 0 ? String(general[key]) : "";
      input.disabled = !isAdmin;
      row.append(mk("label", { for: id }, this._t(label)), input);
      gc.append(row);
      genInputs[key] = input;
    }
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
      for (const { id, name, peak } of inputs) {
        const e = {};
        if (name.value.trim()) e.name = name.value.trim();
        const pv = peak ? parseFloat(peak.value.replace(",", ".")) : NaN;
        if (pv > 0) e.peak = pv;
        payload[id] = e;
      }
      save.disabled = true;
      status.textContent = "";
      try {
        const generalPayload = {};
        for (const [key, input] of Object.entries(genInputs)) {
          const v = parseFloat(input.value.replace(",", "."));
          generalPayload[key] = v > 0 ? v : 0; // 0 clears the value
        }
        const res = await this._hass.callWS({ type: "pv_assistant/set_settings", strings: payload, general: generalPayload });
        this._cfg.settings = res;
        status.textContent = this._t("setSaved");
        this._lastPwr = null; this._last = null;
        this._render(); this._renderPower(); this._draw(); this._drawYears();
      } catch (err) {
        status.textContent = `${this._t("setError")}: ${err?.message || err}`;
      }
      save.disabled = false;
    });
  }

  // ---------------------------------------------------------------- analysis tab

  _buildAnalysis() {
    const box = this._root.getElementById("ana");
    const { P } = this._keys();
    box.replaceChildren();
    if (!P.prod.length) return;
    if (!this._adays) this._adays = 30;
    box.innerHTML = `<div class="filters" id="aranges"></div><ul class="hints" id="ahints"></ul><div class="tiles" id="atiles"></div>
      <h3 class="ch">${esc(this._t("anaStrings"))}</h3><div class="chart" id="astrings"></div>
      <h3 class="ch" id="aheath">${esc(this._t("anaHeat"))}</h3><div class="chart" id="aheat"></div>
      <h3 class="ch">${esc(this._t("anaDays"))}</h3><div class="two" id="adays"></div>
      <h3 class="ch">${esc(this._t("anaForecast"))}</h3><div class="chart" id="afc"></div>
      <h3 class="ch">${esc(this._t("anaForecastDev"))}</h3><div class="chart" id="afd"></div>`;
    const ranges = box.querySelector("#aranges");
    for (const [d, label] of [[7, "d7"], [30, "d30"], [90, "d90"], [365, "d365"]]) {
      const b = document.createElement("button");
      b.textContent = this._t(label);
      b.setAttribute("aria-pressed", String(d === this._adays));
      b.addEventListener("click", () => {
        this._adays = d;
        ranges.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        this._loadAnalysis();
      });
      ranges.append(b);
    }
  }

  async _loadAnalysis() {
    if (!this._hass || !this._root.getElementById("astrings")) return;
    const token = (this._atoken = (this._atoken || 0) + 1);
    const { P, E, G } = this._keys();
    const filt = this._cfg.filtered || {};
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (this._adays - 1));
    const fcStart = new Date(); fcStart.setHours(0, 0, 0, 0); fcStart.setDate(fcStart.getDate() - 60);
    const call = async (ids, from, period, type, units) => {
      ids = [...new Set(ids)];
      if (!ids.length) return {};
      try {
        return await this._hass.callWS({ type: "recorder/statistics_during_period", start_time: from.toISOString(), end_time: new Date().toISOString(), statistic_ids: ids, period, types: [type], units });
      } catch (e) { return {}; }
    };
    this._root.querySelectorAll("#ana .chart").forEach((c) => c.classList.add("loading"));
    const eids = E.prod.concat(E.prod.map((i) => filt[i]).filter(Boolean));
    const [pres, eres, cfg] = await Promise.all([
      call([...P.prod, ...G.irr], start, "hour", "mean", { power: "W" }),
      call(eids, start < fcStart ? start : fcStart, "day", "change", { energy: "kWh" }),
      this._hass.callWS({ type: "pv_assistant/config" }).catch(() => null), // fresh forecast log
    ]);
    if (token !== this._atoken) return;
    if (cfg?.settings) this._cfg.settings = cfg.settings;
    const fcIds = list(this._cfg.forecast_today_energy_sensors);
    const fcHist = fcIds.length ? await this._forecastFromHistory(fcIds) : {};
    if (token !== this._atoken) return;
    this._adata = { pres, eres, start, fcHist };
    this._drawAnalysis();
  }

  // Forecast of past days from the recorder history of the "forecast today" sensors (last value of each day);
  // makes the comparison available right after setup. The log kept by the integration takes precedence.
  async _forecastFromHistory(ids) {
    const tz = this._hass.config?.time_zone;
    const key = localKeyFn(tz);
    const start = new Date(); start.setDate(start.getDate() - 12); start.setHours(0, 0, 0, 0);
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

  _drawAnalysis() {
    const d = this._adata;
    if (!d || !this._root.getElementById("astrings")) return;
    const { P, E, G } = this._keys();
    const { pres, eres, start, fcHist } = d;
    const filt = this._cfg.filtered || {};
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const key = localKeyFn(tz);
    const num = (v, dec = 1) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const root = this._root;
    const peakOf = (id) => { const v = this._cfg.settings?.strings?.[id]?.peak; return v > 0 ? v : null; };
    const dayLabel = (day) => `${day.slice(8, 10)}.${day.slice(5, 7)}.`;
    const dayLabelY = (day) => `${day.slice(8, 10)}.${day.slice(5, 7)}.${day.slice(0, 4)}`; // with year where a range can span years
    const todayKey = key(Date.now()).day;

    // daily production from the energy statistics (counters; the filtered copy wins)
    const actual = new Map();
    for (const id of E.prod) {
      const rows = (eres[filt[id]] || []).length ? eres[filt[id]] : eres[id] || [];
      for (const r of rows) if (r.change != null) { const day = key(r.start).day; actual.set(day, (actual.get(day) || 0) + r.change); }
    }

    // hourly mean power per string: Map ts -> W
    const series = P.prod.map((id) => {
      const m = new Map();
      for (const r of pres[id] || []) if (r.mean != null) m.set(r.start, Math.max(r.mean, 0));
      return { id, name: this._read(id).name, peak: peakOf(id), m };
    });
    for (const s of series) s.kwh = [...s.m.values()].reduce((a, v) => a + v, 0) / 1000;
    const peaked = series.filter((s) => s.peak);

    // like-for-like: only hours in which every string with a peak has data
    let common = null;
    if (peaked.length) {
      common = [...peaked[0].m.keys()].filter((ts) => peaked.every((s) => s.m.has(ts)));
      for (const s of peaked) s.spec = common.reduce((a, ts) => a + s.m.get(ts), 0) / 1000 / (s.peak / 1000);
    }
    const hints = [];
    let weak = new Set();
    if (peaked.length >= 2 && common.length >= 24) {
      const med = median(peaked.map((s) => s.spec));
      for (const s of peaked) if (med > 0 && s.spec < med * 0.85) {
        weak.add(s.id);
        const top = peaked.reduce((a, x) => (x.spec > a.spec ? x : a), peaked[0]);
        hints.push(this._t("anaWeakHint").replace(/\{name\}/g, s.name).replace("{rel}", String(Math.round((s.spec / top.spec) * 100))).replace("{best}", top.name)
          .replace("{own}", num(s.spec)).replace("{top}", num(top.spec)).replace("{med}", num(med)));
      }
    }

    // string cards
    const sorted = [...series].sort((a, b) => (b.spec ?? -1) - (a.spec ?? -1) || b.kwh - a.kwh);
    const bestSpec = Math.max(0, ...peaked.map((s) => s.spec));
    const box = root.getElementById("astrings");
    box.classList.remove("loading");
    box.innerHTML = sorted.map((s) => {
      const w = s.spec && bestSpec ? (s.spec / bestSpec) * 100 : 0;
      const sub = s.spec != null
        ? `${esc(num(s.spec))} ${esc(this._t("anaSpec"))} · ${esc(String(Math.round(w)))} % ${esc(this._t("anaRel"))}${weak.has(s.id) ? ` · <span class="weak">${esc(this._t("anaWeak"))}</span>` : ""}`
        : `<span class="muted">–</span>`;
      return `<div class="strow"><div><div>${esc(s.name)}</div><div class="muted" style="font-size:.85em">${sub}</div></div>
        <div class="gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(w)}"><i style="width:${w.toFixed(1)}%"></i></div>
        <div><b>${esc(num(s.kwh))} kWh</b></div></div>`;
    }).join("") + (peaked.length ? "" : `<p class="note">${esc(this._t("anaNoPeak"))}</p>`);

    // plant totals per local day and hour
    const total = new Map();
    for (const s of series) for (const [ts, v] of s.m) total.set(ts, (total.get(ts) || 0) + v);
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
    const complete = days.filter((day) => day !== todayKey).map((day) => ({ day, kwh: byDay.get(day).reduce((a, w) => a + w, 0) / 1000 })).filter((x) => x.kwh > 0);
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

    // tiles: production, plant yield (kWh/kWp), best day, performance ratio
    const tiles = [];
    let infoHint = null;
    const powerTotal = series.reduce((a, s) => a + s.kwh, 0);
    // the total comes from the energy counters (same as the Energy dashboard); the power sum is the fallback
    const startDay = key(start.getTime()).day;
    const energyDays = [...actual].filter(([day]) => day >= startDay);
    const energyTotal = energyDays.reduce((a, [, v]) => a + v, 0);
    const prodTotal = energyTotal > 0 ? energyTotal : powerTotal;
    tiles.push([`${num(prodTotal)} kWh`, this._t("anaTotal")]);
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
          infoHint = this._t("anaPrHint").replace("{pr}", num(pr, 0)).replace("{verdict}", verdict);
          hints.push(infoHint);
        }
      }
    }
    if (bySize.length) tiles.push([`${num(bySize[0].kwh)} kWh · ${dayLabelY(bySize[0].day)}`, this._t("anaBestDay")]);
    if (bySize.length > 1) { const w = bySize[bySize.length - 1]; tiles.push([`${num(w.kwh)} kWh · ${dayLabelY(w.day)}`, this._t("anaWorstDay")]); }
    root.getElementById("atiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    root.getElementById("ahints").innerHTML = hints.map((h) => `<li${h === infoHint ? ' class="info"' : ""}>${esc(h)}</li>`).join("");

    // forecast against actual (daily production from the energy statistics)
    const log = { ...(fcHist || {}), ...(this._cfg.settings?.forecast_log || {}) };
    const fcDays = Object.keys(log).filter((day) => day !== todayKey && actual.has(day) && log[day] > 0).sort();
    const tl = { summary: this._t("table"), time: this._t("time") };
    const fv = (v, axis) => `${num(v, axis ? 1 : 2)}${axis ? "" : " kWh"}`;
    const fcBox = root.getElementById("afc"), fdBox = root.getElementById("afd");
    fcBox.classList.remove("loading"); fdBox.classList.remove("loading");
    if (!fcDays.length) {
      for (const b of [fcBox, fdBox]) b.innerHTML = `<p class="empty">${esc(this._t(list(this._cfg.forecast_today_energy_sensors).length ? "anaNoForecastYet" : "anaNoForecast"))}</p>`;
    } else {
      const cats = fcDays.map(dayLabel);
      const fc = fcDays.map((day) => log[day]), ist = fcDays.map((day) => actual.get(day));
      const dev = fcDays.map((day, i) => ((ist[i] - fc[i]) / fc[i]) * 100);
      categoryBarChart(fcBox, {
        categories: cats,
        series: [{ name: this._t("fcForecast"), color: "--pva-s1", values: fc }, { name: this._t("fcActual"), color: "--pva-prod", values: ist }],
        fmtValue: fv, empty: this._t("noData"), tableLabels: tl, label: this._t("anaForecast"),
      });
      categoryBarChart(fdBox, {
        categories: cats,
        series: [{ name: this._t("anaForecastDev"), color: "--pva-pos", colorOf: (v) => (v >= 0 ? "--pva-pos" : "--pva-neg"), values: dev }],
        legendItems: [{ name: this._t("aboveFc"), color: "--pva-pos" }, { name: this._t("belowFc"), color: "--pva-neg" }],
        fmtValue: (v, axis) => `${v > 0 ? "+" : ""}${num(v, axis ? 0 : 1)} %`, empty: this._t("noData"), tableLabels: tl, label: this._t("anaForecastDev"),
      });
      const mean = dev.reduce((a, v) => a + v, 0) / dev.length;
      const hit = (dev.filter((v) => Math.abs(v) <= 20).length / dev.length) * 100;
      root.getElementById("atiles").insertAdjacentHTML("beforeend",
        [[`${mean > 0 ? "+" : ""}${num(mean, 1)} %`, this._t("fcAvgDev")], [`${num(hit, 0)} %`, this._t("fcHit")], [String(fcDays.length), this._t("fcDays")]]
          .map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join(""));
    }
  }
}
customElements.define("pv-assistant-panel", PVAssistantPanel);
