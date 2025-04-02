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
     * Check if user has a specific competency
     * 
     * @param int $user_id User ID
     * @param string $competency_key Meta key for the competency
     * @return bool True if user has the competency, false otherwise
     */
    public static function is_competent_role($user_id, $competency_key) {
        if (!$user_id) {
            return false;
        }
        
        $value = get_user_meta($user_id, $competency_key, true);
        return !empty($value) && !in_array(strtolower($value), ['no', 'none', 'false', ''], true);
    }
    
    /**
     * Check if user is a competent evening trip director
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_evening_trip_director($user_id) {
        return self::is_competent_role($user_id, 'competency_evening_trip_director');
    }
    
    /**
     * Check if user is a competent horizontal trip leader
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_horizontal_trip_leader($user_id) {
        return self::is_competent_role($user_id, 'competency_horizontal_trip_leader');
    }
    
    /**
     * Check if user is a competent evening trip tackle manager
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_evening_trip_tacklemanager($user_id) {
        return self::is_competent_role($user_id, 'competency_evening_trip_tacklemanager');
    }
    
    /**
     * Check if user is a competent evening trip lift coordinator
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_evening_trip_lift_coordinator($user_id) {
        return self::is_competent_role($user_id, 'competency_evening_trip_lift_coordinator');
    }
    
    /**
     * Check if user is a competent vertical trip leader
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_vertical_trip_leader($user_id) {
        return self::is_competent_role($user_id, 'competency_vertical_trip_leader');
    }
    
    /**
     * Check if user is a competent trip buddy/friend
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_trip_buddy_friend($user_id) {
        return self::is_competent_role($user_id, 'competency_trip_buddy_friend');
    }
    
    /**
     * Check if user is a competent overnight trip director
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_overnight_trip_director($user_id) {
        return self::is_competent_role($user_id, 'competency_overnight_trip_director');
    }
    
    /**
     * Check if user is a competent overnight evening meal coordinator
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_overnight_evening_meal($user_id) {
        return self::is_competent_role($user_id, 'competency_overnight_evening_meal');
    }
    
    /**
     * Check if user is a competent overnight caving coordinator
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_overnight_caving_coordinator($user_id) {
        return self::is_competent_role($user_id, 'competency_overnight_caving_coordinator');
    }
    
    /**
     * Check if user is a competent overnight lift coordinator
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_overnight_lift_coordinator($user_id) {
        return self::is_competent_role($user_id, 'competency_overnight_lift_coordinator');
    }
    
    /**
     * Check if user is a competent overnight breakfast coordinator
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_overnight_breakfast_coordinator($user_id) {
        return self::is_competent_role($user_id, 'competency_overnight_breakfast_coordinator');
    }
    
    /**
     * Check if user is a competent training organiser
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_training_organiser($user_id) {
        return self::is_competent_role($user_id, 'competency_training_training_organiser');
    }
    
    /**
     * Check if user is a competent skillsharer
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_skillsharer($user_id) {
        return self::is_competent_role($user_id, 'competency_training_skillsharer');
    }
    
    /**
     * Check if user is a competent social organiser
     * 
     * @param int $user_id User ID
     * @return bool True if competent, false otherwise
     */
    public static function is_competent_social_organiser($user_id) {
        return self::is_competent_role($user_id, 'competency_social_social_organiser');
    }
    
    /**
     * Get all competencies for a user
     * 
     * @param int $user_id User ID
     * @return array Array of competencies with boolean values
     */
    public static function get_competencies($user_id) {
        return [
            'evening_trip_director' => self::is_competent_evening_trip_director($user_id),
            'horizontal_trip_leader' => self::is_competent_horizontal_trip_leader($user_id),
            'evening_trip_tacklemanager' => self::is_competent_evening_trip_tacklemanager($user_id),
            'evening_trip_lift_coordinator' => self::is_competent_evening_trip_lift_coordinator($user_id),
            'vertical_trip_leader' => self::is_competent_vertical_trip_leader($user_id),
            'trip_buddy_friend' => self::is_competent_trip_buddy_friend($user_id),
            'overnight_trip_director' => self::is_competent_overnight_trip_director($user_id),
            'overnight_evening_meal' => self::is_competent_overnight_evening_meal($user_id),
            'overnight_caving_coordinator' => self::is_competent_overnight_caving_coordinator($user_id),
            'overnight_lift_coordinator' => self::is_competent_overnight_lift_coordinator($user_id),
            'overnight_breakfast_coordinator' => self::is_competent_overnight_breakfast_coordinator($user_id),
            'training_organiser' => self::is_competent_training_organiser($user_id),
            'skillsharer' => self::is_competent_skillsharer($user_id),
            'social_organiser' => self::is_competent_social_organiser($user_id),
        ];
    }
    
    /**
     * Check if user has a specific competency
     * 
     * @param int $user_id User ID
     * @param string $competency_key Competency key
     * @return bool True if user has the competency, false otherwise
     */
    public static function check_competency_permissions($user_id, $required_competency) {
        $competencies = self::get_competencies($user_id);
        return isset($competencies[$required_competency]) && $competencies[$required_competency];
    }
    
    /**
     * Get skill meta key from skill category
     * 
     * @param string $skill_category Skill category
     * @return string Meta key
     */
    private static function get_skill_meta_key($skill_category) {
        $map = [
            'horizontalSkills' => 'skills-horizontal',
            'srtSkills' => 'skills-srt',
            'leadingHorizontalSkills' => 'skills-leading-horizontal',
            'leadingSrtSkills' => 'skills-leading-srt',
            'leadingCoachingSkills' => 'skills-leading-coaching'
        ];
        return isset($map[$skill_category]) ? $map[$skill_category] : '';
    }
    
    /**
     * Check if user has a specific caving competency level
     * 
     * @param int $user_id User ID
     * @param string $skill_category Skill category
     * @param string $required_level Required competency level
     * @return bool True if user has the required competency level, false otherwise
     */
    public static function has_competency($user_id, $skill_category, $required_level) {
        $meta_key = self::get_skill_meta_key($skill_category);
        if (empty($meta_key)) {
            return false;
        }
        
        $user_skill = get_user_meta($user_id, $meta_key, true);
        if (empty($user_skill)) {
            return false;
        }
        
        $levels = ['none' => 0, 'basic' => 1, 'intermediate' => 2, 'advanced' => 3, 'leader' => 4];
        
        // Extract level from skill description
        $user_level = strtolower($user_skill);
        $user_level_value = 0;
        
        foreach ($levels as $level => $value) {
            if (strpos($user_level, $level) !== false) {
                $user_level_value = $value;
                break;
            }
        }
        
        $required_level = strtolower($required_level);
        $required_level_value = isset($levels[$required_level]) ? $levels[$required_level] : 0;
        
        return $user_level_value >= $required_level_value;
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
