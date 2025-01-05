<?php
/**
 * Frontend functionality
 *
 * @package HybridHeadless
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Frontend Class
 */
class Hybrid_Headless_Frontend {
    /**
     * Constructor
     */
    public function __construct() {
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
        add_filter( 'template_include', array( $this, 'override_template' ), 999 );
    }

    /**
     * Enqueue frontend scripts
     */
    public function enqueue_scripts() {
        // Only enqueue on WordPress-handled routes
        if ( ! $this->is_wordpress_route() ) {
            return;
        }

        wp_enqueue_style(
            'hybrid-headless',
            HYBRID_HEADLESS_PLUGIN_URL . 'assets/css/frontend.css',
            array(),
            HYBRID_HEADLESS_VERSION
        );

        wp_enqueue_script(
            'hybrid-headless',
            HYBRID_HEADLESS_PLUGIN_URL . 'assets/js/frontend.js',
            array( 'jquery' ),
            HYBRID_HEADLESS_VERSION,
            true
        );
    }

    /**
     * Override template for WordPress-handled routes
     *
     * @param string $template Template path.
     * @return string
     */
    public function override_template($template) {
        // If it's a WordPress route, serve the WordPress template
        if ($this->is_wordpress_route()) {
            return $template;
        }

        // Proxy the request to Next.js
        $this->serve_nextjs_app();
        exit;
    }

    /**
     * Check if current route should be handled by WordPress
     *
     * @return boolean
     */
    private function get_nextjs_url() {
        return get_option( 'hybrid_headless_nextjs_url', HYBRID_HEADLESS_DEFAULT_NEXTJS_URL );
    }

    private function proxy_request($url, $args = []) {
        $default_args = array(
            'timeout' => 30,
            'headers' => array(
                'X-Forwarded-Host' => $_SERVER['HTTP_HOST'],
                'X-Forwarded-Proto' => isset($_SERVER['HTTPS']) ? 'https' : 'http',
            ),
        );

        $args = wp_parse_args($args, $default_args);
        $response = wp_remote_get($url, $args);

        if (is_wp_error($response)) {
            error_log('Next.js proxy error: ' . $response->get_error_message());
            return false;
        }

        return $response;
    }

    private function serve_nextjs_app() {
        $nextjs_url = $this->get_nextjs_url();
        $request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Decode the URL-encoded path
        $decoded_path = urldecode($request_uri);
        
        // Preserve query parameters
        $query_string = !empty($_SERVER['QUERY_STRING']) ? '?' . $_SERVER['QUERY_STRING'] : '';
        
        // Build the full URL to proxy to
        $proxy_url = rtrim($nextjs_url, '/') . $decoded_path . $query_string;
        
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
        
        // Handle POST requests
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $args['method'] = 'POST';
            $args['body'] = file_get_contents('php://input');
            $args['headers']['Content-Type'] = $_SERVER['CONTENT_TYPE'] ?? 'application/json';
        }
        
        $response = wp_remote_request($proxy_url, $args);
        
        if (is_wp_error($response)) {
            status_header(500);
            include(get_404_template());
            return;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        status_header($status_code);
        
        // Handle redirects
        if ($status_code >= 300 && $status_code < 400) {
            $location = wp_remote_retrieve_header($response, 'location');
            if ($location) {
                wp_redirect($location, $status_code);
                exit;
            }
        }
        
        // Handle 404s
        if ($status_code === 404) {
            include(get_404_template());
            return;
        }
        
        // Forward headers
        $headers = wp_remote_retrieve_headers($response);
        foreach ($headers as $key => $value) {
            if (!in_array(strtolower($key), ['transfer-encoding', 'content-encoding', 'content-length'])) {
                header("$key: $value");
            }
        }
        
        // Output the response body
        echo wp_remote_retrieve_body($response);
    }

    private function is_wordpress_route() {
        $current_path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

        // Never handle _next/ routes as WordPress routes
        if (strpos($current_path, '_next/') === 0) {
            return false;
        }

        // Check for static files
        if (preg_match('/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/i', $current_path)) {
            return false;
        }

        $wordpress_paths = array(
            'my-account',
            'checkout',
            'cart',
            'wp-login.php',
            'wp-admin',
            'wp-content',
            'wp-includes',
            'wp-json',
            'wp-cron.php',
            'wp-activate.php',
            'wp-signup.php',
            'wp-trackback.php',
            'xmlrpc.php',
            'feed',
            'comments',
        );

        // Check if the current path is a WordPress-specific path
        foreach ($wordpress_paths as $path) {
            if (strpos($current_path, $path) === 0) {
                return true;
            }
        }

        // Check if the current path is one of the frontend routes
        $frontend_routes = array(
            'categories',
            'category',
            'trips',
            'trip',
            'route-descriptions',
        );

        foreach ($frontend_routes as $route) {
            if (strpos($current_path, $route) === 0) {
                return false;
            }
        }

        // Handle the root path
        if ($current_path === '') {
            return false;
        }

        // Default to WordPress for all other routes
        return true;
    }
}
