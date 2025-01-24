import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Button, 
  Radio, 
  Alert,
  Badge,
  Stack,
  Title,
  Group,
  Text
} from '@mantine/core';
import { IconLogin } from '@tabler/icons-react';
import { apiService } from '@/lib/api-service';
import type { Trip } from '@/types/api';

interface TripSignupWidgetProps {
  trip: Trip;
}

export function TripSignupWidget({ trip }: TripSignupWidgetProps) {
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const { data: userStatus } = useQuery({
    queryKey: ['userStatus'],
    queryFn: () => apiService.getUserStatus(),
    refetchInterval: 30000
  });

  // Poll stock data
  const { data: stockData } = useQuery({
    queryKey: ['productStock', trip.id],
    queryFn: () => apiService.getProductStock(trip.id),
    refetchInterval: 30000,
    enabled: trip.has_variations
  });

  const handleSignUp = () => {
    if (!selectedVariation) return;
    window.location.href = `/checkout/?add-to-cart=${selectedVariation}`;
  };

  const hasAvailableVariations = trip.variations?.some(v => v.stock_status === 'instock');
  if ((trip.has_variations && !hasAvailableVariations) || (!trip.has_variations && !trip.purchasable)) {
    return (
      <Alert color="yellow" title={trip.has_variations ? "Sold Out" : "Not Available"}>
        {trip.has_variations ? "All options are currently sold out" : "This trip is currently not available for signups"}
      </Alert>
    );
  }

  return (
    <Box mb="xl">
      <Title order={3} mb="md">Sign Up</Title>

      {trip.has_variations && hasAvailableVariations && (
        <Radio.Group
          value={selectedVariation}
          onChange={setSelectedVariation}
          name="tripVariation"
          label="Select your option:"
          description="Choose the option that best describes you"
          required
        >
          <Stack mt="xs" gap="sm">
            {trip.variations.map((variation) => (
              <Radio 
                key={variation.id}
                value={variation.id.toString()}
                label={
                  <Group gap="xs">
                    <Text span>{Object.values(variation.attributes).map(attr => attr.value).join(' - ')}</Text>
                    <Badge 
                      color={variation.stock_status === 'instock' ? 'green' : 'red'}
                      variant="light"
                    >
                      {variation.stock_status === 'instock' ? 
                        `${variation.stock_quantity} spots left` : 
                        'Sold out'
                      }
                    </Badge>
                  </Group>
                }
                disabled={variation.stock_status !== 'instock'}
              />
            ))}
          </Stack>
        </Radio.Group>
      )}

      {userStatus?.data && !userStatus.data.isLoggedIn && trip.acf?.event_non_members_welcome !== 'yes' ? (
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
            Price: {userStatus?.data?.isMember && trip.acf?.event_cost ? 
              `£${trip.acf.event_cost} (Member)` : 
              `£${trip.price}${userStatus?.data?.isMember ? '' : ' (Non-member)'}`
            }
          </Text>
          <Button
            onClick={handleSignUp}
            disabled={!selectedVariation}
          >
            Sign Up Now
          </Button>
        </Group>
      )}
    </Box>
  );
}
