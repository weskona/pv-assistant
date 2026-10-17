# Berechnungen

## Direktverbrauch und Hausverbrauch
- **Direkt verbrauchte PV** = Erzeugung − Einspeisung − Speicher laden (nie unter 0 und nie über der Erzeugung).
- Mit **gemessenem Hausverbrauch und Netzbezug**: Hausverbrauch − Netzbezug − Speicher-Entladung. Ein gemessener Hausverbrauch zählt nur in Zeitabschnitten, in denen er plausibel ist (mindestens Netzbezug plus Entladung). Fehlende oder zu kleine Abschnitte (z. B. ein junger Sensor) werden aus der Bilanz berechnet; der Hausverbrauch heißt dann „teils berechnet“.
- **Hausverbrauch (berechnet)** = Erzeugung + Netzbezug + Entladung − Einspeisung − Laden.
- Lädt der Speicher auch aus dem Netz und es gibt keinen Netzbezug-Sensor, fällt der Direktverbrauch etwas zu niedrig aus.

## Kennzahlen
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

## Jahreszeiträume (Dieses Jahr, 12 Monate)
- **Leistung (Tagesmittel):** aus der Tagesenergie berechnet (Energie ÷ 24 h). Das ist exakt und behält die Richtung von Sensoren mit Vorzeichen. Ein Tagesmittel eines solchen Leistungssensors würde Bezug und Einspeisung oder Laden und Entladen gegeneinander aufheben.
- **Effektive Leistung:** die Tagesspitze (höchstes Stundenmittel des Tages ÷ Peak). Ein Tagesmittel enthält die Nacht und käme nie in die Nähe des Peaks.
- **Speicher:** Tageshöchstwert, Tagesdurchschnitt und Tagestiefstwert des Ladestands sowie die Tagesspitzen der Leistung aus den Höchst- und Tiefstwerten der Statistik.

## Energiezähler und Leistungssensoren
Gesamtwerte (z. B. Erzeugung in der Analyse) kommen aus den **Energiezählern**, weil sie mit dem Energy-Dashboard übereinstimmen. Der String-Vergleich und die Heatmap nutzen die **Leistungssensoren** (Stundenmittel). Eine bereinigte Kopie eines Sensors und das Original werden je Zeitabschnitt zusammengeführt (die Kopie gewinnt, wo sie Daten hat).

## String-Vergleich
Pro String: kWh pro installiertem kWp über die Stunden, in denen alle Strings Werte haben. Mit Ausrichtung und Neigung wird durch den **erwarteten Ertrag** geteilt:
- Mit Standort: Einstrahlung auf die Modulfläche bei klarem Himmel über genau die verglichenen Stunden (Sonnenstand, vereinfachtes Modell mit diffusem Anteil). Das folgt der Jahreszeit.
- Ohne Standort: grobe Jahrestabelle für Mitteleuropa.

Ein String gilt als schwach, wenn er unter 85 % des Medians liegt. Der **Vorschlag** richtet sich nach dem Sonnenstand (Osten, Süden, Westen) bzw. der Uhrzeit, in der der String zurückfällt: Vormittag/Abend → Verschattung, mittags → Überhitzung oder Begrenzung, gleichmäßig → Verschmutzung, Defekt oder falscher Peak. Das sind Faustregeln, keine Diagnose.

## Performance Ratio
Ertrag ÷ (Einstrahlung × installierte Leistung) über die gemeinsamen Stunden. Typisch sind 75–85 %.

## Prognose gegen Ist
Die Prognose des Tages (Summe der „Prognose heute“-Sensoren) wird täglich protokolliert und zusätzlich aus dem Verlauf der Sensoren der letzten Tage gelesen. Abweichung = (Ist − Prognose) ÷ Prognose.

## Jahresübersicht
Der Monatsschnitt zählt nur abgeschlossene Monate der letzten N Jahre bis zum aktuellsten Jahr mit Daten; Jahre ohne Daten zählen nicht als 0. Die Jahresprognose ist die Summe der Monatsschnitte. Der Trend der Jahressumme ist eine Ausgleichsgerade über die Abweichungen der Jahre (mindestens 9 Monate Daten) und wetterabhängig.
