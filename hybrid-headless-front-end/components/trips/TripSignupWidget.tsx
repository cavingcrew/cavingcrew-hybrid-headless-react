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
  Divider,
  Anchor
} from '@mantine/core';

const calculateMemberPrice = (basePrice: string, discountPounds?: string) => {
  const numericPrice = Number(basePrice);
  const numericDiscount = Number(discountPounds || 0);
  
  if (isNaN(numericPrice)) return 0;
  if (isNaN(numericDiscount) || numericDiscount <= 0) return numericPrice;
  
  return Math.max(numericPrice - numericDiscount, 0); // Ensure price doesn't go negative
};

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

  const memberDiscount = trip.acf.event_members_discount;
  const isMember = userStatus?.data?.isMember;
  const isLoggedIn = userStatus?.data?.isLoggedIn;

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
              const memberPrice = calculateMemberPrice(variation.price, memberDiscount);
              
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
                        
                        {variation.description && (
                          <div
                            dangerouslySetInnerHTML={{ __html: variation.description }}
                            style={{
                              fontSize: '0.875rem',
                              color: '#868e96',
                              lineHeight: 1.6,
                              marginTop: '0.5rem'
                            }}
                          />
                        )}

                        <Group justify="space-between" mt="sm">
                          {isMember ? (
                            <>
                              <Text fw={500}>
                                Member Price: £{memberPrice.toFixed(2)}
                              </Text>
                              {memberDiscount && parseFloat(memberDiscount) > 0 && (
                                <Text td="line-through" c="dimmed">
                                  £{variation.price}
                                </Text>
                              )}
                            </>
                          ) : (
                            <>
                              <Text fw={500}>Price: £{variation.price}</Text>
                              {memberDiscount && parseFloat(memberDiscount) > 0 && isLoggedIn && (
                                <Text c="green" size="sm">
                                  Save £{parseFloat(memberDiscount)} with membership
                                </Text>
                              )}
                            </>
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

      {!isMember && memberDiscount && parseFloat(memberDiscount) > 0 && (
        <Alert color="teal" variant="light" icon={<IconInfoCircle />}>
          <Text size="sm">
            Members save £{memberDiscount} on this trip!{' '}
            <Anchor 
              href="https://www.cavingcrew.com/trip/get-caving-crew-membership/" 
              target="_blank"
              c="blue"
            >
              Get instant membership
            </Anchor>{' '}
            to unlock discounts. Membership is cheaper than you think and can be cancelled anytime.
          </Text>
        </Alert>
      )}

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
            {trip.acf.event_non_members_welcome === 'no' && (
              <Text size="sm" c="dimmed">Membership required</Text>
            )}
          </Stack>
          
          <Button
            onClick={handleSignUp}
            disabled={!selectedVariation}
            size="lg"
          >
            Signup for Trip
          </Button>
        </Group>
      )}
    </Paper>
  );
}
