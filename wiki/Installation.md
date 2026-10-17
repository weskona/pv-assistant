# Installation

## HACS (empfohlen)
1. HACS → ⋮ → **Benutzerdefinierte Repositories**.
2. Repository `https://github.com/weskona/pv-assistant`, Typ **Integration**, hinzufügen.
3. „PV Assistant“ öffnen und herunterladen. Da alle Versionen Vorabversionen sind, **Beta-Versionen anzeigen** aktivieren oder die Version von Hand wählen.
4. Home Assistant neu starten.

## Manuell
1. Ordner `custom_components/pv_assistant` nach `config/custom_components/` kopieren.
2. Home Assistant neu starten.

## Integration hinzufügen
Einstellungen → Geräte & Dienste → Integration hinzufügen → **PV Assistant**. Danach erscheint das Panel in der Seitenleiste. Der zuletzt gewählte Tab wird im Browser gemerkt.

## Aktualisieren
Nach einem Update über HACS Home Assistant neu starten und den Browser hart neu laden (Strg+F5), damit das neue Panel geladen wird.

## Voraussetzungen
- Die Sensoren brauchen eine `state_class` (Langzeitstatistiken des Recorders). Verlauf, Analyse und Jahresübersicht lesen daraus.
- Energiesensoren in kWh (Wh/MWh werden umgerechnet), Leistungssensoren in W.
