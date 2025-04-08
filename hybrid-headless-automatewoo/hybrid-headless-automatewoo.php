<?php
/**
 * Plugin Name: Hybrid Headless AutomateWoo Integration
 * Description: Custom AutomateWoo extensions for Hybrid Headless platform
 * Version: 1.0.0
 * Author: Your Name
 * Requires Plugins: automatewoo
 */

defined('ABSPATH') || exit;

class Hybrid_Headless_AutomateWoo_Loader {

    public static function init() {
        add_action('automatewoo_loaded', [__CLASS__, 'load_plugin']);
        add_action('init', [__CLASS__, 'load_textdomain']);
    }

    public static function load_plugin() {
        if (!class_exists('AutomateWoo\Addon')) {
            return;
        }

        require_once __DIR__ . '/includes/class-plugin.php';
        Hybrid_Headless_AutomateWoo_Plugin::instance((object) [
            'version' => '1.0.0',
            'path' => __DIR__,
            'file' => __FILE__,
            'name' => __('Hybrid Headless AutomateWoo', 'hybrid-headless-automatewoo')
        ]);
    }

    public static function load_textdomain() {
        load_plugin_textdomain(
            'hybrid-headless-automatewoo',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );
    }
}

Hybrid_Headless_AutomateWoo_Loader::init();
