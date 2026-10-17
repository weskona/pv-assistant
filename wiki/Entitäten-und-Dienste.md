# Entitäten und Dienste

## Bereinigte Energiesensoren
Zu jedem Erzeugungs-, Einspeise- und Speicher-Energiesensor (kWh) legt die Integration eine Kopie `… bereinigt` an. Kurze Abstürze auf 0 oder `unavailable` werden ignoriert; ein niedrigerer Wert gilt erst als echter Reset, wenn er die eingestellte Zeit besteht (Standard 10 Minuten). Diese Sensoren als Quelle für `utility_meter` verwenden. Kombi-Speichersensoren (Netto) werden nicht gefiltert.

## String-Störung
`binary_sensor.pv_assistant_string_fault` (Klasse Problem) meldet, wenn ein String 15 Minuten fast nichts liefert (unter 5 % seines Peaks oder nicht verfügbar), während die anderen Strings mit Peak im Median mindestens 25 % liefern. Attribute: `strings`, `entity_ids`. Die Schwellen sind Heuristiken. Der Sensor braucht eingetragene Peaks.

## Gespeicherte Daten
- `.storage/pv_assistant.settings`: Namen, Peak, Ausrichtung, Neigung und Anlagenwerte
- Prognose-Protokoll (letzte Prognose je Tag, bis zu 800 Tage) in derselben Datei

## Websocket-Befehle (Panel)
- `pv_assistant/config`: Konfiguration, bereinigte Sensoren und Einstellungen
- `pv_assistant/set_settings`: Einstellungen speichern (nur Administratoren; nur konfigurierte Erzeugungssensoren)
