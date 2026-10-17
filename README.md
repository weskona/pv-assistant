# PV Assistant

Home-Assistant-Integration mit eigenem Sidebar-Panel für PV-Energiefluss.

> **Beta:** Die Integration befindet sich im Beta-Status. Funktionen und Einstellungen können sich noch ändern, und es kann Fehler geben. Alle Releases sind als Vorabversion (Pre-release) markiert und tragen das Suffix `-beta` (z. B. `v0.6.4-beta`); in HACS dafür „Beta-Versionen anzeigen“ aktivieren oder die Version beim Herunterladen von Hand wählen. Rückmeldungen bitte als Issue melden.

Konfiguration in vier Schritten: (1) Energiesensoren (kWh), (2) Leistungssensoren (W) – beide mit gleichem Aufbau –, (3) optional Prognose-Energiesensoren (heute, morgen, Rest heute; je beliebig viele, z. B. von Forecast.Solar oder Solcast), (4) optional Netzbezug (Energie/Leistung), Hausverbrauch (Energie/Leistung), Batterie-Ladestand, Einstrahlung sowie Strompreis und Einspeisevergütung (Sensor oder input_number). Je: Erzeugung (mehrere), Einspeisung (einer), optional Speicher rein/raus oder kombiniert mit umschaltbarem Vorzeichen (mehrere).

## Bekannte Einschränkungen
- Direkt verbrauchte PV-Energie: lädt der Speicher auch aus dem Netz, fällt der Wert etwas zu niedrig aus (kein Netzbezug-Sensor). Bei Stundenwerten (7/30 Tage) mittelt Home Assistant vorzeichenbehaftete Leistungssensoren, dort ist der Wert eine Näherung.
- Der Netzbezug wird noch nicht ausgewertet (Farbe ist vorgesehen).
- Prognose: nur aktuelle Sensorwerte, kein Vergleich Prognose gegen Ist im Verlauf.
- Farben „Gelb auf hellem Hintergrund“ und „Rosa/Türkis bei Rot-Grün-Schwäche“ sind schwach unterscheidbar (Legende, Tooltip und Tabelle als Ausgleich).

## Installation
1. Ordner `custom_components/pv_assistant` nach `config/custom_components/` kopieren (oder per HACS als Custom Repository).
2. Home Assistant neu starten.
3. Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**.
4. Sensoren auswählen.

Das Panel erscheint danach in der Seitenleiste, gegliedert in die Tabs „Aktuell“, „Verlauf“ und „Jahresübersicht“ (der zuletzt gewählte Tab wird im Browser gemerkt), und zeigt die konfigurierten Sensoren (Energie und Leistung) mit aktuellen Werten und Summen.

## Prognose
Die Prognose-Sensoren erscheinen im Tab „Aktuell“ als Karten (mit Summe, Wh/kWh werden umgerechnet). Im Tab „Verlauf“ zeigt der Zeitraum „Heute“ zusätzlich die Prognose für heute und wie viel davon bereits erzeugt wurde.

## Leistung je String
Der Tab „Leistung“ zeigt für jeden Erzeugungs-Leistungssensor (String) die aktuelle Leistung als Balken im Verhältnis zur höchsten je gemessenen Leistung dieses Strings (aus den Langzeitstatistiken von Home Assistant, mindestens der aktuelle Wert).

## Effektive Leistung der Strings
Für Strings mit eingetragenem Peak (Tab „Einstellungen“) wird die effektive Leistung in Prozent berechnet (Leistung ÷ Peak × 100): als Diagramm im Tab „Verlauf“ (eine Linie je String plus „Gesamtanlage“ = Summe ÷ Summe der Peaks), im Tab „Leistung“ als Karte „Gesamtanlage“ und im Tooltip des Leistungsdiagramms hinter jedem String. Strings ohne eingetragenen Peak werden dabei nicht berücksichtigt.

## Einstellungen im Panel
Im Tab „Einstellungen“ (nur Administratoren dürfen speichern) kannst du für jeden Erzeugungssensor (String) einen eigenen **Anzeigenamen** vergeben, der im ganzen Panel statt des Home-Assistant-Namens erscheint (Karten, Diagramme, Tooltips). Bei Leistungssensoren lässt sich zusätzlich die **Max.-Leistung (Peak)** eintragen; sie ersetzt im Tab „Leistung“ das gemessene Maximum (mit „übernehmen“ kannst du den gemessenen Wert eintragen). Die Einstellungen werden in Home Assistant gespeichert (`.storage/pv_assistant.settings`) und gelten für alle Geräte. Leere Felder setzen auf den Standard zurück.

## Verlauf und Diagramme im Panel
Unter „Verlauf" wählst du den Zeitraum (Heute, Gestern, 7 Tage, 30 Tage). Das Panel zeigt Summen, ein Leistungsdiagramm (Erzeugung, Einspeisung, Speicher netto) und ein Energiediagramm je Stunde bzw. Tag (Erzeugung, Einspeisung, In/Aus Speicher). Die Daten kommen aus den Langzeitstatistiken von Home Assistant (Recorder); die Sensoren brauchen daher eine `state_class`. Zusätzlich wird die direkt verbrauchte PV-Energie berechnet (Erzeugung − Einspeisung − Speicher laden, nie unter 0; als Linie, Balken, Summe und Anteil an der Erzeugung). Meldet dein Einspeise-Leistungssensor die Einspeisung als negative Werte, aktiviere im Schritt „Leistungssensoren“ die Option „Einspeisesensor liefert Einspeisung als negative Werte“; Bezug zählt dann nicht als Einspeisung. Melden deine „In Speicher“-/„Aus Speicher“-Leistungssensoren die Richtung als negative Werte (z. B. Alpha ESS „Leistung zur Batterie“), aktiviere im Schritt „Leistungssensoren“ die Option „In-/Aus-Speicher-Sensoren liefern negative Werte“; dann zählt der Betrag. Lädt der Speicher auch aus dem Netz, fällt der Direktverbrauch etwas zu niedrig aus. Per Mouseover erscheinen die Werte, bei Reihen aus mehreren Quellen zusätzlich aufgeteilt nach Sensor (z. B. die einzelnen Strings unter „Erzeugung“; beim Direktverbrauch die Bestandteile Erzeugung, Einspeisung und Speicher laden), jedes Diagramm gibt es auch als Tabelle.

Hinweise zu Schritt 4: Der **Hausverbrauch** sollte den Gesamtverbrauch hinter dem Zähler enthalten (inkl. Wallbox, Wärmepumpe usw.) und denselben Umfang wie der Netzbezug haben; wird die Wallbox separat gemessen, füge ihren Sensor zusätzlich hinzu (Sensoren werden addiert). Der **Einstrahlungssensor** (W/m², Pyranometer oder Wetterstation) dient der Performance Ratio im Tab „Analyse“ und braucht die eingetragenen Peak-Leistungen der Strings.

## Tabs „Speicher“ und „Prognose“
Der Tab „Speicher“ (nur sichtbar, wenn Speichersensoren oder ein Ladestand gewählt sind) zeigt Ladestand, Speicherleistung (aus Speicher +, in Speicher −, je Gerät aufgeteilt), geladene und entladene Energie sowie Wirkungsgrad, Zyklen (mit Speicherkapazität aus den Einstellungen), maximale Lade- und Entladeleistung und den mittleren Ladestand. Die Speicher-Kennzahlen und das Ladestand-Diagramm sind aus dem Verlauf hierher gewandert.
Der Tab „Prognose“ (sichtbar, wenn Prognose-Sensoren gewählt sind) zeigt die aktuellen Prognosen (heute, morgen, Rest heute), den bisherigen Tagesertrag, die Prognose gegen Ist je Tag sowie die Abweichung (7 Tage bis Jahr). Diese Auswertung ist aus dem Tab „Analyse“ hierher gewandert.

## Analyse, Auswertungen und Anlagenwerte
Der Tab „Analyse“ (7/30/90 Tage, dieses Jahr oder 12 Monate; die Heatmap fasst längere Zeiträume wochenweise zusammen) vergleicht die Strings (kWh/kWp, Hinweis auf schwache Strings), zeigt eine Heatmap (Stunde × Tag), beste/schwächste Tage, einen Hinweis auf Leistungs-Plateaus (Wechselrichter-Begrenzung, ab 3 Tagen), die Performance Ratio (mit Einstrahlungssensor) und Prognose gegen Ist. Unter „Verlauf“ kommen Netzbezug, Hausverbrauch (gemessen oder berechnet), Autarkie, Eigenverbrauchsquote, Verschiebepotenzial, Speicher-Wirkungsgrad, Zyklen, Ersparnis, Einspeiseerlös, CO₂ und der Ladestand hinzu. Die Jahresübersicht zeigt zusätzlich Nutzen, Amortisation und den Trend der Jahressumme (wetterabhängig, nur Richtwert). Anlagenwerte (Speicherkapazität, Preise als Ersatz, Anlagenkosten, CO₂-Faktor) trägst du im Tab „Einstellungen“ unter „Anlage“ ein.
Die Gesamt-Erzeugung im Tab „Analyse“ stammt aus den Energiezählern (wie im Energy-Dashboard); der String-Vergleich und die Heatmap nutzen die Leistungssensoren, weshalb sie leicht abweichen können (ab 3 % Abweichung erscheint ein Hinweis).
Die Prognose der letzten Tage liest das Panel zusätzlich aus dem Verlauf der „Prognose heute“-Sensoren, damit der Vergleich sofort nach der Einrichtung erscheint (nur Sensoren „heute“ zählen, nicht „morgen“ oder „Rest heute“).
Die Prognose des Tages wird täglich protokolliert (für „Prognose gegen Ist“). Der Binärsensor `binary_sensor.pv_assistant_string_fault` („String-Störung“) meldet, wenn ein String 15 Minuten fast nichts liefert, während die anderen deutlich erzeugen. Die Schwellen sind Heuristiken.

## Jahresübersicht
Eigener Bereich im Panel: Monatserzeugung des gewählten Jahres neben dem Monatsschnitt, Abweichung zum Schnitt in Prozent (grün über, rot unter dem Schnitt) sowie Jahresprognose. Das Jahr lässt sich mit den Pfeilen durchblättern, die Zahl der Jahre im Schnitt (1–5, 10 oder alle) ist einstellbar und wird im Browser gemerkt. Der Schnitt je Monat zählt nur echte, abgeschlossene Monate der letzten N Jahre bis zum aktuellsten Jahr mit Daten (unabhängig vom angezeigten Jahr, damit auch ältere Jahre mit dem aktuellen Schnitt verglichen werden) (Jahre ohne Daten für einen Monat zählen nicht als 0); die Jahresprognose ist die Summe dieser Monatsschnitte. Zusätzlich gibt es einen Jahresvergleich über alle Jahre: die Gesamterzeugung je Jahr neben dem Schnitt derselben Monate und die Abweichung der Jahressumme in Prozent (Jahre mit „*“ zählen nur Monate mit Daten, das laufende Jahr nur abgeschlossene Monate; die Quellen werden im Tooltip je Sensor aufgeteilt). Eine Kachel zeigt die Abweichung des gewählten Jahres. Grundlage sind die Erzeugungs-Energiesensoren.

## Bereinigte Energiesensoren
Zu jedem Erzeugungs-, Einspeise- und Speicher-Energiesensor (kWh) legt die Integration eine bereinigte Kopie an (`… bereinigt`). Kurze Abstürze auf 0 oder `unavailable` werden ignoriert; ein niedrigerer Wert gilt erst als echter Reset, wenn er die eingestellte Zeit (Standard 10 Minuten) besteht. Diese Sensoren als Quelle für `utility_meter` verwenden. Kombi-Speichersensoren (Netto) werden nicht gefiltert.
