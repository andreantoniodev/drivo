import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/shared/auth/AuthContext';

const inter = Inter({ subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'DRIVO — Sua garagem inteligente com IA',
  description:
    'Gerencie sua frota e veículos de forma facilitada com inteligência artificial e leitura de CRLV.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark h-full">
      <body
        className={`${inter.className} ${jetbrainsMono.variable} min-h-full bg-bg text-fg antialiased flex flex-col`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
