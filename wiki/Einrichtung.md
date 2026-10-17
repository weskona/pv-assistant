# Einrichtung (Config Flow)

Die Einrichtung läuft in vier Schritten. Dieselben Schritte stehen später unter **Konfigurieren** der Integration zur Verfügung.

## Schritt 1: Energiesensoren (kWh)
- **Erzeugung:** beliebig viele Sensoren (ein Sensor pro String oder Wechselrichter).
- **Einspeisung:** genau ein Sensor.
- **Speicher:** optional „in Speicher“, „aus Speicher“ oder kombiniert (Netto) – jeweils beliebig viele, damit mehrere Speicher getrennt auswertbar sind.
- **Kombisensoren** (ein Sensor für rein und raus) haben immer die Option **Vorzeichen invertieren**. Standard: positiv = aus Speicher, negativ = in Speicher.
- **Reset-Bestätigung (Minuten):** ein niedrigerer Wert gilt erst als echter Zählerreset, wenn er so lange besteht (Standard 10).

## Schritt 2: Leistungssensoren (W)
Gleicher Aufbau wie Schritt 1, nur Leistung. Zusätzliche Schalter:
- **Einspeisesensor liefert Einspeisung als negative Werte** – Bezug zählt dann nicht als Einspeisung.
- **In-/Aus-Speicher-Sensoren liefern negative Werte** – dann zählt der Betrag (z. B. Alpha ESS „Leistung zur Batterie“).

> Verwende bei verschiedenen Ausrichtungen einzelne String-Sensoren statt eines Gesamtsensors, sonst ist kein String-Vergleich möglich.

## Schritt 3: Prognose (optional)
Energiesensoren für **heute**, **morgen** und **Rest heute** (z. B. Forecast.Solar oder Solcast), jeweils beliebig viele. Für „Prognose gegen Ist“ ist ein Sensor **„Prognose heute“** nötig.

## Schritt 4: Netz, Verbrauch und Preise (optional)
- **Netzbezug** (Energie und/oder Leistung)
- **Hausverbrauch** (Energie und/oder Leistung): den Gesamtverbrauch hinter dem Zähler inklusive Wallbox, Wärmepumpe usw., im selben Umfang wie den Netzbezug. Wird die Wallbox separat gemessen, ihren Sensor zusätzlich eintragen (Sensoren werden addiert).
- **Batterie-Ladestand** (%)
- **Einstrahlung** (W/m², Pyranometer oder Wetterstation) für die Performance Ratio. Kein Prognose-Sensor.
- **Strompreis** und **Einspeisevergütung** (Sensor oder `input_number`, €/kWh)

Ohne eigene Netzbezug-Sensoren und mit dem Schalter „negative Einspeisung“ wird der Netzbezug aus dem positiven Teil des Einspeisesensors abgeleitet.
