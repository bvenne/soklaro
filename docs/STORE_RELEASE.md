# Release- und Store-Leitfaden

1. Einen freigegebenen Produktnamen verwenden; `docs/NAME_CLEARANCE.md` dokumentiert den aktuellen Status.
2. Echte HTTPS-Werte für `NEXT_PUBLIC_SITE_URL` und `NEXT_PUBLIC_REPOSITORY_URL` setzen.
3. Betreiberangaben im Impressum und in der Datenschutzerklärung vervollständigen.
4. `OPEN_METEO_USAGE_MODE` passend zum Betreiber festlegen und die zugehörigen Endpunkte konfigurieren.
5. `OPENAURA_APP_ID` setzen, Versionen und Changelog aktualisieren.
6. `npm ci && npm run licenses:generate && npm run release:check` ausführen.
7. `npm run typecheck && npm test && npm run build && npm run build:native-web` ausführen.
8. `npx cap sync`; native Datenschutztexte und Screenshots prüfen.
9. Android in Android Studio als signiertes AAB bauen; Data-Safety-Angaben anhand `android/DATA_SAFETY.md` beantworten.
10. iOS auf macOS in Xcode archivieren; Privacy Manifest und Nutzungsbeschreibung prüfen.
11. Dependency-, Lizenz-, Security-, Accessibility- und Privacy-Audit wiederholen.

Apple und Google können bezahlte Entwicklerkonten, Identitätsprüfung, Signierung, Review und laufende Richtlinienkonformität verlangen. Dieses Repository behauptet keine Store-Freigabe.
