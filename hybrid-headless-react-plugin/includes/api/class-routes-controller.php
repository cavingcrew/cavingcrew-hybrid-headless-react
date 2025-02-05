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
            'test'       => '/test-client-nav'
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
        $request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Check if this is a static file request
        if (strpos($request_uri, '/_next/static/') === 0) {
            if (!$this->is_valid_static_file_path($request_uri)) {
                status_header(403);
                return;
            }
            $this->serve_static_file($request_uri);
            return;
        }
        
        // If not a static file, proxy to Next.js
        $nextjs_url = get_option('hybrid_headless_nextjs_url', HYBRID_HEADLESS_DEFAULT_NEXTJS_URL);
        $decoded_path = urldecode($request_uri);
        $proxy_url = rtrim($nextjs_url, '/') . $decoded_path;
        
        // Set up request arguments
        $args = array(
            'timeout' => 30,
            'headers' => array(
                'X-Forwarded-Host' => $_SERVER['HTTP_HOST'],
                'X-Forwarded-Proto' => isset($_SERVER['HTTPS']) ? 'https' : 'http',
                'X-Real-IP' => $_SERVER['REMOTE_ADDR'],
                'X-Forwarded-For' => $_SERVER['REMOTE_ADDR'],
                'Accept' => $_SERVER['HTTP_ACCEPT'] ?? '*/*',
                'Accept-Language' => $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '',
                'User-Agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            ),
        );
        
        // Make the request to Next.js server
        $response = wp_remote_get($proxy_url, $args);
        
        // Handle errors
        if (is_wp_error($response)) {
            status_header(500);
            return;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        // Handle 404s
        if ($status_code === 404) {
            status_header(404);
            return;
        }
        
        // Forward all headers except those that could cause issues
        $headers = wp_remote_retrieve_headers($response);
        foreach ($headers as $key => $value) {
            if (!in_array(strtolower($key), ['transfer-encoding', 'content-encoding', 'content-length'])) {
                header("$key: $value");
            }
        }
        
        // Set the status code
        status_header($status_code);
        
        // Output the response body
        echo wp_remote_retrieve_body($response);
        exit;
    }

    /**
     * Serve static files with appropriate headers
     *
     * @param string $file_path Path to static file
     */
    private function is_valid_static_file_path($path) {
        // Prevent directory traversal
        if (strpos($path, '..') !== false) {
            return false;
        }

        // Only allow specific characters in the path
        if (!preg_match('/^\/_next\/static\/[a-zA-Z0-9\-_\/\.%]+$/', $path)) {
            return false;
        }

        return true;
    }

    private function serve_static_file($request_uri) {
        // Decode the URL-encoded path
        $decoded_path = urldecode($request_uri);
        
        // Remove any query parameters
        $clean_path = parse_url($decoded_path, PHP_URL_PATH);
        
        // Build the full file path
        $static_file_path = HYBRID_HEADLESS_STATIC_DIR . $clean_path;
        
        if (!file_exists($static_file_path)) {
            status_header(404);
            return;
        }

        $mime_types = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject',
        ];

        $extension = strtolower(pathinfo($static_file_path, PATHINFO_EXTENSION));
        $mime_type = $mime_types[$extension] ?? 'application/octet-stream';

        header('Content-Type: ' . $mime_type);
        header('Content-Length: ' . filesize($static_file_path));
        readfile($static_file_path);
        exit;
    }

    /**
     * Check if route should be handled by frontend
     *
     * @param string $route Current route.
     * @return boolean
     */
    private function is_frontend_route($route) {
        // Always proxy _next/ requests and RSC requests
        if (strpos($route, '_next/') === 0 || 
            strpos($_SERVER['REQUEST_URI'], '_rsc=') !== false) {
            return true;
        }

        $frontend_patterns = array(
            '^trips/?',
            '^trips/[^/]+/?',
            '^categories/?',
            '^categories/[^/]+/?',
            '^test-client-nav/?$'
        );

        foreach ($frontend_patterns as $pattern) {
            if (preg_match("#{$pattern}#", $route)) {
                return true;
            }
        }

        return false;
    }
}
