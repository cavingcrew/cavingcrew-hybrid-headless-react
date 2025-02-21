<?php
/**
 * Plugin Name: Hybrid Headless React Plugin
 * Plugin URI: #
 * Description: Enables headless WordPress + Next.js integration for WooCommerce
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: #
 * Text Domain: hybrid-headless
 * Domain Path: /languages
 * Requires PHP: 7.4
 *
 * @package HybridHeadless
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Define plugin constants
define( 'HYBRID_HEADLESS_VERSION', '1.0.0' );
define( 'HYBRID_HEADLESS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HYBRID_HEADLESS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'HYBRID_HEADLESS_DEFAULT_NEXTJS_URL', 'http://localhost:3000' );
define( 'HYBRID_HEADLESS_STATIC_DIR', WP_CONTENT_DIR . '/uploads/hybrid-headless-static' );

// Composer autoloader
if ( file_exists( dirname( __FILE__ ) . '/vendor/autoload.php' ) ) {
    require_once dirname( __FILE__ ) . '/vendor/autoload.php';
}

/**
 * Main plugin class
 */
final class Hybrid_Headless_Plugin {
    /**
     * Single instance of the plugin
     *
     * @var Hybrid_Headless_Plugin
     */
    private static $instance = null;

    /**
     * Get plugin instance
     *
     * @return Hybrid_Headless_Plugin
     */
    public static function instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
        $this->init_handlers();
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        add_action( 'plugins_loaded', array( $this, 'on_plugins_loaded' ) );
        add_action( 'init', array( $this, 'init' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
    }

    /**
     * Initialize handlers
     */
    private function init_handlers() {
        // Load API handlers
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-rest-api.php';
        new Hybrid_Headless_Rest_API();

        // Load admin handlers if in admin
        if ( is_admin() ) {
            require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/admin/class-admin.php';
            new Hybrid_Headless_Admin();
        }

        // Load frontend handlers
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/frontend/class-frontend.php';
        new Hybrid_Headless_Frontend();

        // Load purchase restrictions
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/purchase-restrictions/class-purchase-restrictions.php';
        new Hybrid_Headless_Purchase_Restrictions();
    }

    /**
     * Plugin initialization
     */
    public function init() {
        // Initialize plugin functionality
        $this->load_textdomain();
        
        // Check for required plugins
        if ( ! class_exists( 'WooCommerce' ) ) {
            add_action( 'admin_notices', array( $this, 'woocommerce_missing_notice' ) );
            return;
        }
    }

    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'hybrid-headless',
            false,
            dirname( plugin_basename( __FILE__ ) ) . '/languages'
        );
    }

    /**
     * WooCommerce missing notice
     */
    public function woocommerce_missing_notice() {
        ?>
        <div class="error">
            <p><?php esc_html_e( 'Hybrid Headless requires WooCommerce to be installed and active.', 'hybrid-headless' ); ?></p>
        </div>
        <?php
    }

    /**
     * Plugins loaded callback
     */
    public function on_plugins_loaded() {
        // Check for required plugins and versions
        if ( ! $this->check_requirements() ) {
            return;
        }
    }

    /**
     * Check plugin requirements
     *
     * @return bool
     */
    private function check_requirements() {
        $php_version = phpversion();
        if ( version_compare( $php_version, '7.4', '<' ) ) {
            add_action( 'admin_notices', array( $this, 'php_version_notice' ) );
            return false;
        }
        return true;
    }

    /**
     * PHP version notice
     */
    public function php_version_notice() {
        ?>
        <div class="error">
            <p><?php esc_html_e( 'Hybrid Headless requires PHP 7.4 or higher.', 'hybrid-headless' ); ?></p>
        </div>
        <?php
    }

    public function register_settings() {
        register_setting('general', 'hybrid_headless_nextjs_url', array(
            'type' => 'string',
            'default' => HYBRID_HEADLESS_DEFAULT_NEXTJS_URL,
            'sanitize_callback' => 'esc_url_raw',
        ));

        add_settings_field(
            'hybrid_headless_nextjs_url',
            __('Next.js Server URL', 'hybrid-headless'),
            array($this, 'nextjs_url_callback'),
            'general'
        );
    }

    public function nextjs_url_callback() {
        $value = get_option( 'hybrid_headless_nextjs_url', HYBRID_HEADLESS_DEFAULT_NEXTJS_URL );
        echo '<input type="url" id="hybrid_headless_nextjs_url" name="hybrid_headless_nextjs_url" value="' . esc_attr( $value ) . '" class="regular-text">';
    }
}

/**
 * Initialize the plugin
 */
function hybrid_headless_init() {
    return Hybrid_Headless_Plugin::instance();
}

// Load CLI commands
if (defined('WP_CLI') && WP_CLI) {
    require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/class-cli.php';
}

// Start the plugin
hybrid_headless_init();
