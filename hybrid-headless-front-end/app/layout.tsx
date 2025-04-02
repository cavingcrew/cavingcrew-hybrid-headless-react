"use client";

import "@mantine/core/styles.css";
import { MainFooter } from "@/components/layout/MainFooter";
import { MainHeader } from "@/components/layout/MainHeader";
import { ClientRouterProvider } from "@/components/providers/ClientRouterProvider";
import { MantineProvider } from "@/components/providers/MantineProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ColorSchemeScript } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<html lang="en" data-mantine-color-scheme="light">
			<head>
				<ColorSchemeScript defaultColorScheme="light" />
				<title>The Caving Crew - Community Caving Trips and Adventures</title>
				<meta
					name="description"
					content="A supportive community organizing caving trips, training, and social events. Join us for adventures underground and cake above!"
				/>
				<meta
					name="keywords"
					content="caving, caving trips, caving community, adventure sports, outdoor activities, caving training"
				/>
				<meta
					property="og:title"
					content="The Caving Crew - Community Caving Trips"
				/>
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
						<>
							<Notifications />
							<ClientRouterProvider>
								<div
									style={{
										minHeight: "100vh",
										display: "flex",
										flexDirection: "column",
									}}
								>
									<MainHeader />
									<main style={{ flex: 1 }}>{children}</main>
									<MainFooter />
								</div>
							</ClientRouterProvider>
						</>
					</MantineProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
