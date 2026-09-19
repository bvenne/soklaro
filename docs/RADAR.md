# Regenradar

Das Radar wird über das Radar-Icon neben dem Wetterhinweis geöffnet. Der Code und
Leaflet werden erst beim Öffnen geladen. Es werden keine API-Schlüssel benötigt.

## Daten und Abdeckung

- DWD-WMS: `https://maps.dwd.de/geoserver/ows`, Layer `dwd:Niederschlagsradar`
  (RV-Produkt, Niederschlagsintensität in mm/h, Fünf-Minuten-Schritte).
- Beobachtungen und radarbasierte Vorhersagen bis zwei Stunden ab Referenzzeit.
  Die verbleibende Vorhersage ab aktueller Uhrzeit ist um die Bereitstellungsverzögerung kürzer.
- Verfügbare Zeiten und Modellläufe stammen aus `GetCapabilities`. Jeder Abruf
  bindet `time` und `dim_reference_time`: historische Messungen an ihren eigenen
  Lauf, Vorhersagen an den neuesten verfügbaren Lauf.
- Die Zeitleiste ist zeitlinear von jetzt minus zwei Stunden bis jetzt plus zwei
  Stunden. „Jetzt“ steht exakt mittig und wird alle 15 Sekunden aktualisiert.
  Beim Öffnen/Aktualisieren wird das Bild etwa 20 Minuten vor jetzt ausgewählt.
  Der Jetzt-Button springt zur aktuellen Zeit. Es werden keine fehlenden
  Zeiträume mit dem letzten Bild aufgefüllt.
- Die Wiedergabe wartet auf das aktuelle Bild. Fehlende Bilder und ältere
  Messungen werden sichtbar gemeldet. Messung/Vorhersage werden gekennzeichnet.
- Abdeckung: Deutschland und Grenzregionen. Außerhalb des unterstützten
  Ortsbereichs wird die Deutschlandübersicht mit einem Hinweis angezeigt.
  Auch innerhalb der Abdeckung können Messdaten fehlen. Transparenz bedeutet
  deshalb nicht zwingend Trockenheit.
- Der Aktualisieren-Button lädt den aktuellen Bestand. Es gibt keine Abrufe
  bei geschlossenem Radar oder automatische Wiedergabe im Hintergrund.

## Open Source und Betrieb

Leaflet: BSD-2-Clause. DWD-Geodaten: CC BY 4.0 mit sichtbarer Attribution und
Kennzeichnung der angepassten Darstellung. OpenStreetMap-Daten: ODbL.
Quellen und vollständige Bibliothekslizenzen stehen in `THIRD_PARTY_NOTICES.md`
und `public/legal/third-party-licenses.txt`.

Der öffentliche OSM-Kacheldienst unterliegt zusätzlich seiner
[Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/).
Die App lädt nur sichtbare Kacheln und verwendet normales Browser-Caching.
Kein Offline-Download, kein Kachel-Prefetch. Für hohen Traffic einen eigenen
oder vertraglichen Kacheldienst verwenden; URL in `rain-radar.tsx` und die
gezielten CSP-Freigaben in `next.config.ts` gemeinsam anpassen.

Die CSP erlaubt `maps.dwd.de` für Verbindungen und Bilder sowie
`tile.openstreetmap.org` für Bilder. Falls der Reverse-Proxy eine zusätzliche
CSP setzt, muss er dieselben Freigaben enthalten. Der Referer für OSM darf
nicht unterdrückt werden. `PRIVACY.md` beschreibt die übertragenen Daten.
