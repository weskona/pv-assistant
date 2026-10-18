# PV Assistant

[English](#english) · [Deutsch](#deutsch)

## English

PV Assistant is a Home Assistant integration with its own sidebar panel for the PV energy flow: production, feed-in, grid import, storage, house consumption and forecast at a glance, with analyses per string.

> **Beta:** The project stays in beta (versions `0.x`, suffix `-beta`). Features and settings may change. All releases are marked as pre-releases. Enable "Show beta versions" in HACS.

### Pages
- [[Installation]] – HACS or manual
- [[Setup]] – the four steps of the config flow
- [[Panel-Tabs]] – what each tab shows
- [[Settings]] – names, peak, orientation, plant values, location
- [[Calculations]] – how the figures are calculated
- [[Entities-and-Services]] – filtered sensors, string fault, stored data
- [[Troubleshooting]] – frequently asked questions
- [[Development]] – structure, workflows, rules for contributions

### Quick start
1. Install as a custom repository via HACS and restart Home Assistant.
2. Settings → Devices & services → Add integration → **PV Assistant**.
3. Choose production, feed-in and storage sensors (energy and power); optionally forecast, grid import, house consumption and prices.
4. In the panel under **Settings** create your plants (one inverter each, with all its strings and MPPT inputs) and tick the power sensors that belong to it. Inside each plant enter name, peak, MPPTs and module strings (modules, orientation, tilt) per sensor. A sensor without a plant counts as a plant of its own. This improves the analysis considerably.

---

## Deutsch

PV Assistant ist eine Home-Assistant-Integration mit eigenem Sidebar-Panel für den PV-Energiefluss: Erzeugung, Einspeisung, Netzbezug, Speicher, Hausverbrauch und Prognose in einem Überblick, mit Auswertungen pro String.

> **Beta:** Das Projekt bleibt im Beta-Status (Versionen `0.x`, Suffix `-beta`). Funktionen und Einstellungen können sich ändern. Alle Releases sind als Vorabversion markiert. In HACS dafür „Beta-Versionen anzeigen“ aktivieren.

### Seiten
- [[Installation]] – HACS oder manuell
- [[Einrichtung|Setup]] – die vier Schritte des Config Flows
- [[Panel-Tabs]] – was jeder Tab zeigt
- [[Einstellungen|Settings]] – Namen, Peak, Ausrichtung, Anlagenwerte, Standort
- [[Berechnungen|Calculations]] – wie Kennzahlen entstehen
- [[Entitäten-und-Dienste|Entities-and-Services]] – bereinigte Sensoren, String-Störung, Speicherung
- [[Fehlersuche|Troubleshooting]] – häufige Fragen
- [[Entwicklung|Development]] – Aufbau, Workflows, Regeln für Beiträge

### Schnellstart
1. Per HACS als Custom Repository installieren und Home Assistant neu starten.
2. Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**.
3. Erzeugungs-, Einspeise- und Speichersensoren wählen (Energie und Leistung), optional Prognose, Netzbezug, Hausverbrauch und Preise.
4. Lege im Panel unter **Einstellungen** deine Anlagen an (je ein Wechselrichter mit allen seinen Strings und MPPT-Eingängen) und hake die zugehörigen Leistungssensoren an. Innerhalb jeder Anlage trägst du je Sensor Namen, Peak, MPPTs und Modulstränge (Module, Ausrichtung, Neigung) ein. Ein Sensor ohne Anlage zählt als eigene Anlage. Das verbessert die Analyse deutlich.
