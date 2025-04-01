import type { UserResponse, Trip, TripParticipantsResponse } from "../types/api";
import type { SkillCategory } from "./skill-definitions";
import { getSkillDefinition } from "./skill-definitions";

// User role type based on access levels
export type UserRole = 
  | 'guest'
  | 'member'
  | 'trip_leader'
  | 'committee_member'
  | 'admin'
  | 'super_admin';

// Competency levels for different caving skills
export type CompetencyLevel =
  | 'none'
  | 'basic'
  | 'intermediate'
  | 'advanced'
  | 'leader';

/**
 * Core user role verification functions
 */
export function getUserRole(user: UserResponse | null, accessLevel?: string): UserRole {
  if (!user || !user.isLoggedIn) return 'guest';
  if (accessLevel === 'super_admin') return 'super_admin';
  if (accessLevel === 'admin') return 'admin';
  if (user.user?.meta?.cc_committee_member === 'yes') return 'committee_member';
  return user.isMember ? 'member' : 'guest';
}

export function isLoggedIn(user: UserResponse | null): boolean {
  return !!user?.isLoggedIn;
}

export function isMember(user: UserResponse | null): boolean {
  return !!user?.isMember;
}

export function isCommitteeMember(user: UserResponse | null): boolean {
  return user?.user?.meta?.cc_committee_member === 'yes';
}

export function isSuperAdmin(accessLevel?: string): boolean {
  return accessLevel === 'super_admin';
}

export function isAdmin(accessLevel?: string): boolean {
  return accessLevel === 'admin' || accessLevel === 'super_admin';
}

/**
 * Trip-specific permissions
 */
export function isTripLeader(user: UserResponse | null, trip?: Trip): boolean {
  if (!user?.user || !trip) return false;
  const leaderNames = trip.acf.event_trip_leader?.split(/,\s*/) || [];
  return leaderNames.some(name => 
    name.toLowerCase() === `${user.user?.first_name?.toLowerCase() || ''} ${user.user?.last_name?.toLowerCase() || ''}`.trim()
  );
}

export function hasTripAdminAccess(
  user: UserResponse | null,
  trip?: Trip,
  accessLevel?: string
): boolean {
  return isAdmin(accessLevel) || 
         (!!trip && isTripLeader(user, trip));
}

export function canEditTrip(
  user: UserResponse | null, 
  trip?: Trip,
  accessLevel?: string
): boolean {
  return hasTripAdminAccess(user, trip, accessLevel) || isCommitteeMember(user);
}

/**
 * Competency checks
 */
export function hasCavingCompetency(
  user: UserResponse | null,
  category: SkillCategory,
  requiredLevel: CompetencyLevel
): boolean {
  if (!user?.user?.meta) return false;
  
  const skillKey = {
    horizontalSkills: 'skills-horizontal',
    srtSkills: 'skills-srt',
    leadingHorizontalSkills: 'skills-leading-horizontal',
    leadingSrtSkills: 'skills-leading-srt',
    leadingCoachingSkills: 'skills-leading-coaching'
  }[category];

  const userSkill = user.user.meta[skillKey];
  if (!userSkill) return false;

  const definition = getSkillDefinition(category, userSkill);
  if (!definition) return false;

  const levelOrder: Record<CompetencyLevel, number> = {
    none: 0,
    basic: 1,
    intermediate: 2,
    advanced: 3,
    leader: 4
  };

  // Convert definition label to lowercase and extract the level part
  const labelParts = definition.label.toLowerCase().split(' ');
  const definitionLevel = labelParts[labelParts.length - 1] as CompetencyLevel;
  
  return levelOrder[definitionLevel] >= levelOrder[requiredLevel];
}

/**
 * Special access permissions
 */
export function hasSensitiveAccess(
  user: UserResponse | null,
  trip?: Trip,
  accessLevel?: string
): boolean {
  return (!!trip && isTripLeader(user, trip)) || 
         isCommitteeMember(user) || 
         isAdmin(accessLevel) ||
         hasCavingCompetency(user, 'leadingHorizontalSkills', 'leader');
}

/**
 * Purchase/registration permissions
 */
export function canPurchaseTrip(
  user: UserResponse | null,
  trip?: Trip,
  accessLevel?: string
): boolean {
  if (!trip) return false;
  if (trip.acf.event_non_members_welcome === 'yes') return true;
  return isMember(user) || hasTripAdminAccess(user, trip, accessLevel);
}

/**
 * Determine if user can view participant details
 */
export function canViewParticipantDetails(
  user: UserResponse | null,
  trip?: Trip,
  accessLevel?: string
): boolean {
  return isLoggedIn(user) && (
    isMember(user) || 
    hasTripAdminAccess(user, trip, accessLevel) ||
    accessLevel === 'participant' ||
    accessLevel === 'event_role'
  );
}
