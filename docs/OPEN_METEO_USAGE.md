# Open-Meteo-Nutzungsmodell

## Festgelegtes Standardmodell

Der unveränderte soklaro-Build ist werbe-, abo- und verkaufsfrei und nutzt die
öffentliche Open-Meteo-API im Modus **non-commercial**. Dabei gelten die
Open-Meteo-Limits sowie deren Terms. Die Wetterdaten werden unter CC BY 4.0
bezogen. Die App verlinkt Open-Meteo und die Lizenz direkt bei der Darstellung
und weist darauf hin, dass sie die Daten auswählt, formatiert und zu lokalen
Hinweisen verarbeitet.

Dieses Profil ist nur zulässig, solange der konkrete Betreiber und der Zweck
tatsächlich nichtkommerziell sind. Open Source oder ein Preis von 0 Euro allein
beweisen keine nichtkommerzielle Nutzung.

## Kommerzielle Veröffentlichung

Ein kommerzieller Betreiber muss vor dem Build eine dieser Varianten wählen:

1. **commercial-proxy:** Ein eigener HTTPS-Proxy hält den Open-Meteo-Kundenschlüssel
   serverseitig. `VITE_OPEN_METEO_URL` und
   `VITE_OPEN_METEO_GEOCODING_URL` zeigen auf öffentliche Proxy-Endpunkte ohne
   Schlüssel im Browsercode.
2. **self-hosted:** Eine selbst betriebene Open-Meteo-Instanz wird konfiguriert;
   deren AGPL- und Datenquellenpflichten werden separat erfüllt.

Ein Kunden-API-Schlüssel darf nie in einer `VITE_*`-Variable, mobilen Binärdatei
oder öffentlichen Repository-Datei stehen.

## Release-Konfiguration

```text
OPEN_METEO_USAGE_MODE=non-commercial | commercial-proxy | self-hosted
VITE_OPEN_METEO_URL=https://…
VITE_OPEN_METEO_GEOCODING_URL=https://…
```

Quellen, Stand 2. September 2026:

- https://open-meteo.com/en/terms
- https://open-meteo.com/en/pricing
- https://open-meteo.com/en/license
