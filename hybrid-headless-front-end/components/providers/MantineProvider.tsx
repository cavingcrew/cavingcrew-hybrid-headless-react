"use client";

import {
	MantineProvider as BaseMantineProvider,
	createTheme,
} from "@mantine/core";
import { type ReactNode, useEffect, useState } from "react";

// Create a consistent theme
const theme = createTheme({
	// Your theme configuration
});

interface MantineProviderProps {
	children: ReactNode;
}

export function MantineProvider({ children }: MantineProviderProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Use a consistent rendering approach for both server and client
	return (
		<BaseMantineProvider
			theme={theme}
			defaultColorScheme="light"
			forceColorScheme="light"
		>
			{mounted ? children : children}
		</BaseMantineProvider>
	);
}
