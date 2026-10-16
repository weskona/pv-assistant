# PV Assistant

Home-Assistant-Integration mit eigenem Sidebar-Panel für PV-Energiefluss.

Konfiguration in drei Schritten: (1) Energiesensoren (kWh), (2) Leistungssensoren (W) – beide mit gleichem Aufbau –, (3) optional Prognose-Energiesensoren (heute, morgen, Rest heute; je beliebig viele, z. B. von Forecast.Solar oder Solcast). Je: Erzeugung (mehrere), Einspeisung (einer), optional Speicher rein/raus oder kombiniert mit umschaltbarem Vorzeichen (mehrere).

## Installation
1. Ordner `custom_components/pv_assistant` nach `config/custom_components/` kopieren (oder per HACS als Custom Repository).
2. Home Assistant neu starten.
3. Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**.
4. Sensoren auswählen.

Das Panel erscheint danach in der Seitenleiste, gegliedert in die Tabs „Aktuell“, „Verlauf“ und „Jahresübersicht“ (der zuletzt gewählte Tab wird im Browser gemerkt), und zeigt die konfigurierten Sensoren (Energie und Leistung) mit aktuellen Werten und Summen.

## Prognose
Die Prognose-Sensoren erscheinen im Tab „Aktuell“ als Karten (mit Summe, Wh/kWh werden umgerechnet). Im Tab „Verlauf“ zeigt der Zeitraum „Heute“ zusätzlich die Prognose für heute und wie viel davon bereits erzeugt wurde.

## Verlauf und Diagramme im Panel
Unter „Verlauf" wählst du den Zeitraum (Heute, Gestern, 7 Tage, 30 Tage). Das Panel zeigt Summen, ein Leistungsdiagramm (Erzeugung, Einspeisung, Speicher netto) und ein Energiediagramm je Stunde bzw. Tag (Erzeugung, Einspeisung, In/Aus Speicher). Die Daten kommen aus den Langzeitstatistiken von Home Assistant (Recorder); die Sensoren brauchen daher eine `state_class`. Zusätzlich wird die direkt verbrauchte PV-Energie berechnet (Erzeugung − Einspeisung − Speicher laden, nie unter 0; als Linie, Balken, Summe und Anteil an der Erzeugung). Meldet dein Einspeise-Leistungssensor die Einspeisung als negative Werte, aktiviere im Schritt „Leistungssensoren“ die Option „Einspeisesensor liefert Einspeisung als negative Werte“; Bezug zählt dann nicht als Einspeisung. Lädt der Speicher auch aus dem Netz, fällt der Direktverbrauch etwas zu niedrig aus. Per Mouseover erscheinen die Werte, jedes Diagramm gibt es auch als Tabelle.

## Jahresübersicht
Eigener Bereich im Panel: Monatserzeugung des gewählten Jahres neben dem Monatsschnitt, Abweichung zum Schnitt in Prozent sowie Jahresprognose. Das Jahr lässt sich mit den Pfeilen durchblättern, die Zahl der Jahre im Schnitt (1–5, 10 oder alle) ist einstellbar und wird im Browser gemerkt. Der Schnitt je Monat zählt nur echte, abgeschlossene Monate der gewählten Jahre (Jahre ohne Daten für einen Monat zählen nicht als 0); die Jahresprognose ist die Summe dieser Monatsschnitte. Grundlage sind die Erzeugungs-Energiesensoren.

## Bereinigte Energiesensoren
Zu jedem Erzeugungs-, Einspeise- und Speicher-Energiesensor (kWh) legt die Integration eine bereinigte Kopie an (`… bereinigt`). Kurze Abstürze auf 0 oder `unavailable` werden ignoriert; ein niedrigerer Wert gilt erst als echter Reset, wenn er die eingestellte Zeit (Standard 10 Minuten) besteht. Diese Sensoren als Quelle für `utility_meter` verwenden. Kombi-Speichersensoren (Netto) werden nicht gefiltert.
