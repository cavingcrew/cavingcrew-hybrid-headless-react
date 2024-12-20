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
    public function override_template( $template ) {
        if ( ! $this->is_wordpress_route() ) {
            return $template;
        }

        // Use default template for WordPress-handled routes
        return $template;
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
        $request_uri = $_SERVER['REQUEST_URI'];
        
        $response = $this->proxy_request($nextjs_url . $request_uri);
        
        if (!$response) {
            status_header(500);
            include(get_404_template());
            return;
        }
        
        $headers = wp_remote_retrieve_headers($response);
        $status_code = wp_remote_retrieve_response_code($response);
        
        status_header($status_code);
        
        foreach ($headers as $key => $value) {
            if (!in_array(strtolower($key), ['transfer-encoding'])) {
                header("$key: $value");
            }
        }
        
        echo wp_remote_retrieve_body($response);
    }

    private function is_wordpress_route() {
        $wordpress_paths = array(
            'my-account',
            'checkout',
            'cart',
            'wp-login.php',
            'wp-admin',
        );

        $current_path = trim( parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ), '/' );
        
        foreach ( $wordpress_paths as $path ) {
            if ( strpos( $current_path, $path ) === 0 ) {
                return true;
            }
        }

        return false;
    }
}
