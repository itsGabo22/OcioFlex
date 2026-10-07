import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { AppShell } from "@/components/shell/AppShell";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta-sans' });

export const metadata: Metadata = {
  title: 'OcioFlex',
  description: 'Native desktop productivity/leisure tracking application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${jakartaSans.variable} antialiased bg-surface text-on-surface`}
      >
        <AppProviders>
          <AppShell>
            {children}
          </AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
