import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Group, 
  Radio, 
  Skeleton, 
  Text, 
  Alert,
  Badge,
  Stack,
  Title
} from '@mantine/core';
import { IconLogin } from '@tabler/icons-react';
import { apiService } from '@/lib/api-service';
import type { Trip } from '@/types/api';

interface TripSignupWidgetProps {
  trip: Trip;
}

export function TripSignupWidget({ trip }: TripSignupWidgetProps) {
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [userStatus, setUserStatus] = useState<{ isLoggedIn: boolean; isMember: boolean } | null>(null);
  const [variations, setVariations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVariations = async () => {
      try {
        const response = await apiService.getProductVariations(trip.id);
        if (response.success) {
          setVariations(response.data?.variations || []);
          setUserStatus(response.data?.userStatus || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load variations');
      } finally {
        setLoading(false);
      }
    };

    if (trip.has_variations) {
      loadVariations();
    }
  }, [trip.id, trip.has_variations]);

  const handleSignUp = async () => {
    if (!selectedVariation) return;
    
    try {
      const response = await apiService.addToCart(trip.id, parseInt(selectedVariation));
      if (response.success) {
        window.location.href = response.data?.cart_url || '/cart';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <Stack gap="sm">
        <Skeleton height={40} width="60%" />
        <Skeleton height={20} />
        <Skeleton height={40} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );
  }

  if (!trip.purchasable) {
    return (
      <Alert color="yellow" title="Not Available">
        This trip is currently not available for signups
      </Alert>
    );
  }

  return (
    <Box mb="xl">
      <Title order={3} mb="md">Sign Up</Title>

      {trip.has_variations ? (
        <Radio.Group
          value={selectedVariation}
          onChange={setSelectedVariation}
          name="tripVariation"
          label="Select your option:"
          description="Choose the option that best describes you"
          required
        >
          <Stack mt="xs" gap="sm">
            {variations.map((variation) => (
              <Radio 
                key={variation.id}
                value={variation.id.toString()}
                label={
                  <Group gap="xs">
                    <Text span>{Object.values(variation.attributes).join(' - ')}</Text>
                    <Badge 
                      color={variation.stock_status === 'instock' ? 'green' : 'red'}
                      variant="light"
                    >
                      {variation.stock_quantity} spots left
                    </Badge>
                  </Group>
                }
                disabled={variation.stock_status !== 'instock'}
              />
            ))}
          </Stack>
        </Radio.Group>
      ) : (
        <Badge color="green" variant="light" mb="sm">
          {trip.stock_quantity} spots left
        </Badge>
      )}

      {userStatus && !userStatus.isLoggedIn && trip.acf?.event_non_members_welcome !== 'yes' ? (
        <Alert color="blue" mt="md" icon={<IconLogin size={18} />}>
          <Group gap="xs">
            <Text>Please log in to sign up for this trip</Text>
            <Button
              variant="light"
              component="a"
              href={`/wp-login.php?redirect_to=${encodeURIComponent(window.location.href)}#signup`}
              leftSection={<IconLogin size={16} />}
            >
              Log In Now
            </Button>
          </Group>
        </Alert>
      ) : (
        <Group mt="md">
          <Text fw={500}>
            Price: {userStatus?.isMember && trip.acf?.event_cost ? 
              `£${trip.acf.event_cost} (Member)` : 
              `£${trip.price}${userStatus?.isMember ? '' : ' (Non-member)'}`
            }
          </Text>
          <Button
            onClick={handleSignUp}
            disabled={!selectedVariation}
            loading={loading}
          >
            Sign Up Now
          </Button>
        </Group>
      )}
    </Box>
  );
}
