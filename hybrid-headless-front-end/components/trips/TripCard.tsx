"use client";

import { Badge, Card, Group, Image, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import type { Trip } from "../../types/api";

interface TripCardProps {
	trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
	const router = useRouter();

	return (
		<Link 
			href={`/trips/${trip.slug}`}
			prefetch={true}
			style={{ textDecoration: 'none', color: 'inherit' }}
		>
			<Card
				shadow="sm"
				padding="lg"
				radius="md"
				withBorder
				style={{
					textDecoration: "none",
					color: "inherit",
					cursor: "pointer",
				}}
			>
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
				{trip.acf.event_description || "No description available"}
			</Text>

			<Group mt="md" justify="space-between">
				<Text size="xl" fw={700} c="blue">
					£{trip.acf.event_cost || trip.price}
				</Text>
			</Group>
		</Card>
	);
}
