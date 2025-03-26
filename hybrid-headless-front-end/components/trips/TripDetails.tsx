"use client";

import {
	Accordion,
	Alert,
	Anchor,
	Badge,
	Box,
	Button,
	Divider,
	Grid,
	Group,
	Image,
	Paper,
	Stack,
	Text,
	Title,
	Center,
} from "@mantine/core";
import { TripOvernightHut } from './TripOvernightHut';
import { TripAccessDetails } from './TripAccessDetails';
import { TripExperience } from './TripExperience';
import { TripObjectionHandling } from './TripObjectionHandling';
import { NeoClanVolunteeringWidget } from './NeoClanVolunteeringWidget';
import { SensitiveAccessWarning } from './SensitiveAccessWarning';
import { TripParticipantInfo } from './TripParticipantInfo';
import { isWithinDays } from '../../utils/event-timing';
import { useUser } from '@/lib/hooks/useUser';
import { TripSignupWidget } from "./TripSignupWidget";
import {
	IconCalendar,
	IconClock,
	IconCoin,
	IconMapPin,
	IconSchool,
	IconTools,
	IconHistory,
	IconUsers,
	IconHeartHandshake,
	IconCalendarEvent,
	IconSparkles,
	IconUser,
	IconInfoCircle,
	IconAlertTriangle,
	IconLock,
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";

interface TripDetailsProps {
	trip: Trip;
}

export function TripDetails({ trip }: TripDetailsProps) {
	const acf = trip.acf;
	const { purchasedProducts, isLoggedIn, user } = useUser();

	// Helper function to extract locality from address
	const getVagueLocation = (address?: string) => {
		if (!address) return null;

		// Split address by commas and clean up
		const parts = address.split(',')
			.map(part => part.trim())
			.filter(part => part.length > 0);

		// Common county names to ignore
		const counties = [
			'derbyshire', 'yorkshire', 'cumbria', 'mid wales', 'wales',
			'somerset', 'devon', 'cornwall', 'north wales', 'south wales'
		].map(c => c.toLowerCase());

		// Look for locality candidates
		const localityCandidates = parts
			.reverse() // Check from last part backwards
			.filter(part =>
				!counties.includes(part.toLowerCase()) &&
				!/\d/.test(part) && // Skip parts with numbers
				part.toLowerCase() !== 'uk');

		// Get first valid candidate
		return localityCandidates.find(part => part.length > 3 && part.match(/[a-z]/i)) || null;
	};

	const getLocationName = (trip: Trip) => {
		// For overnight trips, use the hut location
		if (isOvernightTrip) {
			if (trip.hut?.hut_location?.post_title) {
				return trip.hut.hut_location.post_title;
			}
			return trip.acf.event_location || trip.acf.event_cave_name || '';
		}

		// For training, known location, or giggletrips
		if (['training', 'known', 'giggletrip'].includes(trip.acf.event_type)) {
			// Use entrance location with city if available
			if (trip.route?.acf?.route_entrance_location_id?.title) {
				const locationTitle = trip.route.acf.route_entrance_location_id.title;
				const parkingLatLong = trip.route?.acf?.route_entrance_location_id?.acf?.location_parking_latlong;
				let city = '';

				// Check if parkingLatLong is an object with city property
				if (parkingLatLong && typeof parkingLatLong === 'object' && 'city' in parkingLatLong) {
					city = parkingLatLong.city || '';
				}

				if (city) {
					return `${locationTitle} near ${city}`;
				}
				return locationTitle;
			}

			// Fall back to cave name with possible location
			if (trip.acf.event_cave_name) {
				if (trip.acf.event_possible_location) {
					return `${trip.acf.event_cave_name} near ${trip.acf.event_possible_location}`;
				}
				return trip.acf.event_cave_name;
			}

			// Skip if route title is "Cave Entrance Details"
			if (trip.route?.title && trip.route.title !== "Cave Entrance Details") {
				return trip.route.title;
			}
		}

		// For mystery trips or other types, just use what we have
		if (trip.acf.event_cave_name) {
			return trip.acf.event_cave_name;
		}

		if (trip.acf.event_possible_location) {
			return trip.acf.event_possible_location;
		}

		if (trip.acf.event_location) {
			return trip.acf.event_location;
		}

		return '';
	};
	const startDate = acf?.event_start_date_time ? new Date(acf.event_start_date_time) : null;
	const endDate = acf?.event_finish_date_time ? new Date(acf.event_finish_date_time) : null;
	const isOvernightTrip = trip.categories.some(cat => cat.slug === 'overnight-trips');

	// Function to scroll to signup section
	const scrollToSignup = () => {
		const signupSection = document.getElementById('trip-signup-section');
		if (signupSection) {
			signupSection.scrollIntoView({ behavior: 'smooth' });
		}
	};

	// Check if this is a giggletrip and user is not logged in and there are beginner spots available
	const showSignupCTAs = !isLoggedIn && acf?.event_type === 'giggletrip' &&
		trip.variations.some(v =>
			v.attributes &&
			v.attributes["what-describes-you-best"] &&
			v.attributes["what-describes-you-best"].value.toLowerCase().includes('keen') &&
			v.stock_quantity !== null && v.stock_quantity > 0
		);

	const requiresLogin = (
		(acf.event_non_members_welcome === 'no' ||
		 acf.event_must_caved_with_us_before === 'yes') &&
		!isLoggedIn
	);

	const hasPurchased = purchasedProducts.includes(trip.id) ||
		trip.variations.some(v => purchasedProducts.includes(v.id));

	console.log('[TripDetails] Rendering', {
		tripId: trip.id,
		variations: trip.variations.map(v => v.id),
		purchasedProducts,
		hasPurchased
	});

	return (
		<Stack gap="xl">
			{/* Header Section */}
			<Stack gap="md">
				{acf?.event_description && (
					<div
						// Content from WordPress sanitized HTML
						dangerouslySetInnerHTML={{ __html: acf.event_description ?? "" }}
					/>
				)}
			</Stack>

			{/* Sensitive Access Warning */}
			<SensitiveAccessWarning
				isVisible={!!trip.route?.acf?.route_entrance_location_id?.acf?.location_sensitive_access}
			/>

			{/* Key Details Section */}
			<Grid>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Paper withBorder p="md" radius="md">
						<Stack gap="md">
              {isOvernightTrip ? (
                <>
                  {/* Overnight Trip Date Display */}
                  {startDate && (
                    <Group gap="xs" wrap="nowrap" align="flex-start">
                      <IconCalendar size={20} style={{ marginTop: 3 }} />
                      <Text>
                        From: {startDate.toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}{' '}
                        at {startDate.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </Group>
                  )}
                  {endDate && (
                    <Group gap="xs">
                      <IconCalendar size={20} />
                      <Text>
                        Til: {endDate.toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}{' '}
                        at {endDate.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </Group>
                  )}
                </>
              ) : (
                <>
                  {/* Regular Trip Date Display */}
                  {startDate && (
                    <Group gap="xs">
                      <IconCalendar size={20} />
                      <Text>
                        When: {startDate.toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </Text>
                    </Group>
                  )}
                  {startDate && (
                    <Group gap="xs">
                      <IconClock size={20} />
                      <Text>
                        Time: from {startDate.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </Group>
                  )}
                </>
              )}

              {/* Location Display */}
              {isOvernightTrip ? (
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <IconMapPin size={20} style={{ marginTop: 3 }} />
                  <Text>
                    {hasPurchased && trip.hut?.hut_lat_long ? (
                      <Anchor
                        href={`http://maps.apple.com/?q=${trip.hut.hut_lat_long}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Location Pin
                      </Anchor>
                    ) : (
                      `Region: ${trip.hut?.hut_location?.post_title || 
                        getVagueLocation(trip.hut?.hut_address) || 
                        trip.acf.event_location}`
                    )}
                  </Text>
                </Group>
              ) : (
                getLocationName(trip) && (
                  <Group gap="xs" wrap="nowrap" align="flex-start">
                    <IconMapPin size={20} style={{ marginTop: 3 }} />
                    <Text>Location: {getLocationName(trip)}</Text>
                  </Group>
                )
              )}
							{acf?.event_trip_leader && (
								<Group gap="xs" wrap="nowrap" align="flex-start">
									<IconUser size={20} style={{ marginTop: 3 }} />
									<Text>
										Lead by: {acf.event_trip_leader}
									</Text>
								</Group>
							)}
              <Group gap="xs" wrap="nowrap" align="flex-start">
                <IconCalendarEvent size={20} style={{ marginTop: 3 }} />
                <Badge
                  color={
                    trip.acf.event_type === 'training' ? 'indigo' :
                    trip.acf.event_type === 'giggletrip' ? 'blue' :
                    trip.acf.event_type === 'overnight' ? 'teal' :
                    trip.acf.event_type === 'mystery' ? 'cyan' : 'green'
                  }
                  variant="light"
                >
                  {(() => {
                    switch(trip.acf.event_type) {
                      case 'training': return 'Training Event';
                      case 'giggletrip': return 'Giggletrip';
                      case 'overnight': return 'Overnight Trip';
                      case 'known':
                        const startHour = startDate?.getHours() || 0;
                        return startHour >= 17 ? 'Evening Caving' : 'Day Caving';
                      case 'mystery': return 'Mystery Trip';
                      default: return trip.acf.event_type?.replace(/-/g, ' ') || 'Caving Trip';
                    }
                  })()}
                </Badge>
              </Group>
							{(acf?.event_cost || trip.price) && (
								<Group gap="xs" wrap="nowrap" align="flex-start">
									<IconCoin size={20} style={{ marginTop: 3 }} />
									<Text>
										{acf.event_non_members_welcome === 'no'
											? `Price: £${acf.event_cost || trip.price} (Members Only)`
											: `Member Price: £${acf.event_cost || trip.price}`}
									</Text>
								</Group>
							)}
							{acf?.event_non_members_welcome !== 'no' && trip.price &&
							  // Only show non-member price if it's different from member price
							  // Handle cases where member price might be a range like "3-6" or "3 - 6"
							  String(acf?.event_cost || "").replace(/\s+/g, "") !== String(trip.price).replace(/\s+/g, "") && (
								<Group gap="xs">
									<IconCoin size={20} />
									<Text>Non-Member Price: £{trip.price}</Text>
								</Group>
							)}
						</Stack>
					</Paper>

          {/* Requirements Section */}
          {(acf?.event_skills_required ||
            acf?.event_gear_required ||
            acf?.event_must_caved_with_us_before ||
            acf?.event_non_members_welcome ||
            (acf?.event_volunteering_required && acf.event_volunteering_required > 0) ||
            (acf?.event_attendance_required && acf.event_attendance_required > 0)) && (
            <Paper withBorder p="md" radius="md" mt="md">
              <Title order={3} mb="md">Requirements</Title>

              <Stack gap="md">
                {/* Skills Required */}
                {acf?.event_skills_required && (
                  <Group gap="xs">
                    <IconSchool size={20} />
                    <div>
                      <Text fw={500}>Skills Required:</Text>
                      <Text>{acf.event_skills_required}</Text>
                    </div>
                  </Group>
                )}

                {/* Gear Required */}
                {(trip.route?.acf?.route_personal_gear_required || (acf?.event_gear_required && acf.event_gear_required !== 'None')) && (
                  <Group gap="xs">
                    <IconTools size={20} />
                    <div>
                      <Text fw={500}>Required Gear:</Text>
                      <Text>
                        {trip.route?.acf?.route_personal_gear_required
                          ? (typeof trip.route.acf.route_personal_gear_required === 'string'
                              ? trip.route.acf.route_personal_gear_required.replace(/<[^>]*>/g, '').trim().replace(/,/g, ', ')
                              : String(trip.route.acf.route_personal_gear_required).replace(/,/g, ', '))
                          : acf.event_gear_required}
                      </Text>
                    </div>
                  </Group>
                )}

                {/* Previous Experience */}
                {acf?.event_must_caved_with_us_before && (
                  <Group gap="xs">
                    <IconHistory size={20} />
                    <div>
                      <Text fw={500}>Previous Experience:</Text>
                      <Text>
                        {acf.event_must_caved_with_us_before === 'yes'
                          ? 'Must have caved with us before'
                          : 'No previous experience needed'}
                      </Text>
                    </div>
                  </Group>
                )}

                {/* Membership Requirement */}
                {acf?.event_non_members_welcome && (
                  <Group gap="xs">
                    <IconUsers size={20} />
                    <div>
                      <Text fw={500}>Membership:</Text>
                      <Text>
                        {acf.event_non_members_welcome === 'yes'
                          ? 'Not required - open to all'
                          : 'Required to participate'}
                      </Text>
                      {acf.event_non_members_welcome === 'no' && acf.event_why_are_only_members_allowed && (
                        <Text size="sm" c="dimmed" mt={4}>
                          {acf.event_why_are_only_members_allowed}
                        </Text>
                      )}
                    </div>
                  </Group>
                )}

                {/* Volunteering Requirement */}
                {acf?.event_volunteering_required && acf.event_volunteering_required > 0 && (
                  <Group gap="xs">
                    <IconHeartHandshake size={20} />
                    <div>
                      <Text fw={500}>Volunteering:</Text>
                      <Text>Contribute to {acf.event_volunteering_required} events</Text>
                    </div>
                  </Group>
                )}

                {/* Attendance Requirement */}
                {acf?.event_attendance_required && acf.event_attendance_required > 0 && (
                  <Group gap="xs">
                    <IconCalendarEvent size={20} />
                    <div>
                      <Text fw={500}>Minimum Attendance:</Text>
                      <Text>{acf.event_attendance_required} events</Text>
                    </div>
                  </Group>
                )}

                {/* Age Restrictions */}
                {acf?.event_u18s_come && (
                  <Group gap="xs">
                    <IconUser size={20} />
                    <div>
                      <Text fw={500}>Age Restrictions:</Text>
                      <Text>
                        {acf.event_u18s_come === 'yes'
                          ? 'Open to accompanied under-18s'
                          : 'Participants must be 18 or older'}
                      </Text>
                      {acf.event_u18s_come === 'yes' && (
                        <Alert color="yellow" mt="sm" icon={<IconInfoCircle size={18} />}>
                          This trip is specifically for families with under-18s. Adults without
                          accompanying minors cannot participate.
                        </Alert>
                      )}
                    </div>
                  </Group>
                )}
              </Stack>

              {/* Newbie Friendly Note */}
              {(acf?.event_skills_required === 'Open to All Abilities' ||
                acf?.event_gear_required === 'None') && (
                <Alert color="green" mt="md" variant="light" icon={<IconSparkles size={18} />}>
                  {[
                    acf?.event_skills_required === 'Open to All Abilities' && 'No experience needed',
                    acf?.event_gear_required === 'None' && 'All gear can be provided'
                  ].filter(Boolean).join(' - ')}
                </Alert>
              )}

              {/* Gear Requirements Clarification */}
              {(trip.route?.acf?.route_personal_gear_required || (acf?.event_gear_required && acf.event_gear_required !== 'None')) && (
                <Alert color="blue" mt="md" variant="light" icon={<IconTools size={18} />}>
                  {(() => {
                    // If we have route-specific gear requirements, use those
                    if (trip.route?.acf?.route_personal_gear_required) {
                      return `You'll need: ${typeof trip.route.acf.route_personal_gear_required === 'string'
                        ? trip.route.acf.route_personal_gear_required.replace(/<[^>]*>/g, '').trim().replace(/,/g, ', ')
                        : String(trip.route.acf.route_personal_gear_required).replace(/,/g, ', ')}`;
                    }

                    // Otherwise fall back to the event gear required
                    switch(acf.event_gear_required) {
                      case 'Horizontal Caving Gear':
                        return "You'll need your own personal caving gear (helmet, light, caving suit, wellies)";
                      case 'Horizontal Caving Gear and SRT Kit':
                        return "You'll need your own full caving gear and vertical equipment";
                      default:
                        return "Specialist equipment required - check kit list below";
                    }
                  })()}
                </Alert>
              )}
            </Paper>
          )}
				</Grid.Col>

				<Grid.Col
					span={{ base: 0, md: 4 }}
					visibleFrom="md"
				>
					{trip.images?.[0] && (
						<Image
							src={trip.images[0].sizes?.medium_large?.file || trip.images[0].src}
							alt={trip.images[0].alt}
							radius="md"
						/>
					)}
				</Grid.Col>
			</Grid>

			{hasPurchased ? (
				<>
					<Paper withBorder p="md" radius="md" id="trip-signup-section">
						<Alert
							color="green"
							title={
								<>
									You're Signed Up
									{isLoggedIn && user?.billing_first_name && `, ${user.billing_first_name}`}!
								</>
							}
						>
							<Text>
								You're already booked on this trip. Check your email for confirmation
								or visit your <Anchor href="/my-account">account page</Anchor> for details.
							</Text>
						</Alert>

						<Box mt="md" style={{ opacity: 0.6, pointerEvents: 'none' }}>
							<TripSignupWidget
								trip={trip}
							/>
						</Box>
					</Paper>
				</>
			) : (
				<Box id="trip-signup-section">
					<TripSignupWidget
						trip={trip}
						requiresLogin={requiresLogin}
						loginReason={
							acf.event_non_members_welcome === 'no'
								? "This trip requires membership signup"
								: "This trip requires previous experience caving with us"
						}
					/>
				</Box>
			)}
			{/* Conditional Access Details */}
			{hasPurchased && !isOvernightTrip ? (
				<TripAccessDetails trip={trip} />
			) : "" }

			{/* Trip Experience Details */}
			<TripExperience trip={trip} />

			{/* Signup CTA after Trip Experience */}
			{showSignupCTAs && (
				<Center mt="xl">
					<Button
						size="lg"
						color="blue"
						onClick={scrollToSignup}
					>
						Sign Up For This Trip
					</Button>
				</Center>
			)}

			{/* Participant-specific information */}
			{hasPurchased && isOvernightTrip && (
				<TripParticipantInfo
					hut={trip.hut}
					tripId={trip.id}
				/>
			)}

			{/* What does signing up pay for section */}
			{acf?.event_paying_for && (
				<Paper withBorder p="md" radius="md">
					<Title order={2} mb="md">
						What does signing up pay for?
					</Title>
					<div
						// Content from WordPress sanitized HTML
						dangerouslySetInnerHTML={{
							__html: trip.acf.event_paying_for ?? "",
						}}
					/>

					{/* Signup CTA after payment info */}
					{showSignupCTAs && (
						<Center mt="xl">
							<Button
								size="lg"
								color="blue"
								onClick={scrollToSignup}
							>
								Ready to Join? Sign Up Now
							</Button>
						</Center>
					)}
				</Paper>
			)}

			{/* Accommodation Details for Overnight Trips */}
			{isOvernightTrip && (
				<TripOvernightHut
					hut={trip.hut}
					tripId={trip.id}
					location={acf.event_location}
					facilities={acf.hut_facilities_description}
					photo={acf.hut_photo}
				/>
			)}

			{/* Trip Participants Widget */}
			<NeoClanVolunteeringWidget trip={trip} />

			{/* FAQ Section */}
			{acf.trip_faq && acf.trip_faq.length > 0 && (
				<Paper withBorder p="md" radius="md">
					<Title order={2} mb="md">
						Q&A
					</Title>
					<Accordion>
						{acf.trip_faq &&
							Array.isArray(acf.trip_faq) &&
							acf.trip_faq.map((faq) => (
								<Accordion.Item
									key={faq.trip_faq_title}
									value={faq.trip_faq_title}
								>
									<Accordion.Control>{faq.trip_faq_title}</Accordion.Control>
									<Accordion.Panel>
										{faq.trip_faq_answer && (
											<div
												// Content from WordPress sanitized HTML
												dangerouslySetInnerHTML={{
													__html: faq.trip_faq_answer ?? "",
												}}
											/>
										)}
									</Accordion.Panel>
								</Accordion.Item>
							))}
					</Accordion>

					{/* Signup CTA after FAQ */}
					{showSignupCTAs && (
						<Center mt="xl">
							<Button
								size="lg"
								color="blue"
								onClick={scrollToSignup}
							>
								Got Questions? Sign Up and Ask Us!
							</Button>
						</Center>
					)}
				</Paper>
			)}

			{/* Kit List Section */}
			{acf.overnight_kitlist && acf.overnight_kitlist.length > 0 && (
				<Paper withBorder p="md" radius="md">
					<Title order={2} mb="md">
						Kit List
					</Title>
					<Accordion>
						{acf.overnight_kitlist &&
							Array.isArray(acf.overnight_kitlist) &&
							acf.overnight_kitlist.map((kit) => (
								<Accordion.Item
									key={kit.overnight_kit_list_type}
									value={kit.overnight_kit_list_type}
								>
									<Accordion.Control>
										{kit.overnight_kit_list_type}
									</Accordion.Control>
									<Accordion.Panel>
										{kit.overnight_kit_list && (
											<div
												// Content from WordPress sanitized HTML
												dangerouslySetInnerHTML={{
													__html: kit.overnight_kit_list ?? "",
												}}
											/>
										)}
									</Accordion.Panel>
								</Accordion.Item>
							))}
					</Accordion>

				</Paper>
			)}

			{/* Plans Section */}
			{acf.overnight_plans && acf.overnight_plans.length > 0 && (
				<Paper withBorder p="md" radius="md">
					<Title order={2} mb="md">
						Plans
					</Title>
					<Text mb="md">
						Times are all subject to change, and are mainly for illustration and
						to start conversation.
					</Text>
					<Accordion>
						{acf.overnight_plans &&
							Array.isArray(acf.overnight_plans) &&
							acf.overnight_plans.map((plan) => (
								<Accordion.Item
									key={plan.overnight_plans_day}
									value={plan.overnight_plans_day}
								>
									<Accordion.Control>
										{plan.overnight_plans_day}
									</Accordion.Control>
									<Accordion.Panel>
										{plan.overnight_plans_description && (
											<div
												// Content from WordPress sanitized HTML
												dangerouslySetInnerHTML={{
													__html: plan.overnight_plans_description ?? "",
												}}
											/>
										)}
									</Accordion.Panel>
								</Accordion.Item>
							))}
					</Accordion>

				</Paper>
			)}
		</Stack>
	);
}

