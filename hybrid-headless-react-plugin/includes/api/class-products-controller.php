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
                'default'           => 30,
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
                array(
                    'taxonomy' => 'product_visibility',
                    'field'    => 'name',
                    'terms'    => array('exclude-from-catalog', 'exclude-from-search'),
                    'operator' => 'NOT IN',
                ),
            ),
            'post_status'    => 'publish',
        );

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
                $prepared = $this->prepare_product_data( $product );
                // Add variation count for listings
                $prepared['variation_count'] = count($prepared['variations']);
                $products[] = $prepared;
            }
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
     * @return array
     */
    private function prepare_product_data($product) {
        $cache_key = 'product_stock_' . $product->get_id();
        $stock_info = wp_cache_get($cache_key);

        // Get ACF fields
        $acf_fields = get_fields($product->get_id());

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
            'purchasable' => $stock_info['purchasable']
        );

        // Add route data if available
        if (!empty($acf_fields['event_route_id'])) {
            $product_data['route'] = $this->get_route_data($acf_fields['event_route_id']);
        } elseif (!empty($acf_fields['event_cave_id'])) {
            $product_data['route'] = $this->get_cave_as_route($acf_fields['event_cave_id']);
        }

        // Add hut data if available
        if (!empty($acf_fields['hut_id'])) {
            $product_data['hut'] = $this->get_hut_data($acf_fields['hut_id']);
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
            $images[] = array(
                'id'  => $attachment_id,
                'src' => wp_get_attachment_url( $attachment_id ),
                'alt' => get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ),
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
            'hut_image' => $this->get_hut_image_data($hut_acf['hut_image'] ?? 0),
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

    private function get_hut_image_data($image_id) {
        if (!$image_id) return null;
        
        return [
            'ID' => $image_id,
            'url' => wp_get_attachment_url($image_id),
            'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true),
            'caption' => wp_get_attachment_caption($image_id)
        ];
    }

    private function get_route_data($route_id) {
        $post_ref = $this->get_post_reference($route_id);
        if (!$post_ref) return null;

        $route_acf = get_fields($post_ref['ID']);
        
        return [
            'id' => $post_ref['ID'],
            'title' => $post_ref['post_title'],
            'acf' => [
                'route_name' => $route_acf['route_name'] ?? '',
                'route_blurb' => $route_acf['route_blurb'] ?? '',
                'route_entrance_location_id' => $this->get_location_data($route_acf['route_entrance_location_id'] ?? 0),
                'route_through_trip' => $route_acf['route_through_trip'] ?? false,
                'route_exit_location_id' => $this->get_location_data($route_acf['route_exit_location_id'] ?? 0),
                'route_time_for_eta' => $route_acf['route_time_for_eta'] ?? '',
                'route_survey_image' => $this->get_image_data($route_acf['route_survey_image'] ?? 0),
                'route_survey_link' => $route_acf['route_survey_link'] ?? null,
                'route_route_description' => !empty($route_acf['route_route_description']) ? 
                    array_shift($route_acf['route_route_description']) : 
                    null,
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
                'route_group_tackle_required' => $route_acf['route_group_tackle_required'] ?? '',
                'route_personal_gear_required' => $route_acf['route_personal_gear_required'] ?? [],
                'route_leading_difficulty' => $this->map_grouped_fields($route_acf['route_leading_difficulty'] ?? [], [
                    'route_leading_difficulty_srt_leading_level_required' => ['type' => 'post'],
                    'route_leading_difficulty_srt_leading_skills_required',
                    'route_leading_difficulty_horizontal_leading_level_required' => ['type' => 'post'],
                    'route_leading_difficulty_horizontal_leading_skills_required',
                    'route_leading_difficulty_navigation_difficulty'
                ]),
                'route_additional_images' => array_map(function($img) {
                    return $this->get_image_data($img['image'] ?? 0);
                }, $route_acf['route_additional_images'] ?? [])
            ]
        ];
    }

    private function get_cave_as_route($cave_id) {
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

    private function get_location_data($location) {
        $post_ref = $this->get_post_reference($location);
        if (!$post_ref) return null;
        
        $location_id = $post_ref['ID'];
        $location_acf = get_fields($location_id);
        
        return [
            'id' => $location_id,
            'title' => $post_ref['post_title'],
            'slug' => $post_ref['post_name'],
            'acf' => [
                'location_name' => $location_acf['location_name'] ?? '',
                'location_poi_nearby' => $location_acf['location_poi_nearby'] ?? '',
                'location_caving_region' => $this->get_post_reference($location_acf['location_caving_region'] ?? 0),
                'location_parking_latlong' => $location_acf['location_parking_latlong'] ?? [],
                'location_parking_description' => $location_acf['location_parking_description'] ?? '',
                'location_parking_entrance_route_description' => $location_acf['location_parking_entrance_route_description'] ?? '',
                'location_map_from_parking_to_entrance' => $this->get_image_data($location_acf['location_map_from_parking_to_entrance'] ?? 0),
                'location_entrance_latlong' => $location_acf['location_entrance_latlong'] ?? '',
                'location_info_url' => $location_acf['location_info_url'] ?? '',
                'location_access_arrangement' => $location_acf['location_access_arrangement'] ?? [],
                'location_access_url' => $location_acf['location_access_url'] ?? '',
                'location_reference_links' => array_map(function($link) {
                    return [
                        'link_title' => $link['link_title'] ?? '',
                        'link_url' => $link['link_url'] ?? ''
                    ];
                }, $location_acf['location_reference_links'] ?? []),
                'location_sensitive_access' => (bool)($location_acf['location_sensitive_access'] ?? false)
            ]
        ];
    }

    private function get_image_data($image_id) {
        if (!$image_id) return null;
        
        return [
            'ID' => $image_id,
            'url' => wp_get_attachment_url($image_id),
            'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true),
            'caption' => wp_get_attachment_caption($image_id)
        ];
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

        return rest_ensure_response([
            'stock_quantity' => $product->get_stock_quantity(),
            'stock_status' => $product->get_stock_status(),
            'price' => $product->get_price(),
            'regular_price' => $product->get_regular_price(),
        ]);
    }


    private function is_member() {
        if (!is_user_logged_in()) return false;
        $user_id = get_current_user_id();
        return (bool) get_user_meta($user_id, 'cc_member', true);
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

        $stock_data = [
            'product_id' => $product_id,
            'stock_status' => $product->get_stock_status(),
            'stock_quantity' => $product->get_stock_quantity(),
            'variations' => []
        ];

        if ($product->is_type('variable')) {
            foreach ($product->get_available_variations() as $variation) {
                $variation_product = wc_get_product($variation['variation_id']);
                $stock_data['variations'][] = [
                    'id' => $variation['variation_id'],
                    'stock_quantity' => $variation_product->get_stock_quantity(),
                    'stock_status' => $variation_product->get_stock_status()
                ];
            }
        }

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
        if (!current_user_can('manage_woocommerce')) {
            return new WP_Error(
                'woocommerce_rest_cannot_create',
                __('Sorry, you cannot create resources.', 'hybrid-headless'),
                array('status' => rest_authorization_required_code())
            );
        }
        return true;
    }

    public function create_event_product(WP_REST_Request $request) {
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

            return rest_ensure_response([
                'product_id' => $new_product_id,
                'edit_url' => get_edit_post_link($new_product_id, '')
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
