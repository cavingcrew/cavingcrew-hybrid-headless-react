<?php
namespace HybridHeadlessAutomateWoo;

use AutomateWoo\Addon;

defined('ABSPATH') || exit;

class Plugin extends Addon {
    private static $instance = null;

    public static function instance($plugin_data) {
        if (is_null(self::$instance)) {
            self::$instance = new self($plugin_data);
            self::$instance->init();
        }
        return self::$instance;
    }

    public function __construct($plugin_data) {
        parent::__construct($plugin_data);
        spl_autoload_register([$this, 'autoload']);
    }

    public function autoload($class) {
        if (0 !== strpos($class, __NAMESPACE__ . '\\')) {
            return;
        }

        $relative_class = substr($class, strlen(__NAMESPACE__) + 1);
        $parts = explode('\\', $relative_class);
        
        if (count($parts) > 1) {
            // Handle namespaced classes like Triggers\Test_Trigger
            $filename = strtolower(str_replace('_', '-', end($parts)));
            $directory = strtolower($parts[0]);
            // Use the path() method for consistency
            $path = $this->path("/includes/$directory/class-$filename.php");
        } else {
            // Handle root namespace classes (e.g., Plugin, Options)
            $filename = strtolower(str_replace('_', '-', $relative_class));
             // Use the path() method for consistency
            $path = $this->path("/includes/class-$filename.php");
        }

        error_log("Attempting to load: $class from path: $path");

        if ($path && file_exists($path)) { // Check if path was constructed
            include $path;
            error_log("Successfully loaded: $class");
        } else {
            // Add the calculated path to the error message for clarity
            error_log("Failed to load: $class - File not found at calculated path: " . $path);
        }
    }

    /** @var Options */
    public $options;

    public function init() {
        error_log('Initializing HybridHeadlessAutomateWoo plugin');
        
        add_filter('automatewoo/triggers', [$this, 'register_triggers']);
        add_filter('automatewoo/rules/includes', [$this, 'register_rules']);
        add_filter('automatewoo/variables', [$this, 'register_variables']);
        
        // Define a simple options class inline to avoid file loading issues
        $this->options = new class() {
            public $prefix = 'hybrid_headless_automatewoo_';
            public $defaults = ['version' => '1.0.0'];
            
            public function __get($key) {
                return get_option($this->prefix . $key, $this->defaults[$key] ?? null);
            }
            
            public function __set($key, $value) {
                update_option($this->prefix . $key, $value);
            }
        };

        // Add debug hook to see all registered triggers
        add_action('automatewoo/after_init_triggers', function() {
            $triggers = \AutomateWoo\Triggers::get_all();
            error_log('All registered AutomateWoo triggers: ' . print_r(array_keys($triggers), true));
        });
    }

    public function options() {
        return $this->options;
    }

    public function register_triggers($triggers) {
        error_log('Registering triggers in HybridHeadlessAutomateWoo: ' . print_r(array_keys($triggers), true));
        
        // Add test trigger with full class name for clarity
        $class_name = __NAMESPACE__ . '\Triggers\Test_Trigger';
        error_log("Adding trigger 'test_trigger' with class: $class_name");
        $triggers['test_trigger'] = $class_name;
        
        // Add your other triggers
        $class_name = __NAMESPACE__ . '\Triggers\Order_Event_Date_Trigger';
        error_log("Adding trigger 'order_event_date' with class: $class_name");
        $triggers['order_event_date'] = $class_name;
        
        // Add debug trigger
        $class_name = __NAMESPACE__ . '\Triggers\Debug_Trigger';
        error_log("Adding trigger 'debug_trigger' with class: $class_name");
        $triggers['debug_trigger'] = $class_name;
        
        error_log('After adding our triggers: ' . print_r(array_keys($triggers), true));
        return $triggers;
    }

    public function register_rules($includes) {
        $includes['customer_last_trip_in_period'] = $this->path('/includes/rules/class-customer-last-trip-in-period.php');
        $includes['customer_has_upcoming_trip'] = $this->path('/includes/rules/class-customer-has-upcoming-trip.php');
        return $includes;
    }

    public function register_variables($variables) {
        $variables['product']['event_start_date'] = __NAMESPACE__ . '\Variables\ProductEventStartDate';
        $variables['product']['event_finish_date'] = __NAMESPACE__ . '\Variables\ProductEventFinishDate';
        $variables['product']['event_data'] = __NAMESPACE__ . '\Variables\Product_Event_Data_Variable';
        return $variables;
    }
    public function path($path = '') {
        return $this->plugin_data->path . $path;
    }
}
