import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider, AppShell } from '@mantine/core';
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
          <AppShell
            header={{ height: 60 }}
            footer={{ height: 60 }}
            padding="md"
          >
            <AppShell.Header>
              <MainHeader />
            </AppShell.Header>

            <AppShell.Main>
              {children}
            </AppShell.Main>

            <AppShell.Footer>
              <MainFooter />
            </AppShell.Footer>
          </AppShell>
        </MantineProvider>
      </body>
    </html>
  );
}
