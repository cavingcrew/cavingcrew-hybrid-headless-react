'use client';

import { MantineProvider as BaseMantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { type ReactNode } from 'react';

interface MantineProviderProps {
  children: ReactNode;
}

export function MantineProvider({ children }: MantineProviderProps) {
  const preferredColorScheme = useColorScheme();

  return (
    <BaseMantineProvider
      defaultColorScheme="light"
      forceColorScheme="light"
    >
      {children}
    </BaseMantineProvider>
  );
}
