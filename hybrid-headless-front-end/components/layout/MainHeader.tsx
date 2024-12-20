'use client';

import { Container, Group, Button, Text } from '@mantine/core';
import Link from 'next/link';

export function MainHeader() {
  return (
    <header style={{ height: 60, borderBottom: '1px solid #e9ecef' }}>
      <Container size="lg" h="100%">
        <Group h="100%" justify="space-between">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Text size="xl" fw={700}>Travel Adventures</Text>
          </Link>

          <Group>
            <Button component={Link} href="/trips" variant="light">
              All Trips
            </Button>
            <Button component={Link} href="/categories" variant="light">
              Categories
            </Button>
            <Button 
              component="a" 
              href="/my-account"
              variant="filled"
            >
              My Account
            </Button>
          </Group>
        </Group>
      </Container>
    </header>
  );
}
