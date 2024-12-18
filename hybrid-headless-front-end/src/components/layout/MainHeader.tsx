'use client';

import { Header, Container, Group, Button, Text } from '@mantine/core';
import Link from 'next/link';

export function MainHeader() {
  return (
    <Header height={60}>
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
    </Header>
  );
}
