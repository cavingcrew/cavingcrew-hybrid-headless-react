'use client';

import { useUser } from '@/lib/hooks/useUser';
import { Title, Text } from '@mantine/core';

export function WelcomeMessage() {
  const { isLoggedIn, isMember, user } = useUser();
  const firstName = user?.first_name || 'there';

  return (
    <div>
      {!isLoggedIn ? (
        <>
          <Title order={1} mb="md">
            We're the Caving Crew!
          </Title>
          <Text size="xl">
            A bunch of supportive, friendly people who like to encourage each other to cave and eat cake.
          </Text>
        </>
      ) : isMember ? (
        <>
          <Title order={1} mb="md">
            Welcome back {firstName}!
          </Title>
          <Text size="xl">
            You're part of a bunch of supportive, friendly people who like to encourage each other 
            to cave and eat cake.
          </Text>
        </>
      ) : (
        <>
          <Title order={1} mb="md">
            Welcome {firstName}!
          </Title>
          <Text size="xl">
            We're the Caving Crew - a bunch of supportive, friendly people who like to encourage 
            each other to cave and eat cake. You are extremely welcome here.
          </Text>
        </>
      )}
    </div>
  );
}
