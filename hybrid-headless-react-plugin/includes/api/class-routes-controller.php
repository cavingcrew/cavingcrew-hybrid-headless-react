<?php
/**
 * Routes REST Controller
 *
 * @package HybridHeadless
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Routes Controller Class
 */
class Hybrid_Headless_Routes_Controller {
    /**
     * Constructor
     */
    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
        add_action( 'template_redirect', array( $this, 'handle_frontend_routes' ) );
    }

    /**
     * Register routes
     */
    public function register_routes() {
        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/routes',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_routes' ),
                    'permission_callback' => '__return_true',
                ),
            )
        );
    }

    /**
     * Get available routes
     *
     * @return WP_REST_Response
     */
    public function get_routes() {
        return rest_ensure_response(
            array(
                'frontend' => $this->get_frontend_routes(),
                'wordpress' => $this->get_wordpress_routes(),
            )
        );
    }

    /**
     * Get frontend (Next.js) routes
     *
     * @return array
     */
    private function get_frontend_routes() {
        return array(
            'home'       => '/',
            'trips'      => '/trips',
            'trip'       => '/trips/{slug}',
            'categories' => '/categories',
            'category'   => '/categories/{slug}',
        );
    }

    /**
     * Get WordPress routes
     *
     * @return array
     */
    private function get_wordpress_routes() {
        return array(
            'account'  => '/my-account',
            'checkout' => '/checkout',
            'cart'     => '/cart',
            'login'    => '/wp-login.php',
            'admin'    => '/wp-admin',
        );
    }

    /**
     * Handle frontend routes
     */
    public function handle_frontend_routes() {
        global $wp;
        
        // Check if current route should be handled by Next.js
        if ( $this->is_frontend_route( $wp->request ) ) {
            // Serve the Next.js app
            $this->serve_nextjs_app();
            exit;
        }
    }

    /**
     * Serve the Next.js application
     */
    private function serve_nextjs_app() {
        $next_app_path = HYBRID_HEADLESS_PLUGIN_DIR . 'dist/index.html';
        
        if ( file_exists( $next_app_path ) ) {
            // Set headers for static files
            header( 'Content-Type: text/html; charset=UTF-8' );
            header( 'Cache-Control: public, max-age=3600' );
            
            // Output the Next.js app
            readfile( $next_app_path );
        } else {
            // Fallback if Next.js app is not built
            status_header( 404 );
            include( get_404_template() );
        }
    }

    /**
     * Check if route should be handled by frontend
     *
     * @param string $route Current route.
     * @return boolean
     */
    private function is_frontend_route( $route ) {
        $frontend_patterns = array(
            '^trips/?',
            '^trips/[^/]+/?',
            '^categories/?',
            '^categories/[^/]+/?',
        );

        foreach ( $frontend_patterns as $pattern ) {
            if ( preg_match( "#{$pattern}#", $route ) ) {
                return true;
            }
        }

        // Homepage check
        if ( empty( $route ) && get_option( 'hybrid_headless_frontend_homepage', false ) ) {
            return true;
        }

        return false;
    }
}
