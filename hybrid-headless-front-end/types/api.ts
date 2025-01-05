export interface Trip {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  stock_status: string;
  stock_quantity?: number | null;
  description: string;
  short_description: string;
  images: {
    id: string;
    src: string;
    alt: string;
  }[];
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
  acf: {
    event_start_date_time: string;
    event_description: string;
    event_how_does_this_work: string;
    event_location: string;
    overnight_plans: Array<{
      overnight_plans_day: string;
      overnight_plans_description: string;
    }>;
    overnight_kitlist: Array<{
      overnight_kit_list_type: string;
      overnight_kit_list: string;
    }>;
    trip_faq: Array<{
      trip_faq_title: string;
      trip_faq_answer: string;
    }>;
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
}
