'use client';

import { MantineProvider as BaseMantineProvider } from '@mantine/core';

export function MantineProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseMantineProvider>
      {children}
    </BaseMantineProvider>
  );
}
