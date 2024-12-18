import { Footer, Container, Group, Text } from '@mantine/core';
import Link from 'next/link';

export function MainFooter() {
  return (
    <Footer height={60}>
      <Container size="lg" h="100%">
        <Group h="100%" justify="space-between">
          <Text size="sm">© 2024 Travel Adventures. All rights reserved.</Text>
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
    </Footer>
  );
}
