import '@mantine/core/styles.css';
import { ColorSchemeScript } from '@mantine/core';
import { MantineProvider } from '@/components/providers/MantineProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { MainHeader } from '@/components/layout/MainHeader';
import { MainFooter } from '@/components/layout/MainFooter';
import { useEffect } from 'react';
import { usePrefetch } from '@/lib/hooks/usePrefetch';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { prefetchAll } = usePrefetch();

  useEffect(() => {
    prefetchAll();
  }, []);
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <QueryProvider>
          <MantineProvider>
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
          </MantineProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
