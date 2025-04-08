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

// Use statement for easier access
use AutomateWoo\Addons;

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
        // Use 'plugins_loaded' hook like the Birthdays addon
		add_action( 'plugins_loaded', [ __CLASS__, 'load_addon' ], 11 ); // Use priority 11 to run after AW core (usually 10)
        // Keep textdomain loading on init
		add_action( 'init', [ __CLASS__, 'load_textdomain' ], 5 );

        // Optional: Add activation/compatibility hooks if needed later
		// register_activation_hook( self::$data->file, [ __CLASS__, 'plugin_activate' ] );
        // add_action( 'before_woocommerce_init', [ __CLASS__, 'declare_feature_compatibility' ] );
	}

    /**
	 * Loads the addon class during the 'init' action, after checking requirements.
     * Renamed from load() to load_addon() for clarity.
	 */
	public static function load_addon() {
        error_log('[Loader] Running load_addon method.'); // Log start
		self::check_requirements(); // Check dependencies first

		if ( empty( self::$errors ) ) {
            error_log('[Loader] Requirements check passed. Proceeding to load addon class.'); // Log check passed
            $addon_file = __DIR__ . '/includes/hybrid-headless-addon.php';
            error_log('[Loader] Attempting to include: ' . $addon_file); // Log before include

            // Include the main addon class file
			require_once $addon_file;
            error_log('[Loader] Successfully included addon class file.'); // Log after include

            error_log('[Loader] Attempting to get addon instance...'); // Log before instance call
            // Instantiate the addon using its singleton method (inherited from AutomateWoo\Addon)
            // This automatically stores the instance.
            $instance = \HybridHeadlessAutomateWoo\Hybrid_Headless_Addon::instance( self::$data );

            if ($instance) {
                error_log('[Loader] Successfully obtained addon instance.'); // Log success

                // Explicitly register the addon instance with AutomateWoo's registry
                if ( class_exists('AutomateWoo\Addons') ) {
                    error_log('[Loader] Attempting to explicitly register addon with AutomateWoo\\Addons...');
                    Addons::register( $instance );
                    // Verify registration immediately (optional, but helpful)
                    $verify_addon = Addons::get( self::$data->id );
                    if ($verify_addon) {
                         error_log('[Loader] Successfully registered addon. Found in registry immediately.');
                    } else {
                         error_log('[Loader] Failed to register addon explicitly or find it immediately after registration.');
                    }
                } else {
                     error_log('[Loader] AutomateWoo\\Addons class not found for explicit registration.');
                }

            } else {
                error_log('[Loader] Failed to obtain addon instance.'); // Log failure
            }

            // Optional: Activation hook logic like Birthdays
			// if ( 'yes' === get_option( self::$data->id . '-activated' ) ) {
			// 	add_action( 'automatewoo_loaded', [ __CLASS__, 'addon_activate' ] );
			// }
		} else {
            error_log('[Loader] Requirements check failed. Errors: ' . print_r(self::$errors, true)); // Log if req check fails
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

// --- Debug Hook for automatewoo_init_addons ---
add_action( 'automatewoo_init_addons', 'hybrid_headless_debug_init_addons_hook', 5 ); // Hook early

function hybrid_headless_debug_init_addons_hook() {
    error_log('[Debug Hook] automatewoo_init_addons action fired.');

    if ( class_exists('AutomateWoo\Addons') ) {
        $addon_id = 'hybrid-headless-automatewoo';
        $addon = \AutomateWoo\Addons::get( $addon_id );
        if ( $addon ) {
            error_log("[Debug Hook] Found addon '$addon_id' in AutomateWoo registry.");
            // Let's try calling init manually just for debugging - REMOVE THIS LATER
            // if (method_exists($addon, 'init')) {
            //     error_log("[Debug Hook] Manually calling init() on found addon...");
            //     $addon->init();
            // } else {
            //     error_log("[Debug Hook] Found addon does not have an init() method?");
            // }
        } else {
            error_log("[Debug Hook] Addon '$addon_id' NOT found in AutomateWoo registry at this point.");
            // Log all registered addons for comparison
             error_log("[Debug Hook] Registered addons: " . print_r( array_keys( \AutomateWoo\Addons::get_all() ), true ) );
        }
    } else {
        error_log("[Debug Hook] AutomateWoo\Addons class not found.");
    }
}


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
