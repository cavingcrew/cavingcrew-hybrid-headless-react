"use client";

import {
	Accordion,
	Badge,
	Button,
	Container,
	Grid,
	Group,
	Image,
	List,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { TripSignupWidget } from "./TripSignupWidget";
import {
	IconCalendar,
	IconClock,
	IconCoin,
	IconMapPin,
} from "@tabler/icons-react";
import React from "react";
import type { Trip } from "../../types/api";

interface TripDetailsProps {
	trip: Trip;
}

export function TripDetails({ trip }: TripDetailsProps) {
	const acf = trip.acf;

	const startDate = acf?.event_start_date_time
		? new Date(acf.event_start_date_time)
		: null;

	return (
		<Stack gap="xl">
			{/* Header Section */}
			<Stack gap="md">
				<TripSignupWidget trip={trip} />
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
							{startDate && (
								<Group gap="xs">
									<IconCalendar size={20} />
									<Text>
										When:{" "}
										{startDate.toLocaleDateString("en-GB", {
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
										Time: from{" "}
										{startDate.toLocaleTimeString("en-GB", {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</Text>
								</Group>
							)}
							{(acf?.event_location || acf?.event_cave_name) && (
								<Group gap="xs">
									<IconMapPin size={20} />
									<Text>
										Location: {acf.event_cave_name || ""}
										{acf.event_possible_location && ` near ${acf.event_possible_location}`}
									</Text>
								</Group>
							)}
							{(acf?.event_cost || trip.price) && (
								<Group gap="xs">
									<IconCoin size={20} />
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
              
              <Grid>
                {/* Skills & Requirements Column */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="sm">
                    {/* Skills Required */}
                    {acf?.event_skills_required && (
                      <Group gap="xs">
                        <Badge
                          color={
                            acf.event_skills_required === 'Open to All Abilities' ? 'green' :
                            acf.event_skills_required === 'Basic SRT' ? 'blue' :
                            acf.event_skills_required === 'Advanced SRT' ? 'indigo' : 'orange'
                          }
                          variant="light"
                          leftSection={
                            acf.event_skills_required === 'Open to All Abilities' ? '✅' :
                            acf.event_skills_required.includes('SRT') ? '🧗' : '⚠️'
                          }
                        >
                          {acf.event_skills_required}
                        </Badge>
                      </Group>
                    )}

                    {/* Gear Required */}
                    {acf?.event_gear_required && acf.event_gear_required !== 'None' && (
                      <Group gap="xs">
                        <Badge
                          color={
                            acf.event_gear_required === 'Horizontal Caving Gear' ? 'yellow' :
                            acf.event_gear_required === 'Horizontal Caving Gear and SRT Kit' ? 'red' : 'gray'
                          }
                          variant="light"
                          leftSection={acf.event_gear_required.includes('SRT') ? '🪢' : '🎽'}
                        >
                          {acf.event_gear_required}
                        </Badge>
                      </Group>
                    )}

                    {/* Previous Experience */}
                    {acf?.event_must_caved_with_us_before && (
                      <Group gap="xs">
                        <Badge
                          color={acf.event_must_caved_with_us_before === 'yes' ? 'red' : 'green'}
                          variant="light"
                          leftSection={acf.event_must_caved_with_us_before === 'yes' ? '🔒' : '✅'}
                        >
                          {acf.event_must_caved_with_us_before === 'yes' 
                            ? 'Must have caved with us before'
                            : 'Open to newcomers'}
                        </Badge>
                      </Group>
                    )}

                    {/* Membership Requirement */}
                    {acf?.event_non_members_welcome && (
                      <Group gap="xs">
                        <Badge
                          color={acf.event_non_members_welcome === 'yes' ? 'green' : 'red'}
                          variant="light"
                          leftSection={acf.event_non_members_welcome === 'yes' ? '👥' : '👤'}
                        >
                          {acf.event_non_members_welcome === 'yes' 
                            ? 'Non-members welcome' 
                            : 'Members only'}
                        </Badge>
                        {acf.event_non_members_welcome === 'no' && acf.event_why_are_only_members_allowed && (
                          <Text size="sm" c="dimmed">
                            {acf.event_why_are_only_members_allowed}
                          </Text>
                        )}
                      </Group>
                    )}
                  </Stack>
                </Grid.Col>

                {/* Logistics Column */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="sm">
                    {/* Volunteering Requirement */}
                    {acf?.event_volunteering_required && acf.event_volunteering_required > 0 && (
                      <Group gap="xs">
                        <Badge color="teal" variant="light" leftSection="🤝">
                          Volunteer Contribution: {acf.event_volunteering_required} events
                        </Badge>
                      </Group>
                    )}

                    {/* Attendance Requirement */}
                    {acf?.event_attendance_required && acf.event_attendance_required > 0 && (
                      <Group gap="xs">
                        <Badge color="violet" variant="light" leftSection="📅">
                          Minimum Attendance: {acf.event_attendance_required} events
                        </Badge>
                      </Group>
                    )}

                    {/* Member Requirements */}
                    {acf?.event_non_members_welcome === 'no' && (
                      <Group gap="xs">
                        <Badge color="pink" variant="light" leftSection="⭐">
                          Membership benefits apply
                        </Badge>
                      </Group>
                    )}
                  </Stack>
                </Grid.Col>
              </Grid>

              {/* Additional Requirements Note */}
              {(acf?.event_skills_required === 'Open to All Abilities' || 
                acf?.event_gear_required === 'None') && (
                <Text size="sm" c="green" mt="sm">
                  🎉 This trip is specially designed to be accessible to newcomers!
                </Text>
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
