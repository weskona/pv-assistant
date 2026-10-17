[English](#english) · [Deutsch](#deutsch)

## English

The setup runs in four steps. The same steps are available later under **Configure** of the integration.

### Step 1: Energy sensors (kWh)
- **Production:** any number of sensors (one sensor per string or inverter).
- **Feed-in:** exactly one sensor.
- **Storage:** optionally "into storage", "from storage" or combined (net) – any number of each, so several storages can be evaluated separately.
- **Combined sensors** (one sensor for in and out) always have the option **Invert sign**. Default: positive = from storage, negative = into storage.
- **Reset confirmation (minutes):** a lower value only counts as a real counter reset when it lasts this long (default 10).

### Step 2: Power sensors (W)
Same layout as step 1, but power. Additional switches:
- **Feed-in sensor reports feed-in as negative values** – grid import then does not count as feed-in.
- **In/out storage sensors report negative values** – then the absolute value counts (for example Alpha ESS "power to battery").

> With differently oriented strings use individual string sensors instead of one total sensor, otherwise no string comparison is possible.

### Step 3: Forecast (optional)
Energy sensors for **today**, **tomorrow** and **rest of today** (for example Forecast.Solar or Solcast), any number of each. "Forecast vs actual" needs a **"forecast today"** sensor.

### Step 4: Grid, consumption and prices (optional)
- **Grid import** (energy and/or power)
- **House consumption** (energy and/or power): the total consumption behind the meter including wallbox, heat pump etc., in the same scope as the grid import. If the wallbox is measured separately add its sensor as well (sensors are summed).
- **Battery level** (%)
- **Irradiance** (W/m², pyranometer or weather station) for the performance ratio. Not a forecast sensor.
- **Electricity price** and **feed-in tariff** (sensor or `input_number`, €/kWh)

Without own grid import sensors and with the switch "negative feed-in" the grid import is derived from the positive part of the feed-in sensor.

---

## Deutsch

Die Einrichtung läuft in vier Schritten. Dieselben Schritte stehen später unter **Konfigurieren** der Integration zur Verfügung.

### Schritt 1: Energiesensoren (kWh)
- **Erzeugung:** beliebig viele Sensoren (ein Sensor pro String oder Wechselrichter).
- **Einspeisung:** genau ein Sensor.
- **Speicher:** optional „in Speicher“, „aus Speicher“ oder kombiniert (Netto) – jeweils beliebig viele, damit mehrere Speicher getrennt auswertbar sind.
- **Kombisensoren** (ein Sensor für rein und raus) haben immer die Option **Vorzeichen invertieren**. Standard: positiv = aus Speicher, negativ = in Speicher.
- **Reset-Bestätigung (Minuten):** ein niedrigerer Wert gilt erst als echter Zählerreset, wenn er so lange besteht (Standard 10).

### Schritt 2: Leistungssensoren (W)
Gleicher Aufbau wie Schritt 1, nur Leistung. Zusätzliche Schalter:
- **Einspeisesensor liefert Einspeisung als negative Werte** – Bezug zählt dann nicht als Einspeisung.
- **In-/Aus-Speicher-Sensoren liefern negative Werte** – dann zählt der Betrag (z. B. Alpha ESS „Leistung zur Batterie“).

> Verwende bei verschiedenen Ausrichtungen einzelne String-Sensoren statt eines Gesamtsensors, sonst ist kein String-Vergleich möglich.

### Schritt 3: Prognose (optional)
Energiesensoren für **heute**, **morgen** und **Rest heute** (z. B. Forecast.Solar oder Solcast), jeweils beliebig viele. Für „Prognose gegen Ist“ ist ein Sensor **„Prognose heute“** nötig.

### Schritt 4: Netz, Verbrauch und Preise (optional)
- **Netzbezug** (Energie und/oder Leistung)
- **Hausverbrauch** (Energie und/oder Leistung): den Gesamtverbrauch hinter dem Zähler inklusive Wallbox, Wärmepumpe usw., im selben Umfang wie den Netzbezug. Wird die Wallbox separat gemessen, ihren Sensor zusätzlich eintragen (Sensoren werden addiert).
- **Batterie-Ladestand** (%)
- **Einstrahlung** (W/m², Pyranometer oder Wetterstation) für die Performance Ratio. Kein Prognose-Sensor.
- **Strompreis** und **Einspeisevergütung** (Sensor oder `input_number`, €/kWh)

Ohne eigene Netzbezug-Sensoren und mit dem Schalter „negative Einspeisung“ wird der Netzbezug aus dem positiven Teil des Einspeisesensors abgeleitet.
