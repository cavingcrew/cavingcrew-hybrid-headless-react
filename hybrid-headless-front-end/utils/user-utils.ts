import type { UserResponse, Trip } from "../types/api";
import type { SkillCategory } from "./skill-definitions";
import { getSkillDefinition } from "./skill-definitions";

// Access level type from API
export type AccessLevel = 
  | "public" 
  | "logged_in" 
  | "participant" 
  | "event_role" 
  | "admin" 
  | "super_admin";

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
 * Centralized Auth object for all authentication and authorization functions
 */
export const Auth = {
  /**
   * Core user role verification functions
   */
  getRole(user: UserResponse | null, accessLevel?: AccessLevel | string): UserRole {
    if (!user || !user.isLoggedIn) return 'guest';
    if (accessLevel === 'super_admin') return 'super_admin';
    if (accessLevel === 'admin') return 'admin';
    if (user.user?.meta?.cc_committee_member === 'yes') return 'committee_member';
    return user.isMember ? 'member' : 'guest';
  },

  isLoggedIn(user: UserResponse | null): boolean {
    return !!user?.isLoggedIn;
  },

  isMember(user: UserResponse | null): boolean {
    return !!user?.isMember;
  },

  isCommittee(user: UserResponse | null): boolean {
    return user?.user?.meta?.cc_committee_member === 'yes';
  },

  isSuperAdmin(accessLevel?: AccessLevel | string): boolean {
    return accessLevel === 'super_admin';
  },

  isAdmin(user: UserResponse | null, accessLevel?: AccessLevel | string): boolean {
    return accessLevel === 'admin' || accessLevel === 'super_admin';
  },

  /**
   * Trip-specific permissions
   */
  isTripLeader(user: UserResponse | null, trip?: Trip): boolean {
    if (!user?.user || !trip) return false;
    const leaderNames = trip.acf.event_trip_leader?.split(/,\s*/) || [];
    return leaderNames.some(name => 
      name.toLowerCase() === `${user.user?.first_name?.toLowerCase() || ''} ${user.user?.last_name?.toLowerCase() || ''}`.trim()
    );
  },

  hasTripAccess(
    user: UserResponse | null,
    trip?: Trip,
    accessLevel?: AccessLevel | string
  ): boolean {
    return Auth.isAdmin(user, accessLevel) || 
           (!!trip && Auth.isTripLeader(user, trip));
  },

  canEditTrip(
    user: UserResponse | null, 
    trip?: Trip,
    accessLevel?: AccessLevel | string
  ): boolean {
    return Auth.hasTripAccess(user, trip, accessLevel) || Auth.isCommittee(user);
  },

  /**
   * Competency checks
   */
  hasCompetency(
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
  },

  /**
   * Special access permissions
   */
  canViewSensitive(
    user: UserResponse | null,
    trip?: Trip,
    accessLevel?: AccessLevel | string
  ): boolean {
    return (!!trip && Auth.isTripLeader(user, trip)) || 
           Auth.isCommittee(user) || 
           Auth.isAdmin(user, accessLevel) ||
           Auth.hasCompetency(user, 'leadingHorizontalSkills', 'leader');
  },

  /**
   * Purchase/registration permissions
   */
  canPurchase(
    user: UserResponse | null,
    trip?: Trip,
    accessLevel?: AccessLevel | string
  ): boolean {
    if (!trip) return false;
    if (trip.acf.event_non_members_welcome === 'yes') return true;
    return Auth.isMember(user) || Auth.hasTripAccess(user, trip, accessLevel);
  },

  /**
   * Determine if user can view participant details
   */
  canViewParticipants(
    user: UserResponse | null,
    trip?: Trip,
    accessLevel?: AccessLevel | string
  ): boolean {
    return Auth.isLoggedIn(user) && (
      Auth.isMember(user) || 
      Auth.hasTripAccess(user, trip, accessLevel) ||
      accessLevel === 'participant' ||
      accessLevel === 'event_role'
    );
  }
};

/**
 * Legacy functions for backward compatibility
 * @deprecated Use Auth object instead
 */
export function getUserRole(user: UserResponse | null, accessLevel?: string): UserRole {
  return Auth.getRole(user, accessLevel);
}

export function isLoggedIn(user: UserResponse | null): boolean {
  return Auth.isLoggedIn(user);
}

export function isMember(user: UserResponse | null): boolean {
  return Auth.isMember(user);
}

export function isCommitteeMember(user: UserResponse | null): boolean {
  return Auth.isCommittee(user);
}

export function isSuperAdmin(accessLevel?: string): boolean {
  return Auth.isSuperAdmin(accessLevel);
}

export function isAdmin(accessLevel?: string): boolean {
  return accessLevel === 'admin' || accessLevel === 'super_admin';
}

export function isTripLeader(user: UserResponse | null, trip?: Trip): boolean {
  return Auth.isTripLeader(user, trip);
}

export function hasTripAdminAccess(
  user: UserResponse | null,
  trip?: Trip,
  accessLevel?: string
): boolean {
  return Auth.hasTripAccess(user, trip, accessLevel);
}

export function canEditTrip(
  user: UserResponse | null, 
  trip?: Trip,
  accessLevel?: string
): boolean {
  return Auth.canEditTrip(user, trip, accessLevel);
}

export function hasCavingCompetency(
  user: UserResponse | null,
  category: SkillCategory,
  requiredLevel: CompetencyLevel
): boolean {
  return Auth.hasCompetency(user, category, requiredLevel);
}

export function hasSensitiveAccess(
  user: UserResponse | null,
  trip?: Trip,
  accessLevel?: string
): boolean {
  return Auth.canViewSensitive(user, trip, accessLevel);
}

export function canPurchaseTrip(
  user: UserResponse | null,
  trip?: Trip,
  accessLevel?: string
): boolean {
  return Auth.canPurchase(user, trip, accessLevel);
}

export function canViewParticipantDetails(
  user: UserResponse | null,
  trip?: Trip,
  accessLevel?: string
): boolean {
  return Auth.canViewParticipants(user, trip, accessLevel);
}
