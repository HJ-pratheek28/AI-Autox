import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { GlobalNavigation } from '@/components/global-navigation';
import { SessionProvider } from '@/components/session-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Zapier Central | Autonomous AI Agent Console',
  description: 'Zapier Central connects apps, reasons across tools, and automates integrations dynamically with AI agents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased font-sans text-white/90 bg-neutral-950 selection:bg-white/20 selection:text-white`}>
        <SessionProvider>
          <div className="min-h-screen flex">
            {/* Sidebar */}
            <GlobalNavigation />

            {/* Main Workspace Frame */}
            <main className="flex-1 pl-64 min-h-screen flex flex-col bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.06),rgba(255,255,255,0))]">
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
