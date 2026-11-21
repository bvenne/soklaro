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

1. Auf dem Entwicklungsrechner im Branch `static` bei einer eigenen Testdomain in der Datei `.env.local` die Zeile `NEXT_PUBLIC_SITE_URL=https://wetter.deine-domain.de` mit dem tatsächlichen Hostnamen hinterlegen. Standard ist `https://soklaro.com`. Dann `npm ci` und `npm run build` ausführen.
2. Den **Inhalt von `dist/web/`** in einen eigenen Webordner auf dem NAS kopieren, beispielsweise `web/soklaro`. Die Datei `index.html` muss direkt darin liegen. Der Gruppe `http` Leserechte für den Ordner geben.
3. In **Web Station → Webdienst** eine statische Website mit diesem Dokumentenstamm einrichten. Unter **Webportal** den Dienst einem eigenen Hostnamen zuweisen. DNS und das HTTPS-Zertifikat für diesen Host konfigurieren. Die App erwartet die Domainwurzel. Für den Paralleltest eignet sich eine eigene Subdomain.
4. Im Browser die Domain und die direkten Pfade `/app/`, `/privacy/` und `/impressum/` öffnen. Auf iOS über „Teilen → Zum Home-Bildschirm“ installieren. Nach einem ersten vollständigen Online-Start die Wetteransicht im Flugmodus erneut öffnen. Live-Prognosen, Karten und Radar brauchen eine Verbindung.
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

Kanonische Domain und Quellcode-Repository werden über `NEXT_PUBLIC_SITE_URL` und `NEXT_PUBLIC_REPOSITORY_URL` gesetzt. Ohne echte HTTPS-Adressen zeigt die App keinen erfundenen Repository-Link an und `npm run release:check` verweigert die Freigabe.

## Datenschutz

soklaro enthält keine Werbung, Analytics, Telemetrie, Tracking-Pixel, Session-Replays, Fingerprinting-, Crash-Reporting-, Social-Media- oder Marketing-SDKs. Für Online-Abfragen erhält der konfigurierte Anbieter technisch IP-Adresse und Suchbegriff beziehungsweise Koordinaten. Details: [PRIVACY.md](PRIVACY.md).

## Lizenz

Anwendungscode: MPL-2.0. Die eigens erzeugten Wetterbilder stehen unter CC0-1.0. Drittanbieter und Bildassets: siehe [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [ASSET_LICENSE.md](ASSET_LICENSE.md) und [docs/ASSETS.md](docs/ASSETS.md).
