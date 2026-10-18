[English](#english) · [Deutsch](#deutsch)

## English

Only administrators can save. The values are stored in `.storage/pv_assistant.settings` and apply to all devices. Empty fields reset to the default. The number fields have no arrows.

### Per power sensor (string / MPPT input, inside its plant)
| Field | Meaning |
|---|---|
| Display name | replaces the Home Assistant name throughout the panel |
| Max. power / peak (W) | installed power of the string; basis for effective power and kWh/kWp. "use" enters the measured maximum |
| Power per module (Wp) | optional; with the module counts of the module strings the peak is calculated automatically (modules × Wp) and the max. power field is locked |
| Number of MPPTs | only needed if this sensor combines several MPPT inputs (e.g. 4 for a balcony plant with a sum sensor); if every MPPT has its own sensor, leave empty |
| Module strings | per string of the inverter: modules, orientation / azimuth (like Forecast.Solar: south = 0°, east = −90°, west = 90°, north = ±180°), tilt (0° = flat, 90° = vertical) and the number of the MPPT it hangs on; add as many as the inverter has (e.g. 4 strings on 2 MPPTs). Empty rows are ignored. The analysis weights the expected yield of the strings by their module counts and warns when strings with different orientations share one MPPT |

Energy sensors only have the display name. With orientation and tilt the string comparison becomes fairer (east/west yields less than south).

### Plants (inverters)

A plant is one inverter with all the strings and MPPT inputs connected to it. Per plant: name, max. power of the inverter (W, optional) and the power sensors that belong to it. The cards of these sensors (see above) sit inside their plant. If a plant has several sensors (e.g. string 1 and string 2 of a hybrid inverter), tick all of them; the limit applies to their sum and every sensor is one MPPT. A sensor that is ticked in no plant is listed under "Single plants" and counts as a plant of its own, so the number of plants is what you have, independent of how many strings or MPPTs they contain.

The analysis and the fault sensor compare the **plants** with each other (sum per plant, kWh/kWp); the sensors inside a plant are additionally compared with each other. A plant is only compared if all of its sensors have a peak. The analysis also recognises clipping at the inverter limit and shows the oversizing (module peak vs. inverter).

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

### Je Leistungssensor (String / MPPT-Eingang, innerhalb seiner Anlage)
| Feld | Bedeutung |
|---|---|
| Anzeigename | ersetzt den Home-Assistant-Namen im ganzen Panel |
| Max. Leistung / Peak (W) | installierte Leistung des Strings; Basis für effektive Leistung und kWh/kWp. „übernehmen“ trägt den gemessenen Höchstwert ein |
| Leistung pro Modul (Wp) | optional; mit den Modulzahlen der Modulstränge wird der Peak automatisch berechnet (Module × Wp) und das Feld Max. Leistung gesperrt |
| Anzahl MPPTs | nur nötig, wenn dieser Sensor mehrere MPPT-Eingänge zusammenfasst (z. B. 4 bei einem Balkonkraftwerk mit Summensensor); hängt jeder MPPT an einem eigenen Sensor, leer lassen |
| Modulstränge | pro Strang des Wechselrichters: Module, Ausrichtung / Azimut (wie bei Forecast.Solar: Süd = 0°, Ost = −90°, West = 90°, Nord = ±180°), Neigung (0° = flach, 90° = senkrecht) und Nummer des MPPTs, an dem er hängt; so viele anlegen, wie der Wechselrichter hat (z. B. 4 Stränge an 2 MPPTs). Leere Zeilen werden ignoriert. Die Analyse gewichtet den erwarteten Ertrag der Stränge nach Modulzahl und warnt, wenn Stränge mit unterschiedlicher Ausrichtung an einem MPPT hängen |

Für Energiesensoren gibt es nur den Anzeigenamen. Mit Ausrichtung und Neigung wird der String-Vergleich fairer (Ost/West erzeugt weniger als Süd).

### Anlagen (Wechselrichter)

Eine Anlage ist ein Wechselrichter mit allen Strings und MPPT-Eingängen, die an ihm hängen. Pro Anlage: Name, max. Leistung des Wechselrichters (W, optional) und die zugehörigen Leistungssensoren. Die Karten dieser Sensoren (siehe oben) stehen innerhalb ihrer Anlage. Hat eine Anlage mehrere Sensoren (z. B. String 1 und String 2 eines Hybrid-Wechselrichters), werden alle angehakt; die Grenze gilt für ihre Summe, jeder Sensor ist ein MPPT. Ein Sensor, der in keiner Anlage angehakt ist, steht unter „Einzelne Anlagen“ und zählt als eigene Anlage; die Zahl der Anlagen entspricht also deinen tatsächlichen Anlagen, unabhängig davon, wie viele Strings oder MPPTs sie enthalten.

Analyse und Störungssensor vergleichen die **Anlagen** untereinander (Summe je Anlage, kWh/kWp); die Sensoren innerhalb einer Anlage werden zusätzlich untereinander verglichen. Eine Anlage wird nur verglichen, wenn alle ihre Sensoren einen Peak haben. Die Analyse erkennt außerdem Begrenzung an der Wechselrichter-Grenze und zeigt die Überbauung (Modul-Peak gegenüber Wechselrichter).

### Anlage
| Feld | Bedeutung |
|---|---|
| Speicherkapazität (kWh) | Gesamtkapazität des Speichers |
| Mindest-Ladestand (%) | untere Entladegrenze; nutzbare Kapazität = Kapazität × (1 − Mindest-Ladestand), angezeigt im Tab „Speicher“. Zyklen und „Nutzbar jetzt“ rechnen damit |
| Strompreis Netzbezug, Einspeisevergütung (€/kWh) | fester Ersatzwert. Ist im Config Flow ein Preis-Sensor gewählt, zeigt das Feld dessen Preis und ist gesperrt |
| Anlagenkosten (€) | für die Amortisation |
| CO₂-Faktor (g/kWh) | Standard 380 |
| Breiten- und Längengrad | optional; leer = Standort von Home Assistant. Genutzt für die Sonnenstand-Rechnung |
