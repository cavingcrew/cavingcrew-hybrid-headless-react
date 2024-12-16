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
