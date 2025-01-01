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
    public function handle_cors( $served, $result, $request, $server ) {
        $allowed_origins = array(
            get_option( 'hybrid_headless_nextjs_url', HYBRID_HEADLESS_DEFAULT_NEXTJS_URL ),
            get_option( 'hybrid_headless_frontend_url', '*' )
        );
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        
        if (in_array($origin, $allowed_origins)) {
            header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
        } else {
            header( 'Access-Control-Allow-Origin: *' );
        }
        
        header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
        header( 'Access-Control-Allow-Credentials: true' );
        header( 'Access-Control-Allow-Headers: Authorization, Content-Type' );
        
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
