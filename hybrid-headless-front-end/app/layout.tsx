'use client';

import '@mantine/core/styles.css';
import { ColorSchemeScript } from '@mantine/core';
import { MantineProvider } from '@/components/providers/MantineProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ClientRouterProvider } from '@/components/providers/ClientRouterProvider';
import { MainHeader } from '@/components/layout/MainHeader';
import { MainFooter } from '@/components/layout/MainFooter';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <QueryProvider>
          <MantineProvider>
            <ClientNavigationProvider>
              <div style={{ 
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <MainHeader />
                <main style={{ flex: 1 }}>
                  {children}
                </main>
                <MainFooter />
              </div>
            </ClientNavigationProvider>
          </MantineProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
