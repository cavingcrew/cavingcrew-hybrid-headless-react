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
            '/cart',
            [
                'methods' => 'POST',
                'callback' => [$this, 'add_to_cart'],
                'permission_callback' => [$this, 'check_cart_permissions'],
                'args' => [
                    'product_id' => ['required' => true, 'type' => 'integer'],
                    'variation_id' => ['required' => true, 'type' => 'integer'],
                    'quantity' => ['default' => 1, 'type' => 'integer']
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
                'default'           => 10,
                'sanitize_callback' => 'absint',
            ),
            'category' => array(
                'default'           => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
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
                    'id'   => $term->term_id,
                    'name' => $term->name,
                    'slug' => $term->slug,
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

    public function add_to_cart($request) {
        if (null === WC()->cart) {
            WC()->frontend_includes();
            WC()->session = new WC_Session_Handler();
            WC()->session->init();
            WC()->cart = new WC_Cart();
            WC()->customer = new WC_Customer();
        }
        
        $params = $request->get_params();
        $user_id = get_current_user_id();
        $is_member = (bool) get_user_meta($user_id, 'cc_member', true);
        
        try {
            WC()->cart->add_to_cart(
                $params['product_id'],
                $params['quantity'],
                $params['variation_id'],
                [],
                ['is_member' => $is_member] // Pass actual membership status
            );

            return rest_ensure_response([
                'success' => true,
                'cart_url' => wc_get_cart_url()
            ]);
        } catch (Exception $e) {
            return new WP_Error(
                'cart_error',
                $e->getMessage(),
                ['status' => 400]
            );
        }
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
                    'variation_id' => $variation['variation_id'],
                    'stock_quantity' => $variation_product->get_stock_quantity(),
                    'stock_status' => $variation_product->get_stock_status()
                ];
            }
        }
        
        return rest_ensure_response($stock_data);
    }

    public function check_cart_permissions($request) {
        $params = $request->get_params();
        $product = wc_get_product($params['product_id']);
        
        // Corrected meta key from 'event_non-members-welcome' to 'event_non_members_welcome'
        $non_members_welcome = $product ? get_post_meta($product->get_id(), 'event_non_members_welcome', true) : false;

        if (!is_user_logged_in()) {
            if ($non_members_welcome !== 'yes') {
                return false;
            }
        } else {
            // If product requires membership, check user status
            if ($non_members_welcome !== 'yes') {
                $user_id = get_current_user_id();
                $is_member = (bool) get_user_meta($user_id, 'cc_member', true);
                if (!$is_member) {
                    return false;
                }
            }
        }
        
        return apply_filters('hybrid_headless_cart_permissions', true, $request);
    }
}
