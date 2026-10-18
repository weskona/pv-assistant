import { lineChart, barChart, categoryBarChart } from "./pv-assistant-charts.js";
import { localKeyFn, median, plateauDays, heatmap, orientationFactor, expectedYield, sunPosition } from "./pv-assistant-analysis.js";

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
    gridImp: "Netzbezug", gridImpShort: "Netz", house: "Hausverbrauch", houseDerived: "Hausverbrauch (berechnet)", houseMixed: "Hausverbrauch (teils berechnet)", houseShort: "Haus",
    forecastTab: "Prognose", fcSoFar: "Bisher erzeugt (heute)", fcRangeDays: "Tage",
    stoSocMax: "Tageshöchstwert", stoSocAvg: "Tagesdurchschnitt", stoSocMin: "Tagestiefstwert", stoPeakPower: "Spitzenleistung (Tagesspitzen)", stoPeakOut: "Aus Speicher (Spitze)", stoPeakIn: "In Speicher (Spitze)",
    pwrTipNote: "Prozentwerte im Tooltip: bei einem String der Anteil an seinem eingetragenen Peak, bei der Gesamtanlage der Anteil an der Summe der Peaks, darunter der Anteil jedes Strings an der Gesamtleistung (zusammen 100 %).",
    pwrChart: "Leistung je String",
    powerChartMean: "Leistung (Tagesmittel)", effChartPeak: "Effektive Leistung (%) – Tagesspitze",
    effNoteLong: "Tagesspitze = höchstes Stundenmittel des Tages ÷ eingetragener Peak × 100 (Tagesmittel würden die Nacht mitzählen und nie in die Nähe des Peaks kommen). Die Gesamtanlage ist die höchste Summe aller Strings in einer Stunde, nur für Strings mit eingetragenem Peak.",
    flowTitle: "Energiefluss", flowSolar: "PV", flowHome: "Haus", flowGrid: "Netz", flowBattery: "Speicher",
    storageTab: "Speicher", stoPower: "Speicherleistung", stoEnergy: "Geladen und entladen", stoMaxCharge: "Max. Ladeleistung", stoMaxDis: "Max. Entladeleistung", stoAvgSoc: "Ø Ladestand", stoNow: "Ladestand jetzt", stoNoCap: "Trage die Speicherkapazität im Tab „Einstellungen“ unter „Anlage“ ein, dann werden die Zyklen berechnet.", stoNote: "Wirkungsgrad = entladen ÷ geladen im Zeitraum; er ist nur aussagekräftig, wenn der Ladestand am Anfang und Ende ähnlich ist (längere Zeiträume).",
    socChart: "Batterieladestand (%)", socName: "Ladestand", autarky: "Autarkie", selfShare: "Eigenverbrauchsquote", shift: "Verschiebepotenzial",
    storEff: "Speicher-Wirkungsgrad", cycles: "Speicher-Zyklen", saving: "Ersparnis (Eigenverbrauch)", revenue: "Einspeiseerlös", co2: "CO₂ vermieden",
    socRange: "Ladestand min–max", pr: "Performance Ratio",
    analysisTab: "Analyse", d90: "90 Tage", d365: "12 Monate", dYear: "Dieses Jahr", anaHeatWeek: "Ø je Tag und Woche", anaStrings: "String-Vergleich", anaHeat: "Ertrag je Stunde (kWh)", anaDays: "Beste und schwächste Tage", anaForecast: "Prognose gegen Ist (kWh je Tag)", anaForecastMonth: "Prognose gegen Ist (kWh je Monat)", anaForecastDev: "Abweichung Ist zur Prognose (%)",
    anaYield: "Ertrag", anaSpec: "kWh/kWp", anaRel: "vom besten String", anaWeak: "schwächer", anaBest: "Beste Tage", anaWorst: "Schwächste Tage", anaDay: "Tag",
    anaPowerDiff: "Die Leistungssensoren ergeben summiert {p} kWh, die Energiezähler {e} kWh ({d} %). Gezeigt wird der Zähler; der String-Vergleich nutzt die Leistung. Abweichungen entstehen durch Aktualisierungsintervalle der Leistungssensoren und Ausfälle.",
    anaTotal: "Erzeugung", anaPlant: "Ertrag der Anlage", anaBestDay: "Bester Tag", anaWorstDay: "Schwächster Tag", anaPr: "Performance Ratio", anaNoPeak: "Trage in den Einstellungen für jeden String den Peak ein, dann werden die Strings nach kWh/kWp verglichen.",
    genFromSensor: "Preis vom Sensor „{name}“ (Config Flow): {value}. Nicht änderbar; ein fester Wert gilt nur, wenn dort kein Preis-Sensor gewählt ist.",
    genMinSoc: "Mindest-Ladestand (%)", genMinSocHint: "Untere Entladegrenze des Speichers. Daraus ergibt sich die nutzbare Kapazität.", genUsable: "Nutzbare Kapazität: {kwh} kWh (Kapazität × (1 − Mindest-Ladestand)).",
    stoUsable: "Nutzbare Kapazität", stoUsableNow: "Nutzbar jetzt",
    genLat: "Breitengrad (optional)", genLon: "Längengrad (optional)",
        invTitle: "Wechselrichter", invHint: "Lege jeden Wechselrichter an und wähle die Leistungssensoren, die zu ihm gehören. Hat er mehrere MPPT-Eingänge mit eigenem Sensor (z. B. String 1 und String 2 eines Hybrid-Wechselrichters), wähle alle diese Sensoren; die Grenze gilt dann für ihre Summe.", invTitleN: "Wechselrichter {n}", invName: "Name", invMax: "Max. Leistung (W)", invSensors: "Zugehörige Leistungssensoren", invAdd: "Wechselrichter hinzufügen",
    setGroups: "Modulstränge", setGroupsHint: "Ein Modulstrang sind Module mit gleicher Ausrichtung und Neigung in Reihe. Trage je Strang Modulzahl, Ausrichtung (Süd = 0°, Ost = −90°, West = 90°), Neigung (0° = flach, 90° = senkrecht) und die Nummer des MPPTs ein, an dem er hängt. Leere Zeilen werden ignoriert.", gTitle: "Modulstrang {n}", gAdd: "Modulstrang hinzufügen", gRemove: "Entfernen", gModules: "Module", gAz: "Azimut (°)", gTilt: "Neigung (°)", gMppt: "MPPT Nr.",
    setModuleWp: "Leistung pro Modul (Wp)", setModulesHint: "Mit den Modulzahlen der Modulstränge und der Modulleistung wird der Peak automatisch berechnet (Module × Wp) und das Feld Max. Leistung gesperrt.",
    setMppts: "Anzahl MPPTs", setMpptsHint: "Nur nötig, wenn dieser Sensor mehrere MPPT-Eingänge zusammenfasst (z. B. 4 bei einem Balkonkraftwerk mit Summensensor). Hängt jeder MPPT an einem eigenen Sensor, leer lassen. Jeder MPPT regelt seine Modulstränge unabhängig; an einem MPPT sollten Stränge gleich ausgerichtet sein.",
        anaFactor: "Ausrichtung erwartet {pct} %", anaOrientUsed: "Die Ausrichtung der Strings ist berücksichtigt (Richtwerte für Mitteleuropa).",
    anaNoOrient: "Trage bei den Strings Ausrichtung und Neigung ein (Einstellungen), dann wird der Vergleich um die Ausrichtung bereinigt (Ost/West erzeugt weniger als Süd).",
    anaAdvPrefix: "Vorschlag für {name}:",
    anaAdvMorning: "Der String fällt vor allem am Vormittag zurück: wahrscheinlich Verschattung aus Osten oder Südosten (Gebäude, Baum, Dachaufbau). Prüfe die Umgebung am Morgen und stutze ggf. Bewuchs.",
    anaAdvMidday: "Der String fällt vor allem mittags zurück: mögliche Ursachen sind Überhitzung, Begrenzung des Wechselrichters oder ein Hindernis im Süden. Prüfe Belüftung und die Einstellung der Einspeisebegrenzung.",
    anaAdvEvening: "Der String fällt vor allem am Nachmittag und Abend zurück: wahrscheinlich Verschattung aus Westen oder Südwesten. Prüfe die Umgebung am Abend und stutze ggf. Bewuchs.",
    anaAdvFlat: "Der Rückstand zieht sich gleichmäßig durch den Tag: Reinige die Module, prüfe Steckverbindungen, Optimierer und den Wechselrichter-Eingang und kontrolliere, ob der eingetragene Peak stimmt.",
    anaAdvOrient: "Tipp: Trage Ausrichtung und Neigung des Strings ein, damit der Vergleich fairer wird.",
    anaWeakHint: "{name} erzeugt pro installiertem kWp nur {rel} % des besten Strings ({best}): {own} gegen {top} kWh/kWp. Der typische String liegt bei {med} kWh/kWp. Mögliche Ursachen: Verschattung, Verschmutzung, andere Ausrichtung oder Neigung, falsch eingetragener Peak, Defekt.",
    anaInvLimitHint: "{name}: An {n} Tagen bleibt die Leistung mehrere Stunden auf dem Höchstwert nahe der Wechselrichter-Grenze ({inv} W): hier begrenzt wahrscheinlich der Wechselrichter, Ertrag darüber geht verloren.", anaOverbuild: "{name}: Die Modulleistung ({peak} W) liegt bei {pct} % der Wechselrichter-Leistung ({inv} W).", anaOverbuildHigh: " Das ist eine starke Überbauung, an sonnigen Tagen wird die Spitze abgeschnitten.", anaOverbuildLow: " Der Wechselrichter hat Reserve.", anaMpptMismatch: "{name}: An MPPT {mppt} hängen Modulstränge mit unterschiedlicher Ausrichtung. Sie teilen sich einen Arbeitspunkt, das kostet Ertrag (Mismatch). Ideal ist je Ausrichtung ein eigener MPPT.",
    anaPlateauHint: "An {n} Tagen bleibt die Leistung der Gesamtanlage mehrere Stunden flach auf dem Höchstwert. Mögliche Begrenzung durch Wechselrichter oder Einspeisebegrenzung (nur ein Hinweis, keine Diagnose).",
    anaPrHint: "Performance Ratio der Gesamtanlage {pr} % – {verdict} Sie vergleicht den Ertrag mit dem, was bei der gemessenen Einstrahlung theoretisch möglich wäre (typisch 75 bis 85 %).", anaPrLow: "das liegt unter dem typischen Bereich. Mögliche Ursachen: Verschattung, Verschmutzung, Wechselrichter-Begrenzung, zu hoch eingetragene Peaks oder ein ungenauer Einstrahlungssensor.", anaPrOk: "das liegt im typischen Bereich.", anaPrHigh: "das liegt über dem typischen Bereich (prüfe, ob die Peaks zu niedrig eingetragen sind).",
    anaNoForecastYet: "Noch keine abgeschlossenen Tage mit Prognose. Das Panel liest die Prognose der letzten Tage aus dem Verlauf der „Prognose heute“-Sensoren und merkt sie sich ab jetzt täglich; der Vergleich erscheint spätestens morgen. Prüfe, ob „Prognose heute“ in Schritt 3 gewählt ist (nicht nur „morgen“ oder „Rest heute“).",
    anaNoForecast: "Noch keine Prognose-Daten. Wähle im Config Flow (Schritt 3) Prognose-Sensoren; das Panel merkt sich die Prognose dann täglich.",
    yBenefit: "Nutzen", yBenefit12: "Nutzen (letzte 12 Monate)", yPaidPct: "Amortisiert zu", yPaidLeft: "Noch bis zur Amortisation", yYears: "Jahre", yTrend: "Trend der Jahressumme", yTrendUnit: "pro Jahr",
    aboveFc: "über Prognose", belowFc: "unter Prognose",
    fcAvgDev: "Ø Abweichung", fcHit: "Trefferquote (±20 %)", fcDays: "Tage mit Prognose", fcForecast: "Prognose", fcActual: "Ist", anaLoading: "Lade Analyse …",
    genTitle: "Anlage", genCap: "Speicherkapazität (kWh)", genPriceImport: "Strompreis Netzbezug (€/kWh)", genPriceFeed: "Einspeisevergütung (€/kWh)",
    genCost: "Anlagenkosten (€)", genCo2: "CO₂-Faktor des Strommix (g/kWh)",
    genHint: "Die Preise gelten nur, wenn im Config Flow kein Preis-Sensor gewählt wurde. Standort: leer = Standort von Home Assistant, genutzt für die Sonnenstand-Auswertung der Strings. Kapazität: für die Zyklen des Speichers. Kosten: für die Amortisation. CO₂-Faktor: Standard 380 g/kWh.",
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
    gridImp: "Grid import", gridImpShort: "Grid", house: "House consumption", houseDerived: "House consumption (calculated)", houseMixed: "House consumption (partly calculated)", houseShort: "House",
    forecastTab: "Forecast", fcSoFar: "Produced so far (today)", fcRangeDays: "days",
    stoSocMax: "Daily high", stoSocAvg: "Daily average", stoSocMin: "Daily low", stoPeakPower: "Peak power (daily peaks)", stoPeakOut: "From storage (peak)", stoPeakIn: "Into storage (peak)",
    pwrTipNote: "Percentages in the tooltip: for a string the share of its entered peak, for the plant the share of the sum of the peaks, below it the share of each string in the plant power (adds up to 100 %).",
    pwrChart: "Power per string",
    powerChartMean: "Power (daily mean)", effChartPeak: "Effective power (%) – daily peak",
    effNoteLong: "Daily peak = highest hourly mean of the day ÷ entered peak × 100 (daily means would include the night and never get near the peak). The whole plant is the highest sum of all strings within an hour, only for strings with an entered peak.",
    flowTitle: "Energy flow", flowSolar: "Solar", flowHome: "Home", flowGrid: "Grid", flowBattery: "Storage",
    storageTab: "Storage", stoPower: "Storage power", stoEnergy: "Charged and discharged", stoMaxCharge: "Max charge power", stoMaxDis: "Max discharge power", stoAvgSoc: "Avg level", stoNow: "Level now", stoNoCap: "Enter the storage capacity in the Settings tab under \"Plant\" to get the cycles.", stoNote: "Efficiency = discharged ÷ charged in the range; it is only meaningful when the level at the start and end is similar (longer ranges).",
    socChart: "Battery level (%)", socName: "Level", autarky: "Autarky", selfShare: "Self-consumption rate", shift: "Shifting potential",
    storEff: "Storage efficiency", cycles: "Storage cycles", saving: "Savings (self-consumption)", revenue: "Feed-in revenue", co2: "CO₂ avoided",
    socRange: "Level min–max", pr: "Performance ratio",
    analysisTab: "Analysis", d90: "90 days", d365: "12 months", dYear: "This year", anaHeatWeek: "avg per day and week", anaStrings: "String comparison", anaHeat: "Yield per hour (kWh)", anaDays: "Best and weakest days", anaForecast: "Forecast vs actual (kWh per day)", anaForecastMonth: "Forecast vs actual (kWh per month)", anaForecastMonth: "Forecast vs actual (kWh per month)", anaForecastDev: "Deviation of actual from forecast (%)",
    anaYield: "Yield", anaSpec: "kWh/kWp", anaRel: "of the best string", anaWeak: "weaker", anaBest: "Best days", anaWorst: "Weakest days", anaDay: "Day",
    anaPowerDiff: "The power sensors add up to {p} kWh, the energy counters to {e} kWh ({d} %). The counter is shown; the string comparison uses power. Differences come from the update intervals of the power sensors and outages.",
    anaTotal: "Production", anaPlant: "Plant yield", anaBestDay: "Best day", anaWorstDay: "Weakest day", anaPr: "Performance ratio", anaNoPeak: "Enter the peak of each string in the settings and the strings are compared by kWh/kWp.",
    genFromSensor: "Price from the sensor \"{name}\" (config flow): {value}. Not editable; a fixed value only applies when no price sensor is chosen there.",
    genMinSoc: "Minimum level (%)", genMinSocHint: "Lower discharge limit of the storage. It gives the usable capacity.", genUsable: "Usable capacity: {kwh} kWh (capacity × (1 − minimum level)).",
    stoUsable: "Usable capacity", stoUsableNow: "Usable now",
    genLat: "Latitude (optional)", genLon: "Longitude (optional)",
        invTitle: "Inverters", invHint: "Add every inverter and choose the power sensors that belong to it. If it has several MPPT inputs with their own sensor (e.g. string 1 and string 2 of a hybrid inverter), choose all of them; the limit then applies to their sum.", invTitleN: "Inverter {n}", invName: "Name", invMax: "Max. power (W)", invSensors: "Power sensors of this inverter", invAdd: "Add inverter",
    setGroups: "Module strings", setGroupsHint: "A module string is modules in series with the same orientation and tilt. For each string enter the module count, orientation (south = 0°, east = −90°, west = 90°), tilt (0° = flat, 90° = vertical) and the number of the MPPT it is connected to. Empty rows are ignored.", gTitle: "Module string {n}", gAdd: "Add module string", gRemove: "Remove", gModules: "Modules", gAz: "Azimuth (°)", gTilt: "Tilt (°)", gMppt: "MPPT no.",
    setModuleWp: "Power per module (Wp)", setModulesHint: "With the module counts of the strings and the module power the peak is calculated automatically (modules × Wp) and the max. power field is locked.",
    setMppts: "Number of MPPTs", setMpptsHint: "Only needed if this sensor combines several MPPT inputs (e.g. 4 for a balcony plant with a sum sensor). If every MPPT has its own sensor, leave empty. Each MPPT tracks its module strings independently; strings on one MPPT should face the same way.",
        anaFactor: "orientation expects {pct} %", anaOrientUsed: "The orientation of the strings is taken into account (rough values for central Europe).",
    anaNoOrient: "Enter orientation and tilt of the strings (Settings) and the comparison is corrected for the orientation (east/west yields less than south).",
    anaAdvPrefix: "Suggestion for {name}:",
    anaAdvMorning: "The string falls behind mostly in the morning: probably shading from the east or south-east (building, tree, roof structure). Check the surroundings in the morning and trim vegetation if needed.",
    anaAdvMidday: "The string falls behind mostly at midday: possible causes are overheating, inverter limiting or an obstacle to the south. Check ventilation and the feed-in limit setting.",
    anaAdvEvening: "The string falls behind mostly in the afternoon and evening: probably shading from the west or south-west. Check the surroundings in the evening and trim vegetation if needed.",
    anaAdvFlat: "The gap runs evenly through the day: clean the modules, check connectors, optimizers and the inverter input, and verify the entered peak.",
    anaAdvOrient: "Tip: enter orientation and tilt of the string to make the comparison fairer.",
    anaWeakHint: "{name} produces only {rel} % per installed kWp of the best string ({best}): {own} vs {top} kWh/kWp. The typical string is at {med} kWh/kWp. Possible causes: shading, dirt, different orientation or tilt, wrong peak entered, defect.",
    anaInvLimitHint: "{name}: on {n} days the power stays at its maximum close to the inverter limit ({inv} W) for several hours: the inverter is probably limiting there and yield above it is lost.", anaOverbuild: "{name}: the module power ({peak} W) is {pct} % of the inverter power ({inv} W).", anaOverbuildHigh: " That is a strong oversizing, on sunny days the peak is clipped.", anaOverbuildLow: " The inverter has headroom.", anaMpptMismatch: "{name}: module strings with different orientations hang on MPPT {mppt}. They share one operating point, which costs yield (mismatch). Ideally each orientation has its own MPPT.",
    anaPlateauHint: "On {n} days the power of the whole plant stays flat at its maximum for several hours. Possible limit by the inverter or a feed-in limit (only a hint, not a diagnosis).",
    anaPrHint: "Performance ratio of the whole plant {pr} % – {verdict} It compares the yield with what would be theoretically possible at the measured irradiance (typically 75 to 85 %).", anaPrLow: "that is below the typical range. Possible causes: shading, dirt, inverter limiting, peaks entered too high or an inaccurate irradiance sensor.", anaPrOk: "that is within the typical range.", anaPrHigh: "that is above the typical range (check whether the peaks are entered too low).",
    anaNoForecastYet: "No completed days with a forecast yet. The panel reads the forecast of the last days from the history of the \"forecast today\" sensors and remembers it daily from now on; the comparison appears tomorrow at the latest. Check that \"forecast today\" is selected in step 3 (not only \"tomorrow\" or \"remaining today\").",
    anaNoForecast: "No forecast data yet. Choose forecast sensors in the config flow (step 3); the panel then remembers the forecast every day.",
    yBenefit: "Benefit", yBenefit12: "Benefit (last 12 months)", yPaidPct: "Paid back", yPaidLeft: "Still until payback", yYears: "years", yTrend: "Trend of the yearly total", yTrendUnit: "per year",
    aboveFc: "above forecast", belowFc: "below forecast",
    fcAvgDev: "Avg. deviation", fcHit: "Hit rate (±20 %)", fcDays: "Days with forecast", fcForecast: "Forecast", fcActual: "Actual", anaLoading: "Loading analysis …",
    genTitle: "Plant", genCap: "Storage capacity (kWh)", genPriceImport: "Grid import price (€/kWh)", genPriceFeed: "Feed-in tariff (€/kWh)",
    genCost: "System cost (€)", genCo2: "CO₂ factor of the power mix (g/kWh)",
    genHint: "The prices only apply when no price sensor was chosen in the config flow. Location: empty = Home Assistant location, used for the sun-position analysis of the strings. Capacity: for the storage cycles. Cost: for the payback. CO₂ factor: default 380 g/kWh.",
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
// statistics rows of a sensor merged with its filtered copy per bucket (the copy wins where it has data;
// it is usually younger, so older buckets must still come from the original sensor)
const mergedRows = (res, id, filt, field) => {
  const m = new Map();
  for (const r of res[id] || []) if (r[field] != null) m.set(r.start, r);
  for (const r of (filt[id] && res[filt[id]]) || []) if (r[field] != null) m.set(r.start, r);
  return [...m.values()].sort((a, b) => a.start - b.start);
};

// module strings of a plant unit; older versions stored one or two orientations directly on the entry
const groupsOf = (o) => {
  if (!o) return [];
  if (Array.isArray(o.groups) && o.groups.length) return o.groups;
  const out = [];
  const two = o.azimuth2 != null && o.tilt2 != null;
  const total = o.modules > 0 ? o.modules : null;
  const m2 = two ? (o.modules2 != null ? o.modules2 : total != null ? Math.round(total / 2) : null) : null;
  if (o.azimuth != null || o.tilt != null || total != null) out.push({ modules: total != null ? total - (m2 || 0) : null, azimuth: o.azimuth ?? null, tilt: o.tilt ?? null });
  if (two) out.push({ modules: m2, azimuth: o.azimuth2, tilt: o.tilt2 });
  return out;
};

// inverters of the plant: the saved ones plus, from older versions, a single-sensor inverter for every sensor with its own inverter power
const invertersOf = (settings, ids) => {
  const out = [];
  const taken = new Set();
  for (const inv of settings?.inverters || []) {
    const sensors = (inv.sensors || []).filter((id) => ids.includes(id) && !taken.has(id));
    sensors.forEach((id) => taken.add(id));
    out.push({ name: inv.name || "", max_w: inv.max_w || 0, sensors });
  }
  for (const id of ids) {
    const w = settings?.strings?.[id]?.inverter_w;
    if (!taken.has(id) && w > 0) out.push({ name: settings.strings[id].name || "", max_w: w, sensors: [id] });
  }
  return out;
};

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
          /* all key figures of a tab sit together in one card */
          .tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:16px 20px; margin:0 0 16px; padding:18px 22px;
                   background:var(--g-panel-bg); border:1px solid var(--g-line); border-radius:30px; }
          .tiles:empty { display:none; }
          .tile { display:flex; flex-direction:column; gap:3px; min-width:0; }
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
          /* energy flow */
          .flowcard { padding:8px 12px; }
          svg.flow { display:block; width:100%; max-width:640px; margin:0 auto; color:var(--g-text); }
          svg.flow .track { fill:none; stroke:currentColor; stroke-width:3; opacity:.12; }
          svg.flow .run { fill:none; stroke-linecap:round; stroke-dasharray:1 14; animation:pvaflow 1.1s linear infinite; }
          @keyframes pvaflow { to { stroke-dashoffset:-15; } }
          @media (prefers-reduced-motion: reduce) { svg.flow .run { animation:none; stroke-dasharray:none; opacity:.8; } }
          svg.flow .flowring { fill:var(--g-tile); stroke-width:3; }
          svg.flow text { fill:var(--g-text); font-family:inherit; }
          svg.flow .flowname { fill:var(--g-muted); font-size:13px; letter-spacing:.06em; text-transform:uppercase; font-weight:600; }
          svg.flow .flowval { font-size:19px; font-weight:700; }
          svg.flow .flowsub { fill:var(--g-muted); font-size:12px; }
          svg.flow .flowlbl { font-size:13px; font-weight:600; }
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
          /* plain number entry without the up / down arrows */
          .setrow input[type="number"] { -moz-appearance:textfield; appearance:textfield; }
          .setrow input[type="number"]::-webkit-outer-spin-button, .setrow input[type="number"]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
          .setrow .hint { grid-column:2; color:var(--secondary-text-color); font-size:.85em; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
          .setsub { margin:14px 0 2px; font-weight:600; }
          .setgh { margin-bottom:8px; color:var(--secondary-text-color); font-size:.85em; }
          .setgroup { border:1px solid var(--g-line); border-radius:16px; padding:10px 14px; margin:8px 0; }
          .setgroup .ghead { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px; }
          .setgroup .gtitle { font-weight:600; }
          .setgroup .ggrid { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:8px 12px; }
          .setgroup .gfield { display:flex; flex-direction:column; gap:4px; color:var(--secondary-text-color); font-size:.9em; }
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
        <main><div id="now" role="tabpanel"></div><div id="pwr" role="tabpanel"></div><div id="ana" role="tabpanel"></div><div id="sto" role="tabpanel"></div><div id="fcs" role="tabpanel"></div><div id="hist" role="tabpanel"></div><div id="yearsec" role="tabpanel"></div><div id="setsec" role="tabpanel"></div></main>`;
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
      this._raf = requestAnimationFrame(() => { if (this._tab === "history") this._draw(); if (this._tab === "years") this._drawYears(); if (this._tab === "analysis") this._drawAnalysis(); if (this._tab === "storage") this._drawStorage(); if (this._tab === "forecast") this._drawForecast(); if (this._tab === "power") this._drawPowerChart(); });
    });
    this._ro.observe(this);
    this._timer = setInterval(() => { if (this._hist) this._loadHistory(); if (this._yearsOn) this._loadYears(); if (this._tab === "storage") this._loadStorage(); if (this._tab === "forecast") this._loadForecast(); if (this._tab === "power") this._loadPowerChart(); this._loadPowerMax(); }, 5 * 60 * 1000);
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
    this._buildStorage();
    this._buildForecast();
    this._flowBuilt = false;
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
    const now = this._root.getElementById("now");
    if (!now.querySelector("#nowcards")) now.innerHTML = '<div id="flow"></div><div id="nowcards"></div>';
    if (html !== this._last) { this._last = html; now.querySelector("#nowcards").innerHTML = html; }
    this._renderFlow();
    this._renderPower();
  }

  // ---------------------------------------------------------------- energy flow (current values)

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
    if (!this._keys().P.prod.length) { box.replaceChildren(); this._flowBuilt = false; return; }
    const NS = "http://www.w3.org/2000/svg";
    const el = (tag, attrs = {}, text) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text !== undefined) n.textContent = text; return n; };
    if (!this._flowBuilt) {
      this._flowBuilt = true;
      this._flow = {};
      box.innerHTML = `<h2>${esc(this._t("flowTitle"))}</h2>`;
      const card = document.createElement("div");
      card.className = "card flowcard";
      const svg = el("svg", { viewBox: "0 0 640 425", class: "flow", role: "img", "aria-label": this._t("flowTitle") });
      // flows: [key, path, color, label position]; every path runs from source to destination
      const flows = [
        ["sh", "M320,96 L320,154", "--pva-direct", [330, 130, "start"]],
        ["gh", "M156,200 L274,200", "--pva-grid", [215, 190, "middle"]],
        ["bh", "M320,298 L320,246", "--pva-bout", [330, 278, "start"]],
        ["sg", "M284,66 C170,86 110,116 110,154", "--pva-feed", [172, 94, "middle"]],
        ["sb", "M360,56 C620,56 620,342 364,342", "--pva-bin", [572, 205, "start"]],
      ];
      for (const [key, d, color, [x, y, anchor]] of flows) {
        svg.append(el("path", { d, class: "track" }));
        const run = el("path", { d, class: "run", stroke: `var(${color})`, visibility: "hidden" });
        const label = el("text", { x, y, "text-anchor": anchor, class: "flowlbl" });
        svg.append(run, label);
        this._flow[key] = { run, label };
      }
      const nodes = [
        ["solar", 320, 48, "--pva-prod", this._t("flowSolar")],
        ["home", 320, 200, "--pva-house", this._t("flowHome")],
        ["grid", 110, 200, "--pva-grid", this._t("flowGrid")],
        ["bat", 320, 342, "--pva-bout", this._t("flowBattery")],
      ];
      for (const [key, x, y, color, name] of nodes) {
        const g = el("g", { class: "flownode" });
        g.append(el("circle", { cx: x, cy: y, r: 44, stroke: `var(${color})`, class: "flowring" }));
        g.append(el("text", { x, y: y - 8, "text-anchor": "middle", class: "flowname" }, name));
        const val = el("text", { x, y: y + 14, "text-anchor": "middle", class: "flowval" });
        const sub = el("text", { x, y: y + 66, "text-anchor": "middle", class: "flowsub" }); // below the circle: it is longer than the circle is wide
        g.append(val, sub);
        svg.append(g);
        this._flow[key] = { g, val, sub };
      }
      card.append(svg);
      box.append(card);
    }
    const v = this._flowValues();
    const fmt = (x) => (x >= 1000 ? `${(x / 1000).toLocaleString(this._hass.locale?.language || this._hass.language, { maximumFractionDigits: 2 })} kW` : `${Math.round(x)} W`);
    const direct = Math.max(0, Math.min(v.prod, v.prod - v.feed - v.inn));
    const toBat = Math.min(v.inn, Math.max(0, v.prod - v.feed));
    const f = { sh: direct, gh: v.imp, bh: v.out, sg: v.feed, sb: toBat };
    const max = Math.max(1, ...Object.values(f));
    for (const [key, value] of Object.entries(f)) {
      const { run, label } = this._flow[key];
      const on = value >= 5 && (key === "sg" || key === "gh" ? v.hasGrid : key === "sb" || key === "bh" ? v.hasBat : true);
      run.setAttribute("visibility", on ? "visible" : "hidden");
      run.setAttribute("stroke-width", (3 + 7 * Math.min(1, value / max)).toFixed(1));
      label.textContent = on ? fmt(value) : "";
    }
    const set = (key, val, sub = "") => { this._flow[key].val.textContent = val; this._flow[key].sub.textContent = sub; };
    set("solar", fmt(v.prod));
    set("home", fmt(v.house));
    this._flow.grid.g.style.display = v.hasGrid ? "" : "none";
    this._flow.bat.g.style.display = v.hasBat ? "" : "none";
    if (v.hasGrid) set("grid", fmt(Math.max(v.imp, v.feed)), v.feed > v.imp ? `↑ ${this._t("feed")}` : v.imp > 0 ? `↓ ${this._t("gridImp")}` : "");
    if (v.hasBat) set("bat", fmt(Math.max(v.out, v.inn)), [v.inn > v.out ? `↓ ${this._t("sin")}` : v.out > 0 ? `↑ ${this._t("sout")}` : "", v.soc != null ? `${Math.round(v.soc)} %` : ""].filter(Boolean).join(" · "));
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
      <h3 class="ch" id="pchead">${esc(this._t("powerChart"))} (W)</h3><div class="chart" id="pchart"></div>
      <h3 class="ch" id="xchead">${esc(this._t("effChart"))}</h3><div class="chart" id="xchart"></div>
      <h3 class="ch">${esc(this._t("energyChart"))} (kWh)</h3><div class="chart" id="echart"></div>`;
    const box = h.querySelector("#ranges");
    for (const r of ["today", "yesterday", "d7", "d30", "ytd", "y12"]) {
      const b = document.createElement("button");
      b.textContent = this._t({ ytd: "dYear", y12: "d365" }[r] || r);
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

  _rangeDef(range) {
    const day = new Date(); day.setHours(0, 0, 0, 0);
    const at = (back) => { const d = new Date(day); d.setDate(d.getDate() - back); return d; };
    const r = range || this._range;
    if (r === "ytd" || r === "y12") { // calendar year so far / last 12 months (month aligned, like the Energy dashboard)
      const s = r === "ytd" ? new Date(day.getFullYear(), 0, 1) : new Date(day.getFullYear(), day.getMonth() - 11, 1);
      const tomorrow = new Date(day); tomorrow.setDate(tomorrow.getDate() + 1);
      const H = 3600e3;
      return { t0: s.getTime(), t1: tomorrow.getTime(), end: Date.now(), days: Math.round((tomorrow - s) / (24 * H)), long: true,
        pPeriod: "day", pStep: 24 * H, eBucket: "month", eStep: 30 * 24 * H, tickStep: (365.25 / 12) * 24 * H };
    }
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
    const [pres, eres, hres, dres] = await Promise.all([
      this._stats(powerIds, rd.pPeriod, "mean", { power: "W" }, rd),
      this._stats(energyAll, rd.long ? "month" : rd.eBucket === 3600e3 ? "hour" : "day", "change", { energy: "kWh" }, rd),
      rd.long ? this._stats(P.prod, "hour", "mean", { power: "W" }, rd) : null, // for the daily peaks of the effective power
      rd.long ? this._stats(energyAll, "day", "change", { energy: "kWh" }, rd) : null, // daily mean power = daily energy / 24 h
    ]);
    if (token !== this._token) return; // a newer range was requested meanwhile
    this._data = { rd, P, E, G, pres, eres, filt, hres, dres };
    this._draw();
  }

  _draw() {
    const d = this._data;
    if (!d || !this._hist) return;
    const { rd, P, E, G, pres, eres, filt, hres, dres } = d;
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
    const pick = (id, field) => mergedRows(eres, id, filt, field);
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
    // A measured house consumption is only trusted in buckets where it is plausible (at least what came from the grid
    // and the storage); missing or too small buckets (e.g. a young sensor) use the energy balance of the production side.
    const reconcile = (measured, imp, dis, prod, feed, chg, tol) => {
      const house = new Map(), direct = new Map();
      let fallback = 0;
      for (const [ts, v] of prod) {
        const i = imp.get(ts) || 0, o = dis.get(ts) || 0, m = measured.get(ts);
        if (m != null && m >= i + o - tol) {
          house.set(ts, m);
          direct.set(ts, Math.min(v, Math.max(0, m - i - o)));
        } else {
          house.set(ts, Math.max(0, v + i + o - (feed.get(ts) || 0) - (chg.get(ts) || 0)));
          fallback++;
        }
      }
      for (const [ts, m] of measured) if (!house.has(ts)) house.set(ts, m);
      return { house, direct, mixed: fallback > 0 };
    };
    const merge = (a, b, sign = 1) => { const m = new Map(a); for (const [k, v] of b) add(m, k, sign * v); return m; };

    // ---- power lines
    // year ranges: the mean power of a day is its energy / 24 h. That is exact and keeps the direction of signed sensors
    // (a daily mean of a signed power sensor would cancel import against export and charging against discharging)
    const Pp = rd.long ? E : P;
    const Gp = rd.long ? { ...G, impP: G.impE, houseP: G.houseE } : G;
    const pr = rd.long
      ? (id) => mergedRows(dres || {}, id, filt, "change").map((r) => ({ start: r.start, mean: (r.change * 1000) / 24 }))
      : (id) => get(pres, id, "mean");
    // feed-in power: a sensor that reports feed-in as negative values is inverted; the other
    // direction (import) is not feed-in and counts as 0
    const feedFn = Pp.invFeed ? (v) => Math.max(-v, 0) : (v) => Math.max(v, 0);
    // single-direction sensors (production, storage in, storage out) only count positive values;
    // sensors with a sign belong in the combined storage field
    const nz = (v) => Math.max(v, 0);
    // storage in/out sensors that report their direction as negative values: use the magnitude
    const ns = Pp.absStorage ? (v) => Math.abs(v) : nz;
    const pProd = sum(Pp.prod, pr, "mean", nz), pFeed = sum(Pp.feed, pr, "mean", feedFn);
    const pSin = sum(Pp.sin, pr, "mean", ns), pSout = sum(Pp.sout, pr, "mean", ns);
    const pComb = sum(Pp.comb, pr, "mean", (v) => (Pp.inv ? -v : v));
    let pNet = merge(merge(pSout, pSin, -1), pComb);
    // PV used directly = production - feed-in - charging power (never below 0)
    const cP = comb(Pp.comb, pr, "mean", Pp.inv);
    const pCharge = merge(pSin, cP.neg);
    const pDirect = new Map();
    for (const [ts, v] of pProd) pDirect.set(ts, Math.min(v, Math.max(0, v - (pFeed.get(ts) || 0) - (pCharge.get(ts) || 0)))); // never above the production
    const pNetParts = [...each(Pp.sout, pr, "mean", ns), ...each(Pp.sin, pr, "mean", (v) => -ns(v)), ...each(Pp.comb, pr, "mean", (v) => (Pp.inv ? -v : v))];
    let pDirectParts = [
      { name: this._t("production"), values: pProd },
      { name: `− ${this._t("feed")}`, values: neg(pFeed) },
      { name: `− ${this._t("sin")}`, values: neg(pCharge) },
    ];
    const hasStorageP = Pp.sin.length || Pp.sout.length || Pp.comb.length;
    const toPts = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]);
    // grid import: own sensors, otherwise the positive part of a feed-in sensor that also reports import
    const impP = Gp.impP.length ? sum(Gp.impP, pr, "mean", nz)
      : Pp.invFeed && Pp.feed.length ? sum(Pp.feed, pr, "mean", (v) => Math.max(v, 0)) : null;
    const pDis = merge(pSout, cP.pos); // discharge incl. the discharging part of combined sensors
    const houseMeasuredP = Gp.houseP.length ? sum(Gp.houseP, pr, "mean", nz) : null;
    let houseP = houseMeasuredP;
    if (!houseP && impP) { // energy balance: production + import + discharge - feed-in - charge
      houseP = new Map();
      for (const [ts, v] of pProd) houseP.set(ts, Math.max(0, v + (impP.get(ts) || 0) + (pDis.get(ts) || 0) - (pFeed.get(ts) || 0) - (pCharge.get(ts) || 0)));
    }
    let houseMixedP = false;
    if (houseMeasuredP && impP) { // measured consumption makes the direct consumption exact (where it is plausible)
      const r = reconcile(houseMeasuredP, impP, pDis, pProd, pFeed, pCharge, 50);
      for (const [ts, v] of r.direct) pDirect.set(ts, v);
      houseP = r.house;
      houseMixedP = r.mixed;
      if (!r.mixed) pDirectParts = [
        { name: this._t("house"), values: houseMeasuredP },
        { name: `− ${this._t("gridImp")}`, values: neg(impP) },
        { name: `− ${this._t("sout")}`, values: neg(pDis) },
      ];
    }
    const lines = [
      { name: this._t("production"), short: this._t("production"), color: "--pva-prod", points: toPts(pProd), parts: each(Pp.prod, pr, "mean", nz).map((part, i) => ({ ...part, peak: this._cfg.settings?.strings?.[Pp.prod[i]]?.peak })) },
      { name: this._t("feed"), short: this._t("feed"), color: "--pva-feed", points: toPts(pFeed), parts: each(Pp.feed, pr, "mean", feedFn) },
      { name: this._t("storageNet"), short: this._t("storage"), color: "--pva-bout", colorNeg: "--pva-bin",
        legendItems: [{ name: `${this._t("sout")} (+)`, color: "--pva-bout" }, { name: `${this._t("sin")} (−)`, color: "--pva-bin" }],
        points: hasStorageP ? toPts(pNet) : [], parts: pNetParts },
      { name: this._t("direct"), short: this._t("directShort"), color: "--pva-direct", points: toPts(pDirect), parts: pDirectParts },
      { name: this._t("gridImp"), short: this._t("gridImpShort"), color: "--pva-grid", points: impP ? toPts(impP) : [] },
      { name: houseMeasuredP ? this._t(houseMixedP ? "houseMixed" : "house") : this._t("houseDerived"), short: this._t("houseShort"), color: "--pva-house", points: houseP ? toPts(houseP) : [] },
    ];
    const timeLabels = { summary: this._t("table"), time: this._t("time") };
    const fMon = fm(new Date(rd.t0).getFullYear() === new Date(rd.t1 - 1).getFullYear() ? { month: "short" } : { month: "short", year: "2-digit" });
    const tickFmt = rd.long ? (t) => fMon.format(t + 15 * 24 * 3600e3) : // ticks sit near the start of a month
       rd.days === 1 ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t);
    lineChart(this._root.getElementById("pchart"), {
      series: lines, t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis, 0)}${axis ? "" : " W"}`,
      fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
      empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("powerChart")} (W)`,
    });

    this._root.getElementById("pchead").textContent = `${this._t(rd.long ? "powerChartMean" : "powerChart")} (W)`;
    this._root.getElementById("xchead").textContent = this._t(rd.long ? "effChartPeak" : "effChart");
    // ---- effective power in % of the entered peak (only strings with a peak)
    const peakOf = (id) => { const v = this._cfg.settings?.strings?.[id]?.peak; return v > 0 ? v : null; };
    const peaked = P.prod.filter(peakOf);
    // year ranges: a daily mean includes the night and never gets near the peak, so the highest hourly mean of each day is shown
    const dkey = localKeyFn(tz);
    const dailyMax = (m) => {
      const best = new Map(), first = new Map();
      for (const [ts, v] of m) {
        const day = dkey(ts).day;
        if (v > (best.get(day) ?? -1)) best.set(day, v);
        if (!first.has(day) || ts < first.get(day)) first.set(day, ts);
      }
      return new Map([...best].map(([day, v]) => [first.get(day), v]));
    };
    const hourlyOf = (id) => new Map(get(hres || {}, id, "mean").map((r) => [r.start, Math.max(r.mean, 0)]));
    const effSrc = (id) => (rd.long ? dailyMax(hourlyOf(id)) : each([id], pr, "mean", nz)[0].values);
    const effSeries = peaked.map((id, k) => {
      const m = effSrc(id);
      return { name: this._read(id).name, short: `${this._read(id).name.slice(0, 11)}${this._read(id).name.length > 11 ? "…" : ""}`, color: `--pva-s${(k % 7) + 1}`, id,
        points: toPts(new Map([...m].map(([ts, v]) => [ts, (v / peakOf(id)) * 100]))) };
    });
    if (peaked.length) {
      const sumPeak = peaked.reduce((a, id) => a + peakOf(id), 0), tot = new Map();
      if (rd.long) { // daily peak of the plant: highest hourly sum of the day
        const hourlyTot = new Map();
        for (const id of peaked) for (const [ts, v] of hourlyOf(id)) add(hourlyTot, ts, v);
        for (const [ts, v] of dailyMax(hourlyTot)) tot.set(ts, v);
      } else for (const id of peaked) for (const [ts, v] of each([id], pr, "mean", nz)[0].values) add(tot, ts, v);
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
      n.textContent = this._t(rd.long ? "effNoteLong" : "effNote");
      this._root.getElementById("xchart").append(n);
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
    let houseMixedE = false;
    if (houseMeasuredE && impE) {
      const r = reconcile(houseMeasuredE, impE, eSout, eProd, eFeed, eSin, 0.05);
      for (const [ts, v] of r.direct) eDirect.set(ts, v);
      houseE = r.house;
      houseMixedE = r.mixed;
      if (!r.mixed) eDirectParts = [
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
    if (houseE) bars.push({ name: houseMeasuredE ? this._t(houseMixedE ? "houseMixed" : "house") : this._t("houseDerived"), color: "--pva-house", values: houseE, parts: houseMeasuredE && !houseMixedE ? each(G.houseE, er("change"), "change") : undefined });
    if (rd.long) {
      // one group of bars per month (daily bars would be far too dense for a year)
      const { categories, toArr } = this._monthAxis(rd, tz, fMon);
      categoryBarChart(this._root.getElementById("echart"), {
        categories,
        series: bars.map((b) => ({ name: b.name, color: b.color, values: toArr(b.values), parts: b.parts && b.parts.map((x) => ({ ...x, values: toArr(x.values) })) })),
        fmtValue: (v, axis) => `${num(v, axis)}${axis ? "" : " kWh"}`,
        empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("energyChart")} (kWh)`,
      });
    } else {
      const hourly = rd.eBucket === 3600e3;
      barChart(this._root.getElementById("echart"), {
        series: bars, t0: rd.t0, t1: rd.t1, bucket: rd.eBucket, tickStep: hourly ? 3 * 3600e3 : rd.days === 7 ? 24 * 3600e3 : 5 * 24 * 3600e3,
        fmtValue: (v, axis) => `${num(v, axis)}${axis ? "" : " kWh"}`,
        fmtTime: (t) => (hourly ? fDT.format(t) : fD.format(t)),
        fmtTick: hourly ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t),
        empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("energyChart")} (kWh)`,
      });
    }

    // ---- totals
    const tot = (m) => [...m.values()].reduce((a, v) => a + v, 0);
    const tiles = bars.filter((b) => b.values.size).map((b) =>
      `<div class="tile"><b>${esc(num(tot(b.values)))} kWh</b><span>${esc(b.name)}</span></div>`).join("");
    const prodTot = tot(eProd);
    const share = prodTot > 0 ? `<div class="tile"><b>${esc(num(tot(eDirect) / prodTot * 100, false, 0))} %</b><span>${esc(this._t("directShare"))}</span></div>` : "";
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
    if (priceImp && T.prod > 0) more.push([`${num((T.prod - Math.min(T.feed, T.prod)) * priceImp, false, 2)} €`, this._t("saving")]);
    if (priceFeed && T.feed > 0) more.push([`${num(T.feed * priceFeed, false, 2)} €`, this._t("revenue")]);
    if (T.prod > 0) more.push([`${num((T.prod * (gen.co2_g_per_kwh || 380)) / 1000, false, 1)} kg`, this._t("co2")]);
    const moreTiles = more.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    this._root.getElementById("tiles").innerHTML = tiles + share + moreTiles;
    this._root.querySelectorAll(".chart").forEach((x) => x.classList.remove("loading"));
  }

  // ---------------------------------------------------------------- storage tab

  _buildStorage() {
    const { P, E, G } = this._keys();
    const has = (x) => x.sin.length || x.sout.length || x.comb.length;
    this._storageOn = !!(has(P) || has(E) || G.soc.length);
    const box = this._root.getElementById("sto");
    if (!this._storageOn) { box.replaceChildren(); return; }
    if (!this._srange) this._srange = "today";
    box.innerHTML = `<div class="filters" id="sranges"></div><div class="tiles" id="stiles"></div>${G.soc.length ? `
      <h3 class="ch">${esc(this._t("socChart"))}</h3><div class="chart" id="sosoc"></div>` : ""}${has(P) ? `
      <h3 class="ch" id="sopowh">${esc(this._t("stoPower"))} (W)</h3><div class="chart" id="sopow"></div>` : ""}${has(E) ? `
      <h3 class="ch">${esc(this._t("stoEnergy"))} (kWh)</h3><div class="chart" id="soen"></div>` : ""}
      <p class="note" id="sonote"></p>`;
    const ranges = box.querySelector("#sranges");
    for (const r of ["today", "yesterday", "d7", "d30", "ytd", "y12"]) {
      const b = document.createElement("button");
      b.textContent = this._t({ ytd: "dYear", y12: "d365" }[r] || r);
      b.dataset.range = r;
      b.setAttribute("aria-pressed", String(r === this._srange));
      b.addEventListener("click", () => {
        this._srange = r;
        ranges.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.range === r)));
        this._loadStorage();
      });
      ranges.append(b);
    }
  }

  async _loadStorage() {
    if (!this._storageOn || !this._hass || !this._root.getElementById("sranges")) return;
    const token = (this._stoken = (this._stoken || 0) + 1);
    const rd = this._rangeDef(this._srange);
    const { P, E, G } = this._keys();
    const filt = this._cfg.filtered || {};
    const energyIds = [...E.sin, ...E.sout, ...E.comb];
    const energyAll = energyIds.concat(energyIds.map((i) => filt[i]).filter(Boolean));
    this._root.querySelectorAll("#sto .chart").forEach((c) => c.classList.add("loading"));
    const powIds = [...P.sin, ...P.sout, ...P.comb];
    // means hide the peaks (a full battery for one hour is no 100 % in a daily mean), so the extremes are read as well
    const [pres, eres, smax, smin, pmax, pmin] = await Promise.all([
      this._stats([...powIds, ...G.soc], rd.pPeriod, "mean", { power: "W" }, rd),
      this._stats(energyAll, rd.long ? "month" : rd.eBucket === 3600e3 ? "hour" : "day", "change", { energy: "kWh" }, rd),
      this._stats(G.soc, rd.pPeriod, "max", {}, rd),
      this._stats(G.soc, rd.pPeriod, "min", {}, rd),
      this._stats(powIds, rd.pPeriod, "max", { power: "W" }, rd),
      this._stats(powIds, rd.pPeriod, "min", { power: "W" }, rd),
    ]);
    if (token !== this._stoken) return;
    this._sdata = { rd, pres, eres, filt, smax, smin, pmax, pmin };
    this._drawStorage();
  }

  _drawStorage() {
    const d = this._sdata;
    if (!d || !this._storageOn || !this._root.getElementById("sranges")) return;
    const { rd, pres, eres, filt, smax, smin, pmax, pmin } = d;
    const { P, E, G } = this._keys();
    const root = this._root;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const fm = (o) => new Intl.DateTimeFormat(lang, { ...o, timeZone: tz });
    const fDT = fm({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const fD = fm({ weekday: "short", day: "numeric", month: "numeric" });
    const fH = fm({ hour: "2-digit", minute: "2-digit" });
    const fDM = fm({ day: "numeric", month: "numeric" });
    const num = (v, dec = 2) => v.toLocaleString(lang, { maximumFractionDigits: dec });
    const get = (res, id, field) => (res[id] || []).filter((r) => r[field] != null);
    const pr = (id) => get(pres, id, "mean");
    const pickE = (id) => mergedRows(eres, id, filt, "change");
    const add = (m, ts, v) => m.set(ts, (m.get(ts) || 0) + v);
    const each = (ids, rows, field, fn) => ids.map((id) => {
      const m = new Map();
      for (const r of rows(id)) add(m, r.start, fn(r[field]));
      return { name: this._read(id).name, values: m };
    });
    const total = (parts) => { const m = new Map(); for (const x of parts) for (const [k, v] of x.values) add(m, k, v); return m; };
    const toPts = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]);
    const sum = (m) => [...m.values()].reduce((a, v) => a + v, 0);
    const timeLabels = { summary: this._t("table"), time: this._t("time") };
    const fMon = fm(new Date(rd.t0).getFullYear() === new Date(rd.t1 - 1).getFullYear() ? { month: "short" } : { month: "short", year: "2-digit" });
    const tickFmt = rd.long ? (t) => fMon.format(t + 15 * 24 * 3600e3) : rd.days === 1 ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t);

    // sign convention of the combined sensors: positive = from storage unless inverted
    const nz = (v) => Math.max(v, 0);
    const ns = P.absStorage ? (v) => Math.abs(v) : nz;
    const w = (inv) => (v) => (inv ? -v : v);
    const outP = [...each(P.sout, pr, "mean", ns), ...each(P.comb, pr, "mean", (v) => nz(w(P.inv)(v)))];
    const inP = [...each(P.sin, pr, "mean", ns), ...each(P.comb, pr, "mean", (v) => nz(-w(P.inv)(v)))];
    const netP = new Map();
    for (const [ts, v] of total(outP)) add(netP, ts, v);
    for (const [ts, v] of total(inP)) add(netP, ts, -v);
    const netParts = [...each(P.sout, pr, "mean", ns), ...each(P.sin, pr, "mean", (v) => -ns(v)), ...each(P.comb, pr, "mean", w(P.inv))];

    // peak power per bucket from the max / min statistics (sum over the storages)
    const mmRows = (res, id, field) => new Map(get(res, id, field).map((r) => [r.start, r[field]]));
    const peakOut = new Map(), peakIn = new Map();
    for (const id of [...P.sin, ...P.sout]) {
      const mx = mmRows(pmax, id, "max"), mn = mmRows(pmin, id, "min");
      const target = P.sout.includes(id) ? peakOut : peakIn;
      for (const [ts, v] of mx) add(target, ts, P.absStorage ? Math.max(Math.abs(v), Math.abs(mn.get(ts) ?? 0)) : Math.max(v, 0));
    }
    for (const id of P.comb) { // default: positive = from storage, negative = into storage
      const mx = mmRows(pmax, id, "max"), mn = mmRows(pmin, id, "min");
      for (const ts of new Set([...mx.keys(), ...mn.keys()])) {
        const hi = mx.get(ts) ?? 0, lo = mn.get(ts) ?? 0;
        add(peakOut, ts, Math.max(P.inv ? -lo : hi, 0));
        add(peakIn, ts, Math.max(P.inv ? hi : -lo, 0));
      }
    }
    // level
    const socRows = G.soc.length ? pr(G.soc[0]) : [];
    const socMaxRows = G.soc.length ? get(smax, G.soc[0], "max") : [], socMinRows = G.soc.length ? get(smin, G.soc[0], "min") : [];
    const soc = socRows.map((r) => r.mean);
    const socBox = root.getElementById("sosoc");
    const socPts = (rows, field) => toPts(new Map(rows.map((r) => [r.start, r[field]])));
    if (socBox) lineChart(socBox, {
      series: rd.long && socMaxRows.length
        ? [{ name: this._t("stoSocMax"), short: this._t("stoSocMax"), color: "--pva-s2", points: socPts(socMaxRows, "max") },
           { name: this._t("stoSocAvg"), short: this._t("stoSocAvg"), color: "--pva-s1", points: socPts(socRows, "mean") },
           { name: this._t("stoSocMin"), short: this._t("stoSocMin"), color: "--pva-s3", points: socPts(socMinRows, "min") }]
        : [{ name: this._t("socName"), short: this._t("socName"), color: "--pva-s1", points: toPts(new Map(socRows.map((r) => [r.start, r.mean]))) }],
      t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis ? 1 : 0)} %`, fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
      empty: this._t("noData"), tableLabels: timeLabels, label: this._t("socChart"),
    });
    const powBox = root.getElementById("sopow");
    if (powBox && rd.long) {
      root.getElementById("sopowh").textContent = `${this._t("stoPeakPower")} (W)`;
      lineChart(powBox, {
        series: [{ name: this._t("stoPeakOut"), short: this._t("sout"), color: "--pva-bout", points: toPts(peakOut) },
                 { name: this._t("stoPeakIn"), short: this._t("sin"), color: "--pva-bin", points: toPts(new Map([...peakIn].map(([k, v]) => [k, -v]))) }],
        t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
        fmtValue: (v, axis) => `${num(v, axis ? 1 : 0)}${axis ? "" : " W"}`, fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
        empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("stoPeakPower")} (W)`,
      });
    } else if (powBox) {
      root.getElementById("sopowh").textContent = `${this._t("stoPower")} (W)`;
      lineChart(powBox, {
      series: [{ name: this._t("storageNet"), short: this._t("storage"), color: "--pva-bout", colorNeg: "--pva-bin",
        legendItems: [{ name: `${this._t("sout")} (+)`, color: "--pva-bout" }, { name: `${this._t("sin")} (−)`, color: "--pva-bin" }],
        points: toPts(netP), parts: netParts }],
      t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis ? 1 : 0)}${axis ? "" : " W"}`, fmtTime: (t) => fDT.format(t), fmtTick: tickFmt,
      empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("stoPower")} (W)`,
      });
    }

    // energy per hour / day
    const flip = (inv) => (v) => (inv ? -v : v);
    const outE = [...each(E.sout, pickE, "change", (v) => v), ...each(E.comb, pickE, "change", (v) => nz(flip(E.inv)(v)))];
    const inE = [...each(E.sin, pickE, "change", (v) => v), ...each(E.comb, pickE, "change", (v) => nz(-flip(E.inv)(v)))];
    const eOut = total(outE), eIn = total(inE);
    const hourly = rd.eBucket === 3600e3;
    const enBox = root.getElementById("soen");
    if (enBox && rd.long) {
      const { categories, toArr } = this._monthAxis(rd, tz, fMon);
      const mk = (s) => ({ ...s, values: toArr(s.values), parts: s.parts && s.parts.map((x) => ({ ...x, values: toArr(x.values) })) });
      categoryBarChart(enBox, {
        categories,
        series: [mk({ name: this._t("sin"), color: "--pva-bin", values: eIn, parts: inE }), mk({ name: this._t("sout"), color: "--pva-bout", values: eOut, parts: outE })],
        fmtValue: (v, axis) => `${num(v, axis ? 1 : 2)}${axis ? "" : " kWh"}`,
        empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("stoEnergy")} (kWh)`,
      });
    } else if (enBox) barChart(enBox, {
      series: [
        { name: this._t("sin"), color: "--pva-bin", values: eIn, parts: inE },
        { name: this._t("sout"), color: "--pva-bout", values: eOut, parts: outE },
      ],
      t0: rd.t0, t1: rd.t1, bucket: rd.eBucket, tickStep: hourly ? 3 * 3600e3 : rd.days === 7 ? 24 * 3600e3 : 5 * 24 * 3600e3,
      fmtValue: (v, axis) => `${num(v, axis ? 1 : 2)}${axis ? "" : " kWh"}`,
      fmtTime: (t) => (hourly ? fDT.format(t) : fD.format(t)),
      fmtTick: hourly ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t),
      empty: this._t("noData"), tableLabels: timeLabels, label: `${this._t("stoEnergy")} (kWh)`,
    });

    // tiles
    const tiles = [];
    const gen = this._cfg.settings?.general || {};
    const nowSoc = G.soc.length ? parseFloat(this._hass.states[G.soc[0]]?.state) : NaN;
    if (!Number.isNaN(nowSoc)) tiles.push([`${num(nowSoc, 0)} %`, this._t("stoNow")]);
    const tIn = sum(eIn), tOut = sum(eOut);
    if (tIn > 0) tiles.push([`${num(tIn)} kWh`, this._t("sin")]);
    if (tOut > 0) tiles.push([`${num(tOut)} kWh`, this._t("sout")]);
    if (tIn > 0 && tOut > 0) tiles.push([`${num((tOut / tIn) * 100, 0)} %`, this._t("storEff")]);
    // usable capacity = capacity x (1 - minimum level); cycles and the energy that can still be drawn use it
    const cap = gen.storage_capacity_kwh > 0 ? gen.storage_capacity_kwh : 0, minSoc = gen.battery_min_soc > 0 ? Math.min(gen.battery_min_soc, 100) : 0;
    const usable = cap * (1 - minSoc / 100);
    if (usable > 0) tiles.push([`${num(usable)} kWh`, this._t("stoUsable")]);
    if (usable > 0 && !Number.isNaN(nowSoc)) tiles.push([`${num(Math.max(0, ((nowSoc - minSoc) / 100) * cap))} kWh`, this._t("stoUsableNow")]);
    if (usable > 0 && tIn > 0) tiles.push([num(tIn / usable, 1), this._t("cycles")]);
    const maxIn = Math.max(0, ...peakIn.values()), maxOut = Math.max(0, ...peakOut.values());
    if (maxIn > 0) tiles.push([`${num(maxIn, 0)} W`, this._t("stoMaxCharge")]);
    if (maxOut > 0) tiles.push([`${num(maxOut, 0)} W`, this._t("stoMaxDis")]);
    const vals = soc.filter((v) => v != null);
    if (vals.length) {
      const hi = socMaxRows.length ? Math.max(...socMaxRows.map((r) => r.max)) : Math.max(...vals);
      const lo = socMinRows.length ? Math.min(...socMinRows.map((r) => r.min)) : Math.min(...vals);
      tiles.push([`${num(lo, 0)}–${num(hi, 0)} %`, this._t("socRange")]);
      tiles.push([`${num(vals.reduce((a, v) => a + v, 0) / vals.length, 0)} %`, this._t("stoAvgSoc")]);
    }
    root.getElementById("stiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
    const note = root.getElementById("sonote");
    note.textContent = [tIn > 0 && tOut > 0 ? this._t("stoNote") : "", !(cap > 0) && tIn > 0 ? this._t("stoNoCap") : ""].filter(Boolean).join(" ");
    root.querySelectorAll("#sto .chart").forEach((x) => x.classList.remove("loading"));
  }

  // ---------------------------------------------------------------- forecast tab

  _buildForecast() {
    const c = this._cfg || {};
    this._forecastOn = !!(list(c.forecast_today_energy_sensors).length || list(c.forecast_tomorrow_energy_sensors).length || list(c.forecast_remaining_energy_sensors).length);
    const box = this._root.getElementById("fcs");
    if (!this._forecastOn) { box.replaceChildren(); return; }
    if (!this._fdays) this._fdays = 30;
    box.innerHTML = `<div class="filters" id="franges"></div><div class="tiles" id="ftiles"></div>
      <h3 class="ch" id="fchead">${esc(this._t("anaForecast"))}</h3><div class="chart" id="fcchart"></div>
      <h3 class="ch">${esc(this._t("anaForecastDev"))}</h3><div class="chart" id="fcdev"></div>`;
    const ranges = box.querySelector("#franges");
    for (const [d, label] of [[7, "d7"], [30, "d30"], [90, "d90"], ["ytd", "dYear"], [365, "d365"]]) {
      const b = document.createElement("button");
      b.textContent = this._t(label);
      b.setAttribute("aria-pressed", String(d === this._fdays));
      b.addEventListener("click", () => {
        this._fdays = d;
        ranges.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        this._loadForecast();
      });
      ranges.append(b);
    }
  }

  async _loadForecast() {
    if (!this._forecastOn || !this._hass || !this._root.getElementById("franges")) return;
    const token = (this._ftoken = (this._ftoken || 0) + 1);
    const { E } = this._keys();
    const filt = this._cfg.filtered || {};
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((this._fdays === "ytd" ? Math.floor((start - new Date(start.getFullYear(), 0, 1)) / 86400e3) + 1 : this._fdays) - 1));
    const ids = [...new Set(E.prod.concat(E.prod.map((i) => filt[i]).filter(Boolean)))];
    this._root.querySelectorAll("#fcs .chart").forEach((c) => c.classList.add("loading"));
    const todayIds = list(this._cfg.forecast_today_energy_sensors);
    const [eres, cfg, hist] = await Promise.all([
      ids.length ? this._hass.callWS({ type: "recorder/statistics_during_period", start_time: start.toISOString(), end_time: new Date().toISOString(),
        statistic_ids: ids, period: "day", types: ["change"], units: { energy: "kWh" } }).catch(() => ({})) : {},
      this._hass.callWS({ type: "pv_assistant/config" }).catch(() => null), // fresh forecast log
      todayIds.length ? this._forecastFromHistory(todayIds) : {},
    ]);
    if (token !== this._ftoken) return;
    if (cfg?.settings) this._cfg.settings = cfg.settings;
    this._fdata = { eres, hist, start };
    this._drawForecast();
  }

  _drawForecast() {
    const d = this._fdata;
    if (!d || !this._forecastOn || !this._root.getElementById("franges")) return;
    const { eres, hist, start } = d;
    const { E } = this._keys();
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

    const tl = { summary: this._t("table"), time: this._t("time") };
    const fv = (v, axis) => `${num(v, axis ? 1 : 2)}${axis ? "" : " kWh"}`;
    const fcBox = root.getElementById("fcchart"), fdBox = root.getElementById("fcdev");
    fcBox.classList.remove("loading"); fdBox.classList.remove("loading");
    if (!fcDays.length) {
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
    }
    root.getElementById("ftiles").innerHTML = tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");
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
      // the last 12 completed calendar months, only when every one of them has data
      const lastMonths = Array.from({ length: 12 }, (_, i) => { const t = new Date(cy, cm - 12 + i, 1); return benefit(t.getFullYear(), t.getMonth()); });
      if (lastMonths.every((b) => b != null)) {
        const last12 = lastMonths.reduce((a, v) => a + v, 0);
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
    if (this._storageOn) list.push(["storageTab", "sto", "storage"]);
    if (this._forecastOn) list.push(["forecastTab", "fcs", "forecast"]);
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
    if (id === "storage") this._loadStorage();
    if (id === "forecast") this._loadForecast();
    if (id === "power") this._loadPowerChart();
    if (id === "settings") this._refreshPrices?.();
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
    const html = `<div class="grid">${total}${cards}</div>`;
    if (!this._pwrInit) { // cards on top are re-rendered with every value, the chart below is built once
      this._pwrInit = true;
      box.innerHTML = `<div id="pwrcards"></div><h3 class="ch">${esc(this._t("pwrChart"))} (W)</h3><div class="filters" id="pwranges"></div><div class="chart" id="pwrchart"></div><p class="note">${esc(this._t("pwrTipNote"))}</p><p class="note">${esc(this._t("pwrNote"))}</p>`;
      if (!this._prange) this._prange = "today";
      const ranges = box.querySelector("#pwranges");
      for (const r of ["today", "yesterday", "d7"]) {
        const b = document.createElement("button");
        b.textContent = this._t(r);
        b.dataset.range = r;
        b.setAttribute("aria-pressed", String(r === this._prange));
        b.addEventListener("click", () => {
          this._prange = r;
          ranges.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.range === r)));
          this._loadPowerChart();
        });
        ranges.append(b);
      }
    }
    if (html !== this._lastPwr) { this._lastPwr = html; box.querySelector("#pwrcards").innerHTML = html; }
  }

  async _loadPowerChart() {
    const box = this._root?.getElementById("pwrchart");
    if (!box || !this._hass) return;
    const token = (this._pctoken = (this._pctoken || 0) + 1);
    const rd = this._rangeDef(this._prange);
    box.classList.add("loading");
    const res = await this._stats(this._keys().P.prod, rd.pPeriod, "mean", { power: "W" }, rd);
    if (token !== this._pctoken) return;
    this._pcdata = { rd, res };
    this._drawPowerChart();
  }

  _drawPowerChart() {
    const d = this._pcdata;
    const box = this._root?.getElementById("pwrchart");
    if (!d || !box) return;
    const { rd, res } = d;
    const ids = this._keys().P.prod;
    const lang = this._hass.locale?.language || this._hass.language;
    const tz = this._hass.config?.time_zone;
    const fm = (o) => new Intl.DateTimeFormat(lang, { ...o, timeZone: tz });
    const fDT = fm({ day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const fD = fm({ weekday: "short", day: "numeric", month: "numeric" });
    const fH = fm({ hour: "2-digit", minute: "2-digit" });
    const fDM = fm({ day: "numeric", month: "numeric" });
    const num = (v, axis) => v.toLocaleString(lang, { maximumFractionDigits: axis ? 1 : 0 });
    const perId = ids.map((id) => {
      const m = new Map();
      for (const r of res[id] || []) if (r.mean != null) m.set(r.start, Math.max(r.mean, 0));
      return { id, name: this._read(id).name, peak: this._cfg.settings?.strings?.[id]?.peak, values: m };
    });
    const total = new Map();
    for (const s of perId) for (const [ts, v] of s.values) total.set(ts, (total.get(ts) || 0) + v);
    const toPts = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]);
    // percentages in the tooltip: a string = share of its own peak, the plant = share of the sum of the peaks,
    // the split below the plant = share of the plant power (adds up to 100 %)
    const pct = (v, ref) => (ref > 0 ? `${Math.round((v / ref) * 100)} %` : undefined);
    const sumPeak = perId.filter((s) => s.peak > 0).reduce((a, s) => a + s.peak, 0);
    const series = perId.map((s, k) => ({ name: s.name, short: `${s.name.slice(0, 11)}${s.name.length > 11 ? "…" : ""}`, color: `--pva-s${(k % 7) + 1}`, points: toPts(s.values), rowNote: (v) => pct(v, s.peak) }));
    if (perId.length > 1) series.push({ name: this._t("effTotal"), short: this._t("effTotal"), color: "--pva-prod", points: toPts(total),
      rowNote: (v) => pct(v, sumPeak), partNote: (v, ts) => pct(v, total.get(ts)),
      parts: perId.map((s) => ({ name: s.name, values: s.values })) });
    box.classList.remove("loading");
    lineChart(box, {
      series, t0: rd.t0, t1: rd.t1, step: rd.pStep, tickStep: rd.tickStep,
      fmtValue: (v, axis) => `${num(v, axis)}${axis ? "" : " W"}`,
      fmtTime: (t) => fDT.format(t),
      fmtTick: rd.days === 1 ? (t) => fH.format(t) : rd.days === 7 ? (t) => fD.format(t) : (t) => fDM.format(t),
      empty: this._t("noData"), tableLabels: { summary: this._t("table"), time: this._t("time") }, label: `${this._t("pwrChart")} (W)`,
    });
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
          const row = { el, title, m: field("modules", "gModules", 0, 10000, 1), a: field("azimuth", "gAz", -180, 180, 5, true), t: field("tilt", "gTilt", 0, 90, 5, true), p: field("mppt", "gMppt", 0, 64, 1) };
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
      box.append(c);
      inputs.push({ id, name, peak, mppts, moduleWp, groups });
    };
    P.prod.forEach((id) => card(id, "setPower", true));
    E.prod.forEach((id) => card(id, "setEnergy", false));

    // inverters: max. power and the power sensors (MPPT inputs) that belong to it
    const invBox = mk("div", { class: "setcard" });
    invBox.append(mk("h3", {}, this._t("invTitle")), mk("div", { class: "hint setgh" }, this._t("invHint")));
    const invList = mk("div", { class: "setgroups" });
    const invAdd = mk("button", { type: "button", class: "setbtn" }, this._t("invAdd"));
    invAdd.disabled = !isAdmin;
    invBox.append(invList, invAdd);
    const invRows = [];
    const sensorName = (sid) => strings[sid]?.name || this._hass.states[sid]?.attributes.friendly_name || sid;
    const addInverter = (inv) => {
      const el = mk("div", { class: "setgroup" });
      const title = mk("div", { class: "gtitle" });
      const rm = mk("button", { type: "button", class: "setbtn" }, this._t("gRemove"));
      rm.disabled = !isAdmin;
      const head = mk("div", { class: "ghead" });
      head.append(title, rm);
      const grid = mk("div", { class: "ggrid" });
      const nameWrap = mk("label", { class: "gfield" }, this._t("invName"));
      const nameIn = mk("input", { type: "text", maxlength: "60" });
      nameIn.value = inv?.name || "";
      nameIn.disabled = !isAdmin;
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
        l.append(cb, mk("span", {}, sensorName(sid)));
        list.append(l);
        return { sid, cb };
      });
      const row = { el, title, nameIn, maxIn, boxes };
      rm.addEventListener("click", () => { invRows.splice(invRows.indexOf(row), 1); el.remove(); renumberInv(); });
      el.append(head, grid, list);
      invList.append(el);
      invRows.push(row);
      renumberInv();
    };
    const renumberInv = () => invRows.forEach((r, i) => { r.title.textContent = this._t("invTitleN").replace("{n}", String(i + 1)); });
    invertersOf(this._cfg.settings, P.prod).forEach(addInverter);
    invAdd.addEventListener("click", () => addInverter(null));
    if (P.prod.length) box.append(invBox);

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
      <h3 class="ch">${esc(this._t("anaDays"))}</h3><div class="two" id="adays"></div>`;
    const ranges = box.querySelector("#aranges");
    for (const [d, label] of [[7, "d7"], [30, "d30"], [90, "d90"], ["ytd", "dYear"], [365, "d365"]]) {
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
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((this._adays === "ytd" ? Math.floor((start - new Date(start.getFullYear(), 0, 1)) / 86400e3) + 1 : this._adays) - 1));
    const call = async (ids, from, period, type, units) => {
      ids = [...new Set(ids)];
      if (!ids.length) return {};
      try {
        return await this._hass.callWS({ type: "recorder/statistics_during_period", start_time: from.toISOString(), end_time: new Date().toISOString(), statistic_ids: ids, period, types: [type], units });
      } catch (e) { return {}; }
    };
    this._root.querySelectorAll("#ana .chart").forEach((c) => c.classList.add("loading"));
    const eids = E.prod.concat(E.prod.map((i) => filt[i]).filter(Boolean));
    const [pres, eres] = await Promise.all([
      call([...P.prod, ...G.irr], start, "hour", "mean", { power: "W" }),
      call(eids, start, "day", "change", { energy: "kWh" }),
    ]);
    if (token !== this._atoken) return;
    this._adata = { pres, eres, start };
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
    const { pres, eres, start } = d;
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
      const rows = mergedRows(eres, id, filt, "change");
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
    // expected yield of the orientation (azimuth / tilt from the settings); strings without it count as 1
    // plant location: own value from the settings, otherwise the Home Assistant home location
    const genSet = this._cfg.settings?.general || {};
    const lat = genSet.latitude || this._hass.config?.latitude, lon = genSet.longitude || this._hass.config?.longitude;
    const located = typeof lat === "number" && typeof lon === "number";
    const refYield = located && common ? expectedYield(common, lat, lon, 0, 35) : 0;
    for (const s of peaked) {
      const o = this._cfg.settings?.strings?.[s.id];
      const gs = groupsOf(o).filter((g) => g.azimuth != null && g.tilt != null);
      const factorOf = (az, tl) => (refYield > 0 ? expectedYield(common, lat, lon, az, tl) / refYield : orientationFactor(az, tl));
      // weighted mix of the module strings (by module count; equal weights if a count is missing)
      const weights = gs.every((g) => g.modules > 0) ? gs.map((g) => g.modules) : gs.map(() => 1);
      const wsum = weights.reduce((x, y) => x + y, 0);
      // with the location: clear-sky irradiance on the plane over exactly the hours compared (follows the season of the range); without it: rough annual table
      s.factor = gs.length ? gs.reduce((acc, g, i) => acc + weights[i] * factorOf(g.azimuth, g.tilt), 0) / wsum : null;
      s.eff = s.spec / (s.factor || 1);
    }
    const usesOrient = peaked.some((s) => s.factor);
    const hints = [];
    const infoSet = new Set(); // hints shown as plain information (not as a warning)
    let weak = new Set();
    if (peaked.length >= 2 && common.length >= 24) {
      const med = median(peaked.map((s) => s.eff));
      for (const s of peaked) if (med > 0 && s.eff < med * 0.85) {
        weak.add(s.id);
        const top = peaked.reduce((a, x) => (x.eff > a.eff ? x : a), peaked[0]);
        hints.push(this._t("anaWeakHint").replace(/\{name\}/g, s.name).replace("{rel}", String(Math.round((s.eff / top.eff) * 100))).replace("{best}", top.name)
          .replace("{own}", num(s.spec)).replace("{top}", num(top.spec)).replace("{med}", num(median(peaked.map((x) => x.spec))))
          + (usesOrient ? ` ${this._t("anaOrientUsed")}` : ""));
        // improvement suggestion from the time of day in which the string falls behind
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

    // string cards
    const sorted = [...series].sort((a, b) => (b.eff ?? -1) - (a.eff ?? -1) || b.kwh - a.kwh);
    const bestSpec = Math.max(0, ...peaked.map((s) => s.eff));
    const box = root.getElementById("astrings");
    box.classList.remove("loading");
    box.innerHTML = sorted.map((s) => {
      const w = s.eff && bestSpec ? (s.eff / bestSpec) * 100 : 0;
      const sub = s.spec != null
        ? `${esc(num(s.spec))} ${esc(this._t("anaSpec"))} · ${esc(String(Math.round(w)))} % ${esc(this._t("anaRel"))}${s.factor ? ` · ${esc(this._t("anaFactor").replace("{pct}", String(Math.round(s.factor * 100))))}` : ""}${weak.has(s.id) ? ` · <span class="weak">${esc(this._t("anaWeak"))}</span>` : ""}`
        : `<span class="muted">–</span>`;
      return `<div class="strow"><div><div>${esc(s.name)}</div><div class="muted" style="font-size:.85em">${sub}</div></div>
        <div class="gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(w)}"><i style="width:${w.toFixed(1)}%"></i></div>
        <div><b>${esc(num(s.kwh))} kWh</b></div></div>`;
    }).join("") + (peaked.length ? (peaked.some((s) => !s.factor) && peaked.length >= 2 ? `<p class="note">${esc(this._t("anaNoOrient"))}</p>` : "") : `<p class="note">${esc(this._t("anaNoPeak"))}</p>`);

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
    const strs = this._cfg.settings?.strings || {};
    const seriesIds = series.map((x) => x.id);
    const invs = invertersOf(this._cfg.settings, seriesIds);
    for (const inv of invs) {
      const members = series.filter((x) => inv.sensors.includes(x.id));
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
    for (const s of series) {
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

    // tiles: production, plant yield (kWh/kWp), best day, performance ratio
    const tiles = [];
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
customElements.define("pv-assistant-panel", PVAssistantPanel);
