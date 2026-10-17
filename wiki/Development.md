[English](#english) · [Deutsch](#deutsch)

## English

### Structure
```
custom_components/pv_assistant/
  __init__.py        setup, websocket commands, storage, forecast log
  config_flow.py     config and options flow (four steps)
  sensor.py          filtered energy sensors
  binary_sensor.py   string fault
  frontend/          panel (web components, no build step)
    pv-assistant-panel.js     tabs, data, settings
    pv-assistant-charts.js    own SVG charts
    pv-assistant-analysis.js  heat map, plateaus, sun position
```

### Rules
- Every pull request raises `version` in `manifest.json` (format `x.y.z-beta`). The workflow `validate` checks this.
- After the merge the workflow `release` creates the release `v<version>` as a pre-release.
- Pull request titles are English and meaningful; they become the changelog (squash commit subject).
- Combined sensors always get an option in the config flow to invert the sign.
- Build the config flow in steps; texts in `strings.json`, `translations/en.json` and `translations/de.json` with identical keys.
- The project stays in beta; there is no version 1.0.
- **The wiki is always bilingual:** every page contains an English and a German section with the same content. Change both together. The same applies to the `README.md` and the issue forms (`English / Deutsch`).

### Panel colors (like the Energy dashboard)
| Series | Color |
|---|---|
| Feed-in | `#8353d1` |
| Grid import | `#488fc2` |
| PV production | `#ff9800` |
| directly used PV | `#ffd700` |
| from storage | `#4db6ac` |
| into storage | `#f06292` |

In the panel as CSS variables `--pva-*`; new series use this mapping.

### Checks
Workflow `validate`: hassfest, HACS, syntax check, JSON and translation key check, beta suffix and version bump.

### Wiki
The pages are Markdown files in the folder `wiki/` of the repository. The workflow `wiki` publishes them to the GitHub wiki when they change on `main`. The wiki has to be initialised once in the UI (create a first page); after that a change in the folder `wiki/` or a manual run of the workflow is enough.

---

## Deutsch

### Aufbau
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

### Regeln
- Jeder Pull Request erhöht `version` in `manifest.json` (Format `x.y.z-beta`). Der Workflow `validate` prüft das.
- Nach dem Merge erstellt der Workflow `release` das Release `v<version>` als Vorabversion.
- Pull-Request-Titel sind englisch und aussagekräftig; sie werden zum Changelog (Squash-Commit-Betreff).
- Kombisensoren bekommen im Config Flow immer eine Option zum Invertieren des Vorzeichens.
- Config Flow in Schritten aufbauen; Texte in `strings.json`, `translations/en.json` und `translations/de.json` mit identischen Schlüsseln.
- Das Projekt bleibt im Beta-Status; es gibt keine Version 1.0.
- **Das Wiki ist immer zweisprachig:** jede Seite hat einen englischen und einen deutschen Abschnitt mit demselben Inhalt. Beide gemeinsam ändern. Dasselbe gilt für die `README.md` und die Issue-Formulare (`English / Deutsch`).

### Panel-Farben (wie im Energy-Dashboard)
| Reihe | Farbe |
|---|---|
| Einspeisung | `#8353d1` |
| Netzbezug | `#488fc2` |
| PV-Erzeugung | `#ff9800` |
| direkt verbrauchte PV | `#ffd700` |
| aus Speicher | `#4db6ac` |
| in Speicher | `#f06292` |

Im Panel als CSS-Variablen `--pva-*`; neue Reihen nutzen diese Zuordnung.

### Prüfungen
Workflow `validate`: hassfest, HACS, Syntaxprüfung, JSON- und Übersetzungsschlüssel-Prüfung, Beta-Suffix und Versionserhöhung.

### Wiki
Die Seiten liegen als Markdown im Ordner `wiki/` des Repositories. Der Workflow `wiki` überträgt sie bei Änderungen auf `main` in das GitHub-Wiki. Das Wiki muss einmalig in der Oberfläche initialisiert werden (eine erste Seite anlegen), danach genügt eine Änderung im Ordner `wiki/` oder ein manueller Lauf des Workflows.
