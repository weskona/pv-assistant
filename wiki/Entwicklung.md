# Entwicklung

## Aufbau
```
custom_components/pv_assistant/
  __init__.py        Setup, Websocket-Befehle, Speicherung, Prognose-Protokoll
  config_flow.py     Config und Options Flow (vier Schritte)
  sensor.py          bereinigte Energiesensoren
  binary_sensor.py   String-Störung
  frontend/          Panel (Web Components, ohne Build-Schritt)
    pv-assistant-panel.js     Tabs, Daten, Einstellungen
    pv-assistant-charts.js    eigene SVG-Diagramme
    pv-assistant-analysis.js  Heatmap, Plateaus, Sonnenstand
```

## Regeln
- Jeder Pull Request erhöht `version` in `manifest.json` (Format `x.y.z-beta`). Der Workflow `validate` prüft das.
- Nach dem Merge erstellt der Workflow `release` das Release `v<version>` als Vorabversion.
- Pull-Request-Titel sind englisch und aussagekräftig; sie werden zum Changelog (Squash-Commit-Betreff).
- Kombisensoren bekommen im Config Flow immer eine Option zum Invertieren des Vorzeichens.
- Config Flow in Schritten aufbauen; Texte in `strings.json`, `translations/en.json` und `translations/de.json` mit identischen Schlüsseln.
- Das Projekt bleibt im Beta-Status; es gibt keine Version 1.0.

## Panel-Farben (wie im Energy-Dashboard)
| Reihe | Farbe |
|---|---|
| Einspeisung | `#8353d1` |
| Netzbezug | `#488fc2` |
| PV-Erzeugung | `#ff9800` |
| direkt verbrauchte PV | `#ffd700` |
| aus Speicher | `#4db6ac` |
| in Speicher | `#f06292` |

Im Panel als CSS-Variablen `--pva-*`; neue Reihen nutzen diese Zuordnung.

## Prüfungen
Workflow `validate`: hassfest, HACS, Syntaxprüfung, JSON- und Übersetzungsschlüssel-Prüfung, Beta-Suffix und Versionserhöhung.

## Wiki
Die Seiten liegen als Markdown im Ordner `wiki/` des Repositories. Der Workflow `wiki` überträgt sie bei Änderungen auf `main` in das GitHub-Wiki. Das Wiki muss einmalig in der Oberfläche initialisiert werden (eine erste Seite anlegen), danach genügt eine Änderung im Ordner `wiki/` oder ein manueller Lauf des Workflows.
