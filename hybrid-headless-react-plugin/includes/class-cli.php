<?php
/**
 * WP-CLI Commands
 *
 * @package HybridHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Manages Hybrid Headless plugin settings
 */
class Hybrid_Headless_CLI {
    /**
     * Enables or disables frontend route proxying
     *
     * ## OPTIONS
     *
     * <enable|disable>
     * : Whether to enable or disable proxying
     *
     * ## EXAMPLES
     *
     *     wp hybrid-headless proxy enable
     *     wp hybrid-headless proxy disable
     *
     * @param array $args Command arguments.
     */
    public function proxy($args) {
        if (empty($args[0])) {
            WP_CLI::error('Please specify either enable or disable');
        }

        $action = $args[0];
        
        if ($action === 'enable') {
            update_option('hybrid_headless_enable_proxy', true);
            WP_CLI::success('Frontend route proxying enabled');
        } elseif ($action === 'disable') {
            update_option('hybrid_headless_enable_proxy', false);
            WP_CLI::success('Frontend route proxying disabled');
        } else {
            WP_CLI::error('Invalid action. Use either enable or disable');
        }
    }
}

if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('hybrid-headless', 'Hybrid_Headless_CLI');
}
