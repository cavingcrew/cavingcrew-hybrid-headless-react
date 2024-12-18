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
          <MainHeader />
          <main style={{ minHeight: 'calc(100vh - 120px)' }}>
            {children}
          </main>
          <MainFooter />
        </MantineProvider>
      </body>
    </html>
  );
}
