# soklaro

Das Wetter für deinen Ort – nicht dein Standort für Werbenetzwerke.

soklaro ist eine freie, werbe- und trackerfreie Wetter-App für Web, PWA, iOS und Android. Sie nutzt standardmäßig Open‑Meteo, fragt den Gerätestandort erst nach einer bewussten Aktion ab und speichert Favoriten, Einstellungen sowie den letzten Forecast ausschließlich lokal.

## Lokal starten

Voraussetzungen: Node.js 22.13 oder neuer.

```bash
npm ci
npm run dev
```

Öffne die Landingpage unter `http://localhost:3000/` und die Wetter-App unter `http://localhost:3000/app`.

## Veröffentlichung auf Synology (DSM 7.2+)

1. Auf dem Entwicklungsrechner im Branch `static` mit `npm ci` und `npm run build` bauen. Dieselben Dateien funktionieren an der Domainwurzel und in einem Unterordner.
2. Für die LAN-Adresse `https://192.168.178.100/soklaro/app/` den Inhalt von `dist/web/` nach `web/soklaro/` kopieren. In Web Station muss der Webdienst für diese IP den **übergeordneten Ordner `web/`** ausliefern. Die Gruppe `http` braucht Leserechte. Ist stattdessen `web/soklaro/` selbst der Dokumentenstamm, lautet der Pfad `/app/`.
3. HTTPS mit einem vom Gerät als vertrauenswürdig anerkannten Zertifikat einrichten. Beim Aufruf über die LAN-IP muss diese IP als IP-Adresse im Subject Alternative Name des Zertifikats stehen.
4. `/soklaro/` öffnet die Startseite, `/soklaro/app/` das Wetter. Auf iOS über „Teilen → Zum Home-Bildschirm“ hinzufügen. Nach einem vollständigen Online-Start im Flugmodus erneut öffnen. Live-Daten brauchen eine Verbindung. Eine öffentliche URL ist nur für die optionale Sitemap und kanonische Links nötig; dafür beim Build `NEXT_PUBLIC_SITE_URL` einschließlich Unterordner setzen.
5. Für Updates zuerst die Dateien mit Versionskennung in `assets/`, dann Seiten und zuletzt `sw.js` übertragen. Vorherige Assets während des Übergangs behalten. HTML und `sw.js` beim Abruf revalidieren lassen. Die neue Offline-Version wird nach Schließen der alten App-Fenster aktiv.

Auf dem NAS genügt Web Station. Bei vorgeschaltetem Proxy dort die Antwortheader `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin` und `Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=(), usb=()` setzen. Die Beschränkungen für Skripte und Datenquellen sind in den HTML-Dateien enthalten.

[Synology-Anleitung für Web Station](https://kb.synology.com/en-global/DSM/tutorial/How_to_host_a_website_on_Synology_NAS)

## Qualität

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Tests verwenden ausschließlich lokale Fixtures und keine Live-API.

## Native Apps

```bash
npm run cap:sync
npx cap open android
npx cap open ios
```

Android Studio und Xcode sind kostenlos erhältlich. Apple und Google verlangen für Store-Konten eigene Gebühren und erfüllen weitere Prüfanforderungen. iOS-Builds benötigen macOS und Xcode.

## Architektur

React und Vite erzeugen statische Seiten für Web Station. Capacitor verwendet dieselben Wetterkomponenten für iOS und Android.

- `app/`: Landingpage, Wetter-App und Privacy-Ansicht
- `lib/weather/`: Provider, Modelle, WMO-Mapping, Cache, Insights und Geolocation
- `public/weather/`: lokale responsive AVIF-/WebP-Wetterbilder
- `lib/i18n/`: Locale-Ressourcen und Schlüsselprüfung
- `android/`, `ios/`: Capacitor-Projekte
- `docs/`: Datenfluss, Threat Model, Stores, Assets und Übersetzung

Der Open‑Meteo-Endpunkt ist über `VITE_OPEN_METEO_URL` konfigurierbar. Geheimnisse gehören niemals in `VITE_*`-Variablen oder Clientcode.

Das Standardprofil verwendet die öffentliche Open‑Meteo-API ausschließlich nichtkommerziell. Kommerzielle Releases müssen einen serverseitigen Kunden-Proxy oder eine selbst gehostete Instanz konfigurieren. Details: [docs/OPEN_METEO_USAGE.md](docs/OPEN_METEO_USAGE.md).

Die öffentliche Basis-URL für Suchmaschinen ist optional. Die Repository-Adresse kann über `NEXT_PUBLIC_REPOSITORY_URL` gesetzt werden.

## Datenschutz

soklaro enthält keine Werbung, Analytics, Telemetrie, Tracking-Pixel, Session-Replays, Fingerprinting-, Crash-Reporting-, Social-Media- oder Marketing-SDKs. Für Online-Abfragen erhält der konfigurierte Anbieter technisch IP-Adresse und Suchbegriff beziehungsweise Koordinaten. Details: [PRIVACY.md](PRIVACY.md).

## Lizenz

Anwendungscode: MPL-2.0. Die eigens erzeugten Wetterbilder stehen unter CC0-1.0. Drittanbieter und Bildassets: siehe [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [ASSET_LICENSE.md](ASSET_LICENSE.md) und [docs/ASSETS.md](docs/ASSETS.md).
