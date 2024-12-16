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
        );

        if ( ! empty( $request['category'] ) ) {
            $args['tax_query'] = array(
                array(
                    'taxonomy' => 'product_cat',
                    'field'    => 'slug',
                    'terms'    => $request['category'],
                ),
            );
        }

        $query = new WP_Query( $args );
        $products = array();

        foreach ( $query->posts as $post ) {
            $product = wc_get_product( $post );
            $products[] = $this->prepare_product_data( $product );
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

        return rest_ensure_response( $this->prepare_product_data( $product ) );
    }

    /**
     * Prepare product data
     *
     * @param WC_Product $product Product object.
     * @return array
     */
    private function prepare_product_data( $product ) {
        return array(
            'id'          => $product->get_id(),
            'name'        => $product->get_name(),
            'slug'        => $product->get_slug(),
            'price'       => $product->get_price(),
            'regular_price' => $product->get_regular_price(),
            'sale_price' => $product->get_sale_price(),
            'stock_status' => $product->get_stock_status(),
            'stock_quantity' => $product->get_stock_quantity(),
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
}
