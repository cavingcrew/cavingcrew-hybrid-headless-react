"use client";

import { Badge, Button, Card, Group, Image, Text } from "@mantine/core";
import Link from "next/link";
import React from "react";
import type { Trip } from "../../types/api";

interface TripCardProps {
	trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
	return (
		<Card shadow="sm" padding="lg" radius="md" withBorder>
			{trip.images?.[0] && (
				<Card.Section>
					<Image
						src={trip.images[0].src}
						alt={trip.images[0].alt}
						height={160}
					/>
				</Card.Section>
			)}

			<Group justify="space-between" mt="md" mb="xs">
				<Text fw={500}>{trip.name}</Text>
				<Badge color={trip.stock_status === "instock" ? "green" : "red"}>
					{trip.stock_status === "instock" ? "Available" : "Sold Out"}
				</Badge>
			</Group>

			<Text size="sm" c="dimmed" lineClamp={2}>
				{trip.short_description}
			</Text>

			<Group mt="md" justify="space-between">
				<Text size="xl" fw={700} c="blue">
					£{trip.price}
				</Text>
				<Button component={Link} href={`/trips/${trip.slug}`} variant="light">
					View Details
				</Button>
			</Group>
		</Card>
	);
}
