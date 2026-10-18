[English](#english) · [Deutsch](#deutsch)

## English

### Filtered energy sensors
For every production, feed-in and storage energy sensor (kWh) the integration creates a copy `… filtered`. Short drops to 0 or `unavailable` are ignored; a lower value only counts as a real reset when it lasts the configured time (default 10 minutes). Use these sensors as the source for `utility_meter`. Combined (net) storage sensors are not filtered.

### Plant fault
`binary_sensor.pv_assistant_string_fault` (class problem) reports when a plant (inverter with all its strings / MPPT inputs, summed; a sensor without an inverter is a plant of its own) delivers almost nothing for 15 minutes (below 5 % of its peak or unavailable) while the other plants with a peak deliver at least 25 % in the median. Attributes: `plants`, `strings` (same names, kept for compatibility), `entity_ids` (the sensors of the faulty plants). A plant is only compared if all of its sensors have a peak. The thresholds are heuristics. The sensor needs entered peaks.

### Stored data
- `.storage/pv_assistant.settings`: names, peak, orientation, tilt and plant values
- Forecast log (last forecast per day, up to 800 days) in the same file

### Websocket commands (panel)
- `pv_assistant/config`: configuration, filtered sensors and settings
- `pv_assistant/set_settings`: save settings (administrators only; only configured production sensors)

---

## Deutsch

### Bereinigte Energiesensoren
Zu jedem Erzeugungs-, Einspeise- und Speicher-Energiesensor (kWh) legt die Integration eine Kopie `… bereinigt` an. Kurze Abstürze auf 0 oder `unavailable` werden ignoriert; ein niedrigerer Wert gilt erst als echter Reset, wenn er die eingestellte Zeit besteht (Standard 10 Minuten). Diese Sensoren als Quelle für `utility_meter` verwenden. Kombi-Speichersensoren (Netto) werden nicht gefiltert.

### Anlagen-Störung
`binary_sensor.pv_assistant_string_fault` (Klasse Problem) meldet, wenn eine Anlage (Wechselrichter mit allen Strings / MPPT-Eingängen, summiert; ein Sensor ohne Wechselrichter ist eine eigene Anlage) 15 Minuten fast nichts liefert (unter 5 % ihres Peaks oder nicht verfügbar), während die anderen Anlagen mit Peak im Median mindestens 25 % liefern. Attribute: `plants`, `strings` (gleiche Namen, aus Kompatibilitätsgründen), `entity_ids` (die Sensoren der gestörten Anlagen). Eine Anlage wird nur verglichen, wenn alle ihre Sensoren einen Peak haben. Die Schwellen sind Heuristiken. Der Sensor braucht eingetragene Peaks.

### Gespeicherte Daten
- `.storage/pv_assistant.settings`: Namen, Peak, Ausrichtung, Neigung und Anlagenwerte
- Prognose-Protokoll (letzte Prognose je Tag, bis zu 800 Tage) in derselben Datei

### Websocket-Befehle (Panel)
- `pv_assistant/config`: Konfiguration, bereinigte Sensoren und Einstellungen
- `pv_assistant/set_settings`: Einstellungen speichern (nur Administratoren; nur konfigurierte Erzeugungssensoren)
