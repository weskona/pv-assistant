[English](#english) · [Deutsch](#deutsch)

## English

### HACS (recommended)
1. HACS → ⋮ → **Custom repositories**.
2. Add the repository `https://github.com/weskona/pv-assistant` with type **Integration**.
3. Open "PV Assistant" and download it. All versions are pre-releases, so enable **Show beta versions** or choose the version by hand.
4. Restart Home Assistant.

### Manual
1. Copy the folder `custom_components/pv_assistant` to `config/custom_components/`.
2. Restart Home Assistant.

### Add the integration
Settings → Devices & services → Add integration → **PV Assistant**. The panel then appears in the sidebar. The last selected tab is remembered in the browser.

### Update
After an update through HACS restart Home Assistant and reload the browser; the panel is loaded under the new version, so no hard reload is needed.

### Requirements
- The sensors need a `state_class` (long-term statistics of the recorder). History, Analysis and Yearly overview read from it.
- Energy sensors in kWh (Wh/MWh are converted), power sensors in W.

---

## Deutsch

### HACS (empfohlen)
1. HACS → ⋮ → **Benutzerdefinierte Repositories**.
2. Repository `https://github.com/weskona/pv-assistant`, Typ **Integration**, hinzufügen.
3. „PV Assistant“ öffnen und herunterladen. Da alle Versionen Vorabversionen sind, **Beta-Versionen anzeigen** aktivieren oder die Version von Hand wählen.
4. Home Assistant neu starten.

### Manuell
1. Ordner `custom_components/pv_assistant` nach `config/custom_components/` kopieren.
2. Home Assistant neu starten.

### Integration hinzufügen
Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**. Danach erscheint das Panel in der Seitenleiste. Der zuletzt gewählte Tab wird im Browser gemerkt.

### Aktualisieren
Nach einem Update über HACS Home Assistant neu starten und den Browser neu laden; das Panel wird unter der neuen Version geladen, ein hartes Neuladen ist nicht nötig.

### Voraussetzungen
- Die Sensoren brauchen eine `state_class` (Langzeitstatistiken des Recorders). Verlauf, Analyse und Jahresübersicht lesen daraus.
- Energiesensoren in kWh (Wh/MWh werden umgerechnet), Leistungssensoren in W.
