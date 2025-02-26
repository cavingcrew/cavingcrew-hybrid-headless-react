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
	stock_status: string;
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
		location_parking_latlong?: {
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
		} | string;
		location_parking_description?: string;
		location_parking_entrance_route_description?: string;
		location_map_from_parking_to_entrance?: {
			ID: number;
			url: string;
			alt: string;
			caption: string;
		};
		location_entrance_latlong?: string;
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
	stock_status: string;
	stock_quantity: number | null;
	description: string;
	short_description: string;
	images: {
		id: string;
		src: string;
		alt: string;
	}[];
	categories: BasicCategory[];
	has_purchased: boolean;
	can_purchase: boolean;
	purchasable?: never;
	variations: Variation[];
	has_variations: boolean;
	is_variable: boolean;
	route?: Route;
	acf: {
		// Event Type
		event_type: string;
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
