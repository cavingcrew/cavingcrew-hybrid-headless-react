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
	acf: {
		event_start_date?: string;
		event_finish_date?: string;
		event_signup_opens?: string;
		event_start_date_time: string;
		event_finish_date_time?: string;
		event_description?: string;
		event_how_does_this_work?: string;
		event_location?: string;
		event_cave_name?: string;
		event_possible_location?: string;
		event_cost?: string;
		cost?: string;
		event_total_places_available?: string;
		event_possible_objectives?: string;
		what_is_the_minimum_skill_required_for_this_trip?: string;
		event_climbing_trip_or_other_things?: string;
		event_accomodation_description?: string;
		hut_photo?: string;
		hut_facilities_description?: string;
		event_dogs_come?: "yes" | "no";
		event_paying_for?: string;
		event_type: string;
		event_gear_required: string;
		event_must_caved_with_us_before: string;
		event_skills_required: string;
		event_trip_leader: string;
		event_non_members_welcome?: "yes" | "no";
		event_why_are_only_members_allowed?: string;
		event_volunteering_required?: number;
		event_attendance_required?: number;
		event_u18s_come?: "yes" | "no";
		event_members_discount?: string; // Fixed £ discount for members
		membership_faq?: boolean;
		overnight_plans?: Array<{
			overnight_plans_day: string;
			overnight_plans_description: string;
		}>;
		overnight_kitlist?: Array<{
			overnight_kit_list_type: string;
			overnight_kit_list: string;
		}>;
		trip_faq?:
			| Array<{
					trip_faq_title: string;
					trip_faq_answer: string;
			  }>
			| false;
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

export interface UserStatusResponse {
	isLoggedIn: boolean;
	isMember: boolean;
	username?: string;
	email?: string;
	purchasedProducts?: number[];
}

export interface UserPurchasesResponse {
  purchasedProducts: number[];
  isLoggedIn: boolean;
}
