# Privacy Threat Model

| Risiko | Angreifer / Ursache | Maßnahme | Restrisiko |
| --- | --- | --- | --- |
| Standortprofil | Werbe- oder Analytics-SDK | Keine solchen SDKs; keine Konten; keine Cloud-Synchronisierung | Provider sieht IP und abgefragte Koordinate |
| Zu genaue Koordinate | Unbewusste Freigabe | Kein Auto-Prompt; drei Präzisionsstufen; keine dauerhafte exakte Speicherung | Nutzer kann „exakt“ wählen |
| Drittanbieter-Nachladen | Remote Fonts, Bilder, CDN | CSP und ausschließlich lokale Assets | Browser- oder OS-Netzwerk liegt außerhalb der App |
| Veraltete Offline-Daten | Netzfehler | Quelle, Alter und Offline-Zustand sichtbar; begrenzte Cache-Dauer | Nutzer kann gespeicherte Daten trotzdem fehlinterpretieren |
| Manipulierte API-Antwort | Netzwerk/Provider | HTTPS, Schema-Mapping, fehlende Werte und unbekannte Codes sicher behandeln | Öffentliche API bleibt Vertrauensgrenze |
| Client-Secret | Fehlkonfiguration | Keine Geheimnisse im Client; `.env.example` enthält nur öffentliche Werte | Betreiber kann versehentlich eine öffentliche Variable missbrauchen |

Nicht im Scope: kompromittiertes Betriebssystem, manipulierte Browser-Erweiterungen, Provider-Infrastruktur und App-Store-Telemetrie außerhalb der soklaro-Binärdatei.
