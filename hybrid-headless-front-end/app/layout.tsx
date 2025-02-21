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
        <title>The Caving Crew - Community Caving Trips and Adventures</title>
        <meta
          name="description"
          content="A supportive community organizing caving trips, training, and social events. Join us for adventures underground and cake above!"
        />
        <meta name="keywords" content="caving, caving trips, caving community, adventure sports, outdoor activities, caving training" />
        <meta property="og:title" content="The Caving Crew - Community Caving Trips" />
        <meta
          property="og:description"
          content="Join our friendly community for caving adventures and social events. All experience levels welcome!"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.cavingcrew.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Caving Crew" />
        <meta
          name="twitter:description"
          content="A supportive community of cavers organizing trips and social events"
        />
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
