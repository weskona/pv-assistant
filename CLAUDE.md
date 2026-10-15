# Projektregeln PV Assistant

- **Kombisensoren** (ein Sensor für rein und raus, z. B. Speicher oder Netz) bekommen im Config Flow
  immer eine Möglichkeit zum Invertieren des Vorzeichens (+/-). Das gilt für jeden Kombisensor, auch
  für künftig hinzukommende. Standard-Konvention dokumentieren (z. B. positiv = in Speicher).
- Config Flow in Schritten aufbauen; Sensoren sind Energie (kWh) bzw. Leistung (W) je nach Feld.
