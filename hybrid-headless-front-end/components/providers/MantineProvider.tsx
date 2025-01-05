'use client';

import { MantineProvider as BaseMantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { type ReactNode } from 'react';

interface MantineProviderProps {
  children: ReactNode;
}

export function MantineProvider({ children }: MantineProviderProps) {
  const [mounted, setMounted] = useState(false);
  const preferredColorScheme = useColorScheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <BaseMantineProvider
      defaultColorScheme="light"
      forceColorScheme="light"
    >
      {children}
    </BaseMantineProvider>
  );
}
