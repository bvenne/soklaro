# Architektur

Die führende Web-Codebasis ist React 19 + TypeScript strict + Vite/Vinext. Dateibasierte Routen trennen Landingpage (`/`), Wetter-App (`/app`) und Privacy (`/privacy`). Capacitor erzeugt native Container.

`WeatherProvider` und `GeocodingProvider` sind getrennte Interfaces. `OpenMeteoWeatherProvider` mappt aktuelle `current`, `hourly` und `daily`-Felder auf interne Modelle; Basis-URL und Betriebsmodus sind konfigurierbar. Zeitstrings werden als lokale Zeit des Ortes behandelt und nicht manuell um Offset-Werte verschoben.

Der Client besitzt vier klar getrennte Speicherbereiche: Forecast-Cache mit begrenztem Alter, Favoriten, Einstellungen und Locale. Es gibt keinen Serverzustand, kein Konto und keine Geräte-Synchronisierung.

Der Service Worker cached nur App-Shell und lokale Assets. API-Antworten werden vom Anwendungscode versioniert gespeichert; Offline-Zustände kennzeichnen Quelle und Alter.
