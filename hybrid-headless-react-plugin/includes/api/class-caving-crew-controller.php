<?php
/**
 * Caving Crew REST Controller
 *
 * @package HybridHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Caving Crew Controller Class
 * 
 * Implements the endpoints specified in the Caving Crew Management System API Specification
 */
class Hybrid_Headless_Caving_Crew_Controller {
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
        // Event Space Management
        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/caving-crew/events/(?P<id>\d+)/spaces',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array($this, 'update_event_spaces'),
                    'permission_callback' => array($this, 'check_event_admin_permissions'),
                    'args'                => array(
                        'id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param) && intval($param) > 0;
                            },
                            'sanitize_callback' => 'absint',
                        ),
                    ),
                ),
            )
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/caving-crew/events/(?P<id>\d+)/close',
            array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array($this, 'close_event_signup'),
                    'permission_callback' => array($this, 'check_event_admin_permissions'),
                    'args'                => array(
                        'id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param) && intval($param) > 0;
                            },
                            'sanitize_callback' => 'absint',
                        ),
                    ),
                ),
            )
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/caving-crew/events/(?P<id>\d+)/cancel',
            array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array($this, 'cancel_event'),
                    'permission_callback' => array($this, 'check_event_admin_permissions'),
                    'args'                => array(
                        'id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param) && intval($param) > 0;
                            },
                            'sanitize_callback' => 'absint',
                        ),
                    ),
                ),
            )
        );

        // Attendance Management
        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/caving-crew/orders/(?P<id>\d+)/attendance',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array($this, 'update_attendance_status'),
                    'permission_callback' => array($this, 'check_order_admin_permissions'),
                    'args'                => array(
                        'id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param) && intval($param) > 0;
                            },
                            'sanitize_callback' => 'absint',
                        ),
                        'status' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                $valid_statuses = ['attended', 'cancelled', 'noshow', 'latebail', 'crew_cancelled', 'duplicate', 'noregistershow'];
                                return in_array($param, $valid_statuses);
                            },
                        ),
                    ),
                ),
            )
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/caving-crew/events/(?P<id>\d+)/mark-all-attended',
            array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array($this, 'mark_all_attended'),
                    'permission_callback' => array($this, 'check_event_admin_permissions'),
                    'args'                => array(
                        'id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param) && intval($param) > 0;
                            },
                            'sanitize_callback' => 'absint',
                        ),
                    ),
                ),
            )
        );

        // Role Assignment
        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/caving-crew/orders/(?P<id>\d+)/volunteer',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array($this, 'assign_volunteer_role'),
                    'permission_callback' => array($this, 'check_order_admin_permissions'),
                    'args'                => array(
                        'id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param) && intval($param) > 0;
                            },
                            'sanitize_callback' => 'absint',
                        ),
                        'role' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                $valid_roles = [
                                    'trip_director', 'event_assistant', 'lift_coordinator', 
                                    'climbing_coordinator', 'kit_coordinator', 'buddy_coordinator', 
                                    'postpromo1', 'breakfast_marshal', 'lunch_marshal', 
                                    'covid_marshal', 'evening_meal_washingup_marshal', 
                                    'head_chef', 'evening_meal_chef', 'lunch_breakfast_chef', 'none'
                                ];
                                return in_array($param, $valid_roles);
                            },
                        ),
                    ),
                ),
            )
        );

        // Competency Management
        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/caving-crew/users/(?P<id>\d+)/competency',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array($this, 'assign_competency'),
                    'permission_callback' => array($this, 'check_competency_admin_permissions'),
                    'args'                => array(
                        'id' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                return is_numeric($param) && intval($param) > 0;
                            },
                            'sanitize_callback' => 'absint',
                        ),
                        'competency' => array(
                            'required'          => true,
                            'validate_callback' => function($param) {
                                $valid_competencies = [
                                    'overnight_trip_director', 'evening_meal_chef', 
                                    'breakfast_lunch_chef', 'lift_coordinator', 'activities_coordinator'
                                ];
                                return in_array($param, $valid_competencies);
                            },
                        ),
                        'status' => array(
                            'required'          => true,
                        ),
                    ),
                ),
            )
        );
    }

    /**
     * Check if user has admin permissions for an event
     *
     * @param WP_REST_Request $request Request object
     * @return bool|WP_Error
     */
    public function check_event_admin_permissions($request) {
        // First ensure user is authenticated
        Hybrid_Headless_Auth_Utils::ensure_user_authenticated();
        
        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                __('You must be logged in to access this endpoint.', 'hybrid-headless'),
                array('status' => 401)
            );
        }
        
        $user_id = get_current_user_id();
        
        // Check if user is an admin or shop manager
        if (current_user_can('manage_woocommerce') || current_user_can('administrator')) {
            return true;
        }
        
        // Check if user is a committee member
        if (Hybrid_Headless_Auth_Utils::is_committee_member($user_id)) {
            return true;
        }
        
        // Get the product ID from the request
        $product_id = isset($request['id']) ? intval($request['id']) : 0;
        
        if (!$product_id) {
            return new WP_Error(
                'missing_product_id',
                __('Product ID is required.', 'hybrid-headless'),
                array('status' => 400)
            );
        }
        
        // Check if user is a trip director for this product
        if (Hybrid_Headless_Auth_Utils::is_trip_director($user_id, $product_id)) {
            return true;
        }
        
        return new WP_Error(
            'rest_forbidden',
            __('You must be a trip director, committee member, or admin to access this endpoint.', 'hybrid-headless'),
            array('status' => 403)
        );
    }

    /**
     * Check if user has admin permissions for an order
     *
     * @param WP_REST_Request $request Request object
     * @return bool|WP_Error
     */
    public function check_order_admin_permissions($request) {
        // First ensure user is authenticated
        Hybrid_Headless_Auth_Utils::ensure_user_authenticated();
        
        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_not_logged_in',
                __('You must be logged in to access this endpoint.', 'hybrid-headless'),
                array('status' => 401)
            );
        }
        
        $user_id = get_current_user_id();
        
        // Check if user is an admin or shop manager
        if (current_user_can('manage_woocommerce') || current_user_can('administrator')) {
            return true;
        }
        
        // Check if user is a committee member
        if (Hybrid_Headless_Auth_Utils::is_committee_member($user_id)) {
            return true;
        }
        
        // Get the order
        $order_id = $request['id'];
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return new WP_Error(
                'invalid_order',
                __('Order not found.', 'hybrid-headless'),
                array('status' => 404)
            );
        }
        
        // Get the product ID from the order
        $product_id = null;
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            if ($product) {
                $product_id = $product->get_parent_id() ?: $product->get_id();
                break;
            }
        }
        
        if (!$product_id) {
            return new WP_Error(
                'invalid_order',
                __('Order does not contain a valid product.', 'hybrid-headless'),
                array('status' => 400)
            );
        }
        
        // Check if user is a trip director for this product
        if (Hybrid_Headless_Auth_Utils::is_trip_director($user_id, $product_id)) {
            return true;
        }
        
        return new WP_Error(
            'rest_forbidden',
            __('You do not have permission to manage this order.', 'hybrid-headless'),
            array('status' => 403)
        );
    }

    /**
     * Check if user has admin permissions for competency management
     *
     * @param WP_REST_Request $request Request object
     * @return bool|WP_Error
     */
    public function check_competency_admin_permissions($request) {
        // Only committee members can manage competencies
        return Hybrid_Headless_Auth_Utils::check_committee_permissions($request);
    }

    /**
     * Update event spaces
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error
     */
    public function update_event_spaces($request) {
        $product_id = $request['id'];
        $product = wc_get_product($product_id);
        
        if (!$product) {
            return new WP_Error('invalid_product', 'Product not found', ['status' => 404]);
        }
        
        if ($product->is_type('variable')) {
            // Handle variable product
            if (!isset($request['variations']) || !is_array($request['variations'])) {
                return new WP_Error('missing_variations', 'Variation data is required', ['status' => 400]);
            }
            
            $updated_variations = [];
            
            foreach ($request['variations'] as $variation_id => $stock_quantity) {
                $variation = wc_get_product($variation_id);
                if (!$variation || $variation->get_parent_id() != $product_id) {
                    continue;
                }
                
                $stock_quantity = intval($stock_quantity);
                if ($stock_quantity < 0) {
                    continue;
                }
                
                $variation->set_manage_stock(true);
                $variation->set_stock_quantity($stock_quantity);
                $variation->save();
                
                $updated_variations[$variation_id] = $stock_quantity;
            }
            
            return rest_ensure_response([
                'success' => true,
                'product_id' => $product_id,
                'updated_variations' => $updated_variations
            ]);
        } else {
            // Handle simple product
            if (!isset($request['stock_quantity'])) {
                return new WP_Error('missing_stock', 'Stock quantity is required', ['status' => 400]);
            }
            
            $stock_quantity = intval($request['stock_quantity']);
            if ($stock_quantity < 0) {
                return new WP_Error('invalid_stock', 'Stock quantity must be non-negative', ['status' => 400]);
            }
            
            $product->set_manage_stock(true);
            $product->set_stock_quantity($stock_quantity);
            $product->save();
            
            return rest_ensure_response([
                'success' => true,
                'product_id' => $product_id,
                'stock_quantity' => $stock_quantity
            ]);
        }
    }

    /**
     * Close event signup
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error
     */
    public function close_event_signup($request) {
        $product_id = $request['id'];
        $product = wc_get_product($product_id);
        
        if (!$product) {
            return new WP_Error('invalid_product', 'Product not found', ['status' => 404]);
        }
        
        if ($product->is_type('variable')) {
            // Handle variable product
            $variations = $product->get_children();
            foreach ($variations as $variation_id) {
                $variation = wc_get_product($variation_id);
                if (!$variation) {
                    continue;
                }
                
                $variation->set_manage_stock(true);
                $variation->set_stock_quantity(0);
                $variation->save();
            }
        } else {
            // Handle simple product
            $product->set_manage_stock(true);
            $product->set_stock_quantity(0);
            $product->save();
        }
        
        return rest_ensure_response([
            'success' => true,
            'product_id' => $product_id,
            'message' => 'Event signup closed'
        ]);
    }

    /**
     * Cancel event
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error
     */
    public function cancel_event($request) {
        $product_id = $request['id'];
        $current_user = wp_get_current_user();
        $current_time = time();
        
        // Get all pending orders for this product
        $orders = Hybrid_Headless_Auth_Utils::get_pending_orders_for_product($product_id);
        
        $updated_orders = [];
        
        // Update each order
        foreach ($orders as $order_id) {
            $order = wc_get_order($order_id);
            
            if (!$order) {
                continue;
            }
            
            // Update order status and metadata
            $order->update_status('cancelled');
            $order->update_meta_data('cc_attendance', 'clan_cancelled');
            $order->update_meta_data('cc_attendance_set_by', $current_user->user_email);
            $order->update_meta_data('cc_attendance_set_at', $current_time);
            $order->save();
            
            $updated_orders[] = $order_id;
        }
        
        // Set product to private
        $product = wc_get_product($product_id);
        if ($product) {
            $product->set_status('private');
            $product->update_meta_data('cc_post_set_private_set_by', $current_user->user_email);
            $product->update_meta_data('cc_post_set_private_set_at', $current_time);
            $product->save();
            
            // Delete Google Calendar event if exists
            $calendar_event_id = $product->get_meta('google_cal_event_id');
            if ($calendar_event_id) {
                // This would typically call a function to delete the calendar event
                // For WordPress, this might be handled by a separate plugin or service
                do_action('cc_delete_calendar_event', $calendar_event_id);
                
                // Remove the calendar event ID from product metadata
                $product->delete_meta_data('google_cal_event_id');
                $product->save();
            }
        }
        
        return rest_ensure_response([
            'success' => true,
            'updated_orders' => $updated_orders,
            'product_id' => $product_id
        ]);
    }

    /**
     * Update attendance status
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error
     */
    public function update_attendance_status($request) {
        $order_id = $request['id'];
        $status = $request['status'];
        
        // Map of status values to their display names and metadata values
        $status_map = [
            'attended' => ['display' => 'Attended', 'value' => 'attended'],
            'cancelled' => ['display' => 'Cancelled', 'value' => 'cancelled'],
            'noshow' => ['display' => 'NoShow', 'value' => 'noshow'],
            'latebail' => ['display' => 'Late Bail', 'value' => 'latebail'],
            'crew_cancelled' => ['display' => 'Cancelled by the Crew', 'value' => 'crew_cancelled'],
            'duplicate' => ['display' => 'Duplicated', 'value' => 'duplicate'],
            'noregistershow' => ['display' => 'No Register Show', 'value' => 'noregistershow']
        ];
        
        if (!isset($status_map[$status])) {
            return new WP_Error('invalid_status', 'Invalid attendance status', ['status' => 400]);
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('invalid_order', 'Order not found', ['status' => 404]);
        }
        
        $current_user = wp_get_current_user();
        
        // Update order metadata
        $order->update_meta_data('cc_attendance', $status_map[$status]['value']);
        $order->update_meta_data('cc_attendance_set_by', $current_user->user_email);
        $order->update_meta_data('cc_attendance_set_at', time());
        $order->update_status('completed');
        $order->save();
        
        return rest_ensure_response([
            'success' => true,
            'order' => [
                'id' => $order_id,
                'status' => 'completed',
                'attendance' => $status_map[$status]['display']
            ]
        ]);
    }

    /**
     * Mark all attendees as attended
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error
     */
    public function mark_all_attended($request) {
        global $wpdb;
        $product_id = $request['id'];
        $current_user = wp_get_current_user();
        $current_time = time();
        
        // Get all pending orders for this product
        $orders = Hybrid_Headless_Auth_Utils::get_pending_orders_for_product($product_id);
        
        if (empty($orders)) {
            return new WP_Error('no_orders', 'No pending orders found for this event', ['status' => 404]);
        }
        
        // Bulk update order status directly in the database
        $order_ids_csv = implode(',', array_map('intval', $orders));
        
        // Update order status to completed
        $wpdb->query("
            UPDATE {$wpdb->posts}
            SET post_status = 'wc-completed'
            WHERE ID IN ($order_ids_csv)
            AND post_type = 'shop_order'
        ");
        
        // Update order meta in bulk
        foreach (['cc_attendance' => 'attended', 
                  'cc_attendance_set_by' => $current_user->user_email, 
                  'cc_attendance_set_at' => $current_time] as $meta_key => $meta_value) {
            
            // First, delete any existing meta with this key
            $wpdb->query("
                DELETE FROM {$wpdb->postmeta}
                WHERE post_id IN ($order_ids_csv)
                AND meta_key = '$meta_key'
            ");
            
            // Then insert all the new meta values at once
            $values = [];
            foreach ($orders as $order_id) {
                $values[] = $wpdb->prepare('(%d, %s, %s)', 
                    $order_id, 
                    $meta_key, 
                    is_numeric($meta_value) ? $meta_value : $wpdb->_real_escape($meta_value)
                );
            }
            
            if (!empty($values)) {
                $wpdb->query("
                    INSERT INTO {$wpdb->postmeta} (post_id, meta_key, meta_value)
                    VALUES " . implode(',', $values)
                );
            }
        }
        
        // Clear WooCommerce caches for these orders
        foreach ($orders as $order_id) {
            clean_post_cache($order_id);
            wc_delete_shop_order_transients($order_id);
        }
        
        // Add trip-reports tag to the product instead of setting it to private
        $product = wc_get_product($product_id);
        if ($product) {
            // Get current product tags
            $current_tags = wp_get_post_terms($product_id, 'product_tag', ['fields' => 'ids']);
            
            // Add trip-reports tag (ID 61) if not already present
            if (!in_array(61, $current_tags)) {
                $current_tags[] = 61;
                wp_set_object_terms($product_id, $current_tags, 'product_tag');
            }
            
            // Still add metadata for tracking who marked it as completed
            $product->update_meta_data('cc_post_completed_by', $current_user->user_email);
            $product->update_meta_data('cc_post_completed_at', $current_time);
            $product->save();
        }
        
        // Trigger WooCommerce order status changed action for each order
        foreach ($orders as $order_id) {
            do_action('woocommerce_order_status_changed', $order_id, 'pending', 'completed', wc_get_order($order_id));
        }
        
        return rest_ensure_response([
            'success' => true,
            'updated_orders' => $orders,
            'product_id' => $product_id,
            'count' => count($orders)
        ]);
    }

    /**
     * Assign volunteer role
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error
     */
    public function assign_volunteer_role($request) {
        $order_id = $request['id'];
        $role = $request['role'];
        
        // Define valid roles without changing order status
        $valid_roles = [
            'trip_director',
            'backseat_leader',
            'overnight_gear_tackle',
            'evening_gear_tackle',
            'washing_up',
            'overnight_reporter',
            'day_trip_reporter',
            'evening_chef',
            'breakfast_chef',
            'trip_leader',
            'seconder',
            'overnight_caving',
            'overnight_director',
            'evening_day_director',
            'none'
        ];
        
        if (!in_array($role, $valid_roles)) {
            return new WP_Error('invalid_role', 'Invalid role specified', ['status' => 400]);
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('invalid_order', 'Order not found', ['status' => 404]);
        }
        
        $current_user = wp_get_current_user();
        
        // Update order metadata only - no status change
        $order->update_meta_data('cc_volunteer', $role);
        
        // Add audit note
        $order_note = sprintf(
            'NeoClan: Assigned role "%s" by %s (%s)',
            $role,
            $current_user->display_name,
            $current_user->user_email
        );
        $order->add_order_note($order_note);
        
        $order->save();
        
        return rest_ensure_response([
            'success' => true,
            'order_id' => $order_id,
            'role' => $role,
            'assigned_by' => [
                'name' => $current_user->display_name,
                'email' => $current_user->user_email
            ]
        ]);
    }

    /**
     * Assign competency
     *
     * @param WP_REST_Request $request Request object
     * @return WP_REST_Response|WP_Error
     */
    public function assign_competency($request) {
        $user_id = $request['id'];
        $competency = $request['competency'];
        $status = $request['status'];
        
        // Define valid competencies and their valid statuses
        $valid_competencies = [
            'overnight_trip_director' => [
                'key' => 'competency_overnight_trip_director',
                'statuses' => ['Signed Off', 'In Training', 'Keen to Learn']
            ],
            'evening_meal_chef' => [
                'key' => 'competency_evening_meal_chef',
                'statuses' => ['Signed Off', 'In Training', 'Keen to Learn']
            ],
            'breakfast_lunch_chef' => [
                'key' => 'competency_breakfast_lunch_chef',
                'statuses' => ['Signed Off', 'In Training', 'Keen to Learn']
            ],
            'lift_coordinator' => [
                'key' => 'competency_lift_coordinator',
                'statuses' => ['Signed Off']
            ],
            'activities_coordinator' => [
                'key' => 'competency_activities_coordinator',
                'statuses' => ['Signed Off']
            ]
        ];
        
        if (!isset($valid_competencies[$competency])) {
            return new WP_Error('invalid_competency', 'Invalid competency specified', ['status' => 400]);
        }
        
        $competency_key = $valid_competencies[$competency]['key'];
        $valid_statuses = $valid_competencies[$competency]['statuses'];
        
        if (!in_array($status, $valid_statuses)) {
            return new WP_Error(
                'invalid_status', 
                'Invalid status for this competency', 
                [
                    'status' => 400,
                    'valid_statuses' => $valid_statuses
                ]
            );
        }
        
        $user = get_user_by('id', $user_id);
        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }
        
        // Get current user for attribution
        $current_user = wp_get_current_user();
        $current_time = time();
        
        // Update user metadata
        update_user_meta($user_id, $competency_key, $status);
        update_user_meta($user_id, "{$competency_key}_marked_given_at", $current_time);
        update_user_meta($user_id, "{$competency_key}_marked_given_by", $current_user->user_email);
        
        return rest_ensure_response([
            'success' => true,
            'user_id' => $user_id,
            'competency' => $competency,
            'competency_key' => $competency_key,
            'status' => $status,
            'updated_at' => $current_time,
            'updated_by' => $current_user->user_email
        ]);
    }
}
