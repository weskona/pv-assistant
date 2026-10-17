# PV Assistant

PV Assistant ist eine Home-Assistant-Integration mit eigenem Sidebar-Panel für den PV-Energiefluss: Erzeugung, Einspeisung, Netzbezug, Speicher, Hausverbrauch und Prognose in einem Überblick, mit Auswertungen pro String.

> **Beta:** Das Projekt bleibt im Beta-Status (Versionen `0.x`, Suffix `-beta`). Funktionen und Einstellungen können sich ändern. Alle Releases sind als Vorabversion markiert. In HACS dafür „Beta-Versionen anzeigen“ aktivieren.

## Seiten
- [[Installation]] – HACS oder manuell
- [[Einrichtung]] – die vier Schritte des Config Flows
- [[Panel-Tabs]] – was jeder Tab zeigt
- [[Einstellungen]] – Namen, Peak, Ausrichtung, Anlagenwerte, Standort
- [[Berechnungen]] – wie Kennzahlen entstehen
- [[Entitäten-und-Dienste]] – bereinigte Sensoren, String-Störung, Speicherung
- [[Fehlersuche]] – häufige Fragen
- [[Entwicklung]] – Aufbau, Workflows, Regeln für Beiträge

## Schnellstart
1. Per HACS als Custom Repository installieren und Home Assistant neu starten.
2. Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**.
3. Erzeugungs-, Einspeise- und Speichersensoren wählen (Energie und Leistung), optional Prognose, Netzbezug, Hausverbrauch und Preise.
4. Im Panel unter **Einstellungen** für jeden String Namen, Peak, Ausrichtung und Neigung eintragen. Das verbessert die Analyse deutlich.
