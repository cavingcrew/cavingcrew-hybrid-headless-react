<?php
/**
 * Trip Reports REST Controller
 *
 * @package HybridHeadless
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Trip Reports Controller Class
 */
class Hybrid_Headless_Trip_Reports_Controller {
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
            '/trip-reports',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_trip_reports' ),
                    'permission_callback' => '__return_true',
                    'args'                => array(
                        'per_page' => array(
                            'default'           => 10,
                            'sanitize_callback' => 'absint',
                        ),
                        'page' => array(
                            'default'           => 1,
                            'sanitize_callback' => 'absint',
                        ),
                    ),
                ),
            )
        );

        register_rest_route(
            Hybrid_Headless_Rest_API::API_NAMESPACE,
            '/trip-reports/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_trip_report' ),
                    'permission_callback' => '__return_true',
                    'args'                => array(
                        'id' => array(
                            'required'          => true,
                            'validate_callback' => function( $param ) {
                                return is_numeric( $param );
                            },
                        ),
                    ),
                ),
            )
        );
    }

    /**
     * Get trip reports
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response
     */
    public function get_trip_reports( $request ) {
        $per_page = $request['per_page'];
        $page = $request['page'];
        
        $args = array(
            'post_type'      => 'product',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'tax_query'      => array(
                array(
                    'taxonomy' => 'product_tag',
                    'field'    => 'slug',
                    'terms'    => 'trip-reports',
                ),
            ),
            'meta_key'       => 'event_start_date_time',
            'orderby'        => 'meta_value',
            'order'          => 'DESC',
            'post_status'    => 'publish',
        );

        $query = new WP_Query( $args );
        $reports = array();

        foreach ( $query->posts as $post ) {
            $reports[] = $this->prepare_trip_report_data( $post );
        }

        return rest_ensure_response( array(
            'reports' => $reports,
            'total'   => $query->found_posts,
            'pages'   => $query->max_num_pages,
        ) );
    }

    /**
     * Get single trip report
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error
     */
    public function get_trip_report( $request ) {
        $post = get_post( $request['id'] );

        if ( ! $post || $post->post_type !== 'product' ) {
            return new WP_Error(
                'trip_report_not_found',
                __( 'Trip report not found', 'hybrid-headless' ),
                array( 'status' => 404 )
            );
        }

        // Check if post has the trip-reports tag
        $has_tag = has_term( 'trip-reports', 'product_tag', $post->ID );
        if ( ! $has_tag ) {
            return new WP_Error(
                'not_a_trip_report',
                __( 'This product is not a trip report', 'hybrid-headless' ),
                array( 'status' => 404 )
            );
        }

        return rest_ensure_response( $this->prepare_trip_report_data( $post ) );
    }

    /**
     * Prepare trip report data
     *
     * @param WP_Post $post Post object.
     * @return array
     */
    private function prepare_trip_report_data( $post ) {
        $product = wc_get_product( $post );
        $acf_fields = get_fields( $post->ID );
        
        // Get trip participants who attended
        $participants = $this->get_trip_participants( $post->ID );
        
        // Basic report data
        $report_data = array(
            'id'             => $post->ID,
            'title'          => $post->post_title,
            'slug'           => $post->post_name,
            'date'           => $post->post_date,
            'modified'       => $post->post_modified,
            'event_type'     => $acf_fields['event_type'] ?? '',
            'event_name'     => $acf_fields['event_name'] ?? $post->post_title,
            'event_start'    => $acf_fields['event_start_date_time'] ?? '',
            'event_skills_required' => $acf_fields['event_skills_required'] ?? '',
            'event_trip_leader' => $acf_fields['event_trip_leader'] ?? '',
            'report_author'  => $acf_fields['report_author'] ?? '',
            'report_content' => $acf_fields['report_content'] ?? '',
            'report_gallery' => $this->prepare_gallery_data( $acf_fields['report_gallery'] ?? array() ),
            'participants'   => $participants['names'],
            'participant_count' => $participants['count'],
            'volunteers'     => $participants['volunteers'],
        );
        
        // Add route data if available
        if ( ! empty( $acf_fields['event_route_id'] ) ) {
            $route_data = $this->get_route_data( $acf_fields['event_route_id'] );
            if ( $route_data ) {
                $report_data['route'] = array(
                    'name' => $route_data['name'],
                    'entrance' => $route_data['entrance'] ?? null,
                );
            }
        }
        
        // Add hut data if available
        if ( ! empty( $acf_fields['hut_id'] ) ) {
            $hut_data = $this->get_hut_data( $acf_fields['hut_id'] );
            if ( $hut_data ) {
                $report_data['hut'] = $hut_data;
            }
        }
        
        return $report_data;
    }
    
    /**
     * Get trip participants who attended
     *
     * @param int $trip_id Trip ID.
     * @return array
     */
    private function get_trip_participants( $trip_id ) {
        $participants = array(
            'names' => array(),
            'count' => 0,
            'volunteers' => array(),
        );
        
        // Get all orders for this trip
        $order_ids = wc_get_orders( array(
            'limit'    => -1,
            'return'   => 'ids',
            'status'   => array( 'completed' ),
        ) );
        
        foreach ( $order_ids as $order_id ) {
            $order = wc_get_order( $order_id );
            if ( ! $order ) continue;
            
            // Check if order contains the trip
            $contains_trip = false;
            foreach ( $order->get_items() as $item ) {
                $product = $item->get_product();
                if ( $product && ( $product->get_parent_id() == $trip_id || $product->get_id() == $trip_id ) ) {
                    $contains_trip = true;
                    break;
                }
            }
            
            if ( ! $contains_trip ) continue;
            
            // Check if customer attended
            $attendance = $order->get_meta( 'cc_attendance' );
            if ( $attendance !== 'attended' ) continue;
            
            // Get customer data
            $user_id = $order->get_customer_id();
            if ( ! $user_id ) continue;
            
            $user = get_userdata( $user_id );
            if ( ! $user ) continue;
            
            // Check if user wants to hide their name
            $hide_name = get_user_meta( $user_id, 'preferences_hide_name_from_frontend', true );
            
            // Always count the participant
            $participants['count']++;
            
            // Add name if not hidden
            if ( $hide_name !== 'yes' ) {
                $participants['names'][] = $user->first_name;
            }
            
            // Check for volunteer role
            $volunteer_role = $order->get_meta( 'cc_volunteer' );
            if ( $volunteer_role && $volunteer_role !== 'none' ) {
                $participants['volunteers'][] = array(
                    'role' => $volunteer_role,
                    'name' => $hide_name !== 'yes' ? $user->first_name : null,
                );
            }
        }
        
        return $participants;
    }
    
    /**
     * Prepare gallery data
     *
     * @param array $gallery Gallery field data.
     * @return array
     */
    private function prepare_gallery_data( $gallery ) {
        if ( empty( $gallery ) ) {
            return array();
        }
        
        $images = array();
        
        foreach ( $gallery as $image_id ) {
            $image = array(
                'ID'      => $image_id,
                'url'     => wp_get_attachment_url( $image_id ),
                'alt'     => get_post_meta( $image_id, '_wp_attachment_image_alt', true ),
                'caption' => wp_get_attachment_caption( $image_id ),
                'sizes'   => array(),
            );
            
            // Add image sizes
            $sizes = wp_get_attachment_metadata( $image_id )['sizes'] ?? array();
            foreach ( $sizes as $size_name => $size_data ) {
                $image['sizes'][$size_name] = wp_get_attachment_image_src( $image_id, $size_name );
            }
            
            $images[] = $image;
        }
        
        return $images;
    }
    
    /**
     * Get route data
     *
     * @param int $route_id Route ID.
     * @return array|null
     */
    private function get_route_data( $route_id ) {
        $route_post = get_post( $route_id );
        if ( ! $route_post ) {
            return null;
        }
        
        $route_acf = get_fields( $route_id );
        $route_data = array(
            'id'   => $route_id,
            'name' => $route_acf['route_name'] ?? $route_post->post_title,
        );
        
        // Add entrance location if available
        if ( ! empty( $route_acf['route_entrance_location_id'] ) ) {
            $location_id = $route_acf['route_entrance_location_id'];
            $location_post = get_post( $location_id );
            $location_acf = get_fields( $location_id );
            
            if ( $location_post ) {
                $route_data['entrance'] = $location_acf['location_name'] ?? $location_post->post_title;
            }
        }
        
        return $route_data;
    }
    
    /**
     * Get hut data
     *
     * @param int $hut_id Hut ID.
     * @return array|null
     */
    private function get_hut_data( $hut_id ) {
        $hut_post = get_post( $hut_id );
        if ( ! $hut_post ) {
            return null;
        }
        
        $hut_acf = get_fields( $hut_id );
        $hut_data = array(
            'id'   => $hut_id,
            'name' => $hut_acf['hut_name'] ?? $hut_post->post_title,
        );
        
        // Add hut image if available
        if ( ! empty( $hut_acf['hut_image'] ) ) {
            $image_id = $hut_acf['hut_image'];
            $hut_data['image'] = array(
                'ID'  => $image_id,
                'url' => wp_get_attachment_url( $image_id ),
                'alt' => get_post_meta( $image_id, '_wp_attachment_image_alt', true ),
            );
        }
        
        return $hut_data;
    }
}
