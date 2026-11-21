# Datenschutz

soklaro ist werbe- und trackerfrei, aber eine Online-Wetterabfrage ist keine übertragungsfreie Nutzung. Externe Radarbilder und Kartenkacheln werden ausschließlich nach Öffnen des Regenradars geladen; dabei erhält der jeweilige Anbieter den sichtbaren Kartenausschnitt, nicht den Ortsnamen oder einen gesonderten GPS-Punkt. Beim Schließen enden weitere Abrufe. Die Hintergrundkarte nutzt den Browser-Cache, sie wird nicht zum Offline-Download angeboten.

## Netzwerkzugriffe

| Host | Zweck | Übertragene Daten |
| --- | --- | --- |
| `maps.dwd.de` | Nur beim geöffneten Regenradar: Messzeitpunkte, Radarbild und Legende | IP-Adresse, Kartenausschnitt und gewählter Messzeitpunkt |
| `tile.openstreetmap.org` | Nur beim geöffneten Regenradar: Hintergrundkarte | IP-Adresse, sichtbare Kartenkacheln und Seiten-Referer |
| `api.open-meteo.com` | Forecast | IP-Adresse, gewählte oder gerundete Koordinaten, angeforderte Felder |
| `geocoding-api.open-meteo.com` | Ortssuche | IP-Adresse, Suchbegriff und Sprache |
| `nominatim.openstreetmap.org` | Ortsname nach aktiver GPS-Freigabe | IP-Adresse, gewählte oder gerundete Koordinaten und Sprache |
| `commons.wikimedia.org` | Suche nach einem optionalen Wetterfoto | IP-Adresse, Ortsname und Wetterbegriff; keine GPS-Koordinaten |
| `thumb.wikimedia.org`, `upload.wikimedia.org` | Verkleinertes Wetterfoto bei passendem Treffer | IP-Adresse und angefragte Bilddatei |

Bei einer konfigurierten Kunden- oder Self-Hosting-Instanz ersetzt deren Host den Forecast-Host. Die App lädt keine externen Fonts, Skripte oder Analytics. Optionale Wikimedia-Commons-Fotos lassen sich in den Einstellungen ausschalten; ohne passenden Treffer oder offline bleiben die lokalen Hintergründe sichtbar. Das Foto ist eine Illustration, keine aktuelle Wetteraufnahme. Urheber, Quelle, Lizenz und Bildausschnitt werden beim Foto genannt. Open‑Meteo erklärt, Logs bis zu 90 Tage aufbewahren zu können; vor Veröffentlichung ist die aktuelle Provider-Erklärung erneut zu prüfen.

GPS ist standardmäßig mit exakter Genauigkeit aktiviert. Beim Start fragt die App nach dem Gerätestandort. Nach erteilter Freigabe werden die Koordinaten für Wetter und Ortsbenennung verwendet und mit dem Ort lokal gespeichert. GPS und Genauigkeit können in den Einstellungen geändert werden. Ortsdaten stammen von © OpenStreetMap-Mitwirkende und stehen unter ODbL.

Lokale Daten können in der App über „Alle lokalen Daten löschen“ entfernt werden. Es gibt keine Konten oder Cloud-Synchronisierung.
