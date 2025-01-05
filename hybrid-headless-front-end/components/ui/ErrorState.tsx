import React from 'react';
import { Center, Text, Stack, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  message = 'Something went wrong', 
  onRetry 
}: ErrorStateProps) {
  return (
    <Center h={400}>
      <Stack align="center" gap="md">
        <IconAlertCircle size={48} color="red" />
        <Text size="lg">{message}</Text>
        {onRetry && (
          <Button onClick={onRetry} variant="light">
            Try Again
          </Button>
        )}
      </Stack>
    </Center>
  );
}
