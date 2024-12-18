<?php
/**
 * Categories REST Controller
 *
 * @package HybridHeadless
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Categories Controller Class
 */
class Hybrid_Headless_Categories_Controller {
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
            '/categories',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_categories' ),
                    'permission_callback' => '__return_true',
                ),
            )
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/categories/(?P<slug>[a-zA-Z0-9-]+)',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_category' ),
                    'permission_callback' => '__return_true',
                ),
            )
        );
    }

    /**
     * Get categories
     *
     * @return WP_REST_Response
     */
    public function get_categories() {
        $terms = get_terms(array(
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
        ));

        if (is_wp_error($terms)) {
            return new WP_Error(
                'no_categories',
                __('No categories found', 'hybrid-headless'),
                array('status' => 404)
            );
        }

        $categories = array_map(function($term) {
            return $this->prepare_category_data($term);
        }, $terms);

        return rest_ensure_response($categories);
    }

    /**
     * Get single category
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response
     */
    public function get_category($request) {
        $term = get_term_by('slug', $request['slug'], 'product_cat');

        if (!$term) {
            return new WP_Error(
                'category_not_found',
                __('Category not found', 'hybrid-headless'),
                array('status' => 404)
            );
        }

        return rest_ensure_response($this->prepare_category_data($term));
    }

    /**
     * Prepare category data
     *
     * @param WP_Term $term Term object.
     * @return array
     */
    private function prepare_category_data($term) {
        $thumbnail_id = get_term_meta($term->term_id, 'thumbnail_id', true);
        
        return array(
            'id' => $term->term_id,
            'name' => $term->name,
            'slug' => $term->slug,
            'description' => $term->description,
            'count' => $term->count,
            'image' => $thumbnail_id ? wp_get_attachment_url($thumbnail_id) : null,
            'acf' => get_fields($term) // If using ACF
        );
    }
}
