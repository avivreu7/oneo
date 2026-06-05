import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'האחוזון העליון',
  description: 'The 1% Club — משחק טלוויזיה אינטראקטיבי בזמן אמת',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0050E6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-app-bg antialiased">
        {children}
      </body>
    </html>
  );
}
