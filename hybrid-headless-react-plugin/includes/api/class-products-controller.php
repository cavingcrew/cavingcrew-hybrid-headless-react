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

        return array(
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
            'acf' => get_fields($product->get_id()),
            'variations' => $stock_info['variations'],
            'has_variations' => $stock_info['has_variations'],
            'is_variable' => $stock_info['is_variable'],
            'purchasable' => $stock_info['purchasable']
        );
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

    private function get_product_categories( $product ) {
        $terms = get_the_terms( $product->get_id(), 'product_cat' );
        $categories = array();

        if ( $terms && ! is_wp_error( $terms ) ) {
            foreach ( $terms as $term ) {
                $categories[] = array(
                    'id'          => $term->term_id,
                    'name'        => $term->name,
                    'slug'        => $term->slug,
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
                    return in_array($param, ['giggletrip', 'overnight', 'tuesday', 'training']);
                },
                'error' => __('Invalid event type. Must be one of: giggletrip, overnight, tuesday, training', 'hybrid-headless')
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
                'tuesday' => 11576,
                'training' => 123
            ];

            $event_type = $request['event_type'];
            $template_id = $template_map[$event_type] ?? null;

            if (!$template_id || !get_post($template_id)) {
                return new WP_Error('invalid_template', 'Invalid event type', ['status' => 400]);
            }

            // Duplicate the template product
            $new_product_id = $this->duplicate_product($template_id);

            if (is_wp_error($new_product_id)) {
                return $new_product_id;
            }

            // Update product data
            $this->update_product_data($new_product_id, [
                'name' => $request['event_name'],
                'slug' => sanitize_title($request['event_name'] . ' ' . date('Y-m-d', strtotime($request['event_start_date_time']))),
                'status' => 'draft'
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
     error_log('[Template Check] Template status: ' . $template_product->get_status());
     return new WP_Error(
         'invalid_template',
         __('Template product not found or not in publish/draft state', 'hybrid-headless'),
         array('status' => 400)
     );
 }

        try {
            $new_product = new WC_Product();
            $new_product->set_props($template_product->get_data());
            $new_product->set_status('draft');
            $new_product->set_name('Copy of ' . $template_product->get_name());

            // Generate unique SKU
            $base_sku = $template_product->get_sku();
            $new_sku = date('Y-m-d') . '-' . $base_sku . '-' . uniqid();
            $new_product->set_sku($new_sku);

            $new_product_id = $new_product->save();

            if (!$new_product_id) {
                throw new Exception(__('Failed to create new product', 'hybrid-headless'));
            }

            // Copy meta data and terms
            $this->copy_product_meta($template_id, $new_product_id);
            $this->copy_product_terms($template_id, $new_product_id);

            // Log creation
            error_log(sprintf(
                '[Event Creation] New product %d created from template %d with SKU %s',
                $new_product_id,
                $template_id,
                $new_sku
            ));

            do_action('hybrid_headless_event_created', $new_product_id, $template_id);

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

    private function copy_product_meta($source_id, $destination_id) {
        global $wpdb;

        $meta_data = $wpdb->get_results($wpdb->prepare(
            "SELECT meta_key, meta_value FROM $wpdb->postmeta WHERE post_id = %d",
            $source_id
        ));

        foreach ($meta_data as $meta) {
            if ($meta->meta_key === '_sku') {
                // Generate new SKU
                update_post_meta($destination_id, '_sku',
                    date('Y-m-d') . '-' . $meta->meta_value . '-' . uniqid()
                );
            } else {
                update_post_meta($destination_id, $meta->meta_key, $meta->meta_value);
            }
        }
    }

    private function copy_membership_discounts($source_id, $destination_id) {
        // Check if Memberships is active
        if (!function_exists('wc_memberships') || !function_exists('wc_memberships_get_membership_plans')) {
            error_log('[Membership Discounts] WooCommerce Memberships not active');
            return;
        }

        foreach (wc_memberships_get_membership_plans() as $plan) {
            try {
                $rules = $plan->get_rules('purchasing_discount');
                
                foreach ($rules as $rule) {
                    $rule_product_ids = $rule->get_object_ids();
                    
                    if (in_array($source_id, $rule_product_ids, true) && $rule->is_active()) {
                        // Create new rule configuration
                        $new_rule = [
                            'rule_type' => 'purchasing_discount',
                            'object_ids' => array($destination_id),
                            'active' => $rule->is_active(),
                            'discount_type' => $rule->get_discount_type(),
                            'discount_amount' => $rule->get_discount_amount(),
                            'access_schedule' => $rule->get_access_schedule(),
                            'access_schedule_exclude_trial' => $rule->is_access_schedule_excluding_trial(),
                            'content_type' => 'post_type',
                            'content_type_name' => 'product'
                        ];

                        // Get existing rules and add new one
                        $existing_rules = $plan->get_rules();
                        $existing_rules[] = $new_rule;

                        // Save using core Memberships API
                        $plan->set_rules($existing_rules);
                        $plan->compact_rules();
                        $plan->save();

                        error_log("[Membership Discount] Copied rule from {$source_id} to {$destination_id}");
                    }
                }
            } catch (Exception $e) {
                error_log("[Membership Error] {$e->getMessage()}");
                continue;
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
}
