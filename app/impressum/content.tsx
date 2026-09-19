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
      <h2>{t("Anbieter")}</h2>
      <address>
        <strong>{t("Bastian Vennemann")}</strong><br /> {t("Lerchenstr. 104 ")}<br /> {t("25462 Rellingen ")}<br /> {t("Germany")} </address>
      <h2>{t("Kontakt")}</h2>
      <p>{t("E-Mail:")} <strong>{t("contact@soklaro.com")}</strong><br /></p>
      <p>{t("Telefon:")} <strong>{t("+49 156 796 729 03")}</strong><br /></p>
      <h2>{t("Inhaltlich verantwortlich")}</h2>
            <address>
        <strong>{t("Bastian Vennemann")}</strong><br /> {t("Lerchenstr. 104 ")}<br /> {t("25462 Rellingen ")}<br /> {t("Germany")} </address>

      <h2>{t("Hinweis zum Projektstatus")}</h2>
      <p>{t("soklaro befindet sich noch in der Entwicklung. ")}</p>
    </main>
  );
}
