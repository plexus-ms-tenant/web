import { cn } from '@plexus-ms/std';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import Header from './header';
import { Providers } from './providers';

// The brand's two faces (compendium: miscellaneous/brand). Mono carries the voice
// (display, labels, wordmark, code), sans carries the reading.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-plex-sans',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-plex-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('h-full antialiased', plexSans.variable, plexMono.variable)} suppressHydrationWarning>
      <body className={cn('flex min-h-full bg-card text-ink dark:bg-dark dark:text-dark-paper')}>
        <Providers>
          <div className={cn('flex w-full flex-col')}>
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
