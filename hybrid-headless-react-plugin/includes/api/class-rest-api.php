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
        // Load utility classes first
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-auth-utils.php';
        
        // Load controllers
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-products-controller.php';
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-routes-controller.php';
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-categories-controller.php';
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-user-controller.php';
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-trip-participants-controller.php';
        require_once HYBRID_HEADLESS_PLUGIN_DIR . 'includes/api/class-trip-reports-controller.php';

        new Hybrid_Headless_Products_Controller();
        new Hybrid_Headless_Routes_Controller();
        new Hybrid_Headless_Categories_Controller();
        new Hybrid_Headless_User_Controller();
        new Hybrid_Headless_Trip_Participants_Controller();
        new Hybrid_Headless_Trip_Reports_Controller();
        new Hybrid_Headless_Caving_Crew_Controller();
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
