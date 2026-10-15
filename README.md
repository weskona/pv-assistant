# PV Assistant

Home-Assistant-Integration mit eigenem Sidebar-Panel für PV-Energiefluss.

Konfiguration in zwei Schritten mit gleichem Aufbau: (1) Energiesensoren (kWh), (2) Leistungssensoren (W). Je: Erzeugung (mehrere), Einspeisung (einer), optional Speicher rein/raus oder kombiniert mit umschaltbarem Vorzeichen (mehrere).

## Installation
1. Ordner `custom_components/pv_assistant` nach `config/custom_components/` kopieren (oder per HACS als Custom Repository).
2. Home Assistant neu starten.
3. Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**.
4. Sensoren auswählen.

Das Panel erscheint danach in der Seitenleiste und zeigt die konfigurierten Sensoren (Energie und Leistung) mit aktuellen Werten und Summen.
