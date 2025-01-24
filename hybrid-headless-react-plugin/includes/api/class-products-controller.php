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
                $products[] = $this->prepare_product_data( $product );
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
    private function prepare_product_data( $product ) {
        // Cache stock info for 30 seconds
        $cache_key = 'product_stock_' . $product->get_id();
        $stock_info = wp_cache_get($cache_key);
        
        if (false === $stock_info) {
            $stock_info = array(
                'stock_status' => $product->get_stock_status(),
                'stock_quantity' => $product->get_stock_quantity()
            );
            wp_cache_set($cache_key, $stock_info, '', 30);
        }

        return array(
            'id'          => $product->get_id(),
            'name'        => $product->get_name(),
            'slug'        => $product->get_slug(),
            'price'       => $product->get_price(),
            'regular_price' => $product->get_regular_price(),
            'sale_price' => $product->get_sale_price(),
            'stock_status' => $stock_info['stock_status'],
            'stock_quantity' => $stock_info['stock_quantity'],
            'description' => $product->get_description(),
            'short_description' => $product->get_short_description(),
            'images'      => $this->get_product_images( $product ),
            'categories' => $this->get_product_categories( $product ),
            'acf'        => get_fields( $product->get_id() ),
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
        $params = $request->get_params();
        
        try {
            WC()->cart->add_to_cart(
                $params['product_id'],
                $params['quantity'],
                $params['variation_id'],
                [],
                ['is_member' => $this->is_member()]
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

    public function check_cart_permissions() {
        return is_user_logged_in();
    }
}
