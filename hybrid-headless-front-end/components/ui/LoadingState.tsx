import React from 'react';
import { Center, Loader, Text, Stack } from '@mantine/core';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <Center h={400}>
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text size="lg">{message}</Text>
      </Stack>
    </Center>
  );
}
