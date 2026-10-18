[English](#english) · [Deutsch](#deutsch)

## English

### Production differs from the Energy dashboard
- **Check the period:** "12 months" are the last twelve months, "This year" starts on 1 January. The dashboard usually shows the calendar year.
- The panel uses filtered copies of the counters that ignore short jumps; small differences (below 1 %) are normal.

### "Forecast vs actual" is empty
A sensor **"forecast today"** has to be chosen (step 3); "tomorrow" or "rest of today" are not enough. The panel reads the last days from the sensor history; with new sensors the comparison appears the next day at the latest.

### The price fields under "Plant" are empty or locked
If a price sensor is chosen in the config flow the field shows its price and is locked. The fixed value only applies without a sensor.

### Direct consumption, autarky or house consumption look too small
A house consumption sensor with a short history only delivers values for part of the period. The panel calculates missing periods from the balance (shown as "partly calculated"). The house consumption should include the total consumption including the wallbox.

### A plant or string is marked as weak
First check peak, orientation and tilt in the settings. East and west roofs yield less than south; with the orientation entered this is taken into account. Then follow the suggestion in the analysis.

### Negative values for storage or feed-in
Adjust the switches "negative feed-in" and "negative in/out storage values" in config flow step 2. Sensors with a sign belong in the "combined sensor" field (default positive = from storage).

### The page shows old behavior after an update
Restart Home Assistant and hard-reload the browser (Ctrl+F5).

### Reporting bugs and wishes
Bugs and ideas belong in the [issue tracker](https://github.com/weskona/pv-assistant/issues/new/choose). There are two forms:
- **Report a bug:** version of PV Assistant and Home Assistant, affected tab, what you see and expect (for wrong numbers the comparison values with period), chosen sensors and settings, screenshots, logs.
- **Wish or idea:** the goal, a suggestion what it could look like, and which data would be needed.

Please do not include credentials or personal data in screenshots and logs.

---

## Deutsch

### Die Erzeugung weicht vom Energy-Dashboard ab
- **Zeitraum prüfen:** „12 Monate“ sind die letzten zwölf Monate, „Dieses Jahr“ beginnt am 1. Januar. Das Dashboard zeigt meist das Kalenderjahr.
- Das Panel nutzt bereinigte Kopien der Zähler, die kurze Sprünge ignorieren; kleine Unterschiede (unter 1 %) sind normal.

### „Prognose gegen Ist“ ist leer
Es muss ein Sensor **„Prognose heute“** gewählt sein (Schritt 3), „morgen“ oder „Rest heute“ reichen nicht. Das Panel liest die letzten Tage aus dem Sensorverlauf; bei neuen Sensoren erscheint der Vergleich spätestens am nächsten Tag.

### Die Preisfelder unter „Anlage“ sind leer oder gesperrt
Ist im Config Flow ein Preis-Sensor gewählt, zeigt das Feld dessen Preis und ist gesperrt. Der feste Wert gilt nur ohne Sensor.

### Direktverbrauch, Autarkie oder Hausverbrauch wirken zu klein
Ein Hausverbrauchs-Sensor mit kurzer Historie liefert nur für einen Teil des Zeitraums Werte. Das Panel rechnet fehlende Abschnitte aus der Bilanz (Anzeige „teils berechnet“). Der Hausverbrauch sollte den Gesamtverbrauch inklusive Wallbox enthalten.

### Eine Anlage oder ein String wird als schwach markiert
Prüfe zuerst Peak, Ausrichtung und Neigung in den Einstellungen. Ost- und Westdächer liefern weniger als Süd; mit eingetragener Ausrichtung wird das berücksichtigt. Folge dann dem Vorschlag in der Analyse.

### Negative Werte bei Speicher oder Einspeisung
Die Schalter „negative Einspeisung“ und „negative In-/Aus-Speicher-Werte“ im Config-Flow-Schritt 2 anpassen. Sensoren mit Vorzeichen gehören in das Feld „Kombisensor“ (Standard positiv = aus Speicher).

### Die Seite zeigt nach einem Update altes Verhalten
Home Assistant neu starten und den Browser hart neu laden (Strg+F5).

### Fehler melden und Wünsche äußern
Fehler und Ideen gehören in den [Issue-Tracker](https://github.com/weskona/pv-assistant/issues/new/choose). Es gibt zwei Formulare:
- **Fehler melden:** Version von PV Assistant und Home Assistant, betroffener Tab, was du siehst und erwartest (bei falschen Zahlen die Vergleichswerte mit Zeitraum), gewählte Sensoren und Einstellungen, Screenshots, Logs.
- **Wunsch oder Idee:** das Ziel, ein Vorschlag, wie es aussehen könnte, und welche Daten dafür nötig wären.

Bitte keine Zugangsdaten oder persönlichen Daten in Screenshots und Logs.
