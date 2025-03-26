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
	[key: string]: string | number | null | undefined; // For any other properties
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

export interface TripParticipant {
	first_name: string;
	last_name?: string;
	user_id?: number;
	order_id: number;
	order_status:
		| "pending"
		| "processing"
		| "on-hold"
		| "completed"
		| "cancelled"
		| "refunded"
		| "failed"
		| string;
	meta?: {
		"gear-bringing-evening-or-day-trip"?: string;
		gear_wellies_size?: string;
		"skills-horizontal"?:
			| "New to caving"
			| "Horizontal Basic"
			| "Horizontal Intermediate"
			| null
			| undefined
			| string;
		"skills-srt"?:
			| "No-SRT"
			| "Pre-SRT Basic"
			| "SRT Basic"
			| "Pre-SRT Intermediate"
			| "SRT Intermediate"
			| "SRT Advanced"
			| null
			| undefined;
		"skills-leading-horizontal"?:
			| "no skills"
			| "seconder"
			| "learner leader"
			| "Horizontal Leader"
			| null
			| undefined
			| string;
		"skills-leading-srt"?:
			| "Nothing yet"
			| "I can help derig"
			| "I'm learning to rig"
			| "srt leader basic"
			| "srt leader advanced"
			| null
			| undefined
			| string;
		"skills-leading-coaching"?:
			| "no-skills"
			| "I've helped out a bit and I'm learning"
			| "I can use ground anchors and talk people through common manouveres"
			| "I have significant personal skills and am good at teaching"
			| null
			| undefined
			| string;
		"caving-horizontal-happy-to-second-or-lead"?:
			| "Leader"
			| "Seconder"
			| "No"
			| "N/A"
			| null
			| undefined
			| string;
		"caving-srt-happy-to-second-or-lead"?:
			| "Leader"
			| "Seconder"
			| "No"
			| "N/A"
			| null
			| undefined
			| string;
		"transport-need-lift"?:
			| "Yes"
			| "No"
			| "Prefer to give lift or get lift but not drive a car solo"
			| null
			| undefined
			| string;
		"transport-will-you-give-lift"?: "yes" | "no" | string;
		"transport-depature-time"?: string;
		"transport-leaving-location"?: string;
		"gear-rope-length"?: string;
		"gear-walking-equipment-weekend"?:
			| "My boots"
			| "Waterproof Jacket"
			| "Waterproof Trousers"
			| "Ice Axe"
			| "Crampons"
			| "Walkie-Talkies"
			| "Navigation equipment"
			| "Lots of warm clothes and gloves"
			| "Im not planning on going walking"
			| "A jetpack"
			| "Can I borrow some"
			| string;
		"caving-srt-or-horizontal-preference"?:
			| "No Preference"
			| "SRT"
			| "Horizontal"
			| "Mostly Horizontal but small bits of SRT is fine"
			| null
			| undefined
			| string;
		"admin-dietary-requirements"?: string;
		"admin-car-registration"?: string;
		stats_attendance_attended_cached?: string;
		scores_volunteer_score_cached?: string;
		scores_attendance_reliability_score_cached?: string;
		cc_compliance_last_date_of_caving?: string;
		[key: string]: string | null | undefined;
	};
	order_meta?: {
		cc_attendance?:
			| "attended"
			| "noshow"
			| "cancelled"
			| "latebail"
			| "no-register-show"
			| "noregistershow"
			| "pending"
			| string;
		cc_volunteer?:
			| "none"
			| "director"
			| "tacklemanager"
			| "lift"
			| "cabbage1239zz"
			| "floorwalker"
			| "skillsharer"
			| "announcements"
			| "checkin"
			| "Trip Leader"
			| "Trip Director"
			| "Trip Organiser"
			| "pairing"
			| string;
		cc_volunteer_attendance?: string;
		cc_location?: string;
		[key: string]: string | null | undefined;
	};
	admin_meta?: {
		"admin-emergency-contact-name"?: string;
		"admin-emergency-contact-phone"?: string;
		"admin-emergency-contact-relationship"?: string;
		"admin-phone-number"?: string;
		billing_phone?: string;
		billing_address_1?: string;
		billing_address_2?: string;
		billing_city?: string;
		billing_postcode?: string;
		"admin-date-of-birth"?: string;
		"admin-car-registration"?: string;
		"admin-diet-allergies-health-extra-info"?: string;
		"admin-health-shoulder"?: "Yes" | "No" | null | undefined | string;
		"admin-health-asthma"?:
			| "Yes and I'm bringing an inhaler"
			| "Yes"
			| "No"
			| null
			| undefined
			| string;
		"admin-health-missing-dose"?: "yes" | "no" | string;
		"admin-health-impairment-through-medication"?: "yes" | "no" | string;
		[key: string]: string | null | undefined;
	};
}

export interface TripParticipantsResponse {
	participants: TripParticipant[];
	access_level: "public" | "logged_in" | "participant" | "event_role" | "admin" | "super_admin";
	trip_id: number;
	can_update: boolean;
	participant_count?: number;
	is_logged_in?: boolean;
}

export interface TripsResponse {
	data: Trip[];
	success: boolean;
	message?: string;
	timestamp?: number;
}

export interface ProductStockResponse {
	product_id: number;
	stock_status: string;
	stock_quantity: number | null;
	variations: Array<{
		id: number;
		stock_quantity: number | null;
		stock_status: string;
	}>;
}

export interface Variation {
	id: number;
	description: string;
	attributes: {
		[key: string]: {
			name: string;
			value: string;
			description?: string;
			slug: string;
			options?: Array<{
				slug: string;
				name: string;
				description?: string;
			}>;
		};
	};
	stock_quantity: number | null;
	stock_status: "instock" | "outofstock" | "onbackorder" | string;
	price: string;
	regular_price?: string;
	sale_price?: string;
	sku: string;
	is_in_stock: boolean;
	purchasable: boolean;
	has_purchased?: boolean;
	can_purchase?: boolean;
}

export interface ProductVariationsResponse {
	variations: Variation[];
	userStatus: {
		isLoggedIn: boolean;
		isMember: boolean;
	};
}

export interface BasicCategory {
	id: number;
	name: string;
	description: string;
	slug: string;
}

// Hut Type
export interface Hut {
	id: number;
	acf: {
		hut_name: string;
		hut_sales_description?: string;
		hut_club_name?: string;
		hut_address?: string;
		hut_location?: number; // Post ID
		hut_lat_long: string;
		hut_parking_instructions?: string;
		hut_facilities?: string[];
		hut_arrival_and_directions?: string;
		hut_image?: string;
		hut_webaddress?: string;
		hut_deposit_required?: "yes" | "no" | "sometimes";
		hut_capacity?: string;
		hut_dogs_allowed?: "yes" | "no";
		hut_booking_notes?: string;
		hut_booking_contact_email?: string;
	};
}

// Location Type
export interface Location {
	id: number;
	title?: string;
	slug?: string;
	acf: {
		location_name: string;
		location_poi_nearby?: string;
		location_caving_region?: {
			ID: number;
			post_title: string;
			post_name: string;
			permalink: string;
		};
		location_parking_latlong?:
			| {
					address?: string;
					lat?: number;
					lng?: number;
					zoom?: number;
					place_id?: string;
					street_name?: string;
					street_name_short?: string;
					city?: string;
					state?: string;
					post_code?: string;
					country?: string;
					country_short?: string;
			  }
			| string;
		location_parking_description?: string;
		location_parking_photos?: Array<{
			ID: number;
			url: string;
			alt: string;
			caption: string;
		}>;
		location_parking_entrance_route_description?: string;
		location_map_from_parking_to_entrance?: {
			ID: number;
			url: string;
			alt: string;
			caption: string;
		};
		location_entrance_latlong?: string;
		location_entrance_photos?: Array<{
			ID: number;
			url: string;
			alt: string;
			caption: string;
		}>;
		location_info_url?: string;
		location_access_arrangement?: string[] | string; // Can be array or JSON string
		location_access_url?: string;
		location_reference_links?: Array<{
			link_title: string;
			link_url: string;
		}>;
		location_sensitive_access?: boolean;
	};
}

// Route Type
export interface Route {
	id: number;
	title?: string;
	acf: {
		route_name: string;
		route_blurb?: string;
		route_entrance_location_id?: {
			id: number;
			title: string;
			slug: string;
			acf: Location["acf"];
		};
		route_through_trip?: boolean;
		route_exit_location_id?: {
			id: number;
			title: string;
			slug: string;
			acf: Location["acf"];
		};
		route_time_for_eta?: string;
		route_survey_image?: string;
		route_survey_link?: {
			url: string;
			target?: string;
		};
		route_route_description?:
			| {
					route_description_segment_html?: string;
			  }
			| Array<{
					section_title: string;
					section_content: string;
			  }>;
		route_difficulty?: {
			technical: number;
			physical: number;
		};
		route_trip_star_rating?: number;
		route_participants_skills_required?: {
			route_participants_skills_required_horizontal_level?: string;
			route_participants_skills_required_srt_level?: string;
			minimum_experience?: string;
			recommended_training?: string[];
		};
		route_group_tackle_required?: string;
		route_personal_gear_required?: string; // Stored as JSON string
		route_leading_difficulty?: {
			route_leading_difficulty_srt_leading_level_required?: number | null;
			route_leading_difficulty_srt_leading_skills_required?: string[];
			route_leading_difficulty_horizontal_leading_level_required?: {
				ID: number;
				post_title: string;
				post_name: string;
				permalink: string;
			};
			route_leading_difficulty_horizontal_leading_skills_required?: string[];
			route_leading_difficulty_navigation_difficulty?: string;
		};
		route_additional_images?: string; // Stored as JSON string
	};
}

export interface Trip {
	id: number;
	name: string;
	slug: string;
	price: string;
	regular_price?: string;
	sale_price?: string;
	stock_status: "instock" | "outofstock" | "onbackorder" | string;
	stock_quantity: number | null;
	description: string;
	short_description: string;
	images: {
		id: string;
		src: string;
		alt: string;
		sizes?: {
			[key: string]: {
				file: string;
				width: number;
				height: number;
				mime_type?: string;
			}
		};
	}[];
	categories: BasicCategory[];
	has_purchased: boolean;
	can_purchase: boolean;
	purchasable?: never;
	variations: Variation[];
	has_variations: boolean;
	is_variable: boolean;
	route?: Route;
	hut?: {
		hut_id: number;
		hut_name: string;
		hut_sales_description?: string;
		hut_club_name?: string;
		hut_address?: string;
		hut_location?: {
			ID: number;
			post_title: string;
			post_name: string;
			permalink: string;
		};
		hut_lat_long?: string;
		hut_parking_instructions?: string;
		hut_facilities?: string[];
		hut_arrival_and_directions?: string;
		hut_image?: {
			ID: number;
			url: string;
			alt: string;
			caption: string;
			sizes?: {
				[key: string]: {
					file: string;
					width: number;
					height: number;
					mime_type?: string;
				}
			};
		};
		hut_dogs_allowed?: "yes" | "no" | string;
		hut_capacity?: string;
		hut_booking_notes?: string;
	};
	acf: {
		// Event Type
		event_type:
			| "known"
			| "mystery"
			| "overnight"
			| "giggletrip"
			| "training"
			| "membership"
			| string;
		// Date/Time Fields
		event_start_date?: string;
		event_finish_date?: string;
		event_signup_opens?: string;
		event_start_date_time: string;
		event_finish_date_time?: string;

		// Location Details
		event_trip_leader: string;
		event_route_id?: number; // Reference to Route ID
		event_cave_id?: number; // Reference to Location ID
		event_cave_name?: string;
		event_possible_location?: string;
		event_location?: string;

		// Description Fields
		event_description?: string;
		event_how_does_this_work?: string;

		// Requirements
		event_skills_required:
			| "None required"
			| "Open to All Abilities"
			| "Advanced Horizontal Skills"
			| "Basic SRT"
			| "Advanced SRT"
			| "other";
		event_gear_required:
			| "None"
			| "Horizontal Caving Gear"
			| "Horizontal Caving Gear and SRT Kit";
		event_must_caved_with_us_before: "yes" | "no";

		// Signup Rules
		"event_non-members_welcome"?: "yes" | "no";
		event_non_members_welcome?: "yes" | "no";
		event_allow_late_signup?: boolean;
		event_allow_early_signup?: boolean;

		// Participation Requirements
		event_volunteering_required?: number;
		event_attendance_required?: number;
		event_total_places_available?: string;

		// Attendee Restrictions
		event_u18s_come?: "yes" | "no";
		event_dogs_come?: "yes" | "no";

		// Pricing
		event_cost?: string;
		cost?: string;
		event_members_discount?: string;

		// Payment Details
		event_paying_for?: string;

		// Accommodation Details
		hut_id?: number; // Reference to Hut ID
		hut_photo?: string;
		hut_facilities_description?: string;
		event_accomodation_description?: string;

		// Repeater Fields
		trip_faq?:
			| Array<{
					trip_faq_title: string;
					trip_faq_answer: string;
			  }>
			| false;
		overnight_kitlist?: Array<{
			overnight_kit_list_type: string;
			overnight_kit_list: string;
		}>;
		overnight_plans?: Array<{
			overnight_plans_day: string;
			overnight_plans_description: string;
		}>;

		// Legacy fields
		event_possible_objectives?: string;
		what_is_the_minimum_skill_required_for_this_trip?: string;
		event_climbing_trip_or_other_things?: string;
		event_why_are_only_members_allowed?: string;
		membership_faq?: boolean;
		Testimonials_overnight_trips?: boolean;
	};
}

export interface Category {
	id: number;
	name: string;
	slug: string;
	description: string;
	count: number;
}

export interface ApiResponse<T> {
	data: T | null;
	success: boolean;
	message?: string;
	timestamp?: number;
	etag?: string;
}

export interface CategoryResponse {
	products: Trip[];
	category?: {
		name: string;
		slug: string;
	};
}

export interface UserResponse {
	isLoggedIn: boolean;
	isMember: boolean;
	cartCount: number;
	purchases: number[];
	user?: {
		id: number;
		user_login: string;
		user_email: string;
		nickname?: string;
		first_name?: string;
		last_name?: string;
		billing_first_name?: string;
		billing_last_name?: string;
		billing_email?: string;
		billing_address_1?: string;
		billing_address_2?: string;
		billing_city?: string;
		billing_postcode?: string;
		billing_country?: string;
		meta: {
			[key: string]: string | null;
		};
	};
}
