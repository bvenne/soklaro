# Domain, Repository und App-ID

soklaro enthält keine erfundenen Produktionslinks mehr. Die kanonischen Werte
werden beim Release gesetzt:

```text
NEXT_PUBLIC_SITE_URL=https://<eigene-domain>
NEXT_PUBLIC_REPOSITORY_URL=https://<repository-host>/<konto>/<repository>
SOKLARO_APP_ID=<reverse-dns-app-id>
```

Ohne Repository-Wert wird auf der Landingpage kein Quellcode-Link angezeigt.
Ohne echte Domain verwendet die lokale Entwicklung `http://localhost:3000` für
Metadaten. `npm run release:check` akzeptiert für einen Release nur HTTPS und
lehnt `localhost` sowie reservierte Beispieldomains ab.

Der Repository-Link ist für die Erfüllung der MPL-2.0 bei verteilten
Binärversionen auf die exakt veröffentlichte Quellfassung zu richten. Domain,
Repository-Konto und App-ID müssen dem tatsächlichen Betreiber gehören; sie
können nicht aus dem Quellcode abgeleitet oder stellvertretend registriert
werden.
