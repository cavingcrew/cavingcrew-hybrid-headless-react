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
        if (strpos($class, __NAMESPACE__) !== 0) {
            return;
        }

        $file = str_replace(__NAMESPACE__ . '\\', '', $class);
        $file = str_replace('\\', '/', $file);
        $file = strtolower(preg_replace('/(?<!^)[A-Z]/', '-$0', $file));
        $path = $this->path("/includes/$file.php");

        if (file_exists($path)) {
            include $path;
        }
    }

    public function init() {
        add_filter('automatewoo/triggers', [$this, 'register_triggers']);
        add_filter('automatewoo/rules', [$this, 'register_rules']);
        add_filter('automatewoo/variables', [$this, 'register_variables']);
    }

    public function register_triggers($triggers) {
        $triggers['order_event_date'] = 'HybridHeadlessAutomateWoo\Triggers\Order_Event_Date_Trigger';
        return $triggers;
    }

    public function register_rules($rules) {
        $rules['customer_last_trip_in_period'] = 'HybridHeadlessAutomateWoo\Rules\Customer_Last_Trip_In_Period';
        $rules['customer_has_upcoming_trip'] = 'HybridHeadlessAutomateWoo\Rules\Customer_Has_Upcoming_Trip';
        return $rules;
    }

    public function register_variables($variables) {
        $variables['product']['event_start_date'] = 'HybridHeadlessAutomateWoo\Variables\ProductEventStartDate';
        $variables['product']['event_finish_date'] = 'HybridHeadlessAutomateWoo\Variables\ProductEventFinishDate';
        $variables['product']['event_data'] = 'HybridHeadlessAutomateWoo\Variables\Product_Event_Data_Variable';
        return $variables;
    }
}
