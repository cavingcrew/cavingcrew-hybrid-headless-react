import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Box, 
  Button, 
  Radio, 
  Alert,
  Badge,
  Stack,
  Title,
  Group,
  Text,
  Paper,
  Divider
} from '@mantine/core';
import { WordPressLoginWidget } from '@/components/auth/WordPressLoginWidget';
import { IconLogin, IconInfoCircle } from '@tabler/icons-react';
import { apiService } from '@/lib/api-service';
import type { Trip, ApiResponse } from '@/types/api';
import { tripKeys } from '@/lib/hooks/useTrips';

interface TripSignupWidgetProps {
  trip: Trip;
}

export function TripSignupWidget({ trip }: TripSignupWidgetProps) {
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  const { data: userStatus } = useQuery({
    queryKey: ['userStatus'],
    queryFn: () => apiService.getUserStatus(),
    refetchInterval: 30000
  });

  // Update price when variation changes
  useEffect(() => {
    if (selectedVariation) {
      const variation = trip.variations.find(v => v.id.toString() === selectedVariation);
      setSelectedPrice(variation?.price || '');
    }
  }, [selectedVariation, trip.variations]);

  // Poll stock data
  const queryClient = useQueryClient();
  const { data: stockData } = useQuery({
    queryKey: ['productStock', trip.id],
    queryFn: () => apiService.getProductStock(trip.id),
    refetchInterval: 30000,
    enabled: trip.has_variations
  });

  useEffect(() => {
    if (stockData?.data?.variations) {
      queryClient.setQueryData(tripKeys.all, (old: ApiResponse<Trip[]> | undefined) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map(t => 
            t.id === trip.id ? { 
              ...t, 
              variations: t.variations.map(v => {
                const stockVar = (stockData?.data?.variations ?? []).find((sv: { id: number }) => sv.id === v.id);
                return stockVar ? { 
                  ...v,
                  stock_quantity: stockVar.stock_quantity,
                  stock_status: stockVar.stock_status
                } : v;
              })
            } : t
          )
        };
      });
    }
  }, [stockData, queryClient, trip.id]);

  const handleSignUp = () => {
    if (!selectedVariation) return;
    window.location.href = `/checkout/?add-to-cart=${selectedVariation}`;
  };

  const hasAvailableVariations = trip.variations?.some(v => 
    v.stock_status === 'instock' && (v.stock_quantity ?? 0) > 0
  );

  if ((trip.has_variations && !hasAvailableVariations) || (!trip.has_variations && !trip.purchasable)) {
    return (
      <Paper withBorder p="md" radius="md" mb="xl">
        <Alert color="yellow" title={trip.has_variations ? "Sold Out" : "Not Available"}>
          {trip.has_variations ? "All options are currently sold out" : "This trip is currently not available for signups"}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper withBorder p="md" radius="md" mb="xl">
      <Title order={3} mb="md">Sign Up Options</Title>

      {trip.has_variations && hasAvailableVariations && (
        <Radio.Group
          value={selectedVariation}
          onChange={setSelectedVariation}
          name="tripVariation"
          required
        >
          <Stack gap="lg">
            {trip.variations.map((variation) => {
              const attribute = Object.values(variation.attributes)[0];
              const inStock = variation.stock_status === 'instock';
              
              return (
                <Paper key={variation.id} withBorder p="md" radius="md">
                  <Radio 
                    value={variation.id.toString()}
                    label={
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text fw={500}>
                            {attribute?.value || "Signup Option"}
                          </Text>
                          <Badge 
                            color={inStock ? 'green' : 'red'}
                            variant="light"
                          >
                            {inStock ? 
                              `${variation.stock_quantity ?? 'N/A'} spots left` : 
                              'Sold out'
                            }
                          </Badge>
                        </Group>
                        
                        {attribute?.description && (
                          <Text size="sm" c="dimmed">
                            {attribute.description}
                          </Text>
                        )}

                        <Group justify="space-between" mt="sm">
                          <Text fw={500}>Price: £{variation.price}</Text>
                          {variation.regular_price && variation.price !== variation.regular_price && (
                            <Text td="line-through" c="dimmed">
                              £{variation.regular_price}
                            </Text>
                          )}
                        </Group>
                      </Stack>
                    }
                    disabled={!inStock}
                  />
                </Paper>
              );
            })}
          </Stack>
        </Radio.Group>
      )}

      <Divider my="md" />

      {userStatus?.data && !userStatus.data.isLoggedIn && trip.acf?.event_non_members_welcome !== 'yes' ? (
        <Stack gap="md">
          <Alert color="blue" icon={<IconInfoCircle />}>
            {trip.acf.event_non_members_welcome === 'no' 
              ? "Membership required to sign up - please log in"
              : "Please log in to complete your signup"}
          </Alert>
          <WordPressLoginWidget />
        </Stack>
      ) : (
        <Group justify="space-between">
          <Stack gap={0}>
            <Text fw={500}>
              {selectedPrice ? `Total: £${selectedPrice}` : "Select an option above"}
            </Text>
            {trip.acf.event_non_members_welcome === 'no' && (
              <Text size="sm" c="dimmed">Membership required</Text>
            )}
          </Stack>
          
          <Button
            onClick={handleSignUp}
            disabled={!selectedVariation}
            size="lg"
          >
            Continue to Checkout
          </Button>
        </Group>
      )}
    </Paper>
  );
}
