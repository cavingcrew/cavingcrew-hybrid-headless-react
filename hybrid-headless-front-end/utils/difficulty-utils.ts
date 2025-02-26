import type { Route } from "../types/api";

// Challenge rating thresholds and weights
export const CHALLENGE_CONFIG = {
	thresholds: {
		green: 2.5, // 0-2.5 is Green
		amber: 6.5, // 2.5-6.5 is Amber
		// > 6.5 is Red
	},
	weights: {
		claustrophobia: {
			psychological: 0.33,
			objective: 0.67,
		},
		water: {
			wetness: 0.33,
			nearFace: 0.4,
			deepWater: 0.2,
			muddiness: 0.07,
		},
		heights: {
			exposure: 0.5,
			climbing: 0.5,
		},
		// Hazard is already out of 10, no weights needed
		// Endurance is a direct value
	},
};

// Challenge rating types
export type ChallengeRating = "green" | "amber" | "red" | "na";
export type ChallengeDomain =
	| "claustrophobia"
	| "water"
	| "heights"
	| "hazard"
	| "endurance";

export interface ChallengeMetric {
	domain: ChallengeDomain;
	label: string;
	rating: ChallengeRating;
	score: number;
	details: Array<{
		key: string;
		label: string;
		value: number | null;
		weight: number;
		contribution: number;
	}>;
}

/**
 * Renders a difficulty value as a numeric value
 *
 * @param value - The difficulty value to parse
 * @returns The parsed numeric value or null if invalid
 */
export function parseDifficultyValue(
	value: string | number | null | undefined,
): number | null {
	if (value === null || value === undefined) return null;
	const numValue =
		typeof value === "string" ? Number.parseInt(value, 10) : value;
	return isNaN(numValue) ? null : numValue;
}

/**
 * Determines the challenge rating based on a score
 *
 * @param score - The challenge score (0-10)
 * @returns The challenge rating (green, amber, red, or na)
 */
export function getChallengeRating(score: number | null): ChallengeRating {
	if (score === null || score === 0) return "na";
	if (score <= CHALLENGE_CONFIG.thresholds.green) return "green";
	if (score <= CHALLENGE_CONFIG.thresholds.amber) return "amber";
	return "red";
}

/**
 * Gets the color for a challenge rating
 *
 * @param rating - The challenge rating
 * @returns The color for the rating
 */
export function getChallengeColor(rating: ChallengeRating): string {
	switch (rating) {
		case "green":
			return "#4caf50";
		case "amber":
			return "#ff9800";
		case "red":
			return "#f44336";
		case "na":
			return "#9e9e9e";
	}
}

/**
 * Calculates the claustrophobia score
 *
 * @param difficulty - The difficulty data
 * @returns The claustrophobia score and details
 */
function calculateClaustrophobiaScore(difficulty: any): {
	score: number;
	details: ChallengeMetric["details"];
} {
	const psychological = parseDifficultyValue(
		difficulty.route_difficulty_psychological_claustrophobia,
	);
	const objective = parseDifficultyValue(
		difficulty.route_difficulty_objective_tightness,
	);

	const details = [
		{
			key: "psychological",
			label: "Psychological Claustrophobia",
			value: psychological,
			weight: CHALLENGE_CONFIG.weights.claustrophobia.psychological,
			contribution:
				psychological !== null
					? psychological *
						CHALLENGE_CONFIG.weights.claustrophobia.psychological
					: 0,
		},
		{
			key: "objective",
			label: "Objective Tightness",
			value: objective,
			weight: CHALLENGE_CONFIG.weights.claustrophobia.objective,
			contribution:
				objective !== null
					? objective * CHALLENGE_CONFIG.weights.claustrophobia.objective
					: 0,
		},
	];

	// Calculate total score (out of 10)
	const validDetails = details.filter((d) => d.value !== null);
	if (validDetails.length === 0) return { score: 0, details };

	const totalWeight = validDetails.reduce((sum, d) => sum + d.weight, 0);
	const weightedSum = validDetails.reduce((sum, d) => sum + d.contribution, 0);

	// Normalize to a 0-10 scale
	const score = totalWeight > 0 ? (weightedSum / totalWeight) * 2 : 0;

	return { score, details };
}

/**
 * Calculates the water score
 *
 * @param difficulty - The difficulty data
 * @returns The water score and details
 */
function calculateWaterScore(difficulty: any): {
	score: number;
	details: ChallengeMetric["details"];
} {
	const wetness = parseDifficultyValue(difficulty.route_difficulty_wetness);
	const nearFace = parseDifficultyValue(
		difficulty.route_difficulty_water_near_face,
	);
	const deepWater = parseDifficultyValue(
		difficulty.route_difficulty_exposure_to_deep_water,
	);
	const muddiness = parseDifficultyValue(difficulty.route_difficulty_muddiness);

	const details = [
		{
			key: "wetness",
			label: "Wetness",
			value: wetness,
			weight: CHALLENGE_CONFIG.weights.water.wetness,
			contribution:
				wetness !== null ? wetness * CHALLENGE_CONFIG.weights.water.wetness : 0,
		},
		{
			key: "nearFace",
			label: "Water Near Face",
			value: nearFace,
			weight: CHALLENGE_CONFIG.weights.water.nearFace,
			contribution:
				nearFace !== null
					? nearFace * CHALLENGE_CONFIG.weights.water.nearFace
					: 0,
		},
		{
			key: "deepWater",
			label: "Deep Water Exposure",
			value: deepWater,
			weight: CHALLENGE_CONFIG.weights.water.deepWater,
			contribution:
				deepWater !== null
					? deepWater * CHALLENGE_CONFIG.weights.water.deepWater
					: 0,
		},
		{
			key: "muddiness",
			label: "Muddiness",
			value: muddiness,
			weight: CHALLENGE_CONFIG.weights.water.muddiness,
			contribution:
				muddiness !== null
					? muddiness * CHALLENGE_CONFIG.weights.water.muddiness
					: 0,
		},
	];

	// Calculate total score (out of 10)
	const validDetails = details.filter((d) => d.value !== null);
	if (validDetails.length === 0) return { score: 0, details };

	const totalWeight = validDetails.reduce((sum, d) => sum + d.weight, 0);
	const weightedSum = validDetails.reduce((sum, d) => sum + d.contribution, 0);

	// Normalize to a 0-10 scale
	const score = totalWeight > 0 ? (weightedSum / totalWeight) * 2 : 0;

	return { score, details };
}

/**
 * Calculates the heights score
 *
 * @param difficulty - The difficulty data
 * @returns The heights score and details
 */
function calculateHeightsScore(difficulty: any): {
	score: number;
	details: ChallengeMetric["details"];
} {
	const exposure = parseDifficultyValue(
		difficulty.route_difficulty_exposure_to_heights,
	);
	const climbing = parseDifficultyValue(
		difficulty.route_difficulty_technical_climbing_difficulty,
	);

	const details = [
		{
			key: "exposure",
			label: "Exposure to Heights",
			value: exposure,
			weight: CHALLENGE_CONFIG.weights.heights.exposure,
			contribution:
				exposure !== null
					? exposure * CHALLENGE_CONFIG.weights.heights.exposure
					: 0,
		},
		{
			key: "climbing",
			label: "Technical Climbing",
			value: climbing,
			weight: CHALLENGE_CONFIG.weights.heights.climbing,
			contribution:
				climbing !== null
					? climbing * CHALLENGE_CONFIG.weights.heights.climbing
					: 0,
		},
	];

	// Calculate total score (out of 10)
	const validDetails = details.filter((d) => d.value !== null);
	if (validDetails.length === 0) return { score: 0, details };

	const totalWeight = validDetails.reduce((sum, d) => sum + d.weight, 0);
	const weightedSum = validDetails.reduce((sum, d) => sum + d.contribution, 0);

	// Normalize to a 0-10 scale
	const score = totalWeight > 0 ? (weightedSum / totalWeight) * 2 : 0;

	return { score, details };
}

/**
 * Calculates the hazard score
 *
 * @param difficulty - The difficulty data
 * @returns The hazard score and details
 */
function calculateHazardScore(difficulty: any): {
	score: number;
	details: ChallengeMetric["details"];
} {
	const hazard = parseDifficultyValue(
		difficulty.route_difficulty_objective_hazard,
	);

	const details = [
		{
			key: "hazard",
			label: "Objective Hazards",
			value: hazard,
			weight: 1,
			contribution: hazard !== null ? hazard : 0,
		},
	];

	// Hazard is already on a 0-5 scale, multiply by 2 to get 0-10
	const score = hazard !== null ? hazard * 2 : 0;

	return { score, details };
}

/**
 * Calculates the endurance score
 *
 * @param difficulty - The difficulty data
 * @returns The endurance score and details
 */
function calculateEnduranceScore(difficulty: any): {
	score: number;
	details: ChallengeMetric["details"];
} {
	const endurance = parseDifficultyValue(difficulty.route_difficulty_endurance);

	const details = [
		{
			key: "endurance",
			label: "Physical Endurance",
			value: endurance,
			weight: 1,
			contribution: endurance !== null ? endurance : 0,
		},
	];

	// Endurance is already on a 0-5 scale, multiply by 2 to get 0-10
	const score = endurance !== null ? endurance * 2 : 0;

	return { score, details };
}

/**
 * Extracts challenge metrics from route data
 *
 * @param routeData - The route data containing difficulty information
 * @returns An object with challenge metrics
 */
export function extractChallengeMetrics(
	routeData?: Route["acf"],
): ChallengeMetric[] | null {
	if (!routeData?.route_difficulty) return null;

	const difficulty = routeData.route_difficulty as any;

	// Calculate scores for each domain
	const claustrophobia = calculateClaustrophobiaScore(difficulty);
	const water = calculateWaterScore(difficulty);
	const heights = calculateHeightsScore(difficulty);
	const hazard = calculateHazardScore(difficulty);
	const endurance = calculateEnduranceScore(difficulty);

	return [
		{
			domain: "claustrophobia",
			label: "Claustrophobia",
			rating: getChallengeRating(claustrophobia.score),
			score: claustrophobia.score,
			details: claustrophobia.details,
		},
		{
			domain: "water",
			label: "Water",
			rating: getChallengeRating(water.score),
			score: water.score,
			details: water.details,
		},
		{
			domain: "heights",
			label: "Heights",
			rating: getChallengeRating(heights.score),
			score: heights.score,
			details: heights.details,
		},
		{
			domain: "hazard",
			label: "Hazards",
			rating: getChallengeRating(hazard.score),
			score: hazard.score,
			details: hazard.details,
		},
		{
			domain: "endurance",
			label: "Endurance",
			rating: getChallengeRating(endurance.score),
			score: endurance.score,
			details: endurance.details,
		},
	];
}

/**
 * Extracts difficulty metrics from route data (legacy function)
 *
 * @param routeData - The route data containing difficulty information
 * @returns An object with physical and psychological difficulty metrics
 */
export function extractDifficultyMetrics(routeData?: Route["acf"]) {
	if (!routeData?.route_difficulty) return null;

	const difficulty = routeData.route_difficulty as any;

	return {
		physical: [
			{
				key: "route_difficulty_endurance",
				label: "Physical Endurance",
				color: "green",
				value: parseDifficultyValue(difficulty.route_difficulty_endurance),
			},
			{
				key: "route_difficulty_technical_climbing_difficulty",
				label: "Technical Climbing",
				color: "pink",
				value: parseDifficultyValue(
					difficulty.route_difficulty_technical_climbing_difficulty,
				),
			},
			{
				key: "route_difficulty_muddiness",
				label: "Muddiness",
				color: "brown",
				value: parseDifficultyValue(difficulty.route_difficulty_muddiness),
			},
		],
		psychological: [
			{
				key: "route_difficulty_psychological_claustrophobia",
				label: "Claustrophobia",
				color: "orange",
				value: parseDifficultyValue(
					difficulty.route_difficulty_psychological_claustrophobia,
				),
			},
			{
				key: "route_difficulty_objective_tightness",
				label: "Tightness",
				color: "red",
				value: parseDifficultyValue(
					difficulty.route_difficulty_objective_tightness,
				),
			},
		],
		environmental: [
			{
				key: "route_difficulty_wetness",
				label: "Wetness",
				color: "blue",
				value: parseDifficultyValue(difficulty.route_difficulty_wetness),
			},
			{
				key: "route_difficulty_water_near_face",
				label: "Water Near Face",
				color: "cyan",
				value: parseDifficultyValue(
					difficulty.route_difficulty_water_near_face,
				),
			},
			{
				key: "route_difficulty_exposure_to_deep_water",
				label: "Deep Water Exposure",
				color: "indigo",
				value: parseDifficultyValue(
					difficulty.route_difficulty_exposure_to_deep_water,
				),
			},
			{
				key: "route_difficulty_exposure_to_heights",
				label: "Height Exposure",
				color: "grape",
				value: parseDifficultyValue(
					difficulty.route_difficulty_exposure_to_heights,
				),
			},
			{
				key: "route_difficulty_objective_hazard",
				label: "Objective Hazards",
				color: "yellow",
				value: parseDifficultyValue(
					difficulty.route_difficulty_objective_hazard,
				),
			},
		],
	};
}
