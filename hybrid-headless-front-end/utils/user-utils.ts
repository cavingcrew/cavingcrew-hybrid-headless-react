/**
 * User Authentication and Authorization Utilities
 * 
 * Provides type-safe authentication checks and competency validation that mirrors
 * the PHP authentication utilities. Handles:
 * - User role determination (guest, member, committee, admin)
 * - Trip permissions and access levels
 * - Caving skill competency validation
 * - Purchase eligibility checks
 * - Volunteer role identification
 * 
 * All methods are available via the `Auth` object export.
 */

import type { Trip, TripParticipant, UserResponse } from "../types/api";
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
	| "guest"
	| "member"
	| "trip_leader"
	| "committee_member"
	| "admin"
	| "super_admin";

// Competency levels for different caving skills
export type CompetencyLevel =
	| "none"
	| "basic"
	| "intermediate"
	| "advanced"
	| "leader";

/**
 * Centralized Auth object for all authentication and authorization functions
 */
export const Auth = {
	/**
	 * Core role determination
	 * 
	 * @param user - Current user context
	 * @param accessLevel - Access level from API response
	 * @returns UserRole - Calculated role based on access and metadata
	 */
	getRole(
		user: UserResponse | null,
		accessLevel?: AccessLevel | string,
	): UserRole {
		if (!user || !user.isLoggedIn) return "guest";
		if (accessLevel === "super_admin") return "super_admin";
		if (accessLevel === "admin") return "admin";
		if (user.user?.meta?.cc_committee_member === "yes")
			return "committee_member";
		return user.isMember ? "member" : "guest";
	},

	/**
	 * Check authentication status
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user is logged in
	 */
	isLoggedIn(user: UserResponse | null): boolean {
		return !!user?.isLoggedIn;
	},

	/**
	 * Validate club membership
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has active membership
	 */
	isMember(user: UserResponse | null): boolean {
		return !!user?.isMember;
	},

	/**
	 * Check committee member status
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if active committee member
	 */
	isCommittee(user: UserResponse | null): boolean {
		if (!user?.user?.meta) return false;

		const status = user.user.meta.committee_current?.toLowerCase();
		const invalidStatuses = ["retired", "revoked", "legacy", "expired", ""];

		return !!status && !invalidStatuses.includes(status) && this.isMember(user);
	},

	/**
	 * Check for super admin access level
	 * 
	 * @param accessLevel - Access level from API response
	 * @returns boolean - True if super admin access
	 */
	isSuperAdmin(accessLevel?: AccessLevel | string): boolean {
		return accessLevel === "super_admin";
	},

	/**
	 * Check for admin or super admin access
	 * 
	 * @param user - Current user context
	 * @param accessLevel - Access level from API response
	 * @returns boolean - True if admin or super admin access
	 */
	isAdmin(
		user: UserResponse | null,
		accessLevel?: AccessLevel | string,
	): boolean {
		return accessLevel === "admin" || accessLevel === "super_admin";
	},

	/**
	 * Trip-specific permissions
	 */

	/**
	 * Verify trip leadership status
	 * 
	 * @param user - Current user context
	 * @param trip - Trip object to check
	 * @returns boolean - True if user is listed as trip leader
	 */
	isTripLeader(user: UserResponse | null, trip?: Trip): boolean {
		if (!user?.user || !trip) return false;
		const leaderNames = trip.acf.event_trip_leader?.split(/,\s*/) || [];
		return leaderNames.some(
			(name) =>
				name.toLowerCase() ===
				`${user.user?.first_name?.toLowerCase() || ""} ${user.user?.last_name?.toLowerCase() || ""}`.trim(),
		);
	},

	/**
	 * Check admin/leader access to trip
	 * 
	 * @param user - Current user context
	 * @param trip - Trip object to check
	 * @param accessLevel - Access level from API
	 * @returns boolean - True if user has admin privileges or is trip leader
	 */
	hasTripAccess(
		user: UserResponse | null,
		trip?: Trip,
		accessLevel?: AccessLevel | string,
	): boolean {
		return (
			Auth.isAdmin(user, accessLevel) ||
			(!!trip && Auth.isTripLeader(user, trip))
		);
	},

	/**
	 * Mirror of PHP is_trip_director functionality
	 * Checks if user is a trip director for a specific trip
	 * 
	 * @param user - Current user context
	 * @param tripId - Trip/product ID to check
	 * @returns boolean - True if user is trip director for this trip
	 */
	isTripDirector(user: UserResponse | null, tripId?: number): boolean {
		if (!user?.user?.id || !tripId) return false;

		// Admin and committee members always have trip director permissions
		if (this.isAdmin(user) || this.isCommittee(user)) return true;

		// Check if user has purchased the trip and is a trip director
		return (
			!!user.purchases?.includes(tripId) &&
			(user.user.meta?.competency_evening_trip_director === "yes" ||
				user.user.meta?.competency_overnight_trip_director === "yes")
		);
	},

	/**
	 * Mirror of PHP is_signed_up_for_trip
	 * Checks if user has active participation in trip
	 * 
	 * @param user - Current user context
	 * @param tripId - Trip/product ID to check
	 * @returns boolean - True if user has purchased/registered for this trip
	 */
	isTripParticipant(user: UserResponse | null, tripId?: number): boolean {
		return !!user?.purchases?.includes(tripId as number);
	},

	/**
	 * Check edit permissions for trip
	 * 
	 * @param user - Current user context
	 * @param trip - Trip object to check
	 * @param accessLevel - Access level from API
	 * @returns boolean - True if user can edit trip details
	 */
	canEditTrip(
		user: UserResponse | null,
		trip?: Trip,
		accessLevel?: AccessLevel | string,
	): boolean {
		return (
			Auth.hasTripAccess(user, trip, accessLevel) || Auth.isCommittee(user)
		);
	},

	/**
	 * Competency checks
	 */

	/**
	 * Validate caving skill level against requirements
	 * 
	 * @param user - Current user context
	 * @param category - Skill category to check
	 * @param requiredLevel - Minimum required competency level
	 * @returns boolean - True if user meets/exceeds requirement
	 */
	hasCompetency(
		user: UserResponse | null,
		category: SkillCategory,
		requiredLevel: CompetencyLevel,
	): boolean {
		if (!user?.user?.meta) return false;

		const skillKey = {
			horizontalSkills: "skills-horizontal",
			srtSkills: "skills-srt",
			leadingHorizontalSkills: "skills-leading-horizontal",
			leadingSrtSkills: "skills-leading-srt",
			leadingCoachingSkills: "skills-leading-coaching",
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
			leader: 4,
		};

		// Convert definition label to lowercase and extract the level part
		const labelParts = definition.label.toLowerCase().split(" ");
		const definitionLevel = labelParts[
			labelParts.length - 1
		] as CompetencyLevel;

		return levelOrder[definitionLevel] >= levelOrder[requiredLevel];
	},

	/**
	 * Check specific competency permission
	 * Mirrors PHP check_competency_permissions
	 * 
	 * @param user - Current user context
	 * @param requiredCompetency - Competency key from getCompetencies()
	 * @returns boolean - True if user has required competency
	 */
	hasCompetencyPermission(
		user: UserResponse | null,
		requiredCompetency: string,
	): boolean {
		const competencies = this.getCompetencies(user);
		const key = requiredCompetency
			.replace(/^competency_/, "")
			.replace(/_/g, "");
		return !!competencies[key as keyof typeof competencies];
	},

	/**
	 * Special access permissions
	 */

	/**
	 * Check permission for sensitive information
	 * 
	 * @param user - Current user context
	 * @param trip - Trip object to check
	 * @param accessLevel - Access level from API
	 * @returns boolean - True if user can view sensitive information
	 */
	canViewSensitive(
		user: UserResponse | null,
		trip?: Trip,
		accessLevel?: AccessLevel | string,
	): boolean {
		return (
			(!!trip && Auth.isTripLeader(user, trip)) ||
			Auth.isCommittee(user) ||
			Auth.isAdmin(user, accessLevel) ||
			Auth.hasCompetency(user, "leadingHorizontalSkills", "leader")
		);
	},

	/**
	 * Purchase/registration permissions
	 */

	/**
	 * Validate trip purchase eligibility
	 * 
	 * @param user - Current user context
	 * @param trip - Trip object to check
	 * @param accessLevel - Access level from API
	 * @returns boolean - True if user can purchase/register for trip
	 */
	canPurchase(
		user: UserResponse | null,
		trip?: Trip,
		accessLevel?: AccessLevel | string,
	): boolean {
		if (!trip) return false;
		if (trip.acf.event_non_members_welcome === "yes") return true;
		return Auth.isMember(user) || Auth.hasTripAccess(user, trip, accessLevel);
	},

	/**
	 * Trip volunteer role checks
	 */

	/**
	 * Identify trip reporter volunteer
	 * 
	 * @param participant - Trip participant to check
	 * @returns boolean - True if participant has reporter role
	 */
	isTripReporter(participant?: TripParticipant | null): boolean {
		return participant?.order_meta?.cc_volunteer === "Trip Reporter";
	},

	/**
	 * Identify transport coordinator volunteer
	 * 
	 * @param participant - Trip participant to check
	 * @returns boolean - True if participant has transport coordinator role
	 */
	isTransportCoordinator(participant?: TripParticipant | null): boolean {
		return participant?.order_meta?.cc_volunteer === "Transport Coordinator";
	},

	/**
	 * Identify seconder volunteer
	 * 
	 * @param participant - Trip participant to check
	 * @returns boolean - True if participant has seconder role
	 */
	isSeconder(participant?: TripParticipant | null): boolean {
		return participant?.order_meta?.cc_volunteer === "Seconder";
	},

	/**
	 * Competency role checks
	 */

	/**
	 * Check evening trip director competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentEveningTripDirector(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_evening_trip_director");
	},

	/**
	 * Check horizontal trip leader competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentHorizontalTripLeader(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_horizontal_trip_leader");
	},

	/**
	 * Check evening trip tackle manager competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentEveningTripTackleManager(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_evening_trip_tacklemanager",
		);
	},

	/**
	 * Check evening trip lift coordinator competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentEveningTripLiftCoordinator(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_evening_trip_lift_coordinator",
		);
	},

	/**
	 * Check vertical trip leader competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentVerticalTripLeader(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_vertical_trip_leader");
	},

	/**
	 * Check trip buddy friend competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentTripBuddyFriend(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_trip_buddy_friend");
	},

	/**
	 * Check overnight trip director competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentOvernightTripDirector(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_overnight_trip_director");
	},

	/**
	 * Check overnight evening meal coordinator competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentOvernightEveningMeal(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_overnight_evening_meal");
	},

	/**
	 * Check overnight caving coordinator competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentOvernightCavingCoordinator(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_overnight_caving_coordinator",
		);
	},

	/**
	 * Check overnight lift coordinator competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentOvernightLiftCoordinator(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_overnight_lift_coordinator",
		);
	},

	/**
	 * Check overnight breakfast coordinator competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentOvernightBreakfastCoordinator(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_overnight_breakfast_coordinator",
		);
	},

	/**
	 * Check training organiser competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentTrainingOrganiser(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_training_training_organiser",
		);
	},

	/**
	 * Check skillsharer competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentSkillsharer(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_training_skillsharer");
	},

	/**
	 * Check social organiser competency
	 * 
	 * @param user - Current user context
	 * @returns boolean - True if user has this competency
	 */
	isCompetentSocialOrganiser(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_social_social_organiser");
	},

	/**
	 * Get all competency statuses for a user
	 * 
	 * @param user - Current user context
	 * @returns Record<string, boolean> - Map of competency checks
	 */
	getCompetencies(user: UserResponse | null): Record<string, boolean> {
		return {
			eveningTripDirector: this.isCompetentEveningTripDirector(user),
			horizontalTripLeader: this.isCompetentHorizontalTripLeader(user),
			eveningTripTackleManager: this.isCompetentEveningTripTackleManager(user),
			eveningTripLiftCoordinator:
				this.isCompetentEveningTripLiftCoordinator(user),
			verticalTripLeader: this.isCompetentVerticalTripLeader(user),
			tripBuddyFriend: this.isCompetentTripBuddyFriend(user),
			overnightTripDirector: this.isCompetentOvernightTripDirector(user),
			overnightEveningMeal: this.isCompetentOvernightEveningMeal(user),
			overnightCavingCoordinator:
				this.isCompetentOvernightCavingCoordinator(user),
			overnightLiftCoordinator: this.isCompetentOvernightLiftCoordinator(user),
			overnightBreakfastCoordinator:
				this.isCompetentOvernightBreakfastCoordinator(user),
			trainingOrganiser: this.isCompetentTrainingOrganiser(user),
			skillsharer: this.isCompetentSkillsharer(user),
			socialOrganiser: this.isCompetentSocialOrganiser(user),
		};
	},

	/**
	 * Generic competency checker
	 * 
	 * @param user - Current user context
	 * @param metaKey - Meta key to check for competency
	 * @returns boolean - True if user has this competency
	 */
	hasCompetencyRole(user: UserResponse | null, metaKey: string): boolean {
		const value = user?.user?.meta?.[metaKey];
		return !!value && value !== "none" && value !== "No competency";
	},

	/**
	 * Determine if user can view participant details
	 * 
	 * @param user - Current user context
	 * @param trip - Trip object to check
	 * @param accessLevel - Access level from API
	 * @returns boolean - True if user can view participant list
	 */
	canViewParticipants(
		user: UserResponse | null,
		trip?: Trip,
		accessLevel?: AccessLevel | string,
	): boolean {
		return (
			Auth.isLoggedIn(user) &&
			(Auth.isMember(user) ||
				Auth.hasTripAccess(user, trip, accessLevel) ||
				accessLevel === "participant" ||
				accessLevel === "event_role")
		);
	},
};

/**
 * Legacy functions for backward compatibility
 * @deprecated Use Auth object methods instead
 */
/**
 * @deprecated Use Auth.getRole() instead
 */
export function getUserRole(
	user: UserResponse | null,
	accessLevel?: string,
): UserRole {
	return Auth.getRole(user, accessLevel);
}

/**
 * @deprecated Use Auth.isLoggedIn() instead
 */
export function isLoggedIn(user: UserResponse | null): boolean {
	return Auth.isLoggedIn(user);
}

/**
 * @deprecated Use Auth.isMember() instead
 */
export function isMember(user: UserResponse | null): boolean {
	return Auth.isMember(user);
}

/**
 * @deprecated Use Auth.isCommittee() instead
 */
export function isCommitteeMember(user: UserResponse | null): boolean {
	return Auth.isCommittee(user);
}

/**
 * @deprecated Use Auth.isSuperAdmin() instead
 */
export function isSuperAdmin(accessLevel?: string): boolean {
	return Auth.isSuperAdmin(accessLevel);
}

/**
 * @deprecated Use Auth.isAdmin() instead
 */
export function isAdmin(accessLevel?: string): boolean {
	return accessLevel === "admin" || accessLevel === "super_admin";
}

/**
 * @deprecated Use Auth.isTripLeader() instead
 */
export function isTripLeader(user: UserResponse | null, trip?: Trip): boolean {
	return Auth.isTripLeader(user, trip);
}

/**
 * @deprecated Use Auth.hasTripAccess() instead
 */
export function hasTripAdminAccess(
	user: UserResponse | null,
	trip?: Trip,
	accessLevel?: string,
): boolean {
	return Auth.hasTripAccess(user, trip, accessLevel);
}

/**
 * @deprecated Use Auth.canEditTrip() instead
 */
export function canEditTrip(
	user: UserResponse | null,
	trip?: Trip,
	accessLevel?: string,
): boolean {
	return Auth.canEditTrip(user, trip, accessLevel);
}

/**
 * @deprecated Use Auth.hasCompetency() instead
 */
export function hasCavingCompetency(
	user: UserResponse | null,
	category: SkillCategory,
	requiredLevel: CompetencyLevel,
): boolean {
	return Auth.hasCompetency(user, category, requiredLevel);
}

/**
 * @deprecated Use Auth.canViewSensitive() instead
 */
export function hasSensitiveAccess(
	user: UserResponse | null,
	trip?: Trip,
	accessLevel?: string,
): boolean {
	return Auth.canViewSensitive(user, trip, accessLevel);
}

/**
 * @deprecated Use Auth.canPurchase() instead
 */
export function canPurchaseTrip(
	user: UserResponse | null,
	trip?: Trip,
	accessLevel?: string,
): boolean {
	return Auth.canPurchase(user, trip, accessLevel);
}

/**
 * @deprecated Use Auth.canViewParticipants() instead
 */
export function canViewParticipantDetails(
	user: UserResponse | null,
	trip?: Trip,
	accessLevel?: string,
): boolean {
	return Auth.canViewParticipants(user, trip, accessLevel);
}

/**
 * @deprecated Use Auth.isTripReporter() instead
 */
export function isTripReporter(participant?: TripParticipant | null): boolean {
	return Auth.isTripReporter(participant);
}

/**
 * @deprecated Use Auth.isTransportCoordinator() instead
 */
export function isTransportCoordinator(
	participant?: TripParticipant | null,
): boolean {
	return Auth.isTransportCoordinator(participant);
}

/**
 * @deprecated Use Auth.isSeconder() instead
 */
export function isSeconder(participant?: TripParticipant | null): boolean {
	return Auth.isSeconder(participant);
}

/**
 * @deprecated Use Auth.isCompetentEveningTripDirector() instead
 */
export function isCompetentEveningTripDirector(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentEveningTripDirector(user);
}

/**
 * @deprecated Use Auth.isCompetentHorizontalTripLeader() instead
 */
export function isCompetentHorizontalTripLeader(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentHorizontalTripLeader(user);
}

/**
 * @deprecated Use Auth.isCompetentEveningTripTackleManager() instead
 */
export function isCompetentEveningTripTackleManager(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentEveningTripTackleManager(user);
}

/**
 * @deprecated Use Auth.isCompetentEveningTripLiftCoordinator() instead
 */
export function isCompetentEveningTripLiftCoordinator(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentEveningTripLiftCoordinator(user);
}

/**
 * @deprecated Use Auth.isCompetentVerticalTripLeader() instead
 */
export function isCompetentVerticalTripLeader(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentVerticalTripLeader(user);
}

/**
 * @deprecated Use Auth.isCompetentTripBuddyFriend() instead
 */
export function isCompetentTripBuddyFriend(user: UserResponse | null): boolean {
	return Auth.isCompetentTripBuddyFriend(user);
}

/**
 * @deprecated Use Auth.isCompetentOvernightTripDirector() instead
 */
export function isCompetentOvernightTripDirector(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentOvernightTripDirector(user);
}

/**
 * @deprecated Use Auth.isCompetentOvernightEveningMeal() instead
 */
export function isCompetentOvernightEveningMeal(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentOvernightEveningMeal(user);
}

/**
 * @deprecated Use Auth.isCompetentOvernightCavingCoordinator() instead
 */
export function isCompetentOvernightCavingCoordinator(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentOvernightCavingCoordinator(user);
}

/**
 * @deprecated Use Auth.isCompetentOvernightLiftCoordinator() instead
 */
export function isCompetentOvernightLiftCoordinator(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentOvernightLiftCoordinator(user);
}

/**
 * @deprecated Use Auth.isCompetentOvernightBreakfastCoordinator() instead
 */
export function isCompetentOvernightBreakfastCoordinator(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentOvernightBreakfastCoordinator(user);
}

/**
 * @deprecated Use Auth.isCompetentTrainingOrganiser() instead
 */
export function isCompetentTrainingOrganiser(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentTrainingOrganiser(user);
}

/**
 * @deprecated Use Auth.isCompetentSkillsharer() instead
 */
export function isCompetentSkillsharer(user: UserResponse | null): boolean {
	return Auth.isCompetentSkillsharer(user);
}

/**
 * @deprecated Use Auth.isCompetentSocialOrganiser() instead
 */
export function isCompetentSocialOrganiser(user: UserResponse | null): boolean {
	return Auth.isCompetentSocialOrganiser(user);
}

/**
 * @deprecated Use Auth.getCompetencies() instead
 */
export function getCompetencies(
	user: UserResponse | null,
): Record<string, boolean> {
	return Auth.getCompetencies(user);
}
