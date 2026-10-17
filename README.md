# PV Assistant

[English](#english) · [Deutsch](#deutsch)

Full documentation / Ausführliche Dokumentation: **[Wiki](https://github.com/weskona/pv-assistant/wiki)** (English and German, sources in [`wiki/`](wiki)). Bugs and ideas / Fehler und Wünsche: **[Issue tracker](https://github.com/weskona/pv-assistant/issues/new/choose)**.

## English

Home Assistant integration with its own sidebar panel for the PV energy flow: production, feed-in, grid import, storage, house consumption and forecast, with analyses per string.

> **Beta:** The integration is in beta. Features and settings may still change and there may be bugs. All releases are marked as pre-releases and carry the suffix `-beta` (for example `v0.6.4-beta`); in HACS enable "Show beta versions" or choose the version by hand when downloading. Please report feedback as an issue.

### Installation
1. Add the repository in HACS as a custom repository (type **Integration**) or copy the folder `custom_components/pv_assistant` to `config/custom_components/`.
2. Restart Home Assistant.
3. Settings → Devices & services → Add integration → **PV Assistant**.
4. Choose the sensors. After an update restart Home Assistant and hard-reload the browser (Ctrl+F5).

### Setup in four steps
1. **Energy sensors (kWh):** production (several), feed-in (one), optional storage in / out / combined (several, combined sensors with switchable sign, default positive = from storage).
2. **Power sensors (W):** same layout; switches for negative feed-in and negative storage values. With differently oriented strings use one sensor per string, not a total sensor.
3. **Forecast (optional):** energy sensors for today, tomorrow and rest of today (for example Forecast.Solar or Solcast).
4. **Grid, consumption and prices (optional):** grid import, house consumption (including wallbox, heat pump etc.), battery level, irradiance, electricity price and feed-in tariff (sensor or `input_number`).

### The panel
| Tab | Content |
|---|---|
| Now | current values and sums of all sensors and the forecast |
| Power | power per string against its peak, whole plant, power chart per string |
| Analysis | string comparison (kWh/kWp, corrected for orientation and tilt, with suggestions), heat map, best and weakest days, power plateaus, performance ratio |
| History | power, effective power and energy charts for today up to 12 months, key figures such as autarky, self-consumption, savings, CO₂ |
| Storage | level, storage power, charged and discharged energy, efficiency, cycles, usable capacity |
| Forecast | forecast vs actual per day or month, deviation, hit rate |
| Yearly overview | monthly production against the average, year forecast, benefit, payback, trend |
| Settings | display names, peak, orientation and tilt per string, plant values (capacity, minimum level, prices, cost, CO₂ factor, location) |

The data comes from the long-term statistics of Home Assistant (recorder); the sensors therefore need a `state_class`. The integration also creates filtered copies of the energy sensors (`… filtered`, ignore short drops, usable as `utility_meter` source) and a binary sensor `binary_sensor.pv_assistant_string_fault` ("String fault") that reports a string delivering almost nothing while the others produce. Settings are stored in `.storage/pv_assistant.settings` and apply to all devices; only administrators can save.

### Known limitations
- Directly used PV: if the storage also charges from the grid the value is a little too low (without a grid import sensor). For hourly values (7/30 days) Home Assistant averages signed power sensors, so there the value is an approximation.
- The colors "yellow on a light background" and "pink/turquoise for red-green color weakness" are hard to tell apart (legend, tooltip and table as compensation).
- The thresholds of hints and of the string fault sensor are heuristics, not a diagnosis.

## Deutsch

Home-Assistant-Integration mit eigenem Sidebar-Panel für den PV-Energiefluss: Erzeugung, Einspeisung, Netzbezug, Speicher, Hausverbrauch und Prognose, mit Auswertungen pro String.

> **Beta:** Die Integration befindet sich im Beta-Status. Funktionen und Einstellungen können sich noch ändern, und es kann Fehler geben. Alle Releases sind als Vorabversion (Pre-release) markiert und tragen das Suffix `-beta` (z. B. `v0.6.4-beta`); in HACS dafür „Beta-Versionen anzeigen“ aktivieren oder die Version beim Herunterladen von Hand wählen. Rückmeldungen bitte als Issue melden.

### Installation
1. Das Repository in HACS als benutzerdefiniertes Repository (Typ **Integration**) hinzufügen oder den Ordner `custom_components/pv_assistant` nach `config/custom_components/` kopieren.
2. Home Assistant neu starten.
3. Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**.
4. Sensoren auswählen. Nach einem Update Home Assistant neu starten und den Browser hart neu laden (Strg+F5).

### Einrichtung in vier Schritten
1. **Energiesensoren (kWh):** Erzeugung (mehrere), Einspeisung (einer), optional Speicher rein / raus / kombiniert (mehrere, Kombisensoren mit umschaltbarem Vorzeichen, Standard positiv = aus Speicher).
2. **Leistungssensoren (W):** gleicher Aufbau; Schalter für negative Einspeisung und negative Speicherwerte. Bei verschieden ausgerichteten Strings je String einen Sensor verwenden, keinen Gesamtsensor.
3. **Prognose (optional):** Energiesensoren für heute, morgen und Rest heute (z. B. Forecast.Solar oder Solcast).
4. **Netz, Verbrauch und Preise (optional):** Netzbezug, Hausverbrauch (inkl. Wallbox, Wärmepumpe usw.), Batterie-Ladestand, Einstrahlung, Strompreis und Einspeisevergütung (Sensor oder `input_number`).

### Das Panel
| Tab | Inhalt |
|---|---|
| Aktuell | aktuelle Werte und Summen aller Sensoren und der Prognose |
| Leistung | Leistung je String im Verhältnis zum Peak, Gesamtanlage, Leistungsdiagramm je String |
| Analyse | String-Vergleich (kWh/kWp, bereinigt um Ausrichtung und Neigung, mit Vorschlägen), Heatmap, beste und schwächste Tage, Leistungs-Plateaus, Performance Ratio |
| Verlauf | Leistungs-, Effektivleistungs- und Energiediagramme von heute bis 12 Monate, Kennzahlen wie Autarkie, Eigenverbrauch, Ersparnis, CO₂ |
| Speicher | Ladestand, Speicherleistung, geladene und entladene Energie, Wirkungsgrad, Zyklen, nutzbare Kapazität |
| Prognose | Prognose gegen Ist je Tag oder Monat, Abweichung, Trefferquote |
| Jahresübersicht | Monatserzeugung gegen den Schnitt, Jahresprognose, Nutzen, Amortisation, Trend |
| Einstellungen | Anzeigenamen, Peak, Ausrichtung und Neigung je String, Anlagenwerte (Kapazität, Mindest-Ladestand, Preise, Kosten, CO₂-Faktor, Standort) |

Die Daten kommen aus den Langzeitstatistiken von Home Assistant (Recorder); die Sensoren brauchen daher eine `state_class`. Die Integration legt außerdem bereinigte Kopien der Energiesensoren an (`… bereinigt`, ignorieren kurze Abstürze, als Quelle für `utility_meter` nutzbar) und einen Binärsensor `binary_sensor.pv_assistant_string_fault` („String-Störung“), der meldet, wenn ein String fast nichts liefert, während die anderen erzeugen. Die Einstellungen liegen in `.storage/pv_assistant.settings` und gelten für alle Geräte; nur Administratoren dürfen speichern.

### Bekannte Einschränkungen
- Direkt verbrauchte PV-Energie: lädt der Speicher auch aus dem Netz, fällt der Wert etwas zu niedrig aus (kein Netzbezug-Sensor). Bei Stundenwerten (7/30 Tage) mittelt Home Assistant vorzeichenbehaftete Leistungssensoren, dort ist der Wert eine Näherung.
- Farben „Gelb auf hellem Hintergrund“ und „Rosa/Türkis bei Rot-Grün-Schwäche“ sind schwach unterscheidbar (Legende, Tooltip und Tabelle als Ausgleich).
- Die Schwellen der Hinweise und des String-Störungs-Sensors sind Heuristiken, keine Diagnose.
