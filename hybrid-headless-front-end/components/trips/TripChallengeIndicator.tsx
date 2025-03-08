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
	type ChallengeRating,
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

// Helper function to consistently map rating to color
function getRatingColor(rating: ChallengeRating): string {
	switch (rating) {
		case "green":
			return "green";
		case "amber":
			return "yellow";
		case "red":
			return "red";
		default:
			return "gray";
	}
}

// Component to render the details of a challenge metric
function ChallengeDetails({ metric }: { metric: ChallengeMetric }) {
	// Get description based on the metric domain and detail key
	const getMetricDescription = (domain: ChallengeDomain, key: string) => {
		switch (domain) {
			case "claustrophobia":
				if (key === "psychological") {
					return "How tight and psychologically challenging passages feel. Includes creepy crawlies.";
				}
				if (key === "objective") {
					return "The actual relative width of the tightest mandatory section you must pass through.";
				}
				break;
			case "water":
				if (key === "wetness") {
					return "The general level of how wet you're likely to be at the end of the trip.";
				}
				if (key === "nearFace") {
					return "How close water will come to your face - affects breathing comfort and psychological challenge.";
				}
				if (key === "deepWater") {
					return "Exposure to deep water - includes over thigh depth water and shallower very swiftly moving water";
				}
				if (key === "muddiness") {
					return "The relative amount of standard mud you'll encounter";
				}
				break;
			case "heights":
				if (key === "exposure") {
					return "The psychological impact of height exposure - includes both roped and unroped sections with drops.";
				}
				if (key === "climbing") {
					return "The technical difficulty of the most challenging mandatory climbing section.";
				}
				break;
			case "hazard":
				return "The objective level of hazard including from the most isolated point.";
			case "endurance":
				return "How physically demanding the trip is - considers length, difficulty of movement, and overall exertion required.";
		}
		return "";
	};

	// Get overall domain description
	const getDomainDescription = (domain: ChallengeDomain) => {
		switch (domain) {
			case "claustrophobia":
				return "How confined and tight the cave passages are, both physically and psychologically.";
			case "water":
				return "The presence and challenge of water throughout the cave system.";
			case "heights":
				return "Exposure to drops, climbs, and vertical sections within the cave.";
			case "hazard":
				return "Objective dangers present in the cave environment that require awareness and management.";
			case "endurance":
				return "The physical stamina and energy required to complete the trip.";
		}
	};

	return (
		<Stack gap="md">
			<Text size="sm" c="dimmed" mb="md">
				{getDomainDescription(metric.domain)}
			</Text>

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
							{detail.value !== null
								? metric.domain === "endurance" && detail.key === "endurance"
									? `${detail.value} (open scale)`
									: `${detail.value}/10`
								: "N/A"}
						</Text>
					</Group>
					{detail.value !== null && (
						<Progress
							value={
								metric.domain === "endurance" && detail.key === "endurance"
									? Math.min(detail.value * 10, 100) // Cap at 100% for endurance
									: detail.value * 10
							}
							color={
								detail.value <= 2.5
									? "green"
									: detail.value <= 6.5
										? "yellow"
										: "red"
							}
							size="sm"
							radius="xl"
						/>
					)}
					<Text size="xs" c="dimmed" mt={5}>
						{getMetricDescription(metric.domain, detail.key)}
					</Text>
				</Box>
			))}

			<Box>
				<Text size="sm" fw={500}>
					Weighted Score:{" "}
					{metric.domain === "endurance"
						? `${metric.score.toFixed(1)} (open scale)`
						: `${metric.score.toFixed(1)}/10`}
				</Text>
				<Progress
					value={
						metric.domain === "endurance"
							? Math.min(metric.score * 10, 100) // Cap at 100% for display
							: metric.score * 10
					}
					color={getRatingColor(metric.rating)}
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
			<Box
				style={{
					position: "relative",
					width: "100%",
					maxWidth: 350,
					margin: "0 auto",
					aspectRatio: "1/1",
					marginTop: -10,
				}}
			>
				<style>
					{`
						.challenge-segment:hover {
							filter: brightness(1.1);
							transition: filter 0.3s ease;
						}
						`}
				</style>
				{/* SVG for the circular indicator */}
				<svg
					viewBox="0 0 100 100"
					style={{ width: "100%", height: "100%" }}
					role="img"
					aria-labelledby="challenge-chart-title"
				>
					<title id="challenge-chart-title">Cave challenge rating chart</title>
					{/* Heights (Top Quadrant - 315° to 45°) */}
					<path
						d="M50,50 L71,29 A30,30 0 0,0 29,29 L50,50 Z"
						fill={getDomainColor("heights")}
						stroke={theme.colors.gray[3]}
						strokeWidth="0.5"
						onClick={() => handleSegmentClick("heights")}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleSegmentClick("heights");
							}
						}}
						tabIndex={0}
						role="button"
						aria-label="Heights rating"
						style={{ cursor: "pointer" }}
						className="challenge-segment"
					>
						<animate
							attributeName="opacity"
							values="1;0.8;1"
							dur="2s"
							begin="mouseover"
							repeatCount="indefinite"
						/>
						<animate
							attributeName="stroke-width"
							values="0.5;1.5;0.5"
							dur="2s"
							begin="mouseover"
							repeatCount="indefinite"
						/>
					</path>
					<text
						x="50"
						y="30"
						textAnchor="middle"
						fill="#fff"
						fontSize="6"
						fontWeight="bold"
						pointerEvents="none"
					>
						Heights
					</text>

					{/* Hazards (Right Quadrant - 45° to 135°) */}
					<path
						d="M50,50 L71,71 A30,30 0 0,0 71,29 L50,50 Z"
						fill={getDomainColor("hazard")}
						stroke={theme.colors.gray[3]}
						strokeWidth="0.5"
						onClick={() => handleSegmentClick("hazard")}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleSegmentClick("hazard");
							}
						}}
						tabIndex={0}
						role="button"
						aria-label="Hazards rating"
						style={{ cursor: "pointer" }}
						className="challenge-segment"
					>
						<animate
							attributeName="opacity"
							values="1;0.8;1"
							dur="2s"
							begin="mouseover"
							repeatCount="indefinite"
						/>
						<animate
							attributeName="stroke-width"
							values="0.5;1.5;0.5"
							dur="2s"
							begin="mouseover"
							repeatCount="indefinite"
						/>
					</path>
					<text
						x="70"
						y="50"
						textAnchor="middle"
						fill="#fff"
						fontSize="6"
						fontWeight="bold"
						pointerEvents="none"
						transform="rotate(90, 70, 50)"
					>
						Hazards
					</text>

					{/* Water (Bottom Quadrant - 135° to 225°) */}
					<path
						d="M50,50 L29,71 A30,30 0 0,0 71,71 L50,50 Z"
						fill={getDomainColor("water")}
						stroke={theme.colors.gray[3]}
						strokeWidth="0.5"
						onClick={() => handleSegmentClick("water")}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleSegmentClick("water");
							}
						}}
						tabIndex={0}
						role="button"
						aria-label="Water rating"
						style={{ cursor: "pointer" }}
						className="challenge-segment"
					>
						<animate
							attributeName="opacity"
							values="1;0.8;1"
							dur="2s"
							begin="mouseover"
							repeatCount="indefinite"
						/>
						<animate
							attributeName="stroke-width"
							values="0.5;1.5;0.5"
							dur="2s"
							begin="mouseover"
							repeatCount="indefinite"
						/>
					</path>
					<text
						x="50"
						y="73"
						textAnchor="middle"
						fill="#fff"
						fontSize="6"
						fontWeight="bold"
						pointerEvents="none"
					>
						Water
					</text>

					{/* Claustrophobia (Left Quadrant - 225° to 315°) */}
					<path
						d="M50,50 L29,29 A30,30 0 0,0 29,71 L50,50 Z"
						fill={getDomainColor("claustrophobia")}
						stroke={theme.colors.gray[3]}
						strokeWidth="0.5"
						onClick={() => handleSegmentClick("claustrophobia")}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleSegmentClick("claustrophobia");
							}
						}}
						tabIndex={0}
						role="button"
						aria-label="Claustrophobia rating"
						style={{ cursor: "pointer" }}
						className="challenge-segment"
					>
						<animate
							attributeName="opacity"
							values="1;0.8;1"
							dur="2s"
							begin="mouseover"
							repeatCount="indefinite"
						/>
						<animate
							attributeName="stroke-width"
							values="0.5;1.5;0.5"
							dur="2s"
							begin="mouseover"
							repeatCount="indefinite"
						/>
					</path>
					<text
						x="30"
						y="50"
						textAnchor="middle"
						fill="#fff"
						fontSize="6"
						fontWeight="bold"
						pointerEvents="none"
						transform="rotate(270, 30, 50)"
					>
						Tight
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
							if (e.key === "Enter" || e.key === " ") {
								handleSegmentClick("endurance");
							}
						}}
						tabIndex={0}
						role="button"
						aria-label="Endurance rating"
						style={{ cursor: "pointer" }}
						className="challenge-segment"
					>
						<animate
							attributeName="opacity"
							values="1;0.8;1"
							dur="2s"
							begin="mouseover"
							repeatCount="indefinite"
						/>
						<animate
							attributeName="stroke-width"
							values="0.5;1.5;0.5"
							dur="2s"
							begin="mouseover"
							repeatCount="indefinite"
						/>
					</circle>
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
						bottom: -30,
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
						<Text size="xs">Hard</Text>
					</Group>
				</Box>
			</Box>

			<Text size="sm" c="dimmed" ta="center" mt={30}>
				{weightedRank !== undefined && (
					<Text size="sm" c="dimmed" mt={5}>
						Overall Difficulty: {weightedRank.toFixed(1)}
					</Text>
				)}
			</Text>

			{/* Modal for detailed breakdown */}
			<Modal
				opened={selectedMetric !== null}
				onClose={() => setSelectedMetric(null)}
				title={
					selectedMetric && (
						<Group gap="xs">
							<ThemeIcon
								variant="light"
								color={getRatingColor(selectedMetric.rating)}
								size="lg"
							>
								<DomainIcon domain={selectedMetric.domain} />
							</ThemeIcon>
							<div>
								<Text fw={700} size="lg">
									{selectedMetric.label}
								</Text>
								<Text size="sm" c="dimmed">
									Overall Rating:{" "}
									<Text span fw={700} c={getRatingColor(selectedMetric.rating)}>
										{selectedMetric.rating === "na"
											? "N/A"
											: selectedMetric.rating.charAt(0).toUpperCase() +
												selectedMetric.rating.slice(1)}
									</Text>
								</Text>
							</div>
						</Group>
					)
				}
				size="lg"
			>
				{selectedMetric && <ChallengeDetails metric={selectedMetric} />}
			</Modal>
		</>
	);
}
