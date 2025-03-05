'use client';

import { MantineProvider as BaseMantineProvider } from '@mantine/core';
import { useState, useEffect, type ReactNode } from 'react';

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
      defaultColorScheme="light"
      forceColorScheme="light"
      withCssVariables
      withGlobalStyles
      withNormalizeCSS
    >
      {children}
    </BaseMantineProvider>
  );
}
