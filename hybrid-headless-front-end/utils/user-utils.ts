/**
 * User Authentication and Authorization Utilities
 *
 * Available checks:
 * - isLoggedIn: Checks if user is authenticated
 * - isMember: Checks if user has membership
 * - isCommittee: Checks if user is committee member
 * - isSuperAdmin: Checks for super admin access level
 * - isAdmin: Checks for admin or super admin access
 * - isTripLeader: Checks if user is listed as trip leader
 * - hasTripAccess: Checks admin/leader access to trip
 * - canEditTrip: Checks edit permissions for trip
 * - hasCompetency: Validates user's caving skill level
 * - canViewSensitive: Checks permission for sensitive info
 * - canPurchase: Validates trip purchase eligibility
 * - isTripReporter: Checks if participant is trip reporter volunteer
 * - isTransportCoordinator: Checks transport coordinator role
 * - isSeconder: Checks if participant is seconder volunteer
 * - canViewParticipants: Checks participant list view permissions
 * - isCompetentEveningTripDirector: Checks evening trip director competency
 * - isCompetentHorizontalTripLeader: Checks horizontal trip leader competency
 * - isCompetentEveningTripTackleManager: Checks evening tackle manager competency
 * - isCompetentEveningTripLiftCoordinator: Checks evening lift coordinator competency
 * - isCompetentVerticalTripLeader: Checks vertical trip leader competency
 * - isCompetentTripBuddyFriend: Checks trip buddy friend competency
 * - isCompetentOvernightTripDirector: Checks overnight trip director competency
 * - isCompetentOvernightEveningMeal: Checks overnight meal coordinator competency
 * - isCompetentOvernightCavingCoordinator: Checks overnight caving coordinator competency
 * - isCompetentOvernightLiftCoordinator: Checks overnight lift coordinator competency
 * - isCompetentOvernightBreakfastCoordinator: Checks overnight breakfast coordinator competency
 * - isCompetentTrainingOrganiser: Checks training organiser competency
 * - isCompetentSkillsharer: Checks skillsharer competency
 * - isCompetentSocialOrganiser: Checks social organiser competency
 * - getCompetencies: Returns object with all competency statuses
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
	 * Core user role verification functions
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

	isLoggedIn(user: UserResponse | null): boolean {
		return !!user?.isLoggedIn;
	},

	isMember(user: UserResponse | null): boolean {
		return !!user?.isMember;
	},

	isCommittee(user: UserResponse | null): boolean {
		return user?.user?.meta?.cc_committee_member === "yes";
	},

	isSuperAdmin(accessLevel?: AccessLevel | string): boolean {
		return accessLevel === "super_admin";
	},

	isAdmin(
		user: UserResponse | null,
		accessLevel?: AccessLevel | string,
	): boolean {
		return accessLevel === "admin" || accessLevel === "super_admin";
	},

	/**
	 * Trip-specific permissions
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
	 * Special access permissions
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
	isTripReporter(participant?: TripParticipant | null): boolean {
		return participant?.order_meta?.cc_volunteer === "Trip Reporter";
	},

	isTransportCoordinator(participant?: TripParticipant | null): boolean {
		return participant?.order_meta?.cc_volunteer === "Transport Coordinator";
	},

	isSeconder(participant?: TripParticipant | null): boolean {
		return participant?.order_meta?.cc_volunteer === "Seconder";
	},

	/**
	 * Competency role checks
	 */
	isCompetentEveningTripDirector(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_evening_trip_director");
	},

	isCompetentHorizontalTripLeader(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_horizontal_trip_leader");
	},

	isCompetentEveningTripTackleManager(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_evening_trip_tacklemanager",
		);
	},

	isCompetentEveningTripLiftCoordinator(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_evening_trip_lift_coordinator",
		);
	},

	isCompetentVerticalTripLeader(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_vertical_trip_leader");
	},

	isCompetentTripBuddyFriend(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_trip_buddy_friend");
	},

	isCompetentOvernightTripDirector(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_overnight_trip_director");
	},

	isCompetentOvernightEveningMeal(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_overnight_evening_meal");
	},

	isCompetentOvernightCavingCoordinator(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_overnight_caving_coordinator",
		);
	},

	isCompetentOvernightLiftCoordinator(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_overnight_lift_coordinator",
		);
	},

	isCompetentOvernightBreakfastCoordinator(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_overnight_breakfast_coordinator",
		);
	},

	isCompetentTrainingOrganiser(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(
			user,
			"competency_training_training_organiser",
		);
	},

	isCompetentSkillsharer(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_training_skillsharer");
	},

	isCompetentSocialOrganiser(user: UserResponse | null): boolean {
		return this.hasCompetencyRole(user, "competency_social_social_organiser");
	},

	/**
	 * Get all competency statuses for a user
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
	 */
	hasCompetencyRole(user: UserResponse | null, metaKey: string): boolean {
		const value = user?.user?.meta?.[metaKey];
		return !!value && value !== "none" && value !== "No competency";
	},

	/**
	 * Determine if user can view participant details
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
 * @deprecated Use Auth object instead
 */
export function getUserRole(
	user: UserResponse | null,
	accessLevel?: string,
): UserRole {
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
	return accessLevel === "admin" || accessLevel === "super_admin";
}

export function isTripLeader(user: UserResponse | null, trip?: Trip): boolean {
	return Auth.isTripLeader(user, trip);
}

export function hasTripAdminAccess(
	user: UserResponse | null,
	trip?: Trip,
	accessLevel?: string,
): boolean {
	return Auth.hasTripAccess(user, trip, accessLevel);
}

export function canEditTrip(
	user: UserResponse | null,
	trip?: Trip,
	accessLevel?: string,
): boolean {
	return Auth.canEditTrip(user, trip, accessLevel);
}

export function hasCavingCompetency(
	user: UserResponse | null,
	category: SkillCategory,
	requiredLevel: CompetencyLevel,
): boolean {
	return Auth.hasCompetency(user, category, requiredLevel);
}

export function hasSensitiveAccess(
	user: UserResponse | null,
	trip?: Trip,
	accessLevel?: string,
): boolean {
	return Auth.canViewSensitive(user, trip, accessLevel);
}

export function canPurchaseTrip(
	user: UserResponse | null,
	trip?: Trip,
	accessLevel?: string,
): boolean {
	return Auth.canPurchase(user, trip, accessLevel);
}

export function canViewParticipantDetails(
	user: UserResponse | null,
	trip?: Trip,
	accessLevel?: string,
): boolean {
	return Auth.canViewParticipants(user, trip, accessLevel);
}

export function isTripReporter(participant?: TripParticipant | null): boolean {
	return Auth.isTripReporter(participant);
}

export function isTransportCoordinator(
	participant?: TripParticipant | null,
): boolean {
	return Auth.isTransportCoordinator(participant);
}

export function isSeconder(participant?: TripParticipant | null): boolean {
	return Auth.isSeconder(participant);
}

export function isCompetentEveningTripDirector(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentEveningTripDirector(user);
}

export function isCompetentHorizontalTripLeader(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentHorizontalTripLeader(user);
}

export function isCompetentEveningTripTackleManager(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentEveningTripTackleManager(user);
}

export function isCompetentEveningTripLiftCoordinator(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentEveningTripLiftCoordinator(user);
}

export function isCompetentVerticalTripLeader(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentVerticalTripLeader(user);
}

export function isCompetentTripBuddyFriend(user: UserResponse | null): boolean {
	return Auth.isCompetentTripBuddyFriend(user);
}

export function isCompetentOvernightTripDirector(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentOvernightTripDirector(user);
}

export function isCompetentOvernightEveningMeal(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentOvernightEveningMeal(user);
}

export function isCompetentOvernightCavingCoordinator(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentOvernightCavingCoordinator(user);
}

export function isCompetentOvernightLiftCoordinator(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentOvernightLiftCoordinator(user);
}

export function isCompetentOvernightBreakfastCoordinator(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentOvernightBreakfastCoordinator(user);
}

export function isCompetentTrainingOrganiser(
	user: UserResponse | null,
): boolean {
	return Auth.isCompetentTrainingOrganiser(user);
}

export function isCompetentSkillsharer(user: UserResponse | null): boolean {
	return Auth.isCompetentSkillsharer(user);
}

export function isCompetentSocialOrganiser(user: UserResponse | null): boolean {
	return Auth.isCompetentSocialOrganiser(user);
}

export function getCompetencies(
	user: UserResponse | null,
): Record<string, boolean> {
	return Auth.getCompetencies(user);
}
