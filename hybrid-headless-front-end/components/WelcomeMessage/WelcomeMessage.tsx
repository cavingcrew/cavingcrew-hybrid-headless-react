'use client';

import { useUser } from '@/lib/hooks/useUser';
import { Title, Text } from '@mantine/core';

export function WelcomeMessage() {
  const { isLoggedIn, isMember, user } = useUser();
  const firstName = user?.first_name || 'there';

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      textAlign: 'center',
      padding: '0 16px'
    }}>
      {!isLoggedIn ? (
        <>
          <Title 
            order={1}
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: 1.2,
              marginBottom: 24
            }}
          >
            We're the Caving Crew!
          </Title>
          <Text 
            size="xl"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              lineHeight: 1.6
            }}
          >
            A bunch of supportive, friendly people who like to encourage each other<br />
            to cave and eat cake.
          </Text>
        </>
      ) : isMember ? (
        <>
          <Title 
            order={1}
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: 1.2,
              marginBottom: 24
            }}
          >
            Welcome back {firstName}!
          </Title>
          <Text 
            size="xl"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              lineHeight: 1.6
            }}
          >
            You're part of a bunch of supportive, friendly people<br />
            who like to encourage each other to cave and eat cake.
          </Text>
        </>
      ) : (
        <>
          <Title 
            order={1}
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: 1.2,
              marginBottom: 24
            }}
          >
            Welcome {firstName}!
          </Title>
          <Text 
            size="xl"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              lineHeight: 1.6
            }}
          >
            We're the Caving Crew - a bunch of supportive, friendly people<br />
            who like to encourage each other to cave and eat cake.
            <br /><br />
            You are extremely welcome here.
          </Text>
        </>
      )}
    </div>
  );
}
