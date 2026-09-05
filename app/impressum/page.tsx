import { SoklaroMark } from '../components/soklaro-mark';

export const metadata = {
  title: 'Impressum',
  description: 'Anbieter- und Kontaktangaben für soklaro.',
};

export default function ImprintPage() {
  return (
    <main className="privacy-page imprint-page">
      <header>
        <a className="brand-mark" href="/" aria-label="soklaro Startseite"><span><SoklaroMark /></span>soklaro</a>
        <nav><a href="/privacy">Datenschutz</a><a href="/app">Wetter öffnen</a></nav>
      </header>
      <p className="eyebrow">Rechtliche Angaben</p>
      <h1>Impressum</h1>
      <aside className="legal-placeholder" role="note">
        Vor einer öffentlichen Veröffentlichung müssen die folgenden Platzhalter durch vollständige Betreiberangaben ersetzt und rechtlich geprüft werden.
      </aside>
      <h2>Anbieter</h2>
      <address>
        <strong>[Name oder Firma ergänzen]</strong><br />
        [Straße und Hausnummer ergänzen]<br />
        [Postleitzahl und Ort ergänzen]<br />
        [Land ergänzen]
      </address>
      <h2>Kontakt</h2>
      <p>E-Mail: <strong>[E-Mail-Adresse ergänzen]</strong><br />Telefon: [falls erforderlich ergänzen]</p>
      <h2>Vertretung und Register</h2>
      <p>Vertretungsberechtigte Person, Registergericht, Registernummer sowie Umsatzsteuer-ID sind – soweit auf den Betreiber zutreffend – vor Veröffentlichung zu ergänzen.</p>
      <h2>Inhaltlich verantwortlich</h2>
      <p>[Name und ladungsfähige Anschrift ergänzen, soweit erforderlich]</p>
      <h2>Hinweis zum Projektstatus</h2>
      <p>soklaro befindet sich in Entwicklung. Vor der Veröffentlichung sind die Betreiberangaben vollständig einzutragen.</p>
    </main>
  );
}
