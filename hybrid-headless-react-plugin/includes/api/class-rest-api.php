<?php
/**
 * Main REST API Handler
 *
 * @package HybridHeadless
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * REST API Handler Class
 */
class Hybrid_Headless_Rest_API {
    /**
     * API Namespace
     *
     * @var string
     */
    const API_NAMESPACE = 'hybrid-headless/v1';

    /**
     * Constructor
     */
    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
        add_filter( 'rest_pre_serve_request', array( $this, 'handle_cors' ), 10, 4 );
        
        // Load controllers
        $this->load_controllers();
    }

    /**
     * Load API Controllers
     */
    private function load_controllers() {
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-products-controller.php';
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-routes-controller.php';
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-categories-controller.php';
        
        new Hybrid_Headless_Products_Controller();
        new Hybrid_Headless_Routes_Controller();
        new Hybrid_Headless_Categories_Controller();
    }

    /**
     * Register core REST routes
     */
    public function register_routes() {
        register_rest_route(
            self::API_NAMESPACE,
            '/status',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_status' ),
                    'permission_callback' => '__return_true',
                ),
            )
        );

        register_rest_route(
            self::API_NAMESPACE,
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

    private function is_member($user_id) {
        if (!$user_id) return false;
        return (bool) get_user_meta($user_id, 'cc_member', true);
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
            'admin-emergency-contact-relationship',
            'admin-medical-conditions',
            'admin-medications',
            'admin-allergies',
            'admin-blood-group',
            'admin-tetanus-date',
            'admin-doctor-name',
            'admin-doctor-phone',
            'admin-doctor-address',
            'admin-nhs-number',
            'admin-club-membership',
            'admin-bca-number',
            'admin-bca-expiry',
            'admin-dbs-number',
            'admin-dbs-date',
            'admin-qualifications',
            'admin-training',
            'admin-notes',
            'cc_member',
            'membership_renewal_date',
            'membership_type',
            'membership_status',
            'membership_payment_status',
            'membership_payment_method',
            'membership_payment_date',
            'membership_payment_amount',
            'membership_payment_reference'
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
     * Handle CORS headers
     *
     * @param bool             $served  Whether the request has already been served.
     * @param WP_HTTP_Response $result  Result to send to the client.
     * @param WP_REST_Request  $request Request used to generate the response.
     * @param WP_REST_Server   $server  Server instance.
     * @return bool
     */
    public function handle_cors($served, $result, $request, $server) {
        error_log('[API Auth] Starting CORS/Auth handling');
        
        // Initialize authentication first
        if (isset($_COOKIE[LOGGED_IN_COOKIE])) {
            $user_id = wp_validate_auth_cookie($_COOKIE[LOGGED_IN_COOKIE], 'logged_in');
            if ($user_id) {
                wp_set_current_user($user_id);
                // Force WC customer initialization
                if (class_exists('WooCommerce') && WC()->customer) {
                    WC()->customer = new WC_Customer($user_id, true);
                }
            }
        }
        
        // Set CORS headers
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (in_array($origin, ['https://www.cavingcrew.com', 'http://localhost:3000'])) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
            header('Vary: Origin');
        }

        // Initialize authentication early
        if (isset($_COOKIE[LOGGED_IN_COOKIE])) {
            error_log('[API Auth] Found auth cookie, initializing user');
            $user_id = wp_validate_auth_cookie($_COOKIE[LOGGED_IN_COOKIE], 'logged_in');
            if ($user_id) {
                wp_set_current_user($user_id);
                error_log('[API Auth] Set current user: ' . $user_id);
            }
        }

        // Session handling
        if (!session_id() && !headers_sent()) {
            session_set_cookie_params([
                'lifetime' => 0,
                'path' => '/',
                'domain' => $_SERVER['HTTP_HOST'],
                'secure' => true,
                'httponly' => true,
                'samesite' => 'None' // Critical for cross-origin
            ]);
            session_start();
        }

        // Initialize WC session with user ID
        if (class_exists('WC') && !WC()->session) {
            WC()->session = new WC_Session_Handler();
            WC()->session->init();
            
            // Force session cookie parameters
            add_filter('wc_session_cookie_params', function($params) {
                return [
                    'lifetime' => 0,
                    'path' => '/',
                    'domain' => $_SERVER['HTTP_HOST'],
                    'secure' => true,
                    'httponly' => true,
                    'samesite' => 'None'
                ];
            });

            // Link to WordPress user if logged in
            if (is_user_logged_in()) {
                $user_id = get_current_user_id();
                WC()->session->set_customer_id($user_id);
                WC()->cart->init(); // Reinitialize cart with user ID
            }
        }

        return $served;
    }

    /**
     * Get API status
     *
     * @return WP_REST_Response
     */
    public function get_status() {
        return rest_ensure_response(
            array(
                'status'  => 'ok',
                'version' => HYBRID_HEADLESS_VERSION,
            )
        );
    }
}
