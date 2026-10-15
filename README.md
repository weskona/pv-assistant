# PV Assistant

Home-Assistant-Integration mit eigenem Sidebar-Panel für PV-Energiefluss.

Konfiguration in zwei Schritten mit gleichem Aufbau: (1) Energiesensoren (kWh), (2) Leistungssensoren (W). Je: Erzeugung (mehrere), Einspeisung (einer), optional Speicher rein/raus oder kombiniert mit umschaltbarem Vorzeichen (mehrere).

## Installation
1. Ordner `custom_components/pv_assistant` nach `config/custom_components/` kopieren (oder per HACS als Custom Repository).
2. Home Assistant neu starten.
3. Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**.
4. Sensoren auswählen.

Das Panel erscheint danach in der Seitenleiste und zeigt die konfigurierten Sensoren (Energie und Leistung) mit aktuellen Werten und Summen.

## Bereinigte Energiesensoren
Zu jedem Erzeugungs-, Einspeise- und Speicher-Energiesensor (kWh) legt die Integration eine bereinigte Kopie an (`… bereinigt`). Kurze Abstürze auf 0 oder `unavailable` werden ignoriert; ein niedrigerer Wert gilt erst als echter Reset, wenn er die eingestellte Zeit (Standard 10 Minuten) besteht. Diese Sensoren als Quelle für `utility_meter` verwenden. Kombi-Speichersensoren (Netto) werden nicht gefiltert.
