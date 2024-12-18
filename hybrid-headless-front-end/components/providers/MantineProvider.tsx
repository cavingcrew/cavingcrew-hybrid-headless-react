'use client';

import { MantineProvider as BaseMantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { type ReactNode, useEffect, useState } from 'react';

interface MantineProviderProps {
  children: ReactNode;
}

export function MantineProvider({ children }: MantineProviderProps) {
  const preferredColorScheme = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <BaseMantineProvider
      colorScheme={mounted ? preferredColorScheme : 'light'}
    >
      {children}
    </BaseMantineProvider>
  );
}
