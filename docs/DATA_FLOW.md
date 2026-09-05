# Datenfluss

```text
Nutzeraktion
  ├─ Ortssuche ── Suchtext + IP ──> Open‑Meteo Geocoding
  │                                  └─ Ortskandidaten ──> Gerät
  └─ Standort ── OS-Freigabe ── Rundung auf Gerät
                                 ├─ Koordinaten + IP ──> Open‑Meteo Forecast
                                 │                      └─ Wetterdaten ──> Gerät
                                 └─ Koordinaten + IP ──> OpenStreetMap Nominatim
                                                        └─ Ortsname ──> Gerät

Gerät ── lokal ──> Favoriten · Einstellungen · Locale · letzter Forecast
```

Es existiert kein soklaro-Anwendungsserver und kein Nutzerkonto. Ein Betreiber kann den Forecast-Endpunkt durch eine eigene HTTPS-Instanz ersetzen. Die Nominatim-Abfrage erfolgt nur unmittelbar nach einer bewussten Standortfreigabe; der Ortsname wird anschließend lokal gespeichert.
