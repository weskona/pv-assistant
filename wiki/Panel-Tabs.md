# Panel-Tabs

Alle Kennzahlen eines Tabs stehen gemeinsam in einer Karte. Tabs ohne passende Sensoren werden ausgeblendet.

## Aktuell
Karten für alle konfigurierten Sensoren (Energie und Leistung) mit aktuellen Werten und Summen, dazu die Prognose-Sensoren.

## Leistung
Aktuelle Leistung je String als Balken im Verhältnis zur höchsten gemessenen Leistung (oder dem eingetragenen Peak) und die effektive Leistung der **Gesamtanlage** in Prozent. Darunter ein Diagramm mit dem Leistungsverlauf je String und der Gesamtanlage (Heute, Gestern, 7 Tage).

## Analyse
Zeiträume 7, 30, 90 Tage, **Dieses Jahr** oder **12 Monate**.
- String-Vergleich in kWh/kWp, bereinigt um Ausrichtung und Neigung, mit Hinweis und **Vorschlag** bei schwachen Strings
- Heatmap Stunde × Tag (ab 90 Tagen wochenweise)
- Beste und schwächste Tage (mit Jahr; Tage unter 0,1 kWh zählen nicht)
- Hinweis auf Leistungs-Plateaus (Wechselrichter-Begrenzung, ab 3 Tagen)
- Performance Ratio (mit Einstrahlungssensor)
- Die Erzeugung stammt aus den Energiezählern (wie im Energy-Dashboard); ab 3 % Abweichung zur Leistungssumme erscheint ein Hinweis.

## Verlauf
Zeiträume Heute, Gestern, 7 Tage, 30 Tage, **Dieses Jahr**, **12 Monate**. Bei den Jahreszeiträumen zeigen Leistungsdiagramme Tagesmittel und das Energiediagramm Monatsgruppen.
- Kennzahlen: Erzeugung, Einspeisung, Speicher, Direktverbrauch, Netzbezug, Hausverbrauch, Autarkie, Eigenverbrauchsquote, Verschiebepotenzial, Ersparnis, Einspeiseerlös, CO₂
- Diagramme: Leistung, effektive Leistung der Strings in %, Energie
- Mouseover teilt Quellen auf (z. B. die einzelnen Strings); jedes Diagramm gibt es auch als Tabelle.

## Speicher
Nur sichtbar mit Speichersensoren oder Ladestand. Gleiche Zeiträume wie der Verlauf.
- Kennzahlen: Ladestand jetzt, geladen, entladen, Wirkungsgrad, Zyklen (mit Speicherkapazität), maximale Lade- und Entladeleistung, Ladestand min–max, Ø Ladestand
- Diagramme: Ladestand, Speicherleistung (aus Speicher +, in Speicher −, je Gerät), geladene und entladene Energie

## Prognose
Nur sichtbar mit Prognose-Sensoren. Zeiträume 7, 30, 90 Tage, Dieses Jahr, 12 Monate.
- Prognose heute, morgen, Rest heute, bisher erzeugt, von Prognose erreicht
- Prognose gegen Ist und Abweichung je Tag (ab 90 Tagen je Monat), Ø Abweichung, Trefferquote (±20 %)

## Jahresübersicht
Monatserzeugung des gewählten Jahres neben dem Monatsschnitt, Abweichung in Prozent, Jahresprognose, Jahresvergleich über alle Jahre, Nutzen, Amortisation und Trend der Jahressumme.

## Einstellungen
Siehe [[Einstellungen]].
