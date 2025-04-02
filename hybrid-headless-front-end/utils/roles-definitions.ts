export type VolunteerRole = {
  value: string;
  label: string;
  description?: string;
  category: 'event_management' | 'logistics' | 'safety' | 'hospitality' | 'promotion';
  requiredPermissions?: ('admin' | 'trip_leader' | 'committee')[];
  icon?: string; // For future UI icons
};

export const VOLUNTEER_ROLES: VolunteerRole[] = [
  {
    value: "none",
    label: "No Role",
    category: 'event_management',
    description: "No assigned responsibilities"
  },
  {
    value: "trip_director",
    label: "Trip Director",
    category: 'event_management',
    description: "Overall responsibility for trip organization and safety",
    requiredPermissions: ['admin', 'committee']
  },
  {
    value: "event_assistant",
    label: "Event Assistant",
    category: 'event_management',
    description: "Supports the trip director with organizational tasks"
  },
  {
    value: "lift_coordinator",
    label: "Lift Coordinator",
    category: 'logistics',
    description: "Organizes car sharing and transportation logistics",
    requiredPermissions: ['admin', 'committee', 'trip_leader']
  },
  {
    value: "climbing_coordinator",
    label: "Climbing Coordinator",
    category: 'safety',
    description: "Manages climbing equipment and safety checks"
  },
  {
    value: "kit_coordinator",
    label: "Kit Coordinator",
    category: 'logistics',
    description: "Manages group equipment distribution and tracking"
  },
  {
    value: "buddy_coordinator",
    label: "Buddy Coordinator",
    category: 'safety',
    description: "Pairs up participants and ensures buddy system adherence"
  },
  {
    value: "postpromo1",
    label: "Post Promotion",
    category: 'promotion',
    description: "Documents and shares trip experiences on social media"
  },
  {
    value: "breakfast_marshal",
    label: "Breakfast Marshal",
    category: 'hospitality',
    description: "Organizes morning meals and kitchen cleanup"
  },
  {
    value: "lunch_marshal",
    label: "Lunch Marshal",
    category: 'hospitality',
    description: "Coordinates packed lunches and snacks"
  },
  {
    value: "covid_marshal",
    label: "COVID Marshal",
    category: 'safety',
    description: "Ensures health protocols are followed"
  },
  {
    value: "evening_meal_washingup_marshal",
    label: "Evening Meal/Washing Up Marshal",
    category: 'hospitality',
    description: "Manages dinner preparation and cleanup crew"
  },
  {
    value: "head_chef",
    label: "Head Chef",
    category: 'hospitality',
    description: "Leads meal planning and kitchen operations"
  },
  {
    value: "evening_meal_chef",
    label: "Evening Meal Chef",
    category: 'hospitality',
    description: "Prepares and coordinates the main evening meal"
  },
  {
    value: "lunch_breakfast_chef",
    label: "Lunch/Breakfast Chef",
    category: 'hospitality',
    description: "Handles morning and midday meal preparation"
  }
];

// Utility functions
export function getRoleDefinition(value: string): VolunteerRole | undefined {
  return VOLUNTEER_ROLES.find(role => role.value === value);
}

export function getRolesByCategory(category: VolunteerRole['category']): VolunteerRole[] {
  return VOLUNTEER_ROLES.filter(role => role.category === category);
}

export function getRoleLabel(value: string): string {
  return getRoleDefinition(value)?.label || value;
}
