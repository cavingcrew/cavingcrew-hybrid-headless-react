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

        $file = str_replace(
            [__NAMESPACE__ . '\\', '_'],
            ['', '-'],
            $class
        );
        $file = strtolower($file);
        $path = $this->path("/includes/$file.php");

        if (file_exists($path)) {
            include $path;
        }
    }

    /** @var Options */
    public $options;

    public function init() {
        add_filter('automatewoo/triggers', [$this, 'register_triggers']);
        add_filter('automatewoo/rules/includes', [$this, 'register_rules']); // Changed to rules/includes
        add_filter('automatewoo/variables', [$this, 'register_variables']);

        // Explicitly include the Options class file
        require_once $this->path('/includes/options.php');
        
        $this->options = new Options();
    }

    public function options() {
        return $this->options;
    }

    public function register_triggers($triggers) {
        $triggers['order_event_date'] = __NAMESPACE__ . '\Triggers\Order_Event_Date_Trigger';
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
