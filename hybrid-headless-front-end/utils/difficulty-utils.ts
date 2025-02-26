import { Route } from "../types/api";

/**
 * Renders a difficulty value as a numeric value
 * 
 * @param value - The difficulty value to parse
 * @returns The parsed numeric value or null if invalid
 */
export function parseDifficultyValue(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined) return null;
  const numValue = typeof value === "string" ? Number.parseInt(value, 10) : value;
  return isNaN(numValue) ? null : numValue;
}

/**
 * Extracts difficulty metrics from route data
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
        value: parseDifficultyValue(difficulty.route_difficulty_endurance)
      },
      { 
        key: "route_difficulty_technical_climbing_difficulty", 
        label: "Technical Climbing", 
        color: "pink",
        value: parseDifficultyValue(difficulty.route_difficulty_technical_climbing_difficulty)
      },
      { 
        key: "route_difficulty_muddiness", 
        label: "Muddiness", 
        color: "brown",
        value: parseDifficultyValue(difficulty.route_difficulty_muddiness)
      },
    ],
    psychological: [
      { 
        key: "route_difficulty_psychological_claustrophobia", 
        label: "Claustrophobia", 
        color: "orange",
        value: parseDifficultyValue(difficulty.route_difficulty_psychological_claustrophobia)
      },
      { 
        key: "route_difficulty_objective_tightness", 
        label: "Tightness", 
        color: "red",
        value: parseDifficultyValue(difficulty.route_difficulty_objective_tightness)
      },
    ],
    environmental: [
      { 
        key: "route_difficulty_wetness", 
        label: "Wetness", 
        color: "blue",
        value: parseDifficultyValue(difficulty.route_difficulty_wetness)
      },
      { 
        key: "route_difficulty_water_near_face", 
        label: "Water Near Face", 
        color: "cyan",
        value: parseDifficultyValue(difficulty.route_difficulty_water_near_face)
      },
      { 
        key: "route_difficulty_exposure_to_deep_water", 
        label: "Deep Water Exposure", 
        color: "indigo",
        value: parseDifficultyValue(difficulty.route_difficulty_exposure_to_deep_water)
      },
      { 
        key: "route_difficulty_exposure_to_heights", 
        label: "Height Exposure", 
        color: "grape",
        value: parseDifficultyValue(difficulty.route_difficulty_exposure_to_heights)
      },
      { 
        key: "route_difficulty_objective_hazard", 
        label: "Objective Hazards", 
        color: "yellow",
        value: parseDifficultyValue(difficulty.route_difficulty_objective_hazard)
      },
    ]
  };
}
