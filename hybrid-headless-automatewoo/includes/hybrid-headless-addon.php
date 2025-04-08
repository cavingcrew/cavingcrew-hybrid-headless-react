<?php
namespace HybridHeadlessAutomateWoo; // Changed namespace to match directory structure convention

use AutomateWoo\Addon;

defined('ABSPATH') || exit;

// Ensure the base Addon class is available
if ( ! class_exists( 'AutomateWoo\Addon' ) ) {
    // This check might be redundant if the loader ensures AutomateWoo is active, but good practice.
	return;
}

/**
 * Main plugin class for the Hybrid Headless AutomateWoo Add-on.
 * Mirrors the structure of AW_Birthdays_Addon.
 */
final class Hybrid_Headless_Addon extends Addon {

    /**
	 * Addon main class constructor.
	 *
	 * @param \stdClass $plugin_data
	 */
	public function __construct( $plugin_data ) {
		parent::__construct( $plugin_data ); // Pass data to parent constructor

		// Register autoloader immediately
		spl_autoload_register( [ $this, 'autoload' ] );

        // Add hooks for registration - These run after the object is constructed
        // and AutomateWoo is loaded.
        add_filter( 'automatewoo/triggers', [ $this, 'register_triggers' ] );
		add_filter( 'automatewoo/rules/includes', [ $this, 'register_rules' ] );
		add_filter( 'automatewoo/variables', [ $this, 'register_variables' ] );

        // Hook to set translatable name later, after text domain is loaded
        add_action( 'init', [ $this, 'set_plugin_name' ], 6 ); // Priority 6 to run after textdomain load (usually 5)
	}

    /**
	 * Translatable plugin name must be defined after load_plugin_textdomain() is called.
	 */
	public function set_plugin_name() {
		$this->name = __( 'Hybrid Headless AutomateWoo', 'hybrid-headless-automatewoo' );
	}

    /**
	 * Class autoload callback.
     * Mirrors AW_Birthdays_Addon::autoload and get_autoload_path
	 *
	 * @param string $class
	 */
	public function autoload( $class ) {
        // Check if the class belongs to this plugin's namespace
		if ( 0 !== strpos( $class, __NAMESPACE__ . '\\' ) ) {
			return;
		}

        // Build the path based on class name
		$file = str_replace( __NAMESPACE__ . '\\', '', $class ); // Remove base namespace
		$file = str_replace( '_', '-', $file ); // Convert underscores to hyphens
		$file = strtolower( $file ); // Convert to lowercase
		$file = str_replace( '\\', '/', $file ); // Convert namespace separators to directory separators

        // Construct the full path using the parent Addon's path() method
		$path = $this->path( "/includes/{$file}.php" ); // Assumes files are like includes/triggers/test-trigger.php

        // Add back logging for debugging path calculation
        error_log("Attempting to load: $class from path: $path");

		if ( $path && file_exists( $path ) ) {
			include $path;
            error_log("Successfully loaded: $class");
		} else {
            // Log if file not found - helps debug path/naming issues
            error_log("Failed to load: $class - File not found at calculated path: " . $path);
        }
	}

    // Note: No init() method here. The parent Addon class handles basic init.
    // We add our specific hooks in the constructor.

    // Note: No options() method here for now. Can be added later if needed,
    // mirroring the Birthdays plugin structure with a separate Options class.

    /**
	 * Register custom triggers.
	 *
	 * @param array $triggers Existing triggers.
	 * @return array Modified triggers.
	 */
	public function register_triggers( $triggers ) {
        error_log('Registering triggers in HybridHeadlessAutomateWoo: ' . print_r(array_keys($triggers), true)); // Add back log

        // Register by mapping a unique key to the fully qualified class name
		$triggers['test_trigger']     = __NAMESPACE__ . '\Triggers\Test_Trigger';
		$triggers['order_event_date'] = __NAMESPACE__ . '\Triggers\Order_Event_Date_Trigger';
        $triggers['debug_trigger']    = __NAMESPACE__ . '\Triggers\Debug_Trigger'; // Assuming you still want this

        error_log('After adding our triggers: ' . print_r(array_keys($triggers), true)); // Add back log
		return $triggers;
	}

    /**
	 * Register custom rules.
	 *
	 * @param array $includes Existing rule file paths.
	 * @return array Modified rule file paths.
	 */
	public function register_rules( $includes ) {
        // Register by mapping a unique key to the absolute file path.
        // The file MUST end with 'return new ClassName();'
		$includes['customer_last_trip_in_period'] = $this->path( '/includes/rules/customer-last-trip-in-period.php' );
		$includes['customer_has_upcoming_trip']   = $this->path( '/includes/rules/customer-has-upcoming-trip.php' );

        error_log('Registering rules: ' . print_r($includes, true)); // Add back log
		return $includes;
	}

    /**
	 * Register custom variables.
	 *
	 * @param array $variables Existing variables.
	 * @return array Modified variables.
	 */
	public function register_variables( $variables ) {
        // Register by mapping keys within data types to the fully qualified class name.
		$variables['product']['event_start_date'] = __NAMESPACE__ . '\Variables\ProductEventStartDate';
		$variables['product']['event_finish_date'] = __NAMESPACE__ . '\Variables\ProductEventFinishDate';
        $variables['product']['event_data'] = __NAMESPACE__ . '\Variables\ProductEventDataVariable'; // Corrected class name to match file

        error_log('Registering variables: ' . print_r($variables, true)); // Add back log
		return $variables;
	}

    // Removed the custom path() method as we rely on the parent Addon::path()
    // Removed the custom options() method and inline options class
}
