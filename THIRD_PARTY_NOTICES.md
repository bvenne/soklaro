# Drittanbieterhinweise

## Open‑Meteo

Wetter- und Geocoding-Daten: Open‑Meteo, Datenattribution CC BY 4.0. Die App verlinkt Quelle und Lizenz bei der Datendarstellung und kennzeichnet ihre Auswahl, Formatierung und lokal abgeleiteten Hinweise als Bearbeitung. Nutzungsmodell und Quellen: `docs/OPEN_METEO_USAGE.md`.

## Weather Icons

Weather Icons 2.0.12, Erik Flowers, über die einzeln importierbaren SVG-Komponenten von React Icons. Symbole: SIL Open Font License 1.1; Code: MIT License. Copyright © Erik Flowers. Nur verwendete Komponenten werden lokal gebündelt; es wird kein CDN geladen. Vollständige Lizenztexte werden in Release-Archiven übernommen.

## Lucide

Lucide Icons, ISC License. Nur tatsächlich importierte SVG-Komponenten werden gebündelt.

## OpenAura Wetterbilder

Originalbilder wurden mit dem integrierten OpenAI-Bildgenerator für dieses Repository erzeugt und lokal bearbeitet. Ausgangsbilder und Wettervarianten stehen unter CC0-1.0. Keine Remote-Quelle und kein Standortdatum wird zur Laufzeit für die Auswahl verwendet. Details: `ASSET_LICENSE.md`, `docs/ASSETS.md` und `docs/assets.json`.

## JavaScript- und Native-Abhängigkeiten

Die vollständige, aus dem Lockfile reproduzierbar erzeugte Liste aller
Produktionspakete einschließlich der von den Paketen mitgelieferten Lizenztexte wird als
`public/legal/third-party-licenses.txt` ausgeliefert. Sie wird mit
`npm run licenses:generate` aktualisiert und mit `npm run licenses:check`
gegen das aktuelle Lockfile geprüft. Pakete ohne mitgelieferte Lizenzdatei werden
mit SPDX-Kennung und Quelladresse einzeln ausgewiesen. Die Projektlizenz wird zusätzlich als
`public/legal/project-license.txt` ausgeliefert.

Plattformspezifische optionale Binärpakete der Buildwerkzeuge werden nicht an
Endnutzer ausgeliefert und deshalb nicht in den Laufzeitbericht aufgenommen;
ihre Lizenzdateien verbleiben in der jeweiligen Buildinstallation.
