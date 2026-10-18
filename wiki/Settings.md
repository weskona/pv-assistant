[English](#english) · [Deutsch](#deutsch)

## English

Only administrators can save. The values are stored in `.storage/pv_assistant.settings` and apply to all devices. Empty fields reset to the default. The number fields have no arrows.

### Per string (power sensor)
| Field | Meaning |
|---|---|
| Display name | replaces the Home Assistant name throughout the panel |
| Max. power / peak (W) | installed power of the string; basis for effective power and kWh/kWp. "use" enters the measured maximum |
| Number of modules (total), power per module (Wp) | optional; with both the peak is calculated automatically (count × Wp) and the max. power field is locked |
| Inverter max. power (W) | AC limit of the inverter of this string (e.g. 800 W for a balcony plant); the analysis then recognises clipping at the limit and shows the oversizing (module peak vs. inverter) |
| Number of MPPTs | inverter inputs with their own power tracking; with two orientations on only one MPPT the analysis warns about mismatch losses |
| Orientation / azimuth (°) | like Forecast.Solar: south = 0°, east = −90°, west = 90°, north = ±180° |
| Tilt (°) | 0° = flat, 90° = vertical (balcony, facade) |
| 2nd orientation, 2nd tilt, modules in 2nd orientation | optional, if part of the modules faces another way (e.g. two east, two west); the rest of the module count faces the 1st orientation, empty = half |

Energy sensors only have the display name. With orientation and tilt the string comparison becomes fairer (east/west yields less than south).

### Plant
| Field | Meaning |
|---|---|
| Storage capacity (kWh) | total capacity of the storage |
| Minimum level (%) | lower discharge limit; usable capacity = capacity × (1 − minimum level), shown in the Storage tab. Cycles and "Usable now" use it |
| Electricity price, feed-in tariff (€/kWh) | fixed fallback value. If a price sensor is chosen in the config flow the field shows its price and is locked |
| Plant cost (€) | for the payback |
| CO₂ factor (g/kWh) | default 380 |
| Latitude and longitude | optional; empty = location of Home Assistant. Used for the sun position calculation |

---

## Deutsch

Nur Administratoren dürfen speichern. Die Werte liegen in `.storage/pv_assistant.settings` und gelten für alle Geräte. Leere Felder setzen auf den Standard zurück. Die Zahlenfelder haben keine Pfeile.

### Je String (Leistungssensor)
| Feld | Bedeutung |
|---|---|
| Anzeigename | ersetzt den Home-Assistant-Namen im ganzen Panel |
| Max. Leistung / Peak (W) | installierte Leistung des Strings; Basis für effektive Leistung und kWh/kWp. „übernehmen“ trägt den gemessenen Höchstwert ein |
| Anzahl Module (gesamt), Leistung pro Modul (Wp) | optional; mit beiden wird der Peak automatisch berechnet (Anzahl × Wp) und das Feld Max. Leistung gesperrt |
| Wechselrichter max. Leistung (W) | AC-Grenze des Wechselrichters dieses Strings (z. B. 800 W bei einem Balkonkraftwerk); die Analyse erkennt damit Begrenzung an der Grenze und zeigt die Überbauung (Modul-Peak gegenüber Wechselrichter) |
| Anzahl MPPTs | Eingänge des Wechselrichters mit eigener Leistungsnachführung; bei zwei Ausrichtungen an nur einem MPPT warnt die Analyse vor Mismatch-Verlusten |
| Ausrichtung / Azimut (°) | wie bei Forecast.Solar: Süd = 0°, Ost = −90°, West = 90°, Nord = ±180° |
| Neigung (°) | 0° = flach, 90° = senkrecht (Balkon, Fassade) |
| 2. Ausrichtung, 2. Neigung, Module in 2. Ausrichtung | optional, wenn ein Teil der Module anders ausgerichtet ist (z. B. zwei nach Ost, zwei nach West); der Rest der Modulanzahl zeigt in die 1. Ausrichtung, leer = Hälfte |

Für Energiesensoren gibt es nur den Anzeigenamen. Mit Ausrichtung und Neigung wird der String-Vergleich fairer (Ost/West erzeugt weniger als Süd).

### Anlage
| Feld | Bedeutung |
|---|---|
| Speicherkapazität (kWh) | Gesamtkapazität des Speichers |
| Mindest-Ladestand (%) | untere Entladegrenze; nutzbare Kapazität = Kapazität × (1 − Mindest-Ladestand), angezeigt im Tab „Speicher“. Zyklen und „Nutzbar jetzt“ rechnen damit |
| Strompreis Netzbezug, Einspeisevergütung (€/kWh) | fester Ersatzwert. Ist im Config Flow ein Preis-Sensor gewählt, zeigt das Feld dessen Preis und ist gesperrt |
| Anlagenkosten (€) | für die Amortisation |
| CO₂-Faktor (g/kWh) | Standard 380 |
| Breiten- und Längengrad | optional; leer = Standort von Home Assistant. Genutzt für die Sonnenstand-Rechnung |
