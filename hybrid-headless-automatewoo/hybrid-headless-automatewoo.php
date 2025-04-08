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
        // Remove the 'plugins_loaded' hook for loading the main logic
		// add_action( 'plugins_loaded', [ __CLASS__, 'load' ], 11 );
        // Add hook to load the addon later, during 'init'
        add_action( 'init', [ __CLASS__, 'load_addon' ], 10 ); // Priority 10 is usually safe for init actions
		add_action( 'init', [ __CLASS__, 'load_textdomain' ], 5 ); // Load text domain early

        // Optional: Add activation/compatibility hooks if needed later
		// register_activation_hook( self::$data->file, [ __CLASS__, 'plugin_activate' ] );
        // add_action( 'before_woocommerce_init', [ __CLASS__, 'declare_feature_compatibility' ] );
	}

    /**
	 * Loads the addon class during the 'init' action, after checking requirements.
     * Renamed from load() to load_addon() for clarity.
	 */
	public static function load_addon() {
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
  	 * Checks if the plugin can be loaded.
  	 */
  	protected static function check_requirements() {
  		// translators: 1) The name of the AutomateWoo addon
  		$inactive_text = '<strong>' . sprintf( __( '%s is inactive.', 'automatewoo-birthdays' ), __( 'AutomateWoo - Birthdays', 'automatewoo-birthdays' ) ) . '</strong>';

  		if ( ! self::is_automatewoo_active() ) {
  			// translators: 1) Text stating that the addon is inactive
  			self::$errors[] = sprintf( __( '%s The plugin requires AutomateWoo to be installed and activated.', 'automatewoo-birthdays' ), $inactive_text );
  		} elseif ( ! self::is_automatewoo_version_ok() ) {
  			// translators: 1) Text stating that the addon is inactive 2) The minimum version of AutomateWoo required
  			self::$errors[] = sprintf( __( '%1$s The plugin requires AutomateWoo version %2$s or newer.', 'automatewoo-birthdays' ), $inactive_text, self::$data->min_automatewoo_version );
  		} elseif ( ! self::is_automatewoo_directory_name_ok() ) {
  			// translators: 1) Text stating that the addon is inactive
  			self::$errors[] = sprintf( __( '%s AutomateWoo plugin directory name is not correct.', 'automatewoo-birthdays' ), $inactive_text );
  		}
  	}

  	/**
  	 * Checks if AutomateWoo is active.
  	 *
  	 * @return bool
  	 */
  	protected static function is_automatewoo_active() {
  		return function_exists( 'AW' );
  	}

  	/**
  	 * Checks if the version of AutomateWoo is compatible.
  	 *
  	 * @return bool
  	 */
  	protected static function is_automatewoo_version_ok() {
  		if ( ! function_exists( 'AW' ) ) {
  			return false;
  		}
  		return version_compare( AW()->version, self::$data->min_automatewoo_version, '>=' );
  	}

  	/**
  	 * Checks if AutomateWoo is in the correct location.
  	 *
  	 * @return bool
  	 */
  	protected static function is_automatewoo_directory_name_ok() {
  		$active_plugins = (array) get_option( 'active_plugins', [] );
  		return in_array( 'automatewoo/automatewoo.php', $active_plugins, true ) || array_key_exists( 'automatewoo/automatewoo.php', $active_plugins );
  	}

  	/**
  	 * Outputs any errors as admin notices.
  	 */
  	public static function admin_notices() {
  		if ( empty( self::$errors ) ) {
  			return;
  		}
  		echo '<div class="notice notice-error"><p>';
  		echo wp_kses_post( implode( '<br>', self::$errors ) );
  		echo '</p></div>';
  	}

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
