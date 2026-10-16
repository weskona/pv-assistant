# Projektregeln PV Assistant

- **Kombisensoren** (ein Sensor für rein und raus, z. B. Speicher oder Netz) bekommen im Config Flow
  immer eine Möglichkeit zum Invertieren des Vorzeichens (+/-). Das gilt für jeden Kombisensor, auch
  für künftig hinzukommende. Standard-Konvention dokumentieren (z. B. Speicher: positiv = aus Speicher, negativ = in Speicher).
- Config Flow in Schritten aufbauen; Sensoren sind Energie (kWh) bzw. Leistung (W) je nach Feld.
- Jeder PR muss `version` in `custom_components/pv_assistant/manifest.json` erhöhen (Workflow `validate`
  prüft das). Nach dem Merge erstellt der Workflow `release` automatisch das Release `v<version>`.
- Changelog-Texte auf Englisch: Das Release wird aus den PR-Titeln (Squash-Commit-Betreff) erzeugt.
  PR-Titel daher immer auf Englisch und aussagekräftig formulieren. Chat und Doku mit dem Nutzer bleiben Deutsch.
- Panel-Farben (wie im Energy-Dashboard, vom Nutzer vorgegeben): Einspeisung #8353d1, Netzbezug #488fc2,
  PV-Erzeugung #ff9800, direkt verbrauchte PV #ffd700, aus Speicher #4db6ac, in Speicher #f06292.
  Als CSS-Variablen `--pva-*` im Panel; neue Reihen nutzen diese Zuordnung.
- Bis Version 1.0 ist das Projekt im Beta-Status (Versionen 0.x, normale Releases, kein Release Candidate).
  Die Version 1.0.0 ist die erste stabile Version; sie wird erst nach ausdrücklicher Freigabe durch den Nutzer vergeben.
