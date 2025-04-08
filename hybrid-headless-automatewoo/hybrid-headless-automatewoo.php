<?php
/**
 * Plugin Name: Hybrid Headless AutomateWoo Integration
 * Description: Custom AutomateWoo extensions for Hybrid Headless platform
 * Version: 1.0.0
 * Plugin Name: Hybrid Headless AutomateWoo Integration
 * Description: Custom AutomateWoo extensions for Hybrid Headless platform
 * Version: 1.0.1
 * Author: Caving Crew
 * Requires Plugins: automatewoo, woocommerce
 * Text Domain: hybrid-headless-automatewoo
 * Domain Path: /languages
 */

defined('ABSPATH') || exit;

/**
 * Loader class for the Hybrid Headless AutomateWoo Add-on.
 * Mirrors the structure of AW_Birthdays_Loader.
 */
final class Hybrid_Headless_AutomateWoo_Loader {

    /**
	 * Plugin data.
	 * @var \stdClass
	 */
	public static $data;

    /**
	 * Array of load errors.
	 * @var array
	 */
	public static $errors = [];

    /**
	 * Init the plugin loader.
	 */
	public static function init() {
        // Setup plugin data
		self::$data                          = new \stdClass();
		self::$data->id                      = 'hybrid-headless-automatewoo'; // Unique ID for the addon
		self::$data->name                    = ''; // Set later via set_plugin_name() in the Addon class
		self::$data->version                 = '1.0.1'; // Update version as needed
		self::$data->file                    = __FILE__;
		self::$data->min_automatewoo_version = '5.1.0'; // Set minimum required AW version

        // Standard hooks like Birthdays
		add_action( 'admin_notices', [ __CLASS__, 'admin_notices' ] );
		add_action( 'plugins_loaded', [ __CLASS__, 'load' ], 11 ); // Priority 11 to load after AW core (usually 10)
		add_action( 'init', [ __CLASS__, 'load_textdomain' ], 5 ); // Load text domain early

        // Optional: Add activation/compatibility hooks if needed later
		// register_activation_hook( self::$data->file, [ __CLASS__, 'plugin_activate' ] );
        // add_action( 'before_woocommerce_init', [ __CLASS__, 'declare_feature_compatibility' ] );
	}

    /**
	 * Loads the plugin if requirements are met.
	 */
	public static function load() {
		self::check_requirements(); // Check dependencies first

		if ( empty( self::$errors ) ) {
            // Include the main addon class file
			require_once __DIR__ . '/includes/hybrid-headless-addon.php';

            // Instantiate the addon using its singleton method (inherited from AutomateWoo\Addon)
            // This automatically stores the instance.
            \HybridHeadlessAutomateWoo\Hybrid_Headless_Addon::instance( self::$data );

            // Optional: Activation hook logic like Birthdays
			// if ( 'yes' === get_option( self::$data->id . '-activated' ) ) {
			// 	add_action( 'automatewoo_loaded', [ __CLASS__, 'addon_activate' ] );
			// }
		}
	}

    /**
	 * Loads the plugin textdomain.
	 */
	public static function load_textdomain() {
		load_plugin_textdomain(
            'hybrid-headless-automatewoo',
            false,
            dirname( plugin_basename( __FILE__ ) ) . '/languages'
        );
	}

    /**
	 * Checks if the plugin can be loaded by verifying dependencies.
     * Mirrors AW_Birthdays_Loader::check
	 */
	protected static function check_requirements() {
		// translators: %s: Plugin name placeholder
		$inactive_text = '<strong>' . esc_html__( 'Hybrid Headless AutomateWoo', 'hybrid-headless-automatewoo' ) . '</strong>';

		if ( ! self::is_automatewoo_active() ) {
            // translators: %s: Inactive text placeholder
			self::$errors[] = sprintf( esc_html__( '%s is inactive. The plugin requires AutomateWoo to be installed and activated.', 'hybrid-headless-automatewoo' ), $inactive_text );
		} elseif ( ! self::is_automatewoo_version_ok() ) {
            // translators: 1: Inactive text placeholder, 2: Minimum AutomateWoo version
			self::$errors[] = sprintf( esc_html__( '%1$s is inactive. The plugin requires AutomateWoo version %2$s or newer.', 'hybrid-headless-automatewoo' ), $inactive_text, self::$data->min_automatewoo_version );
		}
        // Optional: Check for WooCommerce if it's a strict requirement
        if ( ! class_exists('WooCommerce') ) {
            // translators: %s: Inactive text placeholder
            self::$errors[] = sprintf( esc_html__( '%s is inactive. The plugin requires WooCommerce to be installed and activated.', 'hybrid-headless-automatewoo' ), $inactive_text );
        }
	}

    /**
	 * Checks if AutomateWoo is active.
	 * @return bool
	 */
	protected static function is_automatewoo_active() {
		return class_exists( 'AutomateWoo\Plugin' ) && function_exists( 'AW' );
	}

    /**
	 * Checks if the version of AutomateWoo is compatible.
	 * @return bool
	 */
	protected static function is_automatewoo_version_ok() {
		return defined( 'AUTOMATEWOO_VERSION' ) && version_compare( AUTOMATEWOO_VERSION, self::$data->min_automatewoo_version, '>=' );
	}

    /**
	 * Outputs any errors as admin notices.
	 */
	public static function admin_notices() {
		if ( ! empty( self::$errors ) ) {
			echo '<div class="notice notice-error"><p>';
			echo wp_kses_post( implode( '<br>', self::$errors ) );
			echo '</p></div>';
		}
	}

    // Optional: Placeholder for activation logic
    // public static function plugin_activate() { ... }
    // public static function addon_activate() { ... }
    // public static function declare_feature_compatibility() { ... }

}

// Initialize the loader
Hybrid_Headless_AutomateWoo_Loader::init();


// --- Singleton Accessor Function ---

// phpcs:disable WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed

/**
 * Plugin singleton function.
 * Provides easy access to the Addon instance.
 * Mirrors AW_Birthdays()
 *
 * @return \HybridHeadlessAutomateWoo\Hybrid_Headless_Addon
 */
function Hybrid_Headless() {
    // Ensure loader data is set before trying to get instance
    if ( ! isset( Hybrid_Headless_AutomateWoo_Loader::$data ) ) {
        // This case should ideally not happen if init() runs correctly
        // Maybe trigger an error or return a dummy object?
        // For now, let's return null, but this indicates a loading problem.
        error_log("Hybrid_Headless() called before loader initialized.");
        return null;
    }
	return \HybridHeadlessAutomateWoo\Hybrid_Headless_Addon::instance( Hybrid_Headless_AutomateWoo_Loader::$data );
}
