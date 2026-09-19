# Drittanbieterhinweise

## Regenradar: Leaflet, DWD und OpenStreetMap

Leaflet (BSD-2-Clause), Copyright © Vladimir Agafonkin und Mitwirkende, wird lokal
gebündelt und erst beim Öffnen des Radars geladen. Lizenztext siehe
`public/legal/third-party-licenses.txt`.

RV-Radarbeobachtungen und -vorhersagen (WMS `dwd:Niederschlagsradar`): © Deutscher Wetterdienst, CC BY 4.0.
Quelle: https://maps.dwd.de/geoserver/ows .
Nutzungsbedingungen: https://www.dwd.de/DE/service/copyright/copyright_node.html .
Die Darstellung wird auf einen Kartenausschnitt projiziert und transparent überlagert.
Die Farben und Werte stammen vom DWD; die Legende wird vom selben Dienst geladen.

Karte: © OpenStreetMap-Mitwirkende, ODbL, https://www.openstreetmap.org/copyright .
Für den öffentlichen Kacheldienst gelten zusätzlich
https://operations.osmfoundation.org/policies/tiles/ .
Nur sichtbare Kartenkacheln werden angefordert; keine Offline-Downloads oder
Vorababrufe. Der Browser beachtet HTTP-Caching und sendet den Seiten-Referer.
Der öffentliche Dienst bietet keine Verfügbarkeitsgarantie; bei größerem
Verkehr ist ein eigener oder vertraglicher Kacheldienst erforderlich.

## Open‑Meteo

Wetter- und Geocoding-Daten: Open‑Meteo, Datenattribution CC BY 4.0. Die App verlinkt Quelle und Lizenz bei der Datendarstellung und kennzeichnet ihre Auswahl, Formatierung und lokal abgeleiteten Hinweise als Bearbeitung. Nutzungsmodell und Quellen: `docs/OPEN_METEO_USAGE.md`.

## Weather Icons

Weather Icons 2.0.12, Erik Flowers, über die einzeln importierbaren SVG-Komponenten von React Icons. Symbole: SIL Open Font License 1.1; Code: MIT License. Copyright © Erik Flowers. Nur verwendete Komponenten werden lokal gebündelt; es wird kein CDN geladen. Vollständige Lizenztexte werden in Release-Archiven übernommen.

## Lucide

Lucide Icons, ISC License. Nur tatsächlich importierte SVG-Komponenten werden gebündelt.

## Outfit

Die soklaro-Wortmarke verwendet Outfit Medium. Copyright 2021 The Outfit Project Authors
(https://github.com/Outfitio/Outfit-Fonts), lizenziert unter der SIL Open Font License 1.1.
Die Schrift wird lokal ausgeliefert; der vollständige Lizenztext liegt unter
`public/fonts/OFL-Outfit.txt`.

## soklaro Wetterbilder

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
