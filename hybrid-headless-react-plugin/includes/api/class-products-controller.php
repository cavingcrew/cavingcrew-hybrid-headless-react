<?php
/**
 * Products REST Controller
 *
 * @package HybridHeadless
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Products Controller Class
 */
class Hybrid_Headless_Products_Controller {
    /**
     * Constructor
     */
    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    /**
     * Register routes
     */
    public function register_routes() {
        // V1 endpoint (server-to-server with WooCommerce permissions)
        register_rest_route(
            'wc-hybrid-headless/v1',
            '/products/create-event',
            array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_event_product' ),
                    'permission_callback' => array( $this, 'check_woocommerce_permissions' ),
                    'args'               => $this->get_event_creation_args(),
                ),
            )
        );

        // V2 endpoint (client-to-server with standard WP authentication)
        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/products/create-event',
            array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_event_product_v2' ),
                    'permission_callback' => array( $this, 'check_event_creation_permissions' ),
                    'args'               => $this->get_event_creation_args(),
                ),
            )
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/products',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_products' ),
                    'permission_callback' => '__return_true',
                    'args'               => $this->get_products_args(),
                ),
            )
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/products/(?P<id>\d+)/variations',
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_product_variations'],
                'permission_callback' => '__return_true',
                'args' => [
                    'id' => [
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ]
                ]
            ]
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/stock/(?P<product_id>\d+)/(?P<variation_id>\d+)',
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_stock'],
                'permission_callback' => '__return_true',
                'args' => [
                    'product_id' => ['type' => 'integer'],
                    'variation_id' => ['type' => 'integer']
                ]
            ]
        );


        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/products/(?P<id>\d+)/stock',
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_product_stock'],
                'permission_callback' => '__return_true',
                'args' => [
                    'id' => [
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ]
                ]
            ]
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/products/(?P<id>[\d]+)',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_product' ),
                    'permission_callback' => '__return_true',
                    'args'               => array(
                        'id' => array(
                            'required'          => true,
                            'validate_callback' => function( $param ) {
                                return is_numeric( $param );
                            },
                        ),
                    ),
                ),
            )
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/products/(?P<slug>[a-zA-Z0-9-]+)',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_product_by_slug' ),
                    'permission_callback' => '__return_true',
                    'args'               => array(
                        'slug' => array(
                            'required'          => true,
                            'validate_callback' => function( $param ) {
                                return is_string( $param );
                            },
                        ),
                    ),
                ),
            )
        );
    }

    /**
     * Get products arguments
     *
     * @return array
     */
    private function get_products_args() {
        return array(
            'page'     => array(
                'default'           => 1,
                'sanitize_callback' => 'absint',
            ),
            'per_page' => array(
                'default'           => 40,
                'sanitize_callback' => 'absint',
            ),
            'category' => array(
                'default'           => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'orderby' => array(
                'default'           => 'date',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'order' => array(
                'default'           => 'ASC',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'get_reports' => array(
                'default'           => false,
                'sanitize_callback' => 'rest_sanitize_boolean',
            )
        );
    }

    /**
     * Get products
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response
     */
    public function get_products( $request ) {
        // Check if this is a cacheable request (frontend initial load)
        $is_cache_request = isset($request['cachemeifyoucan']);

        // If it's a cache request, temporarily set the current user to 0 (not logged in)
        $original_user_id = null;
        if ($is_cache_request) {
            $original_user_id = get_current_user_id();
            wp_set_current_user(0);
        }

        // Get user's trip participation if logged in
        $user_trip_participation = [];
        if (!$is_cache_request && is_user_logged_in()) {
            $user_id = get_current_user_id();
            $orders = wc_get_orders([
                'customer_id' => $user_id,
                'limit' => -1,
                'status' => ['pending', 'on-hold', 'processing', 'completed'],
            ]);

            foreach ($orders as $order) {
                $cc_volunteer = $order->get_meta('cc_volunteer');
                foreach ($order->get_items() as $item) {
                    $product = $item->get_product();
                    if ($product) {
                        $product_id = $product->get_parent_id() ?: $product->get_id();
                        $user_trip_participation[$product_id] = [
                            'order_id' => $order->get_id(),
                            'cc_volunteer' => $cc_volunteer
                        ];
                    }
                }
            }
        }

        $args = array(
            'post_type'      => 'product',
            'posts_per_page' => $request['per_page'],
            'paged'          => $request['page'],
            'meta_key'       => 'event_start_date_time',
            'orderby'        => 'meta_value',
            'order'          => 'ASC',
            'meta_query'     => array(
                'relation' => 'OR',
                array(
                    'key'     => 'event_start_date_time',
                    'compare' => 'EXISTS'
                ),
                array(
                    'key'     => 'event_start_date_time',
                    'compare' => 'NOT EXISTS'
                )
            ),
            'tax_query'      => array(
                'relation' => 'AND',
                array(
                    'taxonomy' => 'product_visibility',
                    'field'    => 'name',
                    'terms'    => array('exclude-from-catalog', 'exclude-from-search'),
                    'operator' => 'NOT IN',
                ),
                array(
                    'taxonomy' => 'product_tag',
                    'field'    => 'slug',
                    'terms'    => 'trip-reports',
                    'operator' => 'NOT IN',
                ),
            ),
            'post_status'    => 'publish',
        );

        // If get_reports parameter is true, modify the query to get trip reports
        if ($request['get_reports']) {
            // Change order to DESC to get most recent first
            $args['order'] = 'DESC';

            // Remove the tag exclusion for trip-reports
            foreach ($args['tax_query'] as $key => $query) {
                if (isset($query['terms']) && $query['terms'] === 'trip-reports') {
                    unset($args['tax_query'][$key]);
                }
            }

            // Add meta query to only get products with non-empty report_content
            $args['meta_query'] = array(
                'relation' => 'AND',
                array(
                    'key'     => 'report_content',
                    'value'   => '',
                    'compare' => '!='
                ),
                array(
                    'key'     => 'event_start_date_time',
                    'compare' => 'EXISTS'
                )
            );
        }

        if ( ! empty( $request['category'] ) ) {
            $args['tax_query'][] = array(
                'taxonomy' => 'product_cat',
                'field'    => 'slug',
                'terms'    => $request['category'],
            );
        }

        $query = new WP_Query( $args );
        $products = array();

        foreach ( $query->posts as $post ) {
            $product = wc_get_product( $post );
            if ($product && $product->is_visible()) {
                $prepared = $this->prepare_product_data( $product, $is_cache_request );
                // Add variation count for listings
                $prepared['variation_count'] = count($prepared['variations']);
                $products[] = $prepared;
            }
        }

        // Restore the original user if we changed it
        if ($is_cache_request && $original_user_id !== null) {
            wp_set_current_user($original_user_id);
        }

        return rest_ensure_response( array(
            'products' => $products,
            'total'    => $query->found_posts,
            'pages'    => $query->max_num_pages,
        ) );
    }

    /**
     * Get single product
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response
     */
    public function get_product( $request ) {
        $product = wc_get_product( $request['id'] );

        if ( ! $product ) {
            return new WP_Error(
                'product_not_found',
                __( 'Product not found', 'hybrid-headless' ),
                array( 'status' => 404 )
            );
        }

        // Set cache headers for stock monitoring
        header('Cache-Control: no-store, max-age=0');
        header('Pragma: no-cache');

        return rest_ensure_response( $this->prepare_product_data( $product ) );
    }

    /**
     * Prepare product data
     *
     * @param WC_Product $product Product object.
     * @param bool $is_cache_request Whether this is a cacheable request.
     * @return array
     */
    private function prepare_product_data($product, $is_cache_request = false) {
        // Ensure user is authenticated before processing
        if (!$is_cache_request) {
            $this->ensure_user_authenticated();
        }

        // TEMPORARY FIX: Save current user and set to guest for price calculations
        // This ensures we always return the non-discounted prices regardless of user auth status
        // We may want to revert this in the future to show personalized prices
        $current_user_id = get_current_user_id();
        $temp_user_switch = false;

        if ($current_user_id) {
            $temp_user_switch = true;
            wp_set_current_user(0); // Set to guest user temporarily
        }

        $cache_key = 'product_stock_' . $product->get_id();
        $stock_info = wp_cache_get($cache_key);

        // Get ACF fields
        $acf_fields = get_fields($product->get_id());

        // Get trip report fields
        $has_report_content = !empty($acf_fields['report_content']);

        // Check if this is a sensitive location
        $is_sensitive_location = false;

        // Check if route has sensitive access
        if (!empty($acf_fields['event_route_id'])) {
            $route_id = $acf_fields['event_route_id'];
            $route_acf = get_fields($route_id);

            // Check if entrance location has sensitive access
            $entrance_location_id = $route_acf['route_entrance_location_id'] ?? 0;
            $entrance_location_acf = $entrance_location_id ? get_fields($entrance_location_id) : null;
            $is_sensitive_location = (bool)($entrance_location_acf['location_sensitive_access'] ?? false);
        }

        // Check if user is authenticated and is a member
        $is_logged_in = !$is_cache_request && is_user_logged_in();
        $is_member = $is_logged_in && $this->is_member();

        // Determine if we should hide the trip report content
        $hide_report = $has_report_content && $is_sensitive_location && !($is_logged_in && $is_member);

        $trip_report = [
            'report_author' => $hide_report ? '' : ($acf_fields['report_author'] ?? ''),
            'report_content' => $hide_report ? 'To see this trip report, you\'ll need to login with membership.' : ($acf_fields['report_content'] ?? ''),
            'report_gallery' => $hide_report ? [] : $this->prepare_gallery_data($acf_fields['report_gallery'] ?? [])
        ];

        // Initialize variation data
        $variations = [];
        $has_variations = false;
        $variation_stock = [
            'total_stock' => 0,
            'in_stock' => false
        ];

        // Get attribute data
        $attributes = [];
        $product_attributes = $product->get_attributes();

        foreach ($product_attributes as $attribute_key => $attribute) {
            // Skip invalid attributes
            if (!($attribute instanceof WC_Product_Attribute)) {
                continue;
            }

            $attr_data = [
                'name' => $attribute->get_name(),
                'terms' => []
            ];

            // Handle taxonomy attributes
            if ($attribute->is_taxonomy()) {
                $taxonomy = $attribute->get_name();
                $attribute_id = wc_attribute_taxonomy_id_by_name($taxonomy);

                if ($attribute_id) {
                    $wc_attribute = wc_get_attribute($attribute_id);
                    $attr_data['description'] = $wc_attribute ? $wc_attribute->description : '';
                }
            }

            // Handle taxonomy attributes
            if ($attribute->is_taxonomy()) {
                $terms = [];
                $attribute_terms = $attribute->get_terms();

                if (is_array($attribute_terms)) {
                    foreach ($attribute_terms as $term) {
                        $terms[] = [
                            'slug' => $term->slug,
                            'name' => $term->name,
                            'description' => $term->description
                        ];
                    }
                }

                $attr_data['terms'] = $terms;

                // Get attribute type from taxonomy
                $taxonomy = $attribute->get_name();
                $attribute_id = wc_attribute_taxonomy_id_by_name($taxonomy);

                if ($attribute_id) {
                    $wc_attribute = wc_get_attribute($attribute_id);
                    $attr_data['type'] = $wc_attribute ? $wc_attribute->type : 'select';
                } else {
                    $attr_data['type'] = 'select';
                }
            } else {
                // Handle custom attributes
                $attr_data['type'] = 'select';
                $options = $attribute->get_options();

                if (is_array($options)) {
                    foreach ($options as $option) {
                        $attr_data['terms'][] = [
                            'slug' => sanitize_title($option),
                            'name' => $option,
                            'description' => ''
                        ];
                    }
                }
            }

            $attributes[$attribute_key] = $attr_data;
        }

        // Handle variable products
        if ($product->is_type('variable')) {
            $has_variations = true;
            foreach ($product->get_available_variations() as $variation_data) {
                $variation = wc_get_product($variation_data['variation_id']);

                // Get attribute details with descriptions
                $variation_attributes = [];
                foreach ($variation->get_variation_attributes() as $attr_name => $attr_value) {
                    $taxonomy = str_replace('attribute_', '', $attr_name);
                    $term = get_term_by('slug', $attr_value, $taxonomy);

                    $variation_attributes[$taxonomy] = [
                        'name' => wc_attribute_label($taxonomy),
                        'value' => $term ? $term->name : $attr_value,
                        'description' => $term ? $term->description : '',
                        'slug' => $attr_value
                    ];
                }

                if ($variation) { // Return all variations regardless of stock status
                    $variation_stock['total_stock'] += $variation->get_stock_quantity();
                    $variation_stock['in_stock'] = true;

                    $variations[] = [
                        'id' => $variation->get_id(),
                        'description' => $variation->get_description(),
                        'attributes' => $variation_attributes,
                        'stock_quantity' => $variation->get_stock_quantity(),
                        'stock_status' => $variation->get_stock_status(),
                        'price' => $variation->get_price(),
                        'regular_price' => $variation->get_regular_price(),
                        'sale_price' => $variation->get_sale_price(),
                        'sku' => $variation->get_sku(),
                        'is_in_stock' => $variation->is_in_stock(),
                        'purchasable' => $variation->is_purchasable()
                    ];
                }
            }
        }

        // Get/cache stock info
        if (false === $stock_info) {
            $stock_info = array(
                'stock_status' => $has_variations ? ($variation_stock['in_stock'] ? 'instock' : 'outofstock') : $product->get_stock_status(),
                'stock_quantity' => $has_variations ? $variation_stock['total_stock'] : $product->get_stock_quantity(),
                'has_variations' => $has_variations,
                'variations' => $variations,
                'is_variable' => $product->is_type('variable'),
                'purchasable' => $product->is_purchasable() || !empty($variations), // Changed line
                'attributes' => $attributes
            );
            wp_cache_set($cache_key, $stock_info, '', 30);
        }

        $product_data = array(
            'id' => $product->get_id(),
            'name' => $product->get_name(),
            'slug' => $product->get_slug(),
            'price' => $product->get_price(),
            'regular_price' => $product->get_regular_price(),
            'sale_price' => $product->get_sale_price(),
            'stock_status' => $stock_info['stock_status'],
            'stock_quantity' => $stock_info['stock_quantity'],
            'description' => $product->get_description(),
            'short_description' => $product->get_short_description(),
            'images' => $this->get_product_images($product),
            'categories' => $this->get_product_categories($product),
            'acf' => $acf_fields,
            'variations' => $stock_info['variations'],
            'has_variations' => $stock_info['has_variations'],
            'is_variable' => $stock_info['is_variable'],
            'purchasable' => $stock_info['purchasable'],
            'trip_report' => $trip_report
        );

        // Add route data if available
        if (!empty($acf_fields['event_route_id'])) {
            $product_data['route'] = $this->get_route_data(
                $acf_fields['event_route_id'],
                $is_cache_request,
                $product->get_id() // Pass current product ID
            );
        } elseif (!empty($acf_fields['event_cave_id'])) {
            $product_data['route'] = $this->get_cave_as_route(
                $acf_fields['event_cave_id'],
                $is_cache_request,
                $product->get_id() // Pass current product ID
            );
        }

        // Add hut data if available
        if (!empty($acf_fields['hut_id'])) {
            $product_data['hut'] = $this->get_hut_data($acf_fields['hut_id']);
        }

        // TEMPORARY FIX: Restore original user if we temporarily switched
        if ($temp_user_switch && $current_user_id) {
            wp_set_current_user($current_user_id);
        }

        return $product_data;
    }

    /**
     * Get product images
     *
     * @param WC_Product $product Product object.
     * @return array
     */
    private function get_product_images( $product ) {
        $images = array();
        $attachment_ids = array_merge(
            array( $product->get_image_id() ),
            $product->get_gallery_image_ids()
        );

        foreach ( $attachment_ids as $attachment_id ) {
            $meta = wp_get_attachment_metadata($attachment_id);
            $sizes_data = [];

            // Process each size to get the full URL
            if (!empty($meta['sizes'])) {
                foreach ($meta['sizes'] as $size_name => $size_info) {
                    $src = wp_get_attachment_image_src($attachment_id, $size_name);
                    if ($src) {
                        $sizes_data[$size_name] = [
                            'file' => $src[0], // Full URL to the resized image
                            'width' => $src[1],
                            'height' => $src[2],
                            'mime_type' => $size_info['mime-type'] ?? null
                        ];
                    }
                }
            }

            $images[] = array(
                'id'    => $attachment_id,
                'src'   => wp_get_attachment_url( $attachment_id ),
                'alt'   => get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ),
                'sizes' => $sizes_data
            );
        }

        return $images;
    }

    /**
     * Get product categories
     *
     * @param WC_Product $product Product object.
     * @return array
     */
    /**
     * Get product by slug
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error
     */
    public function get_product_by_slug( $request ) {
        $slug = $request['slug'];
        $product = get_page_by_path( $slug, OBJECT, 'product' );

        if ( ! $product ) {
            return new WP_Error(
                'product_not_found',
                __( 'Product not found', 'hybrid-headless' ),
                array( 'status' => 404 )
            );
        }

        $wc_product = wc_get_product( $product->ID );

        if ( ! $wc_product ) {
            return new WP_Error(
                'product_not_found',
                __( 'Product not found', 'hybrid-headless' ),
                array( 'status' => 404 )
            );
        }

        // Set cache headers for stock monitoring
        header('Cache-Control: no-store, max-age=0');
        header('Pragma: no-cache');

        return rest_ensure_response( $this->prepare_product_data( $wc_product ) );
    }

    private function get_hut_data($hut_id) {
        if (!$hut_id || !get_post_status($hut_id)) {
            return null;
        }

        $hut_acf = get_fields($hut_id);

        return [
            'hut_id' => $hut_id,
            'hut_name' => $hut_acf['hut_name'] ?? '',
            'hut_sales_description' => $hut_acf['hut_sales_description'] ?? '',
            'hut_club_name' => $hut_acf['hut_club_name'] ?? '',
            'hut_address' => $hut_acf['hut_address'] ?? '',
            'hut_location' => $this->get_hut_location_data($hut_acf['hut_location'] ?? 0),
            'hut_lat_long' => $hut_acf['hut_lat_long'] ?? '',
            'hut_parking_instructions' => $hut_acf['hut_parking_instructions'] ?? '',
            'hut_facilities' => $hut_acf['hut_facilities'] ?? [],
            'hut_arrival_and_directions' => $hut_acf['hut_arrival_and_directions'] ?? '',
            // Use process_acf_image_field as hut_image now returns an array/object
            'hut_image' => $this->process_acf_image_field($hut_acf['hut_image'] ?? null),
            'hut_dogs_allowed' => $hut_acf['hut_dogs_allowed'] ?? 'no'
        ];
    }

    private function get_hut_location_data($location_post_id) {
        if (!$location_post_id) return null;

        $location_post = get_post($location_post_id);

        return $location_post ? [
            'ID' => $location_post->ID,
            'post_title' => $location_post->post_title,
            'post_name' => $location_post->post_name,
            'permalink' => get_permalink($location_post)
        ] : null;
    }

    // Note: get_hut_image_data is no longer directly called by get_hut_data,
    // but it might be used elsewhere or can be removed if confirmed unused.
    // Keeping it for now unless explicitly asked to remove.
    // private function get_hut_image_data($image_id) { ... }


    private function get_route_data($route_id, $is_cache_request = false, $current_product_id = 0) {
        $post_ref = $this->get_post_reference($route_id);
        if (!$post_ref) return null;

        $route_acf = get_fields($post_ref['ID']);

        // Check if entrance location has sensitive access
        $entrance_location_id = $route_acf['route_entrance_location_id'] ?? 0;
        $entrance_location_acf = $entrance_location_id ? get_fields($entrance_location_id) : null;
        $is_sensitive_access = (bool)($entrance_location_acf['location_sensitive_access'] ?? false);

        // Ensure user is authenticated before checking permissions
        if (!$is_cache_request) {
            $this->ensure_user_authenticated();
        }

        // Check user authentication and permissions
        // If it's a cache request, treat as not logged in
        $is_logged_in = !$is_cache_request && is_user_logged_in();
        $is_member = $is_logged_in && $this->is_member();


        // Check if user is signed up for this trip and has appropriate role
        $has_trip_leader_access = false;
        if ($is_logged_in && $is_member && $current_product_id > 0) {
            $user_id = get_current_user_id();
            error_log('Checking trip leader access for user: ' . $user_id . ' on product: ' . $current_product_id);

            // Get user participation from global variable
            global $user_trip_participation;

            // If global variable not set, try to get from function scope
            if (!isset($user_trip_participation) && function_exists('get_user_trip_participation')) {
                $user_trip_participation = get_user_trip_participation();
            }

            // If we have participation data for this product
            if (isset($user_trip_participation) && isset($user_trip_participation[$current_product_id])) {
                $participation = $user_trip_participation[$current_product_id];
                $cc_volunteer = strtolower((string)$participation['cc_volunteer']);
                $leader_roles = ['trip leader', 'trip director', 'trip organiser', 'director'];

                error_log('Role check: ' . $cc_volunteer);

                if ($cc_volunteer && (
                    strpos($cc_volunteer, 'director') !== false ||
                    strpos($cc_volunteer, 'leader') !== false ||
                    in_array($cc_volunteer, $leader_roles)
                )) {
                    $has_trip_leader_access = true;
                    error_log('TRIP LEADER ACCESS GRANTED for role: ' . $cc_volunteer);
                }
            } else {
                // Fallback to direct order check if pre-fetched data not available
                $orders = wc_get_orders([
                    'customer_id' => $user_id,
                    'limit' => -1,
                    'status' => ['pending', 'on-hold', 'processing', 'completed'],
                ]);

                foreach ($orders as $order) {
                    foreach ($order->get_items() as $item) {
                        $item_product = $item->get_product();
                        if ($item_product) {
                            $item_product_id = $item_product->get_parent_id() ?: $item_product->get_id();

                            if ($item_product_id == $current_product_id) {
                                $cc_volunteer = strtolower((string)$order->get_meta('cc_volunteer'));
                                $leader_roles = ['trip leader', 'trip director', 'trip organiser', 'director'];

                                if ($cc_volunteer && (
                                    strpos($cc_volunteer, 'director') !== false ||
                                    strpos($cc_volunteer, 'leader') !== false ||
                                    in_array($cc_volunteer, $leader_roles)
                                )) {
                                    $has_trip_leader_access = true;
                                    error_log('TRIP LEADER ACCESS GRANTED for role: ' . $cc_volunteer);
                                    break 2;
                                }
                            }
                        }
                    }
                }
            }

            if (!$has_trip_leader_access) {
                error_log('No trip leader access granted for user ' . $user_id . ' on product ' . $current_product_id);
            }
        }

        // Base route data that's always returned
        $route_data = [
            'id' => $post_ref['ID'],
            'title' => $is_sensitive_access && !($is_logged_in && $is_member) ? 'A sensitive access location' : $post_ref['post_title'],
            'acf' => [
                'route_name' => $is_sensitive_access && !($is_logged_in && $is_member) ? 'A sensitive access location' : ($route_acf['route_name'] ?? ''),
                'route_entrance_location_id' => $this->get_location_data($route_acf['route_entrance_location_id'] ?? 0, $is_cache_request, $current_product_id),
                'route_difficulty' => $this->map_grouped_fields($route_acf['route_difficulty'] ?? [], [
                    'route_difficulty_psychological_claustrophobia',
                    'route_difficulty_objective_tightness',
                    'route_difficulty_wetness',
                    'route_difficulty_water_near_face',
                    'route_difficulty_exposure_to_deep_water',
                    'route_difficulty_muddiness',
                    'route_difficulty_exposure_to_heights',
                    'route_difficulty_technical_climbing_difficulty',
                    'route_difficulty_endurance',
                    'route_difficulty_objective_hazard'
                ]),
                'route_trip_star_rating' => $route_acf['route_trip_star_rating'] ?? null,
                'route_participants_skills_required' => $this->map_grouped_fields($route_acf['route_participants_skills_required'] ?? [], [
                    'route_participants_skills_required_srt_level' => ['type' => 'post'],
                    'route_participants_skills_required_horizontal_level' => ['type' => 'post']
                ]),
                'route_personal_gear_required' => $route_acf['route_personal_gear_required'] ?? [],
                'route_time_for_eta' => $route_acf['route_time_for_eta'] ?? '',
            ]
        ];

        // If it's not a sensitive location OR user has appropriate access, add more data
        if (!$is_sensitive_access || $has_trip_leader_access) {
            $route_data['acf']['route_blurb'] = $route_acf['route_blurb'] ?? '';
            $route_data['acf']['route_through_trip'] = $route_acf['route_through_trip'] ?? false;
            $route_data['acf']['route_exit_location_id'] = $this->get_location_data($route_acf['route_exit_location_id'] ?? 0, $is_cache_request, $current_product_id);
            $route_data['acf']['route_group_tackle_required'] = $route_acf['route_group_tackle_required'] ?? '';

            // Add sensitive data only for members or trip leaders
            if (!$is_sensitive_access || $has_trip_leader_access || ($is_logged_in && $is_member)) {
                $route_data['acf']['route_leading_difficulty'] = $this->map_grouped_fields($route_acf['route_leading_difficulty'] ?? [], [
                    'route_leading_difficulty_srt_leading_level_required' => ['type' => 'post'],
                    'route_leading_difficulty_srt_leading_skills_required',
                    'route_leading_difficulty_horizontal_leading_level_required' => ['type' => 'post'],
                    'route_leading_difficulty_horizontal_leading_skills_required',
                    'route_leading_difficulty_navigation_difficulty'
                ]);
                $route_data['acf']['route_leading_notes'] = $route_acf['route_leading_notes'] ?? '';
                $route_data['acf']['route_water_impact'] = $route_acf['route_water_impact'] ?? '';
            }

            // Add the most sensitive data only for trip leaders
            if (!$is_sensitive_access || $has_trip_leader_access) {
                $route_data['acf']['route_survey_image'] = $this->process_acf_image_field($route_acf['route_survey_image'] ?? null);                    $route_data['acf']['route_survey_link'] = $route_acf['route_survey_link'] ?? null;
                $route_data['acf']['route_route_description'] = [];
                if (!empty($route_acf['route_route_description'])) {
                    foreach ($route_acf['route_route_description'] as $segment) {
                        $route_data['acf']['route_route_description'][] = [
                            'title' => $segment['route_description_segment_title'] ?? '',
                            'content' => $segment['route_description_segment_html'] ?? '',
                            'image' => $this->process_acf_image_field($segment['route_description_segment_photo'] ?? null)
                        ];
                    }
                }
                $route_data['acf']['route_additional_images'] = is_array($route_acf['route_additional_images'] ?? false) ?
                    array_map(function($img) {
                        return $this->process_acf_image_field($img['image'] ?? null);
                    }, $route_acf['route_additional_images']) : [];
            }
        }

        return $route_data;
    }

    private function get_cave_as_route($cave_id, $is_cache_request = false, $current_product_id = 0) {
        $cave_acf = get_fields($cave_id);
        $cave_post = get_post($cave_id);

        return [
            'id' => null,
            'title' => 'Cave Entrance Details',
            'acf' => [
                'route_name' => $cave_post->post_title,
                'route_entrance_location_id' => $this->get_location_data($cave_id),
                'route_difficulty' => $this->map_grouped_fields([], [
                    'route_difficulty_psychological_claustrophobia',
                    'route_difficulty_objective_tightness',
                    'route_difficulty_wetness',
                    'route_difficulty_water_near_face',
                    'route_difficulty_exposure_to_deep_water',
                    'route_difficulty_muddiness',
                    'route_difficulty_exposure_to_heights',
                    'route_difficulty_technical_climbing_difficulty',
                    'route_difficulty_endurance',
                    'route_difficulty_objective_hazard'
                ]),
                'route_participants_skills_required' => $this->map_grouped_fields([], [
                    'route_participants_skills_required_srt_level' => ['type' => 'post'],
                    'route_participants_skills_required_horizontal_level' => ['type' => 'post']
                ]),
                'route_leading_difficulty' => $this->map_grouped_fields([], [
                    'route_leading_difficulty_srt_leading_level_required' => ['type' => 'post'],
                    'route_leading_difficulty_srt_leading_skills_required',
                    'route_leading_difficulty_horizontal_leading_level_required' => ['type' => 'post'],
                    'route_leading_difficulty_horizontal_leading_skills_required',
                    'route_leading_difficulty_navigation_difficulty'
                ]),
                'route_blurb' => '',
                'route_through_trip' => false,
                'route_exit_location_id' => null,
                'route_time_for_eta' => '',
                'route_survey_image' => null,
                'route_survey_link' => null,
                'route_route_description' => [],
                'route_trip_star_rating' => null,
                'route_group_tackle_required' => '',
                'route_personal_gear_required' => [],
                'route_additional_images' => []
            ]
        ];
    }

    private function map_grouped_fields($group_data, $fields) {
        $mapped = [];
        foreach ($fields as $key => $config) {
            if (is_numeric($key)) {
                $field_name = $config;
                $config = [];
            } else {
                $field_name = $key;
            }

            $value = $group_data[$field_name] ?? null;

            if ($config['type'] ?? null === 'post' && $value) {
                $mapped[$field_name] = $this->get_post_reference($value);
            } else {
                $mapped[$field_name] = $value;
            }
        }
        return $mapped;
    }

    private function get_post_reference($post_id) {
        $post = get_post($post_id);
        return $post ? [
            'ID' => $post->ID,
            'post_title' => $post->post_title,
            'post_name' => $post->post_name,
            'permalink' => get_permalink($post)
        ] : null;
    }

    private function get_location_data($location, $is_cache_request = false, $current_product_id = 0) {
        $post_ref = $this->get_post_reference($location);
        if (!$post_ref) return null;

        $location_id = $post_ref['ID'];
        $location_acf = get_fields($location_id);

        // Check if location has sensitive access
        $is_sensitive_access = (bool)($location_acf['location_sensitive_access'] ?? false);

        // Ensure user is authenticated before checking permissions
        if (!$is_cache_request) {
            $this->ensure_user_authenticated();
        }

        // Check user authentication and permissions
        // If it's a cache request, treat as not logged in
        $is_logged_in = !$is_cache_request && is_user_logged_in();
        $is_member = $is_logged_in && $this->is_member();


        // Check if user is signed up for this trip and has appropriate role
        $has_trip_leader_access = false;
        if ($is_logged_in && $is_member && $current_product_id > 0) {
            $user_id = get_current_user_id();
            error_log('Checking trip leader access for user: ' . $user_id . ' on product: ' . $current_product_id);

            // Get user participation from global variable
            global $user_trip_participation;

            // If global variable not set, try to get from function scope
            if (!isset($user_trip_participation) && function_exists('get_user_trip_participation')) {
                $user_trip_participation = get_user_trip_participation();
            }

            // If we have participation data for this product
            if (isset($user_trip_participation) && isset($user_trip_participation[$current_product_id])) {
                $participation = $user_trip_participation[$current_product_id];
                $cc_volunteer = strtolower((string)$participation['cc_volunteer']);
                $leader_roles = ['trip leader', 'trip director', 'trip organiser', 'director'];

                error_log('Role check: ' . $cc_volunteer);

                if ($cc_volunteer && (
                    strpos($cc_volunteer, 'director') !== false ||
                    strpos($cc_volunteer, 'leader') !== false ||
                    in_array($cc_volunteer, $leader_roles)
                )) {
                    $has_trip_leader_access = true;
                    error_log('TRIP LEADER ACCESS GRANTED for role: ' . $cc_volunteer);
                }
            } else {
                // Fallback to direct order check if pre-fetched data not available
                $orders = wc_get_orders([
                    'customer_id' => $user_id,
                    'limit' => -1,
                    'status' => ['pending', 'on-hold', 'processing', 'completed'],
                ]);

                foreach ($orders as $order) {
                    foreach ($order->get_items() as $item) {
                        $item_product = $item->get_product();
                        if ($item_product) {
                            $item_product_id = $item_product->get_parent_id() ?: $item_product->get_id();

                            if ($item_product_id == $current_product_id) {
                                $cc_volunteer = strtolower((string)$order->get_meta('cc_volunteer'));
                                $leader_roles = ['trip leader', 'trip director', 'trip organiser', 'director'];

                                if ($cc_volunteer && (
                                    strpos($cc_volunteer, 'director') !== false ||
                                    strpos($cc_volunteer, 'leader') !== false ||
                                    in_array($cc_volunteer, $leader_roles)
                                )) {
                                    $has_trip_leader_access = true;
                                    error_log('TRIP LEADER ACCESS GRANTED for role: ' . $cc_volunteer);
                                    break 2;
                                }
                            }
                        }
                    }
                }
            }

            if (!$has_trip_leader_access) {
                error_log('No trip leader access granted for user ' . $user_id . ' on product ' . $current_product_id);
            }
        }

        // Updated gallery processing
        $process_gallery = function($gallery) {
            if (!is_array($gallery)) return [];
            return array_map(function($img) {
                // Handle both image ID and image array formats
                $image_id = is_array($img) ? ($img['ID'] ?? 0) : $img;
                return $this->get_image_data($image_id);
            }, $gallery);
        };

        // Base location data that's always returned
        $location_data = [
            'id' => $location_id,
            'title' => $is_sensitive_access && !($is_logged_in && $is_member) ? 'A sensitive access location' : $post_ref['post_title'],
            'slug' => $is_sensitive_access && !($is_logged_in && $is_member) ? 'sensitive-access-location' : $post_ref['post_name'],
            'acf' => [
                'location_sensitive_access' => $is_sensitive_access,
                'location_caving_region' => $this->get_post_reference($location_acf['location_caving_region'] ?? 0),
            ]
        ];

        // If it's not a sensitive location OR user has appropriate access, return full data
        if (!$is_sensitive_access || $has_trip_leader_access || ($is_logged_in && $is_member)) {
            $location_data['acf']['location_name'] = $location_acf['location_name'] ?? '';

            // Add additional fields for members or trip leaders
            if (!$is_sensitive_access || $has_trip_leader_access) {
                $location_data['acf'] = array_merge($location_data['acf'], [
                    'location_parking_latlong' => $location_acf['location_parking_latlong'] ?? [],
                    'location_parking_description' => $location_acf['location_parking_description'] ?? '',
                    'location_parking_photos' => $process_gallery($location_acf['location_parking_photos'] ?? []),
                    'location_parking_entrance_route_description' => $location_acf['location_parking_entrance_route_description'] ?? '',
                    'location_map_from_parking_to_entrance' => $this->process_acf_image_field(
                        $location_acf['location_map_from_parking_to_entrance'] ?? null
                    ),
                    'location_entrance_latlong' => $location_acf['location_entrance_latlong'] ?? '',
                    'location_entrance_photos' => $process_gallery($location_acf['location_entrance_photos'] ?? []),
                    'location_info_url' => $location_acf['location_info_url'] ?? '',
                    'location_access_arrangement' => $location_acf['location_access_arrangement'] ?? [],
                    'location_access_url' => $location_acf['location_access_url'] ?? '',
                    'location_reference_links' => is_array($location_acf['location_reference_links'] ?? false) ?
                        array_map(function($link) {
                            return [
                                'link_title' => $link['location_reference_link_text'] ?? '',
                                'link_url' => $link['location_reference_link_url'] ?? ''
                            ];
                        }, $location_acf['location_reference_links']) : [],
                ]);
            }
        }

        return $location_data;
    }

    private function get_image_data($image_id) {
        if (!$image_id) return null;

        $image_post = get_post($image_id);
        if (!$image_post) return null;

        $meta = wp_get_attachment_metadata($image_id);
        $sizes_data = [];

        // Process each size to get the full URL
        if (!empty($meta['sizes'])) {
            foreach ($meta['sizes'] as $size_name => $size_info) {
                $src = wp_get_attachment_image_src($image_id, $size_name);
                if ($src) {
                    $sizes_data[$size_name] = [
                        'file' => $src[0], // Full URL to the resized image
                        'width' => $src[1],
                        'height' => $src[2],
                        'mime_type' => $size_info['mime-type'] ?? null
                    ];
                }
            }
        }

        return [
            'ID' => $image_id,
            'url' => wp_get_attachment_url($image_id),
            'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true),
            'caption' => wp_get_attachment_caption($image_id),
            'sizes' => $sizes_data
        ];
    }

    /**
     * Process ACF image field in various formats
     *
     * @param mixed $image_field ACF image field which could be ID, array with ID, or array with nested data
     * @return array|null Processed image data or null if invalid
     */
    private function process_acf_image_field($image_field) {
        // Handle array format (full ACF image array)
        if (is_array($image_field)) {
            // If we have a nested array from ACF group fields
            if (isset($image_field['ID'])) {
                return $this->get_image_data($image_field['ID']);
            }
            // Direct image ID may sometimes come as array value
            elseif (isset($image_field['id'])) {
                return $this->get_image_data($image_field['id']);
            }
        }
        // Handle numeric ID format
        elseif (is_numeric($image_field)) {
            return $this->get_image_data((int)$image_field);
        }

        // Default to empty image data
        return null;
    }

    /**
     * Prepare gallery data for API response
     *
     * @param array $gallery Array of image IDs
     * @return array Processed gallery data
     */
    private function prepare_gallery_data($gallery) {
        if (empty($gallery)) {
            return [];
        }

        $images = [];

        foreach ($gallery as $image_item) {
            // Check if the item is an array (ACF Image Array format) or just an ID
            $image_id = null;
            if (is_array($image_item) && isset($image_item['ID'])) {
                $image_id = $image_item['ID'];
            } elseif (is_numeric($image_item)) {
                $image_id = $image_item;
            }

            // If we have a valid ID, get the image data
            if ($image_id) {
                $image_data = $this->get_image_data($image_id);
                if ($image_data) {
                    $images[] = $image_data;
                }
            }
        }

        return $images;
    }


    private function get_product_categories($product) {
        $terms = get_the_terms($product->get_id(), 'product_cat');
        $categories = array();

        if ($terms && !is_wp_error($terms)) {
            foreach ($terms as $term) {
                $categories[] = array(
                    'id' => $term->term_id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'description' => $term->description
                );
            }
        }

        return $categories;
    }

    public function get_product_variations($request) {
        $product_id = $request['id'];
        $product = wc_get_product($product_id);

        if (!$product || !$product->is_type('variable')) {
            return new WP_Error(
                'invalid_product',
                __('Not a variable product', 'hybrid-headless'),
                ['status' => 400]
            );
        }

        $variations = [];
        foreach ($product->get_available_variations() as $variation) {
            $variation_product = wc_get_product($variation['variation_id']);
            $variations[] = [
                'id' => $variation['variation_id'],
                'attributes' => $variation['attributes'],
                'price' => $variation['display_price'],
                'regular_price' => $variation['display_regular_price'],
                'stock_quantity' => $variation_product->get_stock_quantity(),
                'stock_status' => $variation_product->get_stock_status(),
                'sku' => $variation_product->get_sku(),
            ];
        }

        return rest_ensure_response([
            'variations' => $variations,
            'user_status' => [
                'is_logged_in' => is_user_logged_in(),
                'is_member' => $this->is_member(),
            ]
        ]);
    }

    public function get_stock($request) {
        $variation_id = $request['variation_id'];
        $product = wc_get_product($variation_id);

        if (!$product) {
            return new WP_Error(
                'invalid_variation',
                __('Invalid product variation', 'hybrid-headless'),
                ['status' => 404]
            );
        }

        // TEMPORARY FIX: Force unauthenticated prices
        // This ensures we always return the non-discounted prices regardless of user auth status
        // We may want to revert this in the future to show personalized prices
        $current_user_id = get_current_user_id();
        wp_set_current_user(0); // Set to guest user temporarily

        $price_data = [
            'stock_quantity' => $product->get_stock_quantity(),
            'stock_status' => $product->get_stock_status(),
            'price' => $product->get_price(),
            'regular_price' => $product->get_regular_price(),
        ];

        // Restore the original user
        if ($current_user_id) {
            wp_set_current_user($current_user_id);
        }

        return rest_ensure_response($price_data);
    }


    /**
     * Ensures the user is properly authenticated by checking the auth cookie
     */
    private function ensure_user_authenticated() {
        return Hybrid_Headless_Auth_Utils::ensure_user_authenticated();
    }

    /**
     * Check if user is a member
     */
    private function is_member() {
        $user_id = get_current_user_id();
        return Hybrid_Headless_Auth_Utils::is_member($user_id);
    }

    public function get_product_stock($request) {
        $product_id = $request['id'];
        $product = wc_get_product($product_id);

        if (!$product) {
            return new WP_Error(
                'product_not_found',
                __('Product not found', 'hybrid-headless'),
                ['status' => 404]
            );
        }

        // Force no caching for stock data
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');

        // TEMPORARY FIX: Force unauthenticated prices
        // This ensures we always return the non-discounted prices regardless of user auth status
        // We may want to revert this in the future to show personalized prices
        $current_user_id = get_current_user_id();
        wp_set_current_user(0); // Set to guest user temporarily

        $stock_data = [
            'product_id' => $product_id,
            'stock_status' => $product->get_stock_status(),
            'stock_quantity' => $product->get_stock_quantity(),
            'price' => $product->get_price(),
            'regular_price' => $product->get_regular_price(),
            'sale_price' => $product->get_sale_price(),
            'variations' => []
        ];

        if ($product->is_type('variable')) {
            foreach ($product->get_available_variations() as $variation) {
                $variation_product = wc_get_product($variation['variation_id']);
                $stock_data['variations'][] = [
                    'id' => $variation['variation_id'],
                    'stock_quantity' => $variation_product->get_stock_quantity(),
                    'stock_status' => $variation_product->get_stock_status(),
                    'price' => $variation_product->get_price(),
                    'regular_price' => $variation_product->get_regular_price(),
                    'sale_price' => $variation_product->get_sale_price()
                ];
            }
        }

        // Restore the original user
        if ($current_user_id) {
            wp_set_current_user($current_user_id);
        }

        // Debug log
        error_log('Stock API response: ' . json_encode($stock_data));
        return rest_ensure_response($stock_data);
    }

    private function get_event_creation_args() {
        return array(
            'event_type' => array(
                'required' => true,
                'validate_callback' => function($param) {
                    // Allow all keys from the template map
                    $valid_types = array_keys([
                        'giggletrip' => 11579,
                        'overnight' => 11583,
                        'tuesday' => 11576,
                        'training' => 123,
                        'horizontal_training' => 12759,
                        'basic_srt' => 12758,
                        'known_location' => 11595,
                        'mystery' => 11576
                    ]);
                    return in_array($param, $valid_types);
                },
                'error' => __('Invalid event type. Valid types are: giggletrip, overnight, tuesday, training, horizontal_training, basic_srt, known_location, mystery', 'hybrid-headless')
            ),
            'event_start_date_time' => array(
                'required' => true,
                'validate_callback' => function($param) {
                    $date = DateTime::createFromFormat('Y-m-d H:i:s', $param);
                    return $date && $date->format('Y-m-d H:i:s') === $param;
                },
                'error' => __('Invalid date format. Use YYYY-MM-DD HH:MM:SS in UTC', 'hybrid-headless')
            ),
            'event_name' => array(
                'required' => true,
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function($param) {
                    return strlen($param) >= 5 && strlen($param) <= 100;
                },
                'error' => __('Event name must be between 5 and 100 characters', 'hybrid-headless')
            )
        );
    }

    public function check_woocommerce_permissions() {
        return Hybrid_Headless_Auth_Utils::check_woocommerce_permissions(null);
    }

    /**
     * Check if user has permission to create events
     *
     * @return bool|WP_Error
     */
    public function check_event_creation_permissions() {
        // Committee members can create events
        return Hybrid_Headless_Auth_Utils::check_committee_permissions(null);
    }

    /**
     * Create event product (v2 implementation with standard WP auth)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error
     */
    public function create_event_product_v2(WP_REST_Request $request) {
        // Log the request
        error_log('[Event Creation V2] Request received from user ID: ' . get_current_user_id());

        // Process the request using the same core logic
        return $this->create_event_product_core($request);
    }

    /**
     * Create event product (v1 implementation with WooCommerce auth)
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error
     */
    public function create_event_product(WP_REST_Request $request) {
        // Log the request
        error_log('[Event Creation V1] Request received');

        // Process the request using the shared core logic
        return $this->create_event_product_core($request);
    }

    /**
     * Core implementation of event product creation
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error
     */
    private function create_event_product_core(WP_REST_Request $request) {
        try {
            $template_map = [
                'giggletrip' => 11579,
                'overnight' => 11583,
                'training' => 123,
                'horizontal_training' => 12759,
                'basic_srt' => 12758,
                'known_location' => 11595,
                'mystery' => 11576
            ];

            $event_type = $request['event_type'];
            $template_id = $template_map[$event_type] ?? null;

            if (!$template_id || !get_post($template_id)) {
                return new WP_Error('invalid_template', 'Invalid event type', ['status' => 400]);
            }

            // Generate SKU components
            $event_date = new DateTime($request['event_start_date_time']);
            $sku_date = $event_date->format('Y-m-d');
            $base_sku = sprintf('%s-%s', $sku_date, $event_type);

            // Generate unique suffix with retry logic
            $new_sku = '';
            $retries = 0;
            $max_retries = 5;

            do {
                $unique_suffix = bin2hex(random_bytes(4)); // 8 character hex
                $new_sku = $base_sku . '-' . $unique_suffix;
                $retries++;
            } while ($retries <= $max_retries && $this->sku_exists($new_sku));

            if ($this->sku_exists($new_sku)) {
                throw new Exception(__('Failed to generate unique SKU after ' . $max_retries . ' attempts', 'hybrid-headless'));
            }

            // Duplicate the template product
            $new_product_id = $this->duplicate_product($template_id);

            if (is_wp_error($new_product_id)) {
                return $new_product_id;
            }

            // Update product data with new SKU
            $this->update_product_data($new_product_id, [
                'name' => $request['event_name'],
                'slug' => sanitize_title($request['event_name'] . ' ' . $sku_date),
                'status' => 'draft',
                'sku' => $new_sku
            ]);

            // Update ACF fields
            update_field('event_start_date_time', $request['event_start_date_time'], $new_product_id);
            update_field('event_type', $event_type, $new_product_id);

            // Copy membership discounts
            $this->copy_membership_discounts($template_id, $new_product_id);

            // Get the creator's user ID
            $creator_id = get_current_user_id();
            if ($creator_id) {
                // Store the creator's ID as post meta
                update_post_meta($new_product_id, '_event_created_by', $creator_id);

                // Log the creation
                error_log(sprintf(
                    '[Event Creation] User %d created event %d of type %s',
                    $creator_id,
                    $new_product_id,
                    $event_type
                ));
            }

            return rest_ensure_response([
                'product_id' => $new_product_id,
                'edit_url' => get_edit_post_link($new_product_id, ''),
                'event_type' => $event_type,
                'event_start_date_time' => $request['event_start_date_time'],
                'event_name' => $request['event_name'],
                'created_at' => current_time('mysql'),
                'status' => 'draft'
            ]);
        } catch (Exception $e) {
            error_log('[Event Creation Critical] ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return new WP_Error(
                'creation_failed',
                __('Event creation failed: ', 'hybrid-headless') . $e->getMessage(),
                array('status' => 500)
            );
        }
    }

    private function duplicate_product($template_id) {
        $template_product = wc_get_product($template_id);

        if (!$template_product || !in_array($template_product->get_status(), ['publish', 'draft'])) {
            error_log('[Template Validation] Invalid template product');
            return new WP_Error('invalid_template', 'Invalid template product');
        }

        try {
            // Create new product
            $new_product = clone $template_product;
            $new_product->set_id(0);

            // Reset critical properties
            $current_time = current_time('mysql', true); // GMT time
            $new_product->set_props([
                'date_created' => $current_time,
                'date_modified' => $current_time,
                'total_sales' => 0,
                'stock_quantity' => null,
                'sku' => '' // Will be set later
            ]);

            $new_product_id = $new_product->save();

            // Copy variations
            foreach ($template_product->get_children() as $variation_id) {
                $this->duplicate_variation($variation_id, $new_product_id);
            }

            // Copy filtered meta
            $this->copy_product_meta($template_id, $new_product_id);

            // Canary check 1: Verify SKU was reset
            if (get_post_meta($new_product_id, '_sku', true) === $template_product->get_sku()) {
                error_log('[Canary] SKU duplication detected');
            }

            // Canary check 2: Verify template marker removed
            if (get_post_meta($new_product_id, '_is_event_template', true)) {
                error_log('[Canary] Template marker not removed');
            }

            error_log(sprintf(
                '[Duplication Success] Created product %d from template %d',
                $new_product_id,
                $template_id
            ));

            return $new_product_id;

        } catch (Exception $e) {
            error_log('[Event Creation Error] ' . $e->getMessage());
            return new WP_Error(
                'product_creation',
                __('Failed to create event product', 'hybrid-headless'),
                array('status' => 500)
            );
        }
    }

    private function generate_temp_sku() {
        return 'TEMP-' . uniqid();
    }

    private function duplicate_variation($variation_id, $new_parent_id) {
        $variation = wc_get_product($variation_id);

        $new_variation = clone $variation;
        $new_variation->set_props([
            'parent_id' => $new_parent_id,
            'id' => 0
        ]);

        // Preserve stock data
        $new_variation->set_stock_quantity($variation->get_stock_quantity());
        $new_variation->set_stock_status($variation->get_stock_status());

        $new_variation_id = $new_variation->save();

        // Copy variation meta
        $this->copy_variation_meta($variation_id, $new_variation_id);
    }

    private function copy_variation_meta($source_id, $destination_id) {
        $excluded = ['_sumo_pp_*', '_yoast_*'];
        $meta = get_post_meta($source_id);

        foreach ($meta as $key => $values) {
            foreach ($excluded as $pattern) {
                if (fnmatch($pattern, $key)) continue 2;
            }
            update_post_meta($destination_id, $key, maybe_unserialize($values[0]));
        }
    }

    private function copy_product_meta($source_id, $destination_id) {
        $excluded_patterns = [
            // Core WC
            '_sku', 'total_sales', '_stock_quantity', '_wc_*',
            // Third-party
            '_sumo_pp_*', '_yoast_*', 'wppb-*',
            // Template markers
            '_is_event_template', '_template_version'
        ];

        $meta = get_post_meta($source_id);

        foreach ($meta as $key => $values) {
            // Skip excluded patterns
            foreach ($excluded_patterns as $pattern) {
                if (fnmatch($pattern, $key)) {
                    continue 2;
                }
            }

            $value = maybe_unserialize($values[0]);

            // Special handling for price
            if ($key === '_price') {
                update_post_meta($destination_id, $key, '');
            } else {
                update_post_meta($destination_id, $key, $value);
            }
        }

        // Canary log
        error_log(sprintf(
            '[Meta Copy] Copied %d meta fields, excluded %d patterns',
            count($meta),
            count($excluded_patterns)
        ));
    }

    private function copy_membership_discounts($source_id, $destination_id) {
        if (!function_exists('wc_memberships_get_membership_plans')) return;

        foreach (wc_memberships_get_membership_plans() as $plan) {
            try {
                $rules = $plan->get_rules('purchasing_discount');
                $modified = false;

                foreach ($rules as $rule) {
                    $object_ids = $rule->get_object_ids();

                    if (in_array($source_id, $object_ids) && !in_array($destination_id, $object_ids)) {
                        // Add new product to existing rule
                        $object_ids[] = $destination_id;
                        $rule->set_object_ids(array_unique($object_ids));
                        $modified = true;
                    }
                }

                if ($modified) {
                    // Validate rule changes
                    error_log("[Membership] Updated plan {$plan->get_id()} rules");
                    $plan->compact_rules(); // Critical for persistence
                }

            } catch (Exception $e) {
                error_log('[Membership Error] ' . $e->getMessage());
            }
        }
    }

    private function copy_product_terms($source_id, $destination_id) {
        $taxonomies = get_object_taxonomies('product');

        foreach ($taxonomies as $taxonomy) {
            $terms = wp_get_object_terms($source_id, $taxonomy);
            wp_set_object_terms($destination_id, wp_list_pluck($terms, 'term_id'), $taxonomy);
        }
    }

    private function update_product_data($product_id, $data) {
        $product = wc_get_product($product_id);

        foreach ($data as $key => $value) {
            $setter = "set_$key";
            if (method_exists($product, $setter)) {
                $product->$setter($value);
            }
        }

        $product->save();
    }

    private function sku_exists($sku) {
        global $wpdb;

        $product_id = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT post_id FROM $wpdb->postmeta
                WHERE meta_key = '_sku'
                AND meta_value = %s
                LIMIT 1",
                $sku
            )
        );

        return $product_id !== null;
    }
}
