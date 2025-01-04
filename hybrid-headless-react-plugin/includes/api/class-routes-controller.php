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
        $build_path = get_option('hybrid_headless_build_path', 'dist');
        $request_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $file_path = HYBRID_HEADLESS_PLUGIN_DIR . $build_path . $request_path;

        // Handle static files (_next/static/*)
        if (strpos($request_path, '_next/static/') !== false) {
            $this->serve_static_file($file_path);
            return;
        }

        // Serve index.html for app routes
        $index_path = HYBRID_HEADLESS_PLUGIN_DIR . $build_path . '/index.html';
        if (file_exists($index_path)) {
            header('Content-Type: text/html; charset=UTF-8');
            header('Cache-Control: public, max-age=3600');
            readfile($index_path);
        } else {
            $template = get_404_template();
            if (!empty($template) && file_exists($template)) {
                include($template);
            } else {
                // Fallback to a simple 404 message
                status_header(404);
                nocache_headers();
                echo '<h1>404 - Page Not Found</h1>';
                exit;
            }
        }
    }

    /**
     * Serve static files with appropriate headers
     *
     * @param string $file_path Path to static file
     */
    private function serve_static_file($file_path) {
        if (!file_exists($file_path)) {
            status_header(404);
            return;
        }

        $mime_types = array(
            'css' => 'text/css',
            'js' => 'application/javascript',
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'json' => 'application/json',
        );

        $ext = pathinfo($file_path, PATHINFO_EXTENSION);
        $mime_type = isset($mime_types[$ext]) ? $mime_types[$ext] : 'application/octet-stream';

        header('Content-Type: ' . $mime_type);
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($file_path);
    }

    /**
     * Check if route should be handled by frontend
     *
     * @param string $route Current route.
     * @return boolean
     */
    private function is_frontend_route( $route ) {
        $frontend_patterns = array(
            '^_next/',
            '^trips/?',
            '^trips/[^/]+/?',
            '^categories/?',
            '^categories/[^/]+/?',
        );

        // Add _next/ to the patterns
        if (strpos($route, '_next/') === 0) {
            return true;
        }

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
