# Assets

OpenAura lädt zur Laufzeit keine externen Bilder, Schriften oder Icon-CDNs.

- Die beiden Wetter-Ausgangsbilder in `assets/source/` wurden mit dem
  OpenAI-Bildgenerator für dieses Projekt erzeugt.
- `tools/generate-weather-assets.py` erzeugt daraus die lokalen AVIF- und
  WebP-Varianten in `public/weather/`.
- Ausgangsbilder und Wettervarianten stehen unter CC0-1.0; siehe
  [`ASSET_LICENSE.md`](../ASSET_LICENSE.md).
- Das OpenAura-Zeichen und die PWA-/App-Icons wurden für dieses Projekt als
  eigene SVG-/Rastergrafiken erstellt und fallen unter die MPL-2.0 des
  Anwendungscodes, solange keine gesonderte Markenlizenz erklärt wird.
- Weather Icons und Lucide bleiben unter ihren jeweiligen Drittanbieterlizenzen.

Die maschinenlesbare Herkunftsdokumentation steht in `docs/assets.json`.
