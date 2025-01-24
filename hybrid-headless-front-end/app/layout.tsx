import '@mantine/core/styles.css';
import { ColorSchemeScript } from '@mantine/core';
import { MantineProvider } from '@/components/providers/MantineProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
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
