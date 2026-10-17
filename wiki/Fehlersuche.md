# Fehlersuche und häufige Fragen

## Die Erzeugung weicht vom Energy-Dashboard ab
- **Zeitraum prüfen:** „12 Monate“ sind die letzten zwölf Monate, „Dieses Jahr“ beginnt am 1. Januar. Das Dashboard zeigt meist das Kalenderjahr.
- Das Panel nutzt bereinigte Kopien der Zähler, die kurze Sprünge ignorieren; kleine Unterschiede (unter 1 %) sind normal.

## „Prognose gegen Ist“ ist leer
Es muss ein Sensor **„Prognose heute“** gewählt sein (Schritt 3), „morgen“ oder „Rest heute“ reichen nicht. Das Panel liest die letzten Tage aus dem Sensorverlauf; bei neuen Sensoren erscheint der Vergleich spätestens am nächsten Tag.

## Die Preisfelder unter „Anlage“ sind leer oder gesperrt
Ist im Config Flow ein Preis-Sensor gewählt, zeigt das Feld dessen Preis und ist gesperrt. Der feste Wert gilt nur ohne Sensor.

## Direktverbrauch, Autarkie oder Hausverbrauch wirken zu klein
Ein Hausverbrauchs-Sensor mit kurzer Historie liefert nur für einen Teil des Zeitraums Werte. Das Panel rechnet fehlende Abschnitte aus der Bilanz (Anzeige „teils berechnet“). Der Hausverbrauch sollte den Gesamtverbrauch inklusive Wallbox enthalten.

## Ein String wird als schwach markiert
Prüfe zuerst Peak, Ausrichtung und Neigung in den Einstellungen. Ost- und Westdächer liefern weniger als Süd; mit eingetragener Ausrichtung wird das berücksichtigt. Folge dann dem Vorschlag in der Analyse.

## Negative Werte bei Speicher oder Einspeisung
Die Schalter „negative Einspeisung“ und „negative In-/Aus-Speicher-Werte“ im Config-Flow-Schritt 2 anpassen. Sensoren mit Vorzeichen gehören in das Feld „Kombisensor“ (Standard positiv = aus Speicher).

## Die Seite zeigt nach einem Update altes Verhalten
Home Assistant neu starten und den Browser hart neu laden (Strg+F5).

## Fehler melden
Als Issue im Repository melden, mit Version, Screenshot und den betroffenen Sensoren.
