"use client";

import {
	Accordion,
	Alert,
	Anchor,
	Box,
	Grid,
	Group,
	Image,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { TripOvernightHut } from './TripOvernightHut';
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
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";

interface TripDetailsProps {
	trip: Trip;
}

export function TripDetails({ trip }: TripDetailsProps) {
	const acf = trip.acf;
	const { purchasedProducts, isLoggedIn, user } = useUser();
	const startDate = acf?.event_start_date_time ? new Date(acf.event_start_date_time) : null;
	const endDate = acf?.event_finish_date_time ? new Date(acf.event_finish_date_time) : null;
	const isOvernightTrip = trip.categories.some(cat => cat.slug === 'overnight-trips');

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
						dangerouslySetInnerHTML={{ __html: acf.event_description ?? "" }}
					/>
				)}
			</Stack>

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
              {(acf?.event_location || acf?.event_cave_name) && (
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <IconMapPin size={20} style={{ marginTop: 3 }} />
                  <Text>
                    {isOvernightTrip ? 'Location: ' : ''}
                    {isOvernightTrip ? `${acf.event_accomodation_description} ${acf.event_location}` : '' }
                  </Text>
                </Group>
              )}
							{acf?.event_trip_leader && (
								<Group gap="xs" wrap="nowrap" align="flex-start">
									<IconUser size={20} style={{ marginTop: 3 }} />
									<Text>
										Lead by: {acf.event_trip_leader}
									</Text>
								</Group>
							)}
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
							{acf?.event_non_members_welcome !== 'no' && trip.price && (
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
                {acf?.event_gear_required && acf.event_gear_required !== 'None' && (
                  <Group gap="xs">
                    <IconTools size={20} />
                    <div>
                      <Text fw={500}>Required Gear:</Text>
                      <Text>{acf.event_gear_required}</Text>
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
              {acf?.event_gear_required && acf.event_gear_required !== 'None' && (
                <Alert color="blue" mt="md" variant="light" icon={<IconTools size={18} />}>
                  {(() => {
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

				<Grid.Col span={{ base: 12, md: 4 }}>
					{trip.images?.[0] && (
						<Image
							src={trip.images[0].src}
							alt={trip.images[0].alt}
							radius="md"
						/>
					)}
				</Grid.Col>
			</Grid>

			{hasPurchased ? (
				<Paper withBorder p="md" radius="md">
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
			) : (
				<TripSignupWidget
					trip={trip}
					requiresLogin={requiresLogin}
					loginReason={
						acf.event_non_members_welcome === 'no'
							? "This trip requires membership signup"
							: "This trip requires previous experience caving with us"
					}
				/>
			)}

			{/* What does signing up pay for section */}
			{acf?.event_paying_for && (
				<Paper withBorder p="md" radius="md">
					<Title order={2} mb="md">
						What does signing up pay for?
					</Title>
					<div
						dangerouslySetInnerHTML={{
							__html: trip.acf.event_paying_for ?? "",
						}}
					/>
				</Paper>
			)}

			{/* Accommodation Details for Overnight Trips */}
			{isOvernightTrip && (
				<TripOvernightHut
					location={acf.event_location}
					facilities={acf.hut_facilities_description}
					photo={acf.hut_photo}
				/>
			)}

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
												dangerouslySetInnerHTML={{
													__html: faq.trip_faq_answer ?? "",
												}}
											/>
										)}
									</Accordion.Panel>
								</Accordion.Item>
							))}
					</Accordion>
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

