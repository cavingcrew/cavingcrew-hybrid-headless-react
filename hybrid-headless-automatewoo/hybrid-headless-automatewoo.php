<?php
/**
 * Plugin Name: Hybrid Headless AutomateWoo Integration
 * Description: Custom AutomateWoo extensions for Hybrid Headless platform
 * Version: 1.0.0
 * Author: Your Name
 * Requires Plugins: automatewoo
 */

namespace HybridHeadlessAutomateWoo;

defined('ABSPATH') || exit;

class Plugin {
    private static $instance = null;

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        add_action('automatewoo_loaded', [$this, 'init']);
        add_action('admin_notices', [$this, 'check_dependencies']);
    }

    public function init() {
        $this->load_files();
        $this->register_components();
    }

    private function load_files() {
        require_once __DIR__ . '/includes/rules/class-customer-last-trip-in-period.php';
        require_once __DIR__ . '/includes/rules/class-customer-has-upcoming-trip.php';
        require_once __DIR__ . '/includes/rules/class-customer-trip-date-rule.php';
        require_once __DIR__ . '/includes/variables/class-product-event-data-variable.php';
    }

    private function register_components() {
        add_filter('automatewoo/rules', [$this, 'register_rules']);
        add_filter('automatewoo/variables', [$this, 'register_variables']);
    }

    public function register_rules($rules) {
        $rules['customer_last_trip_in_period'] = __NAMESPACE__ . '\\Rules\\Customer_Last_Trip_In_Period';
        $rules['customer_has_upcoming_trip'] = __NAMESPACE__ . '\\Rules\\Customer_Has_Upcoming_Trip';
        return $rules;
    }

    public function register_variables($variables) {
        $variables['product_event_data'] = __NAMESPACE__ . '\\Variables\\Product_Event_Data_Variable';
        return $variables;
    }

    public function check_dependencies() {
        if (!class_exists('AutomateWoo')) {
            echo '<div class="notice notice-error"><p>';
            _e('Hybrid Headless AutomateWoo Integration requires AutomateWoo to be installed and activated.', 'hybrid-headless-automatewoo');
            echo '</p></div>';
        }
    }
}

Plugin::instance();
