# Datenfluss

```text
Nutzeraktion
  ├─ Ortssuche ── Suchtext + IP ──> Open‑Meteo Geocoding
  │                                  └─ Ortskandidaten ──> Gerät
  └─ Standort ── OS-Freigabe ── Rundung auf Gerät
                                 └─ Koordinaten + IP ──> Open‑Meteo Forecast
                                                        └─ Wetterdaten ──> Gerät

Gerät ── lokal ──> Favoriten · Einstellungen · Locale · letzter Forecast
```

Es existiert kein soklaro-Anwendungsserver und kein Nutzerkonto. Ein Betreiber kann den Forecast-Endpunkt durch eine eigene HTTPS-Instanz ersetzen.
