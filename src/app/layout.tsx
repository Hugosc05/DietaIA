import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import AppInit from '@/components/AppInit';

export const metadata: Metadata = {
  title: 'DietaIA · Definición Abdominal',
  description: 'Plan de definición 1900 kcal: dieta, pesas, cardio LISS y pasos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DietaIA'
  }
};

export const viewport: Viewport = {
  themeColor: '#0b0f14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppInit />
        <main className="mx-auto max-w-lg px-4 pb-24 pt-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
