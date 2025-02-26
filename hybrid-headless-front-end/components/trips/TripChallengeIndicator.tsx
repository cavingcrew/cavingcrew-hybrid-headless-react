"use client";

import {
	Box,
	Group,
	Modal,
	Paper,
	Progress,
	Stack,
	Text,
	ThemeIcon,
	Title,
	useMantineTheme,
} from "@mantine/core";
import {
	IconAlertTriangle,
	IconArrowsVertical,
	IconDroplet,
	IconHeartRateMonitor,
	IconMountain,
} from "@tabler/icons-react";
import React, { useState } from "react";
import {
	type ChallengeDomain,
	type ChallengeMetric,
	getChallengeColor,
} from "../../utils/difficulty-utils";

interface TripChallengeIndicatorProps {
	metrics: ChallengeMetric[];
}

interface DomainIconProps {
	domain: ChallengeDomain;
	size?: number;
}

// Component to render the appropriate icon for each domain
function DomainIcon({ domain, size = 18 }: DomainIconProps) {
	switch (domain) {
		case "claustrophobia":
			return <IconArrowsVertical size={size} />;
		case "water":
			return <IconDroplet size={size} />;
		case "heights":
			return <IconMountain size={size} />;
		case "hazard":
			return <IconAlertTriangle size={size} />;
		case "endurance":
			return <IconHeartRateMonitor size={size} />;
	}
}

// Component to render the details of a challenge metric
function ChallengeDetails({ metric }: { metric: ChallengeMetric }) {
	return (
		<Stack gap="md">
			<Group gap="xs">
				<ThemeIcon
					variant="light"
					color={metric.rating === "na" ? "gray" : metric.rating}
					size="lg"
				>
					<DomainIcon domain={metric.domain} />
				</ThemeIcon>
				<div>
					<Text fw={700} size="lg">
						{metric.label}
					</Text>
					<Text size="sm" c="dimmed">
						Overall Rating:{" "}
						<Text
							span
							fw={700}
							c={metric.rating === "na" ? "gray" : metric.rating}
						>
							{metric.rating === "na"
								? "N/A"
								: metric.rating.charAt(0).toUpperCase() +
									metric.rating.slice(1)}
						</Text>
					</Text>
				</div>
			</Group>

			{metric.details.map((detail) => (
				<Box key={detail.key} mb="xs">
					<Group justify="space-between" mb={5}>
						<Text size="sm">
							{detail.label}{" "}
							<Text span size="xs" c="dimmed">
								(weight: {Math.round(detail.weight * 100)}%)
							</Text>
						</Text>
						<Text size="sm" fw={500}>
							{detail.value !== null ? `${detail.value * 2}/10` : "N/A"}
						</Text>
					</Group>
					{detail.value !== null && (
						<Progress
							value={detail.value * 10}
							color={
								detail.value * 2 <= 2.5
									? "green"
									: detail.value * 2 <= 6.5
										? "yellow"
										: "red"
							}
							size="sm"
							radius="xl"
						/>
					)}
				</Box>
			))}

			<Box>
				<Text size="sm" fw={500}>
					Weighted Score: {metric.score.toFixed(1)}/10
				</Text>
				<Progress
					value={metric.score * 10}
					color={metric.rating === "na" ? "gray" : metric.rating}
					size="md"
					radius="xl"
					mt={5}
				/>
			</Box>
		</Stack>
	);
}

interface TripChallengeIndicatorProps {
	metrics: ChallengeMetric[];
	weightedRank?: number;
}

export function TripChallengeIndicator({
	metrics,
	weightedRank,
}: TripChallengeIndicatorProps) {
	const theme = useMantineTheme();
	const [selectedMetric, setSelectedMetric] = useState<ChallengeMetric | null>(
		null,
	);

	// Find the metric for each domain
	const claustrophobia = metrics.filter(
		(m) => m.domain === "claustrophobia",
	)[0];
	const water = metrics.filter((m) => m.domain === "water")[0];
	const heights = metrics.filter((m) => m.domain === "heights")[0];
	const hazard = metrics.filter((m) => m.domain === "hazard")[0];
	const endurance = metrics.filter((m) => m.domain === "endurance")[0];

	// Helper function to get color for a domain
	const getDomainColor = (domain: ChallengeDomain) => {
		const metric = metrics.filter((m) => m.domain === domain)[0];
		return metric ? getChallengeColor(metric.rating) : "#9e9e9e";
	};

	// Helper function to handle segment click
	const handleSegmentClick = (domain: ChallengeDomain) => {
		const metric = metrics.filter((m) => m.domain === domain)[0];
		if (metric) {
			setSelectedMetric(metric);
		}
	};

	return (
		<>
			<Paper withBorder p="md" radius="md">
				<Title order={4} mb="md" ta="center">
					Challenge Rating
					{weightedRank !== undefined && (
						<Text size="sm" c="dimmed" mt={5}>
							Overall Difficulty: {weightedRank.toFixed(1)}/50
						</Text>
					)}
				</Title>

				<Box
					style={{
						position: "relative",
						width: "100%",
						maxWidth: 400,
						margin: "0 auto",
						aspectRatio: "1/1",
					}}
				>
					{/* SVG for the circular indicator */}
					<svg 
						viewBox="0 0 100 100" 
						style={{ width: "100%", height: "100%" }}
						role="img"
						aria-labelledby="challenge-chart-title"
					>
						<title id="challenge-chart-title">Cave challenge rating chart</title>
						{/* Claustrophobia (Left Quarter) */}
						<path
							d="M50,50 L20,50 A30,30 0 0,1 29.3,29.3 L50,50 Z"
							fill={getDomainColor("claustrophobia")}
							stroke={theme.colors.gray[3]}
							strokeWidth="0.5"
							onClick={() => handleSegmentClick("claustrophobia")}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleSegmentClick("claustrophobia");
								}
							}}
							tabIndex={0}
							role="button"
							aria-label="Claustrophobia rating"
							style={{ cursor: "pointer" }}
						/>
						<text
							x="30"
							y="40"
							textAnchor="middle"
							fill="#fff"
							fontSize="6"
							fontWeight="bold"
							pointerEvents="none"
						>
							Tight
						</text>

						{/* Heights (Top Quarter) */}
						<path
							d="M50,50 L29.3,29.3 A30,30 0 0,1 50,20 L50,50 Z"
							fill={getDomainColor("heights")}
							stroke={theme.colors.gray[3]}
							strokeWidth="0.5"
							onClick={() => handleSegmentClick("heights")}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleSegmentClick("heights");
								}
							}}
							tabIndex={0}
							role="button"
							aria-label="Heights rating"
							style={{ cursor: "pointer" }}
						/>
						<text
							x="40"
							y="30"
							textAnchor="middle"
							fill="#fff"
							fontSize="6"
							fontWeight="bold"
							pointerEvents="none"
						>
							Heights
						</text>

						{/* Hazard (Right Quarter) */}
						<path
							d="M50,50 L50,20 A30,30 0 0,1 70.7,29.3 L50,50 Z"
							fill={getDomainColor("hazard")}
							stroke={theme.colors.gray[3]}
							strokeWidth="0.5"
							onClick={() => handleSegmentClick("hazard")}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleSegmentClick("hazard");
								}
							}}
							tabIndex={0}
							role="button"
							aria-label="Hazards rating"
							style={{ cursor: "pointer" }}
						/>
						<text
							x="60"
							y="30"
							textAnchor="middle"
							fill="#fff"
							fontSize="6"
							fontWeight="bold"
							pointerEvents="none"
						>
							Hazards
						</text>

						{/* Water (Bottom Right Quarter) */}
						<path
							d="M50,50 L70.7,29.3 A30,30 0 0,1 80,50 L50,50 Z"
							fill={getDomainColor("water")}
							stroke={theme.colors.gray[3]}
							strokeWidth="0.5"
							onClick={() => handleSegmentClick("water")}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleSegmentClick("water");
								}
							}}
							tabIndex={0}
							role="button"
							aria-label="Water rating"
							style={{ cursor: "pointer" }}
						/>
						<text
							x="65"
							y="65"
							textAnchor="middle"
							fill="#fff"
							fontSize="6"
							fontWeight="bold"
							pointerEvents="none"
						>
							Water
						</text>

						{/* Endurance (Center) */}
						<circle
							cx="50"
							cy="50"
							r="15"
							fill={getDomainColor("endurance")}
							stroke={theme.colors.gray[3]}
							strokeWidth="0.5"
							onClick={() => handleSegmentClick("endurance")}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleSegmentClick("endurance");
								}
							}}
							tabIndex={0}
							role="button"
							aria-label="Endurance rating"
							style={{ cursor: "pointer" }}
						/>
						<text
							x="50"
							y="52"
							textAnchor="middle"
							fill="#fff"
							fontSize="5"
							fontWeight="bold"
							pointerEvents="none"
						>
							Endurance
						</text>
					</svg>

					{/* Legend */}
					<Box
						style={{
							position: "absolute",
							bottom: -40,
							left: 0,
							right: 0,
							display: "flex",
							justifyContent: "center",
							gap: 10,
						}}
					>
						<Group gap={5}>
							<Box
								style={{
									width: 12,
									height: 12,
									backgroundColor: getChallengeColor("green"),
									borderRadius: "50%",
								}}
							/>
							<Text size="xs">Easy</Text>
						</Group>
						<Group gap={5}>
							<Box
								style={{
									width: 12,
									height: 12,
									backgroundColor: getChallengeColor("amber"),
									borderRadius: "50%",
								}}
							/>
							<Text size="xs">Moderate</Text>
						</Group>
						<Group gap={5}>
							<Box
								style={{
									width: 12,
									height: 12,
									backgroundColor: getChallengeColor("red"),
									borderRadius: "50%",
								}}
							/>
							<Text size="xs">Challenging</Text>
						</Group>
					</Box>
				</Box>

				<Text size="sm" c="dimmed" ta="center" mt={50}>
					Click on any section for detailed breakdown
				</Text>
			</Paper>

			{/* Modal for detailed breakdown */}
			<Modal
				opened={selectedMetric !== null}
				onClose={() => setSelectedMetric(null)}
				title={
					<Group>
						<ThemeIcon
							variant="light"
							color={
								selectedMetric?.rating === "na"
									? "gray"
									: selectedMetric?.rating
							}
							size="lg"
						>
							{selectedMetric && <DomainIcon domain={selectedMetric.domain} />}
						</ThemeIcon>
						<Text>{selectedMetric?.label} Challenge Details</Text>
					</Group>
				}
				size="lg"
			>
				{selectedMetric && <ChallengeDetails metric={selectedMetric} />}
			</Modal>
		</>
	);
}
