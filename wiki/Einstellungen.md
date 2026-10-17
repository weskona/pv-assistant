# Einstellungen (Tab im Panel)

Nur Administratoren dürfen speichern. Die Werte liegen in `.storage/pv_assistant.settings` und gelten für alle Geräte. Leere Felder setzen auf den Standard zurück. Die Zahlenfelder haben keine Pfeile.

## Je String (Leistungssensor)
| Feld | Bedeutung |
|---|---|
| Anzeigename | ersetzt den Home-Assistant-Namen im ganzen Panel |
| Max. Leistung / Peak (W) | installierte Leistung des Strings; Basis für effektive Leistung und kWh/kWp. „übernehmen“ trägt den gemessenen Höchstwert ein |
| Ausrichtung / Azimut (°) | wie bei Forecast.Solar: Süd = 0°, Ost = −90°, West = 90°, Nord = ±180° |
| Neigung (°) | 0° = flach, 90° = senkrecht (Balkon, Fassade) |

Für Energiesensoren gibt es nur den Anzeigenamen. Mit Ausrichtung und Neigung wird der String-Vergleich fairer (Ost/West erzeugt weniger als Süd).

## Anlage
| Feld | Bedeutung |
|---|---|
| Speicherkapazität (kWh) | Gesamtkapazität des Speichers |
| Mindest-Ladestand (%) | untere Entladegrenze; nutzbare Kapazität = Kapazität × (1 − Mindest-Ladestand), angezeigt im Tab „Speicher“. Zyklen und „Nutzbar jetzt“ rechnen damit |
| Strompreis Netzbezug, Einspeisevergütung (€/kWh) | fester Ersatzwert. Ist im Config Flow ein Preis-Sensor gewählt, zeigt das Feld dessen Preis und ist gesperrt |
| Anlagenkosten (€) | für die Amortisation |
| CO₂-Faktor (g/kWh) | Standard 380 |
| Breiten- und Längengrad | optional; leer = Standort von Home Assistant. Genutzt für die Sonnenstand-Rechnung |
