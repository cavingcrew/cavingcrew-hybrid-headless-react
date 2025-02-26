import type { Route } from "../types/api";

// Challenge rating thresholds and weights
export const CHALLENGE_CONFIG = {
	thresholds: {
		claustrophobia: {
			green: 2.5, // 0-2.5 is Green
			amber: 6.5, // 2.5-6.5 is Amber
			// > 6.5 is Red
		},
		water: {
			green: 2.5, // 0-2.5 is Green
			amber: 6.5, // 2.5-6.5 is Amber
			// > 6.5 is Red
		},
		heights: {
			green: 2.5, // 0-2.5 is Green
			amber: 6.5, // 2.5-6.5 is Amber
			// > 6.5 is Red
		},
		hazard: {
			green: 2.5, // 0-2.5 is Green
			amber: 6.5, // 2.5-6.5 is Amber
			// > 6.5 is Red
		},
		endurance: {
			green: 2.5, // 0-2.5 is Green
			amber: 6.5, // 2.5-6.5 is Amber
			// > 6.5 is Red
		},
	},
	weights: {
		claustrophobia: {
			psychological: 0.33,
			objective: 0.67,
		},
		water: {
			wetness: 0.3,
			nearFace: 0.4,
			deepWater: 0.2,
			muddiness: 0.1,
		},
		heights: {
			exposure: 0.5,
			climbing: 0.5,
		},
		// Hazard is already out of 10, no weights needed
		// Endurance is a direct value (0-10 scale like others)
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

// Define the structure of the difficulty object
export interface DifficultyData {
	route_difficulty_psychological_claustrophobia?: string | number;
	route_difficulty_objective_tightness?: string | number;
	route_difficulty_wetness?: string | number;
	route_difficulty_water_near_face?: string | number;
	route_difficulty_exposure_to_deep_water?: string | number;
	route_difficulty_muddiness?: string | number;
	route_difficulty_exposure_to_heights?: string | number;
	route_difficulty_technical_climbing_difficulty?: string | number;
	route_difficulty_endurance?: string | number;
	route_difficulty_objective_hazard?: string | number;
	[key: string]: any; // For any other properties
}

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

export interface ChallengeMetricsResult {
	metrics: ChallengeMetric[];
	weightedRank: number;
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
	return Number.isNaN(numValue) ? null : numValue;
}

/**
 * Determines the challenge rating based on a score
 *
 * @param score - The challenge score (0-10)
 * @param domain - The challenge domain
 * @returns The challenge rating (green, amber, red, or na)
 */
export function getChallengeRating(score: number | null, domain: ChallengeDomain): ChallengeRating {
	if (score === null || score === 0) return "na";
	const thresholds = CHALLENGE_CONFIG.thresholds[domain];
	// Check if score is greater than 0 and less than or equal to green threshold
	if (score > 0 && score <= thresholds.green) return "green";
	// Check if score is greater than green threshold and less than or equal to amber threshold
	if (score > thresholds.green && score <= thresholds.amber) return "amber";
	// If score is greater than amber threshold
	if (score > thresholds.amber) return "red";
	return "na"; // Fallback
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
function calculateClaustrophobiaScore(difficulty: DifficultyData): {
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

	// Calculate weighted sum directly
	const weightedSum = details.reduce((sum, d) => sum + d.contribution, 0);


	const score = weightedSum ;

	return { score, details };
}

/**
 * Calculates the water score
 *
 * @param difficulty - The difficulty data
 * @returns The water score and details
 */
function calculateWaterScore(difficulty: DifficultyData): {
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

	// Calculate weighted sum directly
	const weightedSum = details.reduce((sum, d) => sum + d.contribution, 0);


	const score = weightedSum ;

	return { score, details };
}

/**
 * Calculates the heights score
 *
 * @param difficulty - The difficulty data
 * @returns The heights score and details
 */
function calculateHeightsScore(difficulty: DifficultyData): {
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

	// Calculate weighted sum directly
	const weightedSum = details.reduce((sum, d) => sum + d.contribution, 0);


	const score = weightedSum;

	return { score, details };
}

/**
 * Calculates the hazard score
 *
 * @param difficulty - The difficulty data
 * @returns The hazard score and details
 */
function calculateHazardScore(difficulty: DifficultyData): {
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


	const score = hazard !== null ? hazard : 0;

	return { score, details };
}

/**
 * Calculates the endurance score
 * 
 * Endurance is rated on the same 0-10 scale as other metrics
 *
 * @param difficulty - The difficulty data
 * @returns The endurance score and details
 */
function calculateEnduranceScore(difficulty: DifficultyData): {
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


	const score = endurance !== null ? endurance : 0;

	return { score, details };
}

/**
 * Extracts challenge metrics from route data
 *
 * @param routeData - The route data containing difficulty information
 * @returns An object with challenge metrics and weighted rank
 */
export function extractChallengeMetrics(
	routeData?: Route["acf"],
): ChallengeMetricsResult | null {
	if (!routeData?.route_difficulty) return null;

	const difficulty = routeData.route_difficulty as DifficultyData;

	// Calculate scores for each domain
	const claustrophobia = calculateClaustrophobiaScore(difficulty);
	const water = calculateWaterScore(difficulty);
	const heights = calculateHeightsScore(difficulty);
	const hazard = calculateHazardScore(difficulty);
	const endurance = calculateEnduranceScore(difficulty);

	// Create metrics array
	const metrics = [
		{
			domain: "claustrophobia" as const,
			label: "Claustrophobia",
			rating: getChallengeRating(claustrophobia.score, "claustrophobia"),
			score: claustrophobia.score,
			details: claustrophobia.details,
		},
		{
			domain: "water" as const,
			label: "Water",
			rating: getChallengeRating(water.score, "water"),
			score: water.score,
			details: water.details,
		},
		{
			domain: "heights" as const,
			label: "Heights",
			rating: getChallengeRating(heights.score, "heights"),
			score: heights.score,
			details: heights.details,
		},
		{
			domain: "hazard" as const,
			label: "Hazards",
			rating: getChallengeRating(hazard.score, "hazard"),
			score: hazard.score,
			details: hazard.details,
		},
		{
			domain: "endurance" as const,
			label: "Endurance",
			rating: getChallengeRating(endurance.score, "endurance"),
			score: endurance.score,
			details: endurance.details,
		},
	];

	// Calculate weighted rank (sum of all scores)
	const weightedRank = metrics.reduce((sum, metric) => sum + metric.score, 0);

	return {
		metrics,
		weightedRank,
	};
}

/**
 * Extracts difficulty metrics from route data (legacy function)
 *
 * @param routeData - The route data containing difficulty information
 * @returns An object with physical and psychological difficulty metrics
 */
export function extractDifficultyMetrics(routeData?: Route["acf"]) {
	if (!routeData?.route_difficulty) return null;

	const difficulty = routeData.route_difficulty as DifficultyData;

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
