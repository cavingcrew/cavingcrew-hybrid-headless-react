<?php
/**
 * Trip Participants REST Controller
 *
 * @package HybridHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Trip Participants Controller Class
 */
class Hybrid_Headless_Trip_Participants_Controller {
    /**
     * Constructor
     */
    public function __construct() {
        $this->register_hooks();
    }

    /**
     * Register WordPress hooks
     */
    public function register_hooks() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Explicit initialization
     */
    public function init() {
        $this->register_routes();
    }

    /**
     * Register routes
     */
    public function register_routes() {
        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/trip-participants/(?P<trip_id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array($this, 'get_trip_participants'),
                    'permission_callback' => '__return_true', // We'll handle permissions in the callback
                    'args'                => array(
                        'trip_id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param);
                            },
                        ),
                    ),
                ),
            )
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/trip-participants/(?P<trip_id>\d+)/update',
            array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array($this, 'update_trip_participant'),
                    'permission_callback' => array($this, 'check_admin_permissions'),
                    'args'                => array(
                        'trip_id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param) && intval($param) > 0;
                            },
                            'sanitize_callback' => 'absint',
                        ),
                        'user_id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param) && intval($param) > 0 && get_userdata(intval($param)) !== false;
                            },
                            'sanitize_callback' => 'absint',
                        ),
                        'order_id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param) && intval($param) > 0 && wc_get_order(intval($param)) !== false;
                            },
                            'sanitize_callback' => 'absint',
                        ),
                    ),
                ),
            )
        );
    }

    /**
     * Check if user has admin permissions for a trip
     *
     * @param WP_REST_Request $request Request object.
     * @return bool|WP_Error
     */
    public function check_admin_permissions($request) {
        return Hybrid_Headless_Auth_Utils::check_trip_director_permissions($request);
    }

    /**
     * Determine user's access level for a trip
     *
     * @param int $trip_id Trip ID.
     * @param int $user_id User ID.
     * @return string 'public', 'logged_in', 'participant', 'event_role', 'admin', or 'super_admin'
     */
    private function get_access_level($trip_id, $user_id) {
        if (!$user_id) {
            return 'public';
        }

        // Check if user is an Administrator or Shop Manager (super_admin)
        $user = get_userdata($user_id);
        $is_super_admin = $user && ($user->has_cap('administrator') || $user->has_cap('manage_woocommerce'));

        if (WP_DEBUG) {
            error_log(sprintf(
                '[Trip Participants Access] User ID: %d, Super Admin: %s',
                $user_id,
                $is_super_admin ? 'yes' : 'no'
            ));
        }

        if ($is_super_admin) {
            return 'super_admin';
        }

        // Check if user is a committee member (admin)
        $committee_current = get_user_meta($user_id, 'committee_current', true);
        if (WP_DEBUG) {
            error_log(sprintf('[Trip Participants Access] User %d committee_current value: "%s"', $user_id, $committee_current));
        }
        
        $is_committee = $committee_current && 
                        $committee_current !== '' && 
                        $committee_current !== 'retired' && 
                        $committee_current !== 'revoked' && 
                        $committee_current !== 'legacy' && 
                        $committee_current !== 'expired';
        
        if ($is_committee) {
            if (WP_DEBUG) {
                error_log(sprintf('[Trip Participants Access] User %d is committee member with role: %s', $user_id, $committee_current));
            }
            return 'admin';
        } else if (WP_DEBUG) {
            error_log(sprintf('[Trip Participants Access] User %d is NOT a valid committee member', $user_id));
        }
        
        // Check if user is a member
        $is_member = get_user_meta($user_id, 'cc_member', true) === 'yes';
        if (WP_DEBUG) {
            error_log(sprintf('[Trip Participants Access] User %d is member: %s', $user_id, $is_member ? 'yes' : 'no'));
        }

        // Check if user is signed up for this trip and/or is a trip director
        $orders = wc_get_orders([
            'customer_id' => $user_id,
            'limit' => -1,
            'status' => ['on-hold', 'processing', 'completed'],
        ]);

        if (WP_DEBUG) {
            error_log(sprintf(
                '[Trip Participants Access] User ID: %d, Orders found: %d',
                $user_id,
                count($orders)
            ));
        }

        $is_participant = false;
        $is_event_role = false;

        foreach ($orders as $order) {
            $order_id = $order->get_id();
            $order_status = $order->get_status();

            if (WP_DEBUG) {
                error_log(sprintf(
                    '[Trip Participants Access] Checking Order ID: %d, Status: %s',
                    $order_id,
                    $order_status
                ));
            }

            if ($order_status === 'completed') {
                $cc_attendance = $order->get_meta('cc_attendance');
                if (strpos($cc_attendance, 'cancelled') !== false) {
                    if (WP_DEBUG) {
                        error_log(sprintf('[Trip Participants Access] Order %d skipped - cancelled', $order_id));
                    }
                    continue;
                }
            }

            foreach ($order->get_items() as $item) {
                $product = $item->get_product();
                if ($product) {
                    $product_id = $product->get_parent_id() ?: $product->get_id();
                    if (WP_DEBUG) {
                        error_log(sprintf(
                            '[Trip Participants Access] Order %d contains product %d, comparing with trip %d',
                            $order_id,
                            $product_id,
                            $trip_id
                        ));
                    }

                    if ($product_id == $trip_id) {
                        $is_participant = true;
                        if (WP_DEBUG) {
                            error_log(sprintf('[Trip Participants Access] User %d is participant for trip %d', $user_id, $trip_id));

                            $cc_volunteer = $order->get_meta('cc_volunteer');
                            error_log(sprintf('[Trip Participants Access] Volunteer role: %s', $cc_volunteer));
                        }

                        // Check for trip director role (admin)
                        if (strpos(strtolower($cc_volunteer), 'director') !== false && 
                            strpos(strtolower($cc_volunteer), 'trip') !== false || 
                            $cc_volunteer === 'cabbage1239zz') {
                            if (WP_DEBUG) {
                                error_log(sprintf('[Trip Participants Access] User %d is admin for trip %d', $user_id, $trip_id));
                            }
                            return 'admin';
                        }
                        
                        // Check for event role
                        if ($order_status === 'processing' && 
                            (!$order->get_meta('cc_attendance') || $order->get_meta('cc_attendance') === 'pending') && 
                            $cc_volunteer && $cc_volunteer !== 'none') {
                            $is_event_role = true;
                            if (WP_DEBUG) {
                                error_log(sprintf('[Trip Participants Access] User %d has event role for trip %d', $user_id, $trip_id));
                            }
                        }
                    }
                }
            }
        }

        // If user is an event role or participant but not a member, downgrade to logged_in
        if ($is_event_role) {
            return $is_member ? 'event_role' : 'logged_in';
        }
        
        return $is_participant ? ($is_member ? 'participant' : 'logged_in') : 'logged_in';
    }

    /**
     * Get trip participants
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error
     */
    public function get_trip_participants($request) {
        $trip_id = absint($request['trip_id']); // Ensure integer

        // Ensure user is properly authenticated
        $user_id = 0;
        if (isset($_COOKIE[LOGGED_IN_COOKIE])) {
            $cookie = $_COOKIE[LOGGED_IN_COOKIE];
            $user_id = wp_validate_auth_cookie($cookie, 'logged_in');
            if ($user_id) {
                wp_set_current_user($user_id);
            }
        }

        // Force integer type for comparison
        $trip_id = (int)$trip_id;

        // Check user purchases directly
        $has_purchased = false;
        if ($user_id) {
            $orders = wc_get_orders([
                'customer_id' => $user_id,
                'limit' => -1,
                'status' => ['on-hold', 'processing', 'completed'],
            ]);

            foreach ($orders as $order) {
                foreach ($order->get_items() as $item) {
                    $product = $item->get_product();
                    if ($product) {
                        $product_id = (int)($product->get_parent_id() ?: $product->get_id());
                        if ($product_id === $trip_id) {
                            $has_purchased = true;
                            break 2;
                        }
                    }
                }
            }
        }

        $access_level = $this->get_access_level($trip_id, $user_id);

        // Debug logging for authentication issues
        if (WP_DEBUG) {
            error_log(sprintf(
                '[Trip Participants] User ID: %d, Access Level: %s, Trip ID: %d, Has Purchased: %s, Cookie present: %s',
                $user_id,
                $access_level,
                $trip_id,
                $has_purchased ? 'yes' : 'no',
                isset($_COOKIE[LOGGED_IN_COOKIE]) ? 'yes' : 'no'
            ));
        }

        // Override access level if user has purchased this trip and is a member
        if ($has_purchased && ($access_level === 'public' || $access_level === 'logged_in')) {
            $is_member = get_user_meta($user_id, 'cc_member', true) === 'yes';
            $access_level = $is_member ? 'participant' : 'logged_in';
            if (WP_DEBUG) {
                error_log(sprintf(
                    '[Trip Participants] %s access level to %s for user %d on trip %d (is_member: %s)',
                    $is_member ? 'Upgrading' : 'Setting',
                    $access_level,
                    $user_id,
                    $trip_id,
                    $is_member ? 'yes' : 'no'
                ));
            }
        }

        // For admin-level access, check if user has access to the event
        // Skip this check for committee members who already have admin access level
        if ($access_level === 'admin') {
            $is_committee = $this->is_committee_member($user_id);
            $has_event_access = $this->user_has_access_to_event($trip_id);
            
            if (WP_DEBUG) {
                error_log(sprintf(
                    '[Trip Participants Auth] User %d, Access Level: %s, Is Committee: %s, Has Event Access: %s',
                    $user_id,
                    $access_level,
                    $is_committee ? 'yes' : 'no',
                    $has_event_access ? 'yes' : 'no'
                ));
            }
            
            if (!$is_committee && !$has_event_access) {
                if (WP_DEBUG) {
                    error_log(sprintf(
                        '[Trip Participants Auth] DENYING ACCESS to User %d for trip %d - not committee and no event access',
                        $user_id,
                        $trip_id
                    ));
                }
                return new WP_Error(
                    'unauthorised_for_that_event',
                    __('You do not have access to this event.', 'hybrid-headless'),
                    array('status' => 403)
                );
            }
            
            if (WP_DEBUG) {
                error_log(sprintf(
                    '[Trip Participants Auth] GRANTING ACCESS to User %d for trip %d - %s',
                    $user_id,
                    $trip_id,
                    $is_committee ? 'is committee member' : 'has event access'
                ));
            }
        }
        
        // Super admin always has access
        if ($access_level === 'super_admin' && WP_DEBUG) {
            error_log(sprintf('[Trip Participants] Super admin access granted for user %d on trip %d', $user_id, $trip_id));
        }

        // Get all orders for this trip based on access level
        $orders = $this->get_trip_orders($trip_id, $access_level);

        if (empty($orders)) {
            return rest_ensure_response([
                'participants' => [],
                'access_level' => $access_level,
                'trip_id' => $trip_id,
                'participant_count' => 0,
                'is_logged_in' => ($user_id > 0)
            ]);
        }

        // Process participants based on access level using the filtered orders
        $participants = [];
        $participant_count = count($filtered_orders); // Count based on filtered list

        // If not logged in, only return count
        if ($access_level === 'public') {
            return rest_ensure_response([
                'participants' => [], // No participant details for public
                'access_level' => $access_level,
                'trip_id' => $trip_id,
                'participant_count' => $participant_count,
                'is_logged_in' => false
            ]);
        }

        // If logged in but not participant/admin, return only first names and count
        if ($access_level === 'logged_in') {
             $participant_first_names = [];
             foreach ($filtered_orders as $order) {
                 $participant_user_id = $order->get_customer_id();
                 if (!$participant_user_id) continue;
                 $user = get_userdata($participant_user_id);
                 if ($user) {
                     $participant_first_names[] = ['first_name' => $user->first_name];
                 }
             }
             return rest_ensure_response([
                 'participants' => $participant_first_names, // Only first names
                 'access_level' => $access_level,
                 'trip_id' => $trip_id,
                 'participant_count' => $participant_count,
                 'is_logged_in' => true
             ]);
        }


        // For participant, admin, super_admin levels - process full details from filtered list
        foreach ($filtered_orders as $order) {
            $participant_user_id = $order->get_customer_id();
            if (!$participant_user_id) continue;

            $user = get_userdata($participant_user_id);
            if (!$user) continue;

            // Basic info for all access levels
            $participant = [
                'first_name' => $user->first_name,
                'order_id' => $order->get_id()
            ];

            // Add additional info based on access level
            if ($access_level === 'participant' || $access_level === 'event_role' || $access_level === 'admin' || $access_level === 'super_admin') {
                $participant['last_name'] = $user->last_name;
                $participant['user_id'] = $participant_user_id;

                // Add participant-level meta
                $participant_meta = $this->get_participant_meta($participant_user_id);
                $participant['meta'] = $participant_meta;

                // Add order meta
                $participant['order_meta'] = $this->get_order_meta($order->get_id());
            }

            // Add admin-level meta
            if ($access_level === 'admin' || $access_level === 'super_admin') {
                $admin_meta = $this->get_admin_meta($participant_user_id);
                $participant['admin_meta'] = $admin_meta;
                $participant['order_status'] = $order->get_status();
                $participant['cc_attendance'] = $order->get_meta('cc_attendance');
            }

            $participants[] = $participant;
        }

        // Prepare response with event closure information
        $response = [
            'participants' => $participants,
            'access_level' => $access_level,
            'trip_id' => $trip_id,
            'can_update' => ($access_level === 'admin' || $access_level === 'super_admin'),
            'participant_count' => $participant_count,
            'is_logged_in' => true
        ];

        // Check if event is closed (has trip-reports tag)
        $product = wc_get_product($trip_id);
        if ($product) {
            $terms = wp_get_post_terms($product->get_id(), 'product_tag');
            $term_ids = wp_list_pluck($terms, 'term_id');
            $has_closed_tag = in_array(61, $term_ids);
            
            if ($has_closed_tag) {
                $response['event_closed'] = true;
                $response['event_message'] = 'This event has been finalized and archived';
                $response['closed_at'] = $product->get_meta('cc_post_completed_at');
                $response['closed_by'] = $product->get_meta('cc_post_completed_by');
            }
        }

        return rest_ensure_response($response);
    }

    /**
     * Get all orders for a trip
     *
     * @param int $trip_id Trip ID.
     * @return array Array of WC_Order objects
     */
    private function get_trip_orders($trip_id) {
        $orders = [];

        // Get all potentially relevant statuses
        $statuses = ['on-hold', 'processing', 'completed', 'pending', 'cancelled', 'refunded', 'failed'];

        // Query for orders containing this product
        $order_ids = wc_get_orders([
            'limit' => -1,
            'return' => 'ids',
            'status' => $statuses,
        ]);

        foreach ($order_ids as $order_id) {
            $order = wc_get_order($order_id);
            if (!$order) continue;

            // Check if order contains the trip - always check this
            $contains_trip = false;
            foreach ($order->get_items() as $item) {
                $product = $item->get_product();
                if ($product) {
                    $product_id = (int)($product->get_parent_id() ?: $product->get_id());
                    if ($product_id === $trip_id) {
                        $contains_trip = true;
                        break;
                    }
                }
            }

            if ($contains_trip) {
                 $orders[] = $order;
            }
        }

        return $orders; // Return all orders containing the trip; filtering happens in the main function
    }

    /**
     * Get participant-level meta for a user
     *
     * @param int $user_id User ID.
     * @return array
     */
    private function get_participant_meta($user_id) {
        $meta_keys = [
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
            'gear-rope-length',
            'gear-walking-equipment-weekend',
            'admin-will-you-not-flake-please',
            'caving-srt-or-horizontal-preference',
            'admin-over18',
            'admin_u18_child_name_of_supervisor',
            'admin_u18_participation_statement_one',
            'admin_u18_participation_statement_two',
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
            'caving-srt-happy-to-second-or-lead',
            'committee_current',
            'membership_joining_date',
            'cc_membership_join_date',
            'admin_evening_requests_notes',
            'admin_day_requests_notes',
            'admin_overnight_requests_notes',
            'admin_training_requests_notes',
            'admin_social_requests_notes',
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
            'gear_wellies_size',
            'admin_training_join_admin_team'
        ];

        $meta = [];
        foreach ($meta_keys as $key) {
            $meta[$key] = get_user_meta($user_id, $key, true);
        }

        return $meta;
    }

    /**
     * Get admin-level meta for a user
     *
     * @param int $user_id User ID.
     * @return array
     */
    private function get_admin_meta($user_id) {
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
            'admin-phone-number',
                        'admin_u18_supervisor_name_of_child',
            'billing_phone',
            'shipping_address_1',
            'shipping_address_2',
            'shipping_city',
            'shipping_postcode',
            'shipping_country',
            'payment_customer_id',
            'payment_customer_email',
            'admin-club-constitution-acceptance',
            '_legacy_info_bca_member',
            '_legacy_info_bca_club',
            'admin_dob',
            'membership_managed',
            'membership_renewal_date',
            'membership_leaving_date',
            'membership_cancellation_date',
            'cc_membership_cancellation_intent_date',
            'admin-membership-type',
            'admin-club-constitution-acceptance-noted-date',
            'admin-code-of-conduct-accepted-noted-date',
            'admin-code-of-conduct-accepted',
            'admin-social-facebook-url',
            'admin-social-instagram-handle',
            'caving_trip_leaving_postcode',
            'caving_trip_leaving_postcode_geocoded',
                        'admin-personal-year-of-birth',
                        'admin-personal-pronouns',
                        'admin-car-registration',
                        'admin-health-shoulder',
                                    'admin-health-asthma',
                                    'admin-health-missing-dose',
                        'admin-health-impairment-through-medication',
            'caving_trip_leaving_postcode_geocoded_last_updated'
        ];

        $meta = [];
        foreach ($meta_keys as $key) {
            $meta[$key] = get_user_meta($user_id, $key, true);
        }

        return $meta;
    }

    /**
     * Get order meta
     *
     * @param int $order_id Order ID.
     * @return array
     */
    private function get_order_meta($order_id) {
        $meta_keys = [
            'cc_attendance',
            'cc_volunteer',
            'cc_volunteer_attendance',
            'cc_attendance_sim',
            'cc_volunteer_attendance_sim',
            'cc_volunteer_sim',
            'cc_outdoor_location_sim',
            'cc_location',
            'cc_outdoor_location'
        ];

        $order = wc_get_order($order_id);
        if (!$order) {
            return [];
        }

        $meta = [];
        foreach ($meta_keys as $key) {
            $meta[$key] = $order->get_meta($key);
        }

        return $meta;
    }

    /**
     * Check if user has access to event
     *
     * @param int $product_id Product/Trip ID.
     * @return boolean
     */
    private function user_has_access_to_event($product_id) {
        // Check if user is an admin, shop manager, or committee member
        $user_id = get_current_user_id();
        if (!$user_id) {
            return false;
        }
        
        // Check admin/shop manager permissions
        $user = get_userdata($user_id);
        if ($user && ($user->has_cap('administrator') || $user->has_cap('manage_woocommerce'))) {
            return true;
        }
        
        // Check committee membership
        if (Hybrid_Headless_Auth_Utils::is_committee_member($user_id)) {
            return true;
        }
        
        // Check if user is a trip director for this trip
        if (Hybrid_Headless_Auth_Utils::is_trip_director($user_id, $product_id)) {
            return true;
        }
        
        // Check if user has a volunteer role for this trip
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
                    if ($product_id == $product_id) {
                        $cc_volunteer = $order->get_meta('cc_volunteer');
                        $cc_attendance = $order->get_meta('cc_attendance');
                        
                        if ($cc_volunteer && $cc_volunteer !== 'none' && 
                            (!$cc_attendance || $cc_attendance === 'pending')) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Check if user is a committee member
     *
     * @param int $user_id User ID.
     * @return boolean
     */
    private function is_committee_member($user_id) {
        return Hybrid_Headless_Auth_Utils::is_committee_member($user_id);
    }
    
    /**
     * Update trip participant information
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error
     */
    public function update_trip_participant($request) {
        $trip_id = absint($request['trip_id']);
        $user_id = absint($request['user_id']);
        $order_id = absint($request['order_id']);
        $data = $request->get_json_params();

        // Validate data structure
        if (!is_array($data)) {
            return new WP_Error(
                'invalid_data_format',
                __('Invalid data format. JSON object expected.', 'hybrid-headless'),
                array('status' => 400)
            );
        }

        // Check if user has access to the event
        if (!$this->user_has_access_to_event($trip_id)) {
            return new WP_Error(
                'unauthorised_for_that_event',
                __('You do not have access to this event.', 'hybrid-headless'),
                array('status' => 403)
            );
        }

        // Validate the order belongs to the user and trip
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error(
                'invalid_order',
                __('Invalid order ID.', 'hybrid-headless'),
                array('status' => 400)
            );
        }

        if ($order->get_customer_id() != $user_id) {
            return new WP_Error(
                'order_user_mismatch',
                __('Order does not belong to the specified user.', 'hybrid-headless'),
                array('status' => 400)
            );
        }

        $found_trip = false;
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            if ($product) {
                $product_id = $product->get_parent_id() ?: $product->get_id();
                if ($product_id == $trip_id) {
                    $found_trip = true;
                    break;
                }
            }
        }

        if (!$found_trip) {
            return new WP_Error(
                'order_trip_mismatch',
                __('Order does not contain the specified trip.', 'hybrid-headless'),
                array('status' => 400)
            );
        }

        // Update user meta if provided
        if (!empty($data['user_meta'])) {
            // Validate user_meta is an array
            if (!is_array($data['user_meta'])) {
                return new WP_Error(
                    'invalid_user_meta',
                    __('User meta must be an array.', 'hybrid-headless'),
                    array('status' => 400)
                );
            }

            $allowed_user_meta_keys = [
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
                'competency_social_social_organiser'
            ];

            // Valid values for competency fields
            $valid_competency_values = ['yes', 'no', ''];

            foreach ($data['user_meta'] as $key => $value) {
                // Validate key is allowed
                if (!in_array($key, $allowed_user_meta_keys)) {
                    continue; // Skip disallowed keys
                }

                // Validate value is allowed for competency fields
                if (!in_array($value, $valid_competency_values)) {
                    return new WP_Error(
                        'invalid_competency_value',
                        sprintf(__('Invalid value for %s. Allowed values are: yes, no, or empty string.', 'hybrid-headless'), $key),
                        array('status' => 400)
                    );
                }

                // Sanitize and update
                update_user_meta($user_id, $key, sanitize_text_field($value));
            }
        }

        // Update order meta if provided
        if (!empty($data['order_meta'])) {
            // Validate order_meta is an array
            if (!is_array($data['order_meta'])) {
                return new WP_Error(
                    'invalid_order_meta',
                    __('Order meta must be an array.', 'hybrid-headless'),
                    array('status' => 400)
                );
            }

            $allowed_order_meta_keys = [
                'cc_attendance',
                'cc_volunteer',
                'cc_volunteer_attendance',
                'cc_attendance_sim',
                'cc_volunteer_attendance_sim',
                'cc_volunteer_sim',
                'cc_outdoor_location_sim',
                'cc_location',
                'cc_outdoor_location'
            ];

            // Valid values for specific fields
            $attendance_values = ['pending', 'attended', 'noshow', 'cancelled', 'latebail', 'noregistershow'];
            $volunteer_values = ['none', 'director', 'tacklemanager', 'lift', 'cabbage1239zz', 'floorwalker', 'skillsharer', 'announcements', 'checkin', 'pairing'];

            foreach ($data['order_meta'] as $key => $value) {
                // Validate key is allowed
                if (!in_array($key, $allowed_order_meta_keys)) {
                    continue; // Skip disallowed keys
                }

                // Validate specific field values
                if ($key === 'cc_attendance' && !in_array($value, $attendance_values)) {
                    return new WP_Error(
                        'invalid_attendance_value',
                        __('Invalid attendance value. Allowed values are: pending, attended, noshow, cancelled, latebail, noregistershow.', 'hybrid-headless'),
                        array('status' => 400)
                    );
                }

                if ($key === 'cc_volunteer' && !in_array($value, $volunteer_values)) {
                    return new WP_Error(
                        'invalid_volunteer_value',
                        __('Invalid volunteer value.', 'hybrid-headless'),
                        array('status' => 400)
                    );
                }

                // Sanitize and update
                $order->update_meta_data($key, sanitize_text_field($value));
            }

            $order->save();
        }

        return rest_ensure_response([
            'success' => true,
            'message' => __('Participant information updated successfully.', 'hybrid-headless')
        ]);
    }
}
