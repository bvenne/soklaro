import type { Metadata } from 'next';
import './globals.css';
import { projectLinks } from '@/lib/project';

export const metadata: Metadata = {
  metadataBase: new URL(projectLinks.site),
  title: { default: 'soklaro – Wetter ohne Tracking', template: '%s · soklaro' },
  description: 'Freie, werbe- und trackerfreie Wetter-App mit bewusstem Standortschutz. Als Website, PWA, iOS- und Android-App.',
  manifest: '/manifest.webmanifest',
  openGraph: { title: 'soklaro – Wetter ohne Tracking', description: 'Das Wetter für deinen Ort – nicht dein Standort für Werbenetzwerke.', type: 'website', images: ['/og.png'] },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
