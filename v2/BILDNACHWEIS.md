# seaFOX v2 – Bildnachweis

Für v2 wurde **nichts neu generiert** (Higgsfield: 0 Credits, keine Aufträge). Alle Dateien stammen aus dem
vorhandenen Material und wurden nur neu geschnitten bzw. kodiert.

## App-Aufnahmen (`assets/screens/`, unverändert skaliert, WebP)
Quelle: `seaFOX/output/device-screens/2026-10-12/` (Emulator). Beschriftung auf der Seite in Klammern.

| Datei | Aufnahme | Abschnitt | Beschriftung |
|---|---|---|---|
| 65.webp | 65 Startseite quer, Nacht | Dashboard 1 | App-Aufnahme · Simulation |
| 60.webp | 60 Startseite quer, Tag | Dashboard 2 | App-Aufnahme · Simulation |
| 63.webp | 63 Dialog Widget-Katalog, quer | Dashboard 3 | App-Aufnahme · Simulation |
| 64.webp | 64 Karte im Vollbild, quer | Seekarte 1 | App-Aufnahme · Simulation |
| 87.webp | 87 NOAA-Vektorkarte Tag, hochkant (Build B) | Seekarte 2 | Entwicklungsvorschau · ohne Bootsdaten |
| 90.webp | 90 NOAA-Vektorkarte Nacht, hochkant (Build B) | Seekarte 3 | Entwicklungsvorschau · ohne Bootsdaten |
| 82.webp | 82 sieben Anzeigen quer (Build B) | Sicherheit 1 | Entwicklungsvorschau · Simulation |
| 32.webp | 32 Tiefenalarm, hochkant | Sicherheit 2 | App-Aufnahme · Simulation |
| 43.webp | 43 Seite Anker mit AIS-Alarm, hochkant | Sicherheit 3 | App-Aufnahme · Simulation |
| 111.webp | 111 Sonarkarte Vollbild, quer (Build E) | Sensorik 1 | App-Aufnahme · Simulation |
| 134.webp | 134 Bodenkarte Vollbild, Ebene Tiefen (Build D, 1920 px) | Sensorik 2 | Entwicklungsvorschau · Simulation |
| 133.webp | 133 Seite Sonar mit 3D-Relief (Build D, 1920 px) | Sensorik 3 | Entwicklungsvorschau · Simulation |

Nicht verwendet: 135, 136 (im Index als Mangel geführt), 130/114 (Kartenfeld leer), 120 (synthetische Vorschaudaten).

## Stimmungsbilder (früher generiert, siehe `../README.md`, Abschnitt „Generierte Dateien“)
| Datei | Quelle | Verwendung |
|---|---|---|
| assets/video/hero.mp4, hero.webm, hero-poster.webp | `source-media/v1_catamaran`, `v6_anchor`, `v4_underwater`, `v5_harbour` (je 5 s, überblendet, 1600×900, ohne Ton) | Hero-Hintergrund |
| assets/img/sailing.webp | `_unused/s8_cruisers.png` | Für wen · Unter Segeln |
| assets/video/research.mp4, assets/img/research.webp | `_unused/loop-research.mp4` | Für wen · Bei der Arbeit |
| assets/video/family.mp4, assets/img/family.webp | `source-media/v7_family.mp4` (vor und zurück als Schleife) | Für wen · Mit Kindern |

Auf der Seite beschriftet als „Stimmungsbild, generiert“. Keines zeigt die App, ein Tablet oder einen Bildschirm.

## Programmiert (Illustration)
Tablet-Rahmen (CSS), Linienfeld mit Peilstrahl und Ankerkreis (`js/field.js`, WebGL). Keine Messdaten.

## Schrift
Orbitron (nur Wortmarke), SIL OFL 1.1 – `assets/fonts/OFL.txt`, `LICENCE-NOTICE.txt`. Text: Systemschrift.
