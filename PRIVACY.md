# Datenschutz

soklaro ist werbe- und trackerfrei, aber eine Online-Wetterabfrage ist keine übertragungsfreie Nutzung.

## Netzwerkzugriffe

| Host | Zweck | Übertragene Daten |
| --- | --- | --- |
| `api.open-meteo.com` | Forecast | IP-Adresse, gewählte oder gerundete Koordinaten, angeforderte Felder |
| `geocoding-api.open-meteo.com` | Ortssuche | IP-Adresse, Suchbegriff und Sprache |
| `nominatim.openstreetmap.org` | Ortsname nach aktiver GPS-Freigabe | IP-Adresse, gewählte oder gerundete Koordinaten und Sprache |

Bei einer konfigurierten Kunden- oder Self-Hosting-Instanz ersetzt deren Host den Forecast-Host. Die App lädt keine externen Wetterbilder, Fonts, Skripte oder Analytics. Open‑Meteo erklärt, Logs bis zu 90 Tage aufbewahren zu können; vor Veröffentlichung ist die aktuelle Provider-Erklärung erneut zu prüfen.

Der Standort wird nur nach Nutzeraktion angefragt. Exakte Koordinaten werden standardmäßig nicht dauerhaft gespeichert. Vor der Übertragung kann auf ungefähr 1 km oder 5 km gerundet werden; das kann in Gebirgen und Küstenregionen die Prognose und den angezeigten Ortsnamen beeinflussen. Nach derselben Aktion fragt die App Nominatim einmalig nach einem Ortsnamen. Der ermittelte Ort wird lokal gespeichert und beim Start nicht erneut abgefragt. Ortsdaten stammen von © OpenStreetMap-Mitwirkende und stehen unter ODbL.

Lokale Daten können in der App über „Alle lokalen Daten löschen“ entfernt werden. Es gibt keine Konten oder Cloud-Synchronisierung.
