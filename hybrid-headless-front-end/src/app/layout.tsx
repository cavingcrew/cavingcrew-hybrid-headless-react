'use client';

import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { MainHeader } from '@/components/layout/MainHeader';
import { MainFooter } from '@/components/layout/MainFooter';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <div style={{ 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <MainHeader />
            <main style={{ flex: 1, padding: '1rem' }}>
              {children}
            </main>
            <MainFooter />
          </div>
        </MantineProvider>
      </body>
    </html>
  );
}
