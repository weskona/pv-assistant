# Projektregeln PV Assistant

- **Kombisensoren** (ein Sensor für rein und raus, z. B. Speicher oder Netz) bekommen im Config Flow
  immer eine Möglichkeit zum Invertieren des Vorzeichens (+/-). Das gilt für jeden Kombisensor, auch
  für künftig hinzukommende. Standard-Konvention dokumentieren (z. B. Speicher: positiv = aus Speicher, negativ = in Speicher).
- Config Flow in Schritten aufbauen; Sensoren sind Energie (kWh) bzw. Leistung (W) je nach Feld.
- Jeder PR muss `version` in `custom_components/pv_assistant/manifest.json` erhöhen (Workflow `validate`
  prüft das). Nach dem Merge erstellt der Workflow `release` automatisch das Release `v<version>`.
