'use client';

import { ArrowUpRight } from 'lucide-react';
import { useLocale } from '@/lib/i18n/use-locale';
import { projectLinks } from '@/lib/project';
import { SoklaroMark } from './components/soklaro-mark';

export default function LandingPage() {
  const { t } = useLocale();
  return (
    <main className="landing">
      <header className="landing-nav">
        <a className="brand-mark" href="./" aria-label={t('soklaro Startseite')}>
          <span><SoklaroMark /></span>soklaro
        </a>
        <nav aria-label={t('Hauptnavigation')}>
          <a href="./privacy/">{t('Datenschutz')}</a>
          <a className="nav-cta" href="./app/">{t('Wetter öffnen')}</a>
        </nav>
      </header>
      <section className="landing-hero">
        <div className="hero-copy">
          <h1>{t('Das Wetter für deinen Ort.')}</h1>
          <p>{t('Werbefrei und ohne Konto.')}</p>
          <div className="hero-actions">
            <a className="primary" href="./app/">{t('Wetter öffnen')} <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </div>
        <div className="phone-preview">
          <p className="eyebrow">{t('App-Vorschau')}</p>
          <h2>Hamburg</h2>
          <p>{t('14:20 · Teilweise bewölkt')}</p>
          <div className="mini-temp">22°</div>
          <p>{t('Gefühlt 21° · H 23° / T 13°')}</p>
          <div className="mini-insight">{t('Regen wahrscheinlich ab 16:00.')}</div>
        </div>
      </section>
      <section className="story" id="privacy">
        <h2>{t('Datenschutz')}</h2>
        <div className="story-copy">
          <p>{t('Die Ortsliste und Einstellungen werden auf deinem Gerät gespeichert. Dein Browser ruft aktuelle Prognosen direkt beim Wetterdienst ab.')}</p>
          <p><a href="./privacy/">{t('Alle Netzwerkverbindungen ansehen →')}</a></p>
        </div>
      </section>
      <footer className="landing-footer">
        <h2>soklaro</h2>
        <nav aria-label={t('Projekt')}>
          <strong>{t('Projekt')}</strong>
          <a href="./app/">{t('Wetter-App öffnen')}</a>
          {projectLinks.repository && <a href={projectLinks.repository} rel="noreferrer">{t('Quellcode')}</a>}
        </nav>
        <nav aria-label={t('Rechtliches')}>
          <strong>{t('Rechtliches')}</strong>
          <a href="./privacy/">{t('Datenschutz')}</a>
          <a href="./impressum/">{t('Impressum')}</a>
          <a href="./legal/third-party-licenses.txt">{t('Lizenzen')}</a>
        </nav>
      </footer>
    </main>
  );
}
