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
    pv-assistant-panel.js     shell: element, Now tab, tab bar (loads the modules below)
    pv-assistant-flow.js      energy flow diagram and key figure strip
    pv-assistant-range.js     range picker, range definitions, statistics queries
    pv-assistant-tab-*.js     one file per tab (history, storage, forecast, years, power, settings, plants, balance, economics, analysis)
    pv-assistant-texts.js     panel texts (German and English)
    pv-assistant-util.js      pure helpers (periods, plants, merging of statistics)
    pv-assistant-charts.js    own SVG charts
    pv-assistant-analysis.js  heat map, plateaus, sun position
```

The panel modules are classes (`*Part`) whose methods are added to the panel class. The shared helpers are handed to each module through `init(ctx)`, because all modules are loaded with the `?v=<version>` of the panel (an update never mixes new and cached files). A new helper has to be added there; the check `eslint no-undef` finds a forgotten one.

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
Workflow `validate`: hassfest, HACS, syntax check of Python and all frontend files, `ruff`, `eslint` (undefined names in the frontend), JSON and translation key check, panel text check (`tools/check_texts.py`: German and English match, no text missing or unused), beta suffix and version bump, and the tests.

Tests: `pip install -r requirements-test.txt && pytest` (Home Assistant test framework; `tests/test_calc.py` covers the calculated sensors, the daily counters and the midnight rollover). The release notes list one line per pull request (its title).

### Screenshots
The images in `docs/screenshots/{en,de}` show every tab with sample data (README and wiki use them). `tools/screenshots/make.cjs` creates them: it loads the real panel files in a browser (Playwright) with a fake Home Assistant behind them (`mock.js`: a simulated system with three and a half years of made-up data). Run it again after visible changes of the panel; the options are in the header of the script.

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
    pv-assistant-panel.js     Gerüst: Element, Tab Aktuell, Tab-Leiste (lädt die Module unten)
    pv-assistant-flow.js      Energiefluss-Diagramm und Kennzahlen-Leiste
    pv-assistant-range.js     Zeitraum-Wähler, Zeitraum-Definitionen, Statistik-Abfragen
    pv-assistant-tab-*.js     eine Datei je Tab (history, storage, forecast, years, power, settings, plants, balance, economics, analysis)
    pv-assistant-texts.js     Panel-Texte (Deutsch und Englisch)
    pv-assistant-util.js      reine Hilfsfunktionen (Zeiträume, Anlagen, Zusammenführen von Statistiken)
    pv-assistant-charts.js    eigene SVG-Diagramme
    pv-assistant-analysis.js  Heatmap, Plateaus, Sonnenstand
```

Die Panel-Module sind Klassen (`*Part`), deren Methoden zur Panel-Klasse hinzugefügt werden. Die gemeinsamen Hilfsfunktionen bekommt jedes Modul über `init(ctx)`, weil alle Module mit dem `?v=<Version>` des Panels geladen werden (ein Update mischt nie neue und zwischengespeicherte Dateien). Eine neue Hilfsfunktion muss dort ergänzt werden; die Prüfung `eslint no-undef` findet eine vergessene.

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
Workflow `validate`: hassfest, HACS, Syntaxprüfung von Python und allen Frontend-Dateien, `ruff`, `eslint` (undefinierte Namen im Frontend), JSON- und Übersetzungsschlüssel-Prüfung, Prüfung der Panel-Texte (`tools/check_texts.py`: Deutsch und Englisch stimmen überein, kein Text fehlt oder ist ungenutzt), Beta-Suffix und Versionserhöhung sowie die Tests.

Tests: `pip install -r requirements-test.txt && pytest` (Test-Framework von Home Assistant; `tests/test_calc.py` deckt die berechneten Sensoren, die Tageszähler und den Mitternachts-Wechsel ab). Die Release-Notizen führen eine Zeile je Pull Request auf (dessen Titel).

### Screenshots
Die Bilder in `docs/screenshots/{en,de}` zeigen jeden Tab mit Beispieldaten (README und Wiki verwenden sie). `tools/screenshots/make.cjs` erzeugt sie: Das Skript lädt die echten Panel-Dateien in einem Browser (Playwright) mit einem nachgebildeten Home Assistant dahinter (`mock.js`: ein simuliertes System mit dreieinhalb Jahren erfundener Daten). Nach sichtbaren Änderungen am Panel erneut ausführen; die Optionen stehen im Kopf des Skripts.

### Wiki
Die Seiten liegen als Markdown im Ordner `wiki/` des Repositories. Der Workflow `wiki` überträgt sie bei Änderungen auf `main` in das GitHub-Wiki. Das Wiki muss einmalig in der Oberfläche initialisiert werden (eine erste Seite anlegen), danach genügt eine Änderung im Ordner `wiki/` oder ein manueller Lauf des Workflows.
