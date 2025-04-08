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

        // Simplify autoloader based on Birthdays plugin example
        
        // 1. Remove base namespace: HybridHeadlessAutomateWoo\Triggers\Test_Trigger -> Triggers\Test_Trigger
        $relative_class = str_replace(__NAMESPACE__ . '\\', '', $class); 
        
        // 2. Replace namespace separators with directory separators: Triggers\Test_Trigger -> Triggers/Test_Trigger
        $relative_path = str_replace('\\', '/', $relative_class);
        
        // 3. Convert to lowercase: Triggers/Test_Trigger -> triggers/test_trigger
        $relative_path_lower = strtolower($relative_path);
        
        // 4. Replace underscores with hyphens (if any): triggers/test_trigger -> triggers/test-trigger
        $file = str_replace('_', '-', $relative_path_lower);
        
        // 5. Construct the full path: /path/to/plugin/includes/triggers/test-trigger.php
        //    (Note: We will rename files below to remove the 'class-' prefix)
        $path = $this->path("/includes/{$file}.php");

        error_log("Attempting to load: $class from path: $path");

        if ($path && file_exists($path)) {
            include $path;
            error_log("Successfully loaded: $class");
        } else {
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
