# PV Assistant

Home-Assistant-Integration mit eigenem Sidebar-Panel für PV-Energiefluss.

Berechnet aus PV-, Netz- und optional Batterieleistung: Hausverbrauch, Netzbezug,
Netzeinspeisung, Autarkie und Eigenverbrauchsquote.

## Installation
1. Ordner `custom_components/pv_assistant` nach `config/custom_components/` kopieren (oder per HACS als Custom Repository).
2. Home Assistant neu starten.
3. Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**.
4. Sensoren wählen; Vorzeichen bei Bedarf invertieren (Standard: Netz + = Bezug, Batterie + = Laden).

Das Panel erscheint danach in der Seitenleiste.
