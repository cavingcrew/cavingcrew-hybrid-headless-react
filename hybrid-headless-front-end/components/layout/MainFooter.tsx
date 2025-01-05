'use client';

import { Container, Group, Text } from '@mantine/core';
import Link from 'next/link';

export function MainFooter() {
  return (
    <footer style={{ height: 60, borderTop: '1px solid #e9ecef' }}>
      <Container size="lg" h="100%">
        <Group h="100%" justify="space-between">
          <Text size="sm">© {new Date().getFullYear()} The Caving Crew. All rights reserved.</Text>
          <Group>
            <Text component={Link} href="/privacy-policy" size="sm">
              Privacy Policy
            </Text>
            <Text component={Link} href="/terms" size="sm">
              Terms of Service
            </Text>
          </Group>
        </Group>
      </Container>
    </footer>
  );
}
