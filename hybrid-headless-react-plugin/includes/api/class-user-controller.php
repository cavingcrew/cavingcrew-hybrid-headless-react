<?php
/**
 * User REST Controller
 *
 * @package HybridHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * User Controller Class
 */
class Hybrid_Headless_User_Controller {
    /**
     * Constructor
     */
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register routes
     */
    public function register_routes() {
        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/user',
            array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array($this, 'get_user'),
                    'permission_callback' => '__return_true',
                )
            )
        );
    }

    /**
     * Get comprehensive user information
     *
     * @return WP_REST_Response
     */
    public function get_user() {
        // Validate auth cookie
        $user_id = 0;
        $logged_in = false;

        if (isset($_COOKIE[LOGGED_IN_COOKIE])) {
            $cookie = $_COOKIE[LOGGED_IN_COOKIE];
            $user_id = wp_validate_auth_cookie($cookie, 'logged_in');
            $logged_in = (bool)$user_id;
        }

        $response = [
            'isLoggedIn' => $logged_in,
            'isMember' => $this->is_member($user_id),
            'cartCount' => 0
        ];

        if (!$logged_in) {
            return rest_ensure_response($response);
        }

        // Get basic user info from wp_users table
        $user = get_userdata($user_id);
        $response['user'] = [
            'id' => $user->ID,
            'user_login' => $user->user_login,
            'user_email' => $user->user_email,
            'nickname' => $user->nickname,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'billing_first_name' => $user->billing_first_name,
            'billing_last_name' => $user->billing_last_name,
            'billing_email' => $user->billing_email,
            'billing_address_1' => $user->billing_address_1,
            'billing_address_2' => $user->billing_address_2,
            'billing_city' => $user->billing_city,
            'billing_postcode' => $user->billing_postcode,
            'billing_country' => $user->billing_country,
        ];

        // Get specified user meta fields
        $meta_keys = [
            'admin-emergency-contact-name',
            'admin-emergency-contact-phone',
            'admin-first-timer-question',
            'admin-covid-agreement',
            'admin-covid-cautious',
            'admin-no-insurance-disclaimer',
            'admin-insurance-status',
            'admin-participation-statement-one',
            'admin-participation-statement-two',
            'admin-diet-allergies-health-extra-info',
            'admin-dietary-requirements',
            'skills-horizontal',
            'skills-leading-srt',
            'skills-srt',
            'skills-leading-horizontal',
            'caving-horizontal-happy-to-second-or-lead',
            'gear-bringing-evening-or-day-trip',
            'transport-need-lift',
            'transport-will-you-give-lift',
            'transport-depature-time',
            'transport-leaving-location',
            'admin-phone-number',
            'gear-rope-length',
            'gear-walking-equipment-weekend',
            'last_update',
            'wc_last_active',
            'billing_phone',
            'admin-will-you-not-flake-please',
            'shipping_address_1',
            'shipping_address_2',
            'shipping_city',
            'shipping_postcode',
            'shipping_country',
            'payment_customer_id',
            'payment_customer_email',
            'caving-srt-or-horizontal-preference',
            'admin-club-constitution-acceptance',
            '_legacy_info_bca_member',
            '_legacy_info_bca_club',
            'admin-over18',
            'admin_dob',
            'admin-personal-year-of-birth',
            'admin-personal-pronouns',
            'admin-car-registration',
            'admin-health-shoulder',
            'admin-health-impairment-through-medication',
            'admin_u18_child_name_of_supervisor',
            'admin_u18_participation_statement_one',
            'admin_u18_participation_statement_two',
            'admin_u18_supervisor_name_of_child',
            'admin-health-asthma',
            'admin-health-missing-dose',
            'admin-other-club-name',
            'admin-bca-number',
            'misc-any-other-requests',
            'admin_can_you_help_evenings',
            'admin_can_you_help_overnight',
            'admin_can_you_help_daytrip',
            'admin-can-you-help-organisation',
            'admin-can-you-help-social',
            'admin-can-you-help-training',
            'admin_can_you_help_ew',
            'cc_member',
            'skills-leading-coaching',
            'membership_managed',
            'membership_renewal_date',
            'caving-srt-happy-to-second-or-lead',
            'committee_current',
            'membership_leaving_date',
            'membership_cancellation_date',
            'cc_membership_cancellation_intent_date',
            'admin-membership-type',
            'membership_joining_date',
            'cc_membership_join_date',
            'admin-club-constitution-acceptance-noted-date',
            'admin-code-of-conduct-accepted-noted-date',
            'admin-code-of-conduct-accepted',
            'admin_evening_requests_notes',
            'admin_day_requests_notes',
            'admin_overnight_requests_notes',
            'admin_training_requests_notes',
            'admin_social_requests_notes',
            'admin-social-facebook-url',
            'admin-social-instagram-handle',
            'admin-uninsured-climbers-alert-1',
            'admin-no-personal-insurance-disclaimer',
            'stats_volunteer_for_numerator_cached',
            'stats_volunteer_for_but_no_attend_cached',
            'stats_volunteer_for_denominator_cached',
            'stats_attendance_attended_cached',
            'stats_attendance_outdoor_day_attended_cached',
            'stats_attendance_outdoor_saturday_attended_cached',
            'stats_attendance_indoor_wednesday_attended_cached',
            'stats_attendance_overnight_attended_cached',
            'stats_attendance_training_attended_cached',
            'stats_attendance_social_attended_cached',
            'stats_attendance_signups_cached',
            'stats_attendance_cancelled_cached',
            'stats_attendance_noregistershow_cached',
            'stats_attendance_noshow_cached',
            'stats_attendance_latebail_cached',
            'stats_attendance_duplicate_cached',
            'stats_attendance_inprogress_cached',
            'stats_volunteer_for_but_no_volunteer_cached',
            'scores_volunteer_reliability_score_cached',
            'scores_attendance_reliability_score_cached',
            'scores_volunteer_value_cached',
            'scores_attendance_score_cached',
            'scores_volunteer_score_cached',
            'scores_and_stats_cache_last_updated',
            'cc_attendance_noted_date',
            'cc_compliance_last_date_of_caving',
            'milestones_3_badge',
            'milestones_3_badge_marked_given_at',
            'milestones_3_badge_marked_given_by',
            'milestones_5_band',
            'milestones_5_band_marked_given_at',
            'milestones_5_band_marked_given_by',
            'cc_compliance_first_date_of_caving',
            'competency_evening_trip_director',
            'competency_horizontal_trip_leader',
            'competency_evening_trip_tacklemanager',
            'competency_evening_trip_lift_coordinator',
            'competency_vertical_trip_leader',
            'competency_trip_buddy_friend',
            'competency_overnight_trip_director',
            'competency_overnight_evening_meal',
            'competency_overnight_caving_coordinator',
            'competency_overnight_lift_coordinator',
            'competency_overnight_breakfast_coordinator',
            'competency_training_training_organiser',
            'competency_training_skillsharer',
            'competency_social_social_organiser',
            'admin_evening_join_admin_team',
            'admin_overnight_join_admin_team',
            'caving_trip_leaving_postcode',
            'caving_trip_leaving_postcode_geocoded',
            'caving_trip_leaving_postcode_geocoded_last_updated',
            'gear_wellies_size',
            'admin_training_join_admin_team'
        ];

        $response['user']['meta'] = [];
        foreach ($meta_keys as $key) {
            $response['user']['meta'][$key] = get_user_meta($user_id, $key, true) ?: null;
        }

        // Get purchases data
        $response['purchases'] = [];
        $orders = wc_get_orders([
            'customer_id' => $user_id,
            'limit' => -1,
            'status' => ['on-hold', 'processing', 'completed'],
        ]);

        $product_ids = [];
        foreach ($orders as $order) {
            if ($order->get_status() === 'completed') {
                $cc_attendance = $order->get_meta('cc_attendance');
                if (strpos($cc_attendance, 'cancelled') !== false) continue;
            }

            foreach ($order->get_items() as $item) {
                $product = $item->get_product();
                if ($product) {
                    $product_id = $product->get_parent_id() ?: $product->get_id();
                    if ($product_id == 1272) continue;
                    $product_ids[] = $product_id;
                }
            }
        }
        $response['purchases'] = array_values(array_unique($product_ids));

        // Get cart count
        if (class_exists('WooCommerce') && WC()->cart) {
            $response['cartCount'] = WC()->cart->get_cart_contents_count();
        }

        return rest_ensure_response($response);
    }

    /**
     * Check if user is a member
     */
    private function is_member($user_id) {
        if (!$user_id) return false;
        return get_user_meta($user_id, 'cc_member', true) === 'yes';
    }
}
