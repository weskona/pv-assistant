[English](#english) · [Deutsch](#deutsch)

## English

### Direct consumption and house consumption
- **Directly used PV** = production − feed-in − charging the storage (never below 0 and never above the production).
- With **measured house consumption and grid import**: house consumption − grid import − storage discharge. A measured house consumption only counts in periods where it is plausible (at least grid import plus discharge). Missing or too small periods (for example a young sensor) are calculated from the balance; the house consumption is then called "partly calculated".
- **House consumption (calculated)** = production + grid import + discharge − feed-in − charging.
- If the storage also charges from the grid and there is no grid import sensor, the direct consumption is a little too low.

### Key figures
| Figure | Formula |
|---|---|
| Share of production | directly used ÷ production |
| Autarky | 1 − grid import ÷ house consumption |
| Self-consumption rate | (production − feed-in) ÷ production, also includes what went into the storage |
| Shifting potential | the smaller value of grid import and feed-in |
| Storage efficiency | discharged ÷ charged (meaningful when the level at the start and end is similar) |
| Usable capacity | capacity × (1 − minimum level) |
| Usable now | (level − minimum level) × capacity |
| Cycles | charged energy ÷ usable capacity |
| Savings | (production − feed-in) × electricity price |
| Feed-in revenue | feed-in × feed-in tariff |
| CO₂ avoided | production × CO₂ factor |

### Year ranges (This year, 12 months)
- **Power (daily mean):** calculated from the daily energy (energy ÷ 24 h). This is exact and keeps the direction of signed sensors. A daily mean of such a power sensor would cancel import against export or charging against discharging.
- **Effective power:** the daily peak (highest hourly mean of the day ÷ peak). A daily mean includes the night and would never get near the peak.
- **Storage:** daily high, daily average and daily low of the level, and the daily power peaks from the highest and lowest values of the statistics.

### Energy counters and power sensors
Totals (for example production in the analysis) come from the **energy counters** because they match the Energy dashboard. The string comparison and the heat map use the **power sensors** (hourly means). A filtered copy of a sensor and the original are merged per period (the copy wins where it has data).

### String comparison
Per string: kWh per installed kWp over the hours in which all strings have values. With orientation and tilt it is divided by the **expected yield**:
- With location: clear-sky irradiance on the module plane over exactly the compared hours (sun position, simplified model with a diffuse part). This follows the season.
- Without location: rough annual table for central Europe.

A string counts as weak if it is below 85 % of the median. The **suggestion** depends on the sun position (east, south, west) or the time of day in which the string falls behind: morning/evening → shading, midday → overheating or limiting, evenly → dirt, defect or wrong peak. These are rules of thumb, not a diagnosis.

### Performance ratio
Yield ÷ (irradiance × installed power) over the common hours. Typical values are 75–85 %.

### Forecast vs actual
The forecast of the day (sum of the "forecast today" sensors) is logged daily and additionally read from the sensor history of the last days. Deviation = (actual − forecast) ÷ forecast.

### Yearly overview
The monthly average only counts completed months of the last N years up to the latest year with data; years without data do not count as 0. The year forecast is the sum of the monthly averages. The trend of the yearly total is a regression line over the deviations of the years (at least 9 months of data) and depends on the weather.

---

## Deutsch

### Direktverbrauch und Hausverbrauch
- **Direkt verbrauchte PV** = Erzeugung − Einspeisung − Speicher laden (nie unter 0 und nie über der Erzeugung).
- Mit **gemessenem Hausverbrauch und Netzbezug**: Hausverbrauch − Netzbezug − Speicher-Entladung. Ein gemessener Hausverbrauch zählt nur in Zeitabschnitten, in denen er plausibel ist (mindestens Netzbezug plus Entladung). Fehlende oder zu kleine Abschnitte (z. B. ein junger Sensor) werden aus der Bilanz berechnet; der Hausverbrauch heißt dann „teils berechnet“.
- **Hausverbrauch (berechnet)** = Erzeugung + Netzbezug + Entladung − Einspeisung − Laden.
- Lädt der Speicher auch aus dem Netz und es gibt keinen Netzbezug-Sensor, fällt der Direktverbrauch etwas zu niedrig aus.

### Kennzahlen
| Kennzahl | Formel |
|---|---|
| Anteil an Erzeugung | direkt verbraucht ÷ Erzeugung |
| Autarkie | 1 − Netzbezug ÷ Hausverbrauch |
| Eigenverbrauchsquote | (Erzeugung − Einspeisung) ÷ Erzeugung, enthält auch, was in den Speicher ging |
| Verschiebepotenzial | kleinerer Wert aus Netzbezug und Einspeisung |
| Speicher-Wirkungsgrad | entladen ÷ geladen (aussagekräftig bei ähnlichem Ladestand am Anfang und Ende) |
| Nutzbare Kapazität | Kapazität × (1 − Mindest-Ladestand) |
| Nutzbar jetzt | (Ladestand − Mindest-Ladestand) × Kapazität |
| Zyklen | geladene Energie ÷ nutzbare Kapazität |
| Ersparnis | (Erzeugung − Einspeisung) × Strompreis |
| Einspeiseerlös | Einspeisung × Einspeisevergütung |
| CO₂ vermieden | Erzeugung × CO₂-Faktor |

### Jahreszeiträume (Dieses Jahr, 12 Monate)
- **Leistung (Tagesmittel):** aus der Tagesenergie berechnet (Energie ÷ 24 h). Das ist exakt und behält die Richtung von Sensoren mit Vorzeichen. Ein Tagesmittel eines solchen Leistungssensors würde Bezug und Einspeisung oder Laden und Entladen gegeneinander aufheben.
- **Effektive Leistung:** die Tagesspitze (höchstes Stundenmittel des Tages ÷ Peak). Ein Tagesmittel enthält die Nacht und käme nie in die Nähe des Peaks.
- **Speicher:** Tageshöchstwert, Tagesdurchschnitt und Tagestiefstwert des Ladestands sowie die Tagesspitzen der Leistung aus den Höchst- und Tiefstwerten der Statistik.

### Energiezähler und Leistungssensoren
Gesamtwerte (z. B. Erzeugung in der Analyse) kommen aus den **Energiezählern**, weil sie mit dem Energy-Dashboard übereinstimmen. Der String-Vergleich und die Heatmap nutzen die **Leistungssensoren** (Stundenmittel). Eine bereinigte Kopie eines Sensors und das Original werden je Zeitabschnitt zusammengeführt (die Kopie gewinnt, wo sie Daten hat).

### String-Vergleich
Pro String: kWh pro installiertem kWp über die Stunden, in denen alle Strings Werte haben. Mit Ausrichtung und Neigung wird durch den **erwarteten Ertrag** geteilt:
- Mit Standort: Einstrahlung auf die Modulfläche bei klarem Himmel über genau die verglichenen Stunden (Sonnenstand, vereinfachtes Modell mit diffusem Anteil). Das folgt der Jahreszeit.
- Ohne Standort: grobe Jahrestabelle für Mitteleuropa.

Ein String gilt als schwach, wenn er unter 85 % des Medians liegt. Der **Vorschlag** richtet sich nach dem Sonnenstand (Osten, Süden, Westen) bzw. der Uhrzeit, in der der String zurückfällt: Vormittag/Abend → Verschattung, mittags → Überhitzung oder Begrenzung, gleichmäßig → Verschmutzung, Defekt oder falscher Peak. Das sind Faustregeln, keine Diagnose.

### Performance Ratio
Ertrag ÷ (Einstrahlung × installierte Leistung) über die gemeinsamen Stunden. Typisch sind 75–85 %.

### Prognose gegen Ist
Die Prognose des Tages (Summe der „Prognose heute“-Sensoren) wird täglich protokolliert und zusätzlich aus dem Verlauf der Sensoren der letzten Tage gelesen. Abweichung = (Ist − Prognose) ÷ Prognose.

### Jahresübersicht
Der Monatsschnitt zählt nur abgeschlossene Monate der letzten N Jahre bis zum aktuellsten Jahr mit Daten; Jahre ohne Daten zählen nicht als 0. Die Jahresprognose ist die Summe der Monatsschnitte. Der Trend der Jahressumme ist eine Ausgleichsgerade über die Abweichungen der Jahre (mindestens 9 Monate Daten) und wetterabhängig.
