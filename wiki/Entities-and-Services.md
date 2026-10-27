[English](#english) · [Deutsch](#deutsch)

## English

### Filtered energy sensors
For every production, feed-in and storage energy sensor (kWh) the integration creates a copy `… filtered`. Short drops to 0 or `unavailable` are ignored; a lower value only counts as a real reset when it lasts the configured time (default 10 minutes). Use these sensors as the source for `utility_meter`. Combined (net) storage sensors are not filtered.

### Calculated sensors
The integration creates sensors that you can use in automations, templates and dashboards. Which of them exist depends on the sensors you chose in the config flow. Energy and money values of the day count from 0 at midnight (state class total with `last_reset`), so they also work in the Energy dashboard and in long-term statistics.

| Sensor | Unit | Needs |
|---|---|---|
| PV power | W | production power sensors; the sum of all of them |
| PV effective power | % | peaks in the settings; power in percent of the peak of the sensors that have one |
| *Plant name* power, *Plant name* effective power | W, % | one pair per plant (inverter with its strings, or a single sensor); attributes `sensors` and `peak` |
| Production today | kWh | production energy sensors |
| Feed-in today | kWh | feed-in energy sensor |
| Self-consumption rate today | % | feed-in energy sensor |
| Self-sufficiency today | % | feed-in and grid import energy sensors (the house consumption sensor is used if there is one) |
| Savings today, Feed-in revenue today, Benefit today | currency | feed-in energy sensor and prices (price sensors or the settings) |
| Storage usable energy | kWh | battery level sensor, storage capacity and minimum level in the settings |
| Forecast reached today | % | forecast-today sensors and production energy sensors |

The values of the day are counted from the value of the counters at midnight (stored, so a restart keeps them); the filtered copies are used where they exist. A counter that falls clearly below its start value counts as reset. Plant sensors follow the settings: when you save the plants in the panel, new plants get their sensors and plants that no longer exist become unavailable. The entity id keeps the name it had when it was created; rename it in Home Assistant if you want a different id.

### Plant fault
`binary_sensor.pv_assistant_string_fault` (class problem) reports when a plant (inverter with all its strings / MPPT inputs, summed; a sensor without an inverter is a plant of its own) delivers almost nothing for 15 minutes (below 5 % of its peak or unavailable) while the other plants with a peak deliver at least 25 % in the median. Attributes: `plants`, `strings` (same names, kept for compatibility), `entity_ids` (the sensors of the faulty plants). A plant is only compared if all of its sensors have a peak. The thresholds are heuristics. The sensor needs entered peaks.

### Stored data
- `.storage/pv_assistant.settings`: names, peak, orientation, tilt and plant values
- `.storage/pv_assistant.daily`: the start values of the energy counters of the current day (for the daily sensors)
- Forecast log (last forecast per day, up to 800 days) in the same file

### Websocket commands (panel)
- `pv_assistant/config`: configuration, filtered sensors and settings
- `pv_assistant/set_settings`: save settings (administrators only; only configured production sensors)

---

## Deutsch

### Bereinigte Energiesensoren
Zu jedem Erzeugungs-, Einspeise- und Speicher-Energiesensor (kWh) legt die Integration eine Kopie `… bereinigt` an. Kurze Abstürze auf 0 oder `unavailable` werden ignoriert; ein niedrigerer Wert gilt erst als echter Reset, wenn er die eingestellte Zeit besteht (Standard 10 Minuten). Diese Sensoren als Quelle für `utility_meter` verwenden. Kombi-Speichersensoren (Netto) werden nicht gefiltert.

### Berechnete Sensoren
Die Integration legt Sensoren an, die du in Automationen, Templates und Dashboards weiterverwenden kannst. Welche es gibt, hängt von den Sensoren ab, die du im Config Flow gewählt hast. Energie- und Geldwerte des Tages zählen um Mitternacht ab 0 (State Class total mit `last_reset`), sie funktionieren daher auch im Energie-Dashboard und in den Langzeitstatistiken.

| Sensor | Einheit | Braucht |
|---|---|---|
| PV-Leistung | W | Erzeugungs-Leistungssensoren; die Summe aller |
| PV effektive Leistung | % | Peaks in den Einstellungen; Leistung in Prozent des Peaks der Sensoren, die einen haben |
| *Anlagenname* Leistung, *Anlagenname* effektive Leistung | W, % | ein Paar je Anlage (Wechselrichter mit seinen Strings oder ein einzelner Sensor); Attribute `sensors` und `peak` |
| Erzeugung heute | kWh | Erzeugungs-Energiesensoren |
| Einspeisung heute | kWh | Einspeise-Energiesensor |
| Eigenverbrauchsquote heute | % | Einspeise-Energiesensor |
| Autarkie heute | % | Einspeise- und Netzbezug-Energiesensoren (ein Hausverbrauchssensor wird genutzt, wenn vorhanden) |
| Ersparnis heute, Einspeiseerlös heute, Nutzen heute | Währung | Einspeise-Energiesensor und Preise (Preis-Sensoren oder Einstellungen) |
| Speicher nutzbare Energie | kWh | Ladestand-Sensor, Speicherkapazität und Mindest-Ladestand in den Einstellungen |
| Prognose erreicht heute | % | Prognose-heute-Sensoren und Erzeugungs-Energiesensoren |

Die Tageswerte werden ab dem Wert der Zähler um Mitternacht gezählt (gespeichert, ein Neustart behält sie); wo es bereinigte Kopien gibt, werden diese verwendet. Ein Zähler, der deutlich unter seinen Startwert fällt, gilt als zurückgesetzt. Die Anlagen-Sensoren folgen den Einstellungen: Speicherst du die Anlagen im Panel, bekommen neue Anlagen ihre Sensoren, und nicht mehr vorhandene Anlagen werden nicht verfügbar. Die Entity-ID behält den Namen, den sie bei der Erstellung hatte; benenne sie in Home Assistant um, wenn du eine andere ID möchtest.

### Anlagen-Störung
`binary_sensor.pv_assistant_string_fault` (Klasse Problem) meldet, wenn eine Anlage (Wechselrichter mit allen Strings / MPPT-Eingängen, summiert; ein Sensor ohne Wechselrichter ist eine eigene Anlage) 15 Minuten fast nichts liefert (unter 5 % ihres Peaks oder nicht verfügbar), während die anderen Anlagen mit Peak im Median mindestens 25 % liefern. Attribute: `plants`, `strings` (gleiche Namen, aus Kompatibilitätsgründen), `entity_ids` (die Sensoren der gestörten Anlagen). Eine Anlage wird nur verglichen, wenn alle ihre Sensoren einen Peak haben. Die Schwellen sind Heuristiken. Der Sensor braucht eingetragene Peaks.

### Gespeicherte Daten
- `.storage/pv_assistant.settings`: Namen, Peak, Ausrichtung, Neigung und Anlagenwerte
- `.storage/pv_assistant.daily`: die Startwerte der Energiezähler des aktuellen Tages (für die Tages-Sensoren)
- Prognose-Protokoll (letzte Prognose je Tag, bis zu 800 Tage) in derselben Datei

### Websocket-Befehle (Panel)
- `pv_assistant/config`: Konfiguration, bereinigte Sensoren und Einstellungen
- `pv_assistant/set_settings`: Einstellungen speichern (nur Administratoren; nur konfigurierte Erzeugungssensoren)
