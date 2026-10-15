# PV Assistant

Home-Assistant-Integration mit eigenem Sidebar-Panel für PV-Energiefluss.

Konfiguration: Erzeugungs-, Einspeise- und Speichersensoren (nur Power) sowie Preise für Netzbezug und Einspeisevergütung (Sensor oder input_number).

## Installation
1. Ordner `custom_components/pv_assistant` nach `config/custom_components/` kopieren (oder per HACS als Custom Repository).
2. Home Assistant neu starten.
3. Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**.
4. Schritt 1: Leistungssensoren (Erzeugung, Einspeisung, in/aus Speicher). Schritt 2: Preise.

Das Panel erscheint danach in der Seitenleiste.
