'use client';
import { useLocale } from '@/lib/i18n/use-locale';
import { SoklaroMark } from '../components/soklaro-mark';



export default function ImprintPage() {
  const { t } = useLocale();
  return (
    <main className="privacy-page imprint-page">
      <header>
        <a className="brand-mark" href="/" aria-label={t("soklaro Startseite")}><span><SoklaroMark /></span>soklaro</a>
        <nav><a href="/privacy">{t("Datenschutz")}</a><a href="/app">{t("Wetter öffnen")}</a></nav>
      </header>
      <p className="eyebrow">{t("Rechtliche Angaben")}</p>
      <h1>{t("Impressum")}</h1>
      <aside className="legal-placeholder" role="note"> {t("Vor einer öffentlichen Veröffentlichung müssen die folgenden Platzhalter durch vollständige Betreiberangaben ersetzt und rechtlich geprüft werden.")} </aside>
      <h2>{t("Anbieter")}</h2>
      <address>
        <strong>{t("[Name oder Firma ergänzen]")}</strong><br /> {t("[Straße und Hausnummer ergänzen]")}<br /> {t("[Postleitzahl und Ort ergänzen]")}<br /> {t("[Land ergänzen]")} </address>
      <h2>{t("Kontakt")}</h2>
      <p>{t("E-Mail:")} <strong>{t("[E-Mail-Adresse ergänzen]")}</strong><br />{t("Telefon: [falls erforderlich ergänzen]")}</p>
      <h2>{t("Vertretung und Register")}</h2>
      <p>{t("Vertretungsberechtigte Person, Registergericht, Registernummer sowie Umsatzsteuer-ID sind – soweit auf den Betreiber zutreffend – vor Veröffentlichung zu ergänzen.")}</p>
      <h2>{t("Inhaltlich verantwortlich")}</h2>
      <p>{t("[Name und ladungsfähige Anschrift ergänzen, soweit erforderlich]")}</p>
      <h2>{t("Hinweis zum Projektstatus")}</h2>
      <p>{t("soklaro befindet sich in Entwicklung. Vor der Veröffentlichung sind die Betreiberangaben vollständig einzutragen.")}</p>
    </main>
  );
}
