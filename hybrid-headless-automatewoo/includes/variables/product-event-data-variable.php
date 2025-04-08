<?php
namespace HybridHeadlessAutomateWoo\Variables;

use AutomateWoo\Variable; // Extend the correct base class
use AutomateWoo\Clean;

defined( 'ABSPATH' ) || exit;

// Extend the base Variable class, not the Datetime one
class Product_Event_Data_Variable extends Variable {

    public function load_admin_details() {
        $this->title = __( 'Product - Event Data', 'hybrid-headless-automatewoo' );
        $this->group = __( 'Product', 'hybrid-headless-automatewoo' );
        $this->description = __( "Access nested event data (product, route, hut, cave) using the 'field' parameter with dot notation (e.g., 'product.event_type', 'route.name', 'hut.facilities').", 'hybrid-headless-automatewoo' );

        // Add a text field parameter for the data path
        $this->add_parameter_text_field(
            'field', // Parameter name
            __( "Enter the data path using dot notation.", 'hybrid-headless-automatewoo' ), // Parameter description
            true // Required
        );

        // Remove the date format parameter field added by the previous base class
    }

    /**
     * Get the value of the specified nested field.
     *
     * @param \WC_Product $product
     * @param array $parameters Expects ['field' => 'path.to.data']
     * @return string The requested data, or a comma-separated list for arrays.
     */
    public function get_value( $product, $parameters ) {
        // Ensure product exists and the 'field' parameter is set
        if ( ! $product || ! $product->get_id() || empty( $parameters['field'] ) ) {
            return ''; // Return empty if product or field parameter is missing
        }

        // Fetch the complete data structure
        $data = $this->get_product_event_data( $product->get_id() );

        // Get the requested value using the path from the 'field' parameter
        $value = $this->get_nested_property( $data, $parameters['field'] );

        // If the value is an array, convert it to a comma-separated string
        if ( is_array( $value ) ) {
            // Clean array elements before imploding
            $cleaned_array = array_map( [ Clean::class, 'string' ], $value );
            // Filter out empty values that might result from cleaning
            $non_empty_array = array_filter($cleaned_array, function($item) {
                return $item !== '';
            });
            return implode( ', ', $non_empty_array );
        }

        // Otherwise, return the cleaned string value
        return Clean::string( $value );
    }

    /**
     * Fetches and structures all related event data.
     * Checks if ACF function exists before calling it.
     *
     * @param int $product_id
     * @return array
     */
    private function get_product_event_data( $product_id ) {
        return [
            'product' => $this->get_product_fields( $product_id ),
            'route'   => $this->get_route_data( $product_id ),
            'hut'     => $this->get_hut_data( $product_id ),
            'cave'    => $this->get_cave_data( $product_id ), // Keep cave data retrieval
        ];
    }

    /**
     * Gets direct product ACF fields.
     * Checks if ACF function exists before calling it.
     *
     * @param int $product_id
     * @return array
     */
    private function get_product_fields( $product_id ) {
        if ( ! function_exists('get_field') ) return [];
        return [
            'event_start_date_time'  => get_field( 'event_start_date_time', $product_id ),
            'event_finish_date_time' => get_field( 'event_finish_date_time', $product_id ),
            'event_type'             => get_field( 'event_type', $product_id ),
            'event_trip_leader'      => get_field( 'event_trip_leader', $product_id ),
            // Add other direct product fields if necessary
        ];
    }

    /**
     * Gets related route data.
     * Checks if ACF function exists before calling it.
     *
     * @param int $product_id
     * @return array|null
     */
    private function get_route_data( $product_id ) {
        $route_id = $this->get_referenced_post_id( 'event_route_id', $product_id );

        if ( ! $route_id || ! function_exists('get_fields') ) {
            return null;
        }

        $route_data = get_fields( $route_id );
        
        return [
            'id'          => $route_id,
            'name'        => $route_data['route_name'] ?? '',
            'description' => $route_data['route_blurb'] ?? '',
            'difficulty'  => $this->get_route_difficulty( $route_data ),
            'entrance'    => $this->get_location_data( $route_data['route_entrance_location_id'] ?? 0 ),
            'exit'        => $this->get_location_data( $route_data['route_exit_location_id'] ?? 0 ),
            'exit'        => $this->get_location_data( $route_data['route_exit_location_id'] ?? 0 ),
            // Add other route fields if necessary
        ];
    }

    /**
     * Gets related hut data.
     * Checks if ACF function exists before calling it.
     *
     * @param int $product_id
     * @return array|null
     */
    private function get_hut_data( $product_id ) {
        $hut_id = $this->get_referenced_post_id( 'hut_id', $product_id );
        if ( ! $hut_id || ! function_exists('get_fields') ) {
             return null;
        }

        $hut_data = get_fields( $hut_id );
        if ( ! $hut_data ) return null; // Check if get_fields returned data

        return [
            'id' => $hut_id,
            'name' => $hut_data['hut_name'] ?? '',
            'description' => $hut_data['hut_sales_description'] ?? '',
            'parking' => [
                'instructions' => $hut_data['hut_parking_instructions'] ?? '',
                'coordinates' => $this->parse_coordinates( $hut_data['hut_lat_long'] ?? '' )
            ],
            'facilities' => $hut_data['hut_facilities'] ?? [],
            'capacity' => $hut_data['hut_capacity'] ?? '',
            'dogs_allowed' => $hut_data['hut_dogs_allowed'] ?? 'no'
            // Add other hut fields if necessary
        ];
    }

    /**
     * Gets related cave data.
     * Checks if ACF function exists before calling it.
     *
     * @param int $product_id
     * @return array|null
     */
    private function get_cave_data( $product_id ) {
        $cave_id = $this->get_referenced_post_id( 'event_cave_id', $product_id );

        if ( ! $cave_id || ! function_exists('get_fields') ) {
            return null;
        }

        $cave_data = get_fields( $cave_id );
        
        return [
            'id'          => $cave_id,
            'name'        => get_the_title( $cave_id ),
            'description' => $cave_data['location_description'] ?? '',
            'access'      => $cave_data['location_access_arrangement'] ?? '',
            // Add other cave fields if necessary
        ];
    }

    /**
     * Helper to get the ID from an ACF Post Object or Relationship field.
     * Checks if ACF function exists before calling it.
     *
     * @param string $field_name
     * @param int $product_id
     * @return int|null
     */
    private function get_referenced_post_id( $field_name, $product_id ) {
        if ( ! function_exists('get_field') ) return null;
        $value = get_field( $field_name, $product_id );

        // Handle ACF Post Object field (returns WP_Post object or ID)
        if ( $value instanceof \WP_Post ) {
            return $value->ID;
        }
        // Handle ACF Relationship field (returns array of IDs or Post objects)
        if ( is_array( $value ) && ! empty( $value ) ) {
            $first_item = reset($value);
            if ( $first_item instanceof \WP_Post ) {
                return $first_item->ID;
            }
            if ( is_numeric( $first_item ) ) {
                return (int) $first_item; // Return the first related post ID
            }
        }
        // Handle case where field stores just the ID
        if ( is_numeric( $value ) ) {
            return $value['ID'];
        }
        
        if ( is_numeric( $value ) ) {
            return (int) $value;
        }
        
        return null;
    }

    private function parse_coordinates( $input ) {
        if ( is_array( $input ) ) {
            $lat = $input['lat'] ?? '';
            $lng = $input['lng'] ?? '';
            return "$lat,$lng";
        }
        
        if ( is_string( $input ) ) {
            return str_replace( ' ', '', $input );
        }
        
        return '';
    }

    private function get_location_data( $location_id ) {
        if ( ! $location_id ) {
            return null;
        }

        $location_data = get_fields( $location_id );
        
        return [
            'id'          => $location_id,
            'name'        => get_the_title( $location_id ),
            'coordinates' => $this->parse_coordinates( $location_data['location_parking_latlong'] ?? '' ),
            'description' => $location_data['location_parking_description'] ?? '',
            'description' => $location_data['location_parking_description'] ?? '',
            // Add other location fields if necessary
        ];
    }

    /**
     * Gets route difficulty fields.
     *
     * @param array $route_data ACF fields for the route.
     * @return array
     */
    private function get_route_difficulty( $route_data ) {
        return [
            'claustrophobia' => $route_data['route_difficulty_psychological_claustrophobia'] ?? '', // Return empty string if not set
            'tightness'      => $route_data['route_difficulty_objective_tightness'] ?? '',
            'wetness'        => $route_data['route_difficulty_wetness'] ?? '',
            'heights'        => $route_data['route_difficulty_exposure_to_heights'] ?? '',
            // Add other difficulty fields if necessary
        ];
    }

    /**
     * Safely retrieves a nested property from an array using dot notation.
     *
     * @param array $data The data array.
     * @param string $path The dot-separated path (e.g., 'route.difficulty.claustrophobia').
     * @return mixed The value found at the path, or an empty string if not found.
     */
    private function get_nested_property( $data, $path ) {
        $parts = explode( '.', $path );
        $value = $data;

        foreach ( $parts as $part ) {
            // Check if the current level is an array and the key exists
            if ( is_array( $value ) && isset( $value[$part] ) ) {
                $value = $value[$part];
            } else {
                // Path does not exist
                return '';
            }
        }

        // Return the final value (could be scalar or array)
        return $value;
    }
}

return new Product_Event_Data_Variable();
