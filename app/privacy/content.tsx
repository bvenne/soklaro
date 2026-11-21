'use client';

import { useLocale } from '@/lib/i18n/use-locale';
import { SoklaroMark } from '../components/soklaro-mark';

export default function PrivacyPage() {
  const { t } = useLocale();
  return (
    <main className="privacy-page">
      <header>
        <a className="brand-mark" href="./" aria-label={t('soklaro Startseite')}>
          <span><SoklaroMark /></span>soklaro
        </a>
        <nav>
          <a href="./impressum/">{t('Impressum')}</a>
          <a href="./app/">{t('Wetter öffnen')}</a>
        </nav>
      </header>
      <h1>{t('Netzwerk &')}<br />{t('Datenschutz')}</h1>
      <p>{t('Die Web-App wird statisch ausgeliefert. Dein Browser fragt Wetterdaten und weitere Inhalte direkt bei den jeweiligen Diensten ab.')}</p>

      <h2>{t('Wetter, Ortssuche und GPS')}</h2>
      <ul className="host-list">
        <li><code>api.open-meteo.com</code><span>{t('Wetterprognosen. Übertragen werden IP-Adresse sowie gewählte oder gerundete Koordinaten.')}</span></li>
        <li><code>geocoding-api.open-meteo.com</code><span>{t('Ortssuche. Übertragen werden IP-Adresse, Suchbegriff und Sprache.')}</span></li>
        <li><code>nominatim.openstreetmap.org</code><span>{t('Nach GPS-Freigabe ermittelt Nominatim den Ortsnamen aus den Koordinaten. Der Dienst erhält auch deine IP-Adresse und Sprache.')}</span></li>
      </ul>
      <p>{t('GPS ist beim Start standardmäßig aktiv. Nach deiner Freigabe nutzt die App standardmäßig exakte Koordinaten. In den Einstellungen kannst du GPS abschalten oder die Koordinaten runden.')}</p>
      <p>
        {t('Andere Installationen können eigene Wetter- und Suchendpunkte verwenden. Die kostenlose Open‑Meteo-API ist für nichtkommerzielle Nutzung vorgesehen.')}
        {' '}<a href="https://open-meteo.com/en/terms" rel="noreferrer">{t('Bedingungen von Open‑Meteo')}</a>
        {' · '}<a href="https://operations.osmfoundation.org/policies/nominatim/" rel="noreferrer">{t('Nominatim-Nutzungsregeln')}</a>
      </p>

      <h2>{t('Regenradar')}</h2>
      <p>{t('Beim Öffnen des Radars erhalten maps.dwd.de und tile.openstreetmap.org deine IP-Adresse und den angezeigten Kartenausschnitt.')}</p>
      <p>
        {t('Radardaten: Deutscher Wetterdienst (CC BY 4.0). Hintergrundkarte: OpenStreetMap.')}
        {' '}<a href="https://operations.osmfoundation.org/policies/tiles/" rel="noreferrer">{t('Karten-Nutzungsbedingungen')}</a>
      </p>

      <h2>{t('Wetterfotos')}</h2>
      <ul className="host-list">
        <li><code>commons.wikimedia.org</code><span>{t('Bei aktiven Wetterfotos übermittelt die App Ortsname, Wetterlage und IP-Adresse für die Bildsuche.')}</span></li>
        <li><code>thumb.wikimedia.org / upload.wikimedia.org</code><span>{t('Liefert bei einem Treffer das Foto. Es dient als Illustration. Quelle und Lizenz stehen am Bild.')}</span></li>
      </ul>

      <h2>{t('Lokale Daten')}</h2>
      <p>{t('Ortsliste, Prognosen und Einstellungen werden im Browser gespeichert. Du kannst sie in den Einstellungen löschen. Gespeicherte Prognosen sind auch offline verfügbar. Für neue Daten braucht die App eine Verbindung.')}</p>
    </main>
  );
}
