<?php
/**
 * Plugin Name: Hybrid Headless AutomateWoo Integration
 * Description: Custom AutomateWoo extensions for Hybrid Headless platform
 * Version: 1.0.0
 * Author: Your Name
 * Requires Plugins: automatewoo
 */

namespace HybridHeadlessAutomateWoo;

use AutomateWoo\Addon;

defined('ABSPATH') || exit;

if (!class_exists('AutomateWoo\Addon')) {
    include WP_PLUGIN_DIR . '/automatewoo/includes/abstracts/addon.php';
}

class Plugin extends Addon {
    private static $instance = null;
    private $options;

    public static function instance($plugin_data) {
        if (is_null(self::$instance)) {
            self::$instance = new self($plugin_data);
        }
        return self::$instance;
    }

    public function __construct($plugin_data) {
        parent::__construct($plugin_data);
        spl_autoload_register([$this, 'autoload']);
        add_action('automatewoo_loaded', [$this, 'init'], 20);
    }

    public function autoload($class) {
        if (strpos($class, __NAMESPACE__) !== 0) {
            return;
        }

        $file = str_replace(__NAMESPACE__ . '\\', '', $class);
        $file = str_replace('\\', '/', $file);
        
        // Convert snake_case to kebab-case for file names
        $file = strtolower(preg_replace('/(?<!^)[A-Z]/', '-$0', $file));
        
        $path = $this->path("/includes/{$file}.php");

        if (file_exists($path)) {
            include $path;
        }
    }

    public function options() {
        if ( ! isset( $this->options ) ) {
            include_once $this->path( '/includes/class-options.php' );
            $this->options = new Options();
        }
        return $this->options;
    }

    public function init() {
        add_filter('automatewoo/rules', [$this, 'register_rules']);
        add_filter('automatewoo/variables', [$this, 'register_variables']);
    }

    public function register_rules($rules) {
        $rules['customer_last_trip_in_period'] = 'HybridHeadlessAutomateWoo\Rules\Customer_Last_Trip_In_Period';
        $rules['customer_has_upcoming_trip'] = 'HybridHeadlessAutomateWoo\Rules\Customer_Has_Upcoming_Trip';
        return $rules;
    }

    public function register_variables($variables) {
        $variables['product']['event_data'] = 'HybridHeadlessAutomateWoo\Variables\Product_Event_Data_Variable';
        return $variables;
    }
}

// Initialize with plugin data
Plugin::instance((object) [
    'version' => '1.0.0',
    'path' => __DIR__,
    'file' => __FILE__,
    'name' => __('Hybrid Headless AutomateWoo', 'hybrid-headless-automatewoo')
]);
