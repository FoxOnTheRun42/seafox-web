# seaFOX Website

Statische Projektwebsite für GitHub Pages, ohne Build-Schritt oder Paketinstallation.
Die aktuelle Startseite liegt in `index.html`; `/v2/` leitet auf diese Startseite weiter.
Produktinhalte: Stand 16. November 2026.

## Lokal ansehen

Im Website-Verzeichnis starten:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Dann `http://127.0.0.1:8080/` im Browser öffnen. Änderungen an HTML, CSS und JavaScript
sind nach dem Neuladen sichtbar.

## Dateien

- `index.html`, `css/current.css`, `js/current.js`: aktuelle Startseite.
- `js/instruments.js`, `css/instruments.css`: interaktive Instrumentenillustration mit
  Beispielwerten und den Farbschemata Tag, Nacht und Rotlicht.
- `v2/index.html`: Weiterleitung zur aktuellen Startseite.
- `impressum.html`, `datenschutz.html`, `bildnachweis.html`: Informationsseiten;
  verwenden weiterhin `css/site.css`.
- `assets/`, `v2/assets/`: lokale Medien und Schriftdateien. Ältere Dateien bleiben
  für die Nachvollziehbarkeit erhalten; ihr Vorhandensein bedeutet keine Verwendung
  auf der aktuellen Startseite.

## Medien und Produktstand

Die Instrumentenvorschau ist eine für die Website erstellte Illustration anhand
der neuen UI-Palette und Anordnung. Sie ist keine Android-Bildschirmaufnahme und
empfängt keine Bootsdaten. Die beiden unveränderten Kartenaufnahmen
`v2/assets/screens/87.webp` und `90.webp` stammen aus einem Entwicklungsstand vom
Oktober 2026 (NOAA ENC US5MA11M, ohne Bootsdaten). Das vorhandene Hero-Video ist ein
früher generiertes maritimes Stimmungsbild. Details: `bildnachweis.html`.

Die Produktbeschreibung unterscheidet verfügbare Funktionen und vorbereitete
Erweiterungen. Die Website belegt weder einen erfolgreichen App-Build noch eine
Geräteprüfung oder einen zertifizierten Navigationsbetrieb. Im Repository liegen
keine Kopien oder Verknüpfungen des privaten App-Quellcodes.

## Vor einer Veröffentlichung prüfen

JavaScript-Syntax prüfen:

```sh
node --check js/current.js
node --check js/instruments.js
```

Zusätzlich Startseite und `/v2/`, Navigation, Instrumentenumschalter,
Tastaturbedienung sowie die Informationsseiten bei schmaler und breiter Ansicht
im Browser prüfen. Diese Liste beschreibt den Prüfablauf, keine bereits
bestandenen Checks. Schriften und Medien werden lokal ausgeliefert.
