# Android Data Safety – Release-Angaben

Stand: 2. September 2026. Die Angaben müssen bei jeder Änderung des Providers
oder der App-Funktionen erneut geprüft werden.

- **Erhobene Datentypen:** genauer Standort und ungefährer Standort, jeweils
  optional und ausschließlich für die App-Funktionalität.
- **Ablauf:** Standortzugriff und Übertragung erfolgen erst nach einer
  ausdrücklichen Nutzeraktion. Je nach gewählter Präzision werden genaue oder
  vorab auf ungefähr 1 km bzw. 5 km gerundete Koordinaten übertragen.
- **Empfänger:** der konfigurierte Wetterprovider. Beim Standardprofil ist dies
  Open-Meteo. Dessen Webserver-Logs können IP-Adresse und Koordinaten bis zu
  90 Tage enthalten; die Übertragung ist daher nicht als rein flüchtige
  On-Device-Verarbeitung zu deklarieren.
- **Zweck:** Abruf der lokalen Wettervorhersage; keine Werbung, Analytics,
  Profilbildung oder Weitergabe an Werbepartner.
- **Schutz:** HTTPS während der Übertragung. Kein Nutzerkonto. Favoriten,
  Einstellungen und letzte Prognosen verbleiben lokal und können in der App
  gelöscht werden.
- **Sharing-Frage:** Ob Open-Meteo im konkreten Betreibervertrag als
  Dienstleister oder als Dritter gilt und ob die Ausnahme für eine erwartbare,
  nutzerinitiierte Übertragung greift, ist im Play-Console-Formular anhand des
  gewählten Nutzungsmodells wahrheitsgemäß zu beantworten.

Quelle: https://support.google.com/googleplay/android-developer/answer/10787469
