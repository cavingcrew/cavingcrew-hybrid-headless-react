<?php
/**
 * Authentication Utilities
 *
 * @package HybridHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Authentication and Authorization Utilities Class
 */
class Hybrid_Headless_Auth_Utils {
    /**
     * Ensure user is authenticated by checking the auth cookie
     * 
     * @return int User ID or 0 if not authenticated
     */
    public static function ensure_user_authenticated() {
        // Only run this check if the user isn't already authenticated
        if (get_current_user_id() === 0 && isset($_COOKIE[LOGGED_IN_COOKIE])) {
            $user_id = wp_validate_auth_cookie($_COOKIE[LOGGED_IN_COOKIE], 'logged_in');
            if ($user_id) {
                wp_set_current_user($user_id);
                
                // Force WC customer initialization if WooCommerce is active
                if (class_exists('WooCommerce') && function_exists('WC') && WC()->customer) {
                    WC()->customer = new WC_Customer($user_id, true);
                }
                
                return $user_id;
            }
        }
        
        return get_current_user_id();
    }
    
    /**
     * Check if user is logged in
     * 
     * @param WP_REST_Request $request Request object
     * @return bool|WP_Error True if logged in, WP_Error otherwise
     */
    public static function check_logged_in($request) {
        self::ensure_user_authenticated();
        
        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                __('You must be logged in to access this endpoint.', 'hybrid-headless'),
                array('status' => 401)
            );
        }
        
        return true;
    }
    
    /**
     * Check if user has WooCommerce admin permissions
     * 
     * @param WP_REST_Request $request Request object
     * @return bool|WP_Error True if has permissions, WP_Error otherwise
     */
    public static function check_woocommerce_permissions($request) {
        self::ensure_user_authenticated();
        
        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                __('You must be logged in to access this endpoint.', 'hybrid-headless'),
                array('status' => 401)
            );
        }
        
        if (!current_user_can('manage_woocommerce')) {
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to access this endpoint.', 'hybrid-headless'),
                array('status' => 403)
            );
        }
        
        return true;
    }
    
    /**
     * Check if user is a committee member
     * 
     * @param WP_REST_Request $request Request object
     * @return bool|WP_Error True if committee member, WP_Error otherwise
     */
    public static function check_committee_permissions($request) {
        self::ensure_user_authenticated();
        
        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                __('You must be logged in to access this endpoint.', 'hybrid-headless'),
                array('status' => 401)
            );
        }
        
        // Check if user is an admin or shop manager (they always have committee permissions)
        if (current_user_can('manage_woocommerce') || current_user_can('administrator')) {
            return true;
        }
        
        // Check if user is a committee member
        $user_id = get_current_user_id();
        if (self::is_committee_member($user_id)) {
            return true;
        }
        
        return new WP_Error(
            'rest_forbidden',
            __('You must be a committee member to access this endpoint.', 'hybrid-headless'),
            array('status' => 403)
        );
    }
    
    /**
     * Check if user is a trip director for a specific trip
     * 
     * @param WP_REST_Request $request Request object
     * @return bool|WP_Error True if trip director, WP_Error otherwise
     */
    public static function check_trip_director_permissions($request) {
        self::ensure_user_authenticated();
        
        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                __('You must be logged in to access this endpoint.', 'hybrid-headless'),
                array('status' => 401)
            );
        }
        
        // Check if user is an admin or shop manager (they always have trip director permissions)
        if (current_user_can('manage_woocommerce') || current_user_can('administrator')) {
            return true;
        }
        
        // Check if user is a committee member (they always have trip director permissions)
        $user_id = get_current_user_id();
        if (self::is_committee_member($user_id)) {
            return true;
        }
        
        // Get trip ID from request
        $trip_id = isset($request['id']) ? intval($request['id']) : 0;
        if (!$trip_id) {
            $trip_id = isset($request['trip_id']) ? intval($request['trip_id']) : 0;
        }
        
        if (!$trip_id) {
            return new WP_Error(
                'missing_trip_id',
                __('Trip ID is required.', 'hybrid-headless'),
                array('status' => 400)
            );
        }
        
        // Check if user is a trip director for this trip
        if (self::is_trip_director($user_id, $trip_id)) {
            return true;
        }
        
        return new WP_Error(
            'rest_forbidden',
            __('You must be a trip director for this trip to access this endpoint.', 'hybrid-headless'),
            array('status' => 403)
        );
    }
    
    /**
     * Check if user is a member
     * 
     * @param WP_REST_Request $request Request object
     * @return bool|WP_Error True if member, WP_Error otherwise
     */
    public static function check_member_permissions($request) {
        self::ensure_user_authenticated();
        
        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                __('You must be logged in to access this endpoint.', 'hybrid-headless'),
                array('status' => 401)
            );
        }
        
        $user_id = get_current_user_id();
        if (!self::is_member($user_id)) {
            return new WP_Error(
                'rest_forbidden',
                __('You must be a member to access this endpoint.', 'hybrid-headless'),
                array('status' => 403)
            );
        }
        
        return true;
    }
    
    /**
     * Check if user is signed up for a trip
     * 
     * @param WP_REST_Request $request Request object
     * @return bool|WP_Error True if signed up, WP_Error otherwise
     */
    public static function check_if_signed_up_for_trip($request) {
        self::ensure_user_authenticated();
        
        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                __('You must be logged in to access this endpoint.', 'hybrid-headless'),
                array('status' => 401)
            );
        }
        
        // Get trip ID from request
        $trip_id = isset($request['id']) ? intval($request['id']) : 0;
        if (!$trip_id) {
            $trip_id = isset($request['trip_id']) ? intval($request['trip_id']) : 0;
        }
        
        if (!$trip_id) {
            return new WP_Error(
                'missing_trip_id',
                __('Trip ID is required.', 'hybrid-headless'),
                array('status' => 400)
            );
        }
        
        $user_id = get_current_user_id();
        
        // Check if user is an admin, shop manager, or committee member (they always have access)
        if (current_user_can('manage_woocommerce') || current_user_can('administrator') || self::is_committee_member($user_id)) {
            return true;
        }
        
        // Check if user is signed up for this trip
        if (self::is_signed_up_for_trip($user_id, $trip_id)) {
            return true;
        }
        
        return new WP_Error(
            'rest_forbidden',
            __('You must be signed up for this trip to access this endpoint.', 'hybrid-headless'),
            array('status' => 403)
        );
    }
    
    /**
     * Check if user is a committee member
     * 
     * @param int $user_id User ID
     * @return bool True if committee member, false otherwise
     */
    public static function is_committee_member($user_id) {
        if (!$user_id) {
            return false;
        }
        
        $committee_current = get_user_meta($user_id, 'committee_current', true);
        
        $is_committee = $committee_current && 
                        $committee_current !== '' && 
                        $committee_current !== 'retired' && 
                        $committee_current !== 'revoked' && 
                        $committee_current !== 'legacy' && 
                        $committee_current !== 'expired';
        
        return $is_committee;
    }
    
    /**
     * Check if user is a member
     * 
     * @param int $user_id User ID
     * @return bool True if member, false otherwise
     */
    public static function is_member($user_id) {
        if (!$user_id) {
            return false;
        }
        
        return get_user_meta($user_id, 'cc_member', true) === 'yes';
    }
    
    /**
     * Check if user is a trip director for a specific trip
     * 
     * @param int $user_id User ID
     * @param int $trip_id Trip ID
     * @return bool True if trip director, false otherwise
     */
    public static function is_trip_director($user_id, $trip_id) {
        if (!$user_id || !$trip_id) {
            return false;
        }
        
        $orders = wc_get_orders([
            'customer_id' => $user_id,
            'limit' => -1,
            'status' => ['on-hold', 'processing', 'completed'],
        ]);
        
        foreach ($orders as $order) {
            foreach ($order->get_items() as $item) {
                $product = $item->get_product();
                if ($product) {
                    $product_id = $product->get_parent_id() ?: $product->get_id();
                    if ($product_id == $trip_id) {
                        $cc_volunteer = $order->get_meta('cc_volunteer');
                        if (strpos($cc_volunteer, 'director') !== false || 
                            $cc_volunteer === 'trip_director' || 
                            $cc_volunteer === 'cabbage1239zz') {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if user is signed up for a trip
     * 
     * @param int $user_id User ID
     * @param int $trip_id Trip ID
     * @return bool True if signed up, false otherwise
     */
    public static function is_signed_up_for_trip($user_id, $trip_id) {
        if (!$user_id || !$trip_id) {
            return false;
        }
        
        $orders = wc_get_orders([
            'customer_id' => $user_id,
            'limit' => -1,
            'status' => ['on-hold', 'processing', 'completed'],
        ]);
        
        foreach ($orders as $order) {
            foreach ($order->get_items() as $item) {
                $product = $item->get_product();
                if ($product) {
                    $product_id = $product->get_parent_id() ?: $product->get_id();
                    if ($product_id == $trip_id) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Get pending orders for a product
     * 
     * @param int $product_id Product ID
     * @return array Array of order IDs
     */
    public static function get_pending_orders_for_product($product_id) {
        global $wpdb;
        
        $orders = $wpdb->get_col($wpdb->prepare(
            "SELECT DISTINCT order_id 
             FROM {$wpdb->prefix}wc_order_product_lookup 
             WHERE product_id = %d 
             AND order_id IN (
                 SELECT post_id 
                 FROM {$wpdb->postmeta} 
                 WHERE meta_key = 'cc_attendance' 
                 AND meta_value = 'pending'
             )",
            $product_id
        ));
        
        return $orders;
    }
}
