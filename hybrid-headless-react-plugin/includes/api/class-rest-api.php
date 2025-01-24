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
            '/user-status',
            array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array($this, 'get_user_status'),
                    'permission_callback' => '__return_true',
                )
            )
        );
    }

    public function get_user_status() {
        // Manually validate WordPress auth cookies
        $user_id = 0;
        $logged_in = false;
        
        if (isset($_COOKIE[LOGGED_IN_COOKIE])) {
            $cookie = $_COOKIE[LOGGED_IN_COOKIE];
            $user_id = wp_validate_auth_cookie($cookie, 'logged_in');
            
            if ($user_id) {
                wp_set_current_user($user_id);
                $logged_in = true;
            }
        }

        // Get cart count safely
        $cart_count = 0;
        if (class_exists('WooCommerce') && WC()->cart) {
            $cart_count = WC()->cart->get_cart_contents_count();
        }

        return rest_ensure_response([
            'isLoggedIn' => $logged_in,
            'isMember' => $this->is_member($user_id),
            'cartCount' => $cart_count
        ]);
    }

    private function is_member($user_id) {
        if (!$user_id) return false;
        return (bool) get_user_meta($user_id, 'cc_member', true);
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
        error_log('[CORS] Handling CORS headers');
        error_log('[CORS] Request headers: ' . print_r($request->get_headers(), true));
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = [
            'https://www.cavingcrew.com',
            'http://localhost:3000' // For local development
        ];

        if (in_array($origin, $allowed)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Credentials: true');
        }
        
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Vary: Origin');
        
        // Session debugging
        error_log('[CORS] Session status: ' . (session_status() === PHP_SESSION_ACTIVE ? 'Active' : 'Inactive'));
        error_log('[CORS] Current cookies: ' . print_r($_COOKIE, true));

        if (!session_id() && !headers_sent()) {
            error_log('[CORS] Starting new session');
            session_start();
        } else {
            error_log('[CORS] Session ID exists: ' . session_id());
        }
        
        // WooCommerce session initialization
        if (class_exists('WC')) {
            error_log('[CORS] WooCommerce version: ' . WC()->version);
            if (!WC()->session) {
                error_log('[CORS] Initializing new WC session');
                WC()->session = new WC_Session_Handler();
                WC()->session->init();
            }
            error_log('[CORS] WC customer ID: ' . WC()->session->get_customer_id());
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
