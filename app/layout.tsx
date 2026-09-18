import type { Metadata, Viewport } from 'next';
import './globals.css';
import { projectLinks } from '@/lib/project';

export const metadata: Metadata = {
  metadataBase: new URL(projectLinks.site),
  title: { default: 'soklaro – Wetter ohne Tracking', template: '%s · soklaro' },
  description: 'Freie, werbe- und trackerfreie Wetter-App mit bewusstem Standortschutz. Als Website, PWA, iOS- und Android-App.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'soklaro' },
  openGraph: { title: 'soklaro – Wetter ohne Tracking', description: 'Das Wetter für deinen Ort – nicht dein Standort für Werbenetzwerke.', type: 'website', images: ['/og.png'] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#132c31',
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
