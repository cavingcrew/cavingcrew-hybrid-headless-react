<?php
namespace HybridHeadlessAutomateWoo\Variables;

use AutomateWoo\Variable_Abstract_Datetime;
use AutomateWoo\Clean;

defined( 'ABSPATH' ) || exit;

class Product_Event_Data_Variable extends Variable_Abstract_Datetime {

    public function load_admin_details() {
        $type_options = [
            'product' => __( 'Product Event Data', 'hybrid-headless-automatewoo' ),
            'route' => __( 'Route Data', 'hybrid-headless-automatewoo' ), 
            'hut' => __( 'Hut Data', 'hybrid-headless-automatewoo' ),
            'cave' => __( 'Cave Data', 'hybrid-headless-automatewoo' )
        ];

        $this->add_parameter_select_field( 'type', __( 'Select which event data to display', 'hybrid-headless-automatewoo' ), $type_options, true );
        parent::add_parameter_select_field( 'format', __( 'Date format', 'hybrid-headless-automatewoo' ), $this->get_date_format_options(), false );

        $this->description = __( "Displays event-related data for products", 'hybrid-headless-automatewoo' );
        $this->group = __( 'Product', 'hybrid-headless-automatewoo' );
    }

    public function get_value( $product, $parameters ) {
        if ( ! $product || ! $product->get_id() ) {
            return '';
        }

        $data = $this->get_product_event_data( $product->get_id() );
        
        if ( empty( $parameters['field'] ) ) {
            return $data;
        }
        
        return $this->get_nested_property( $data, $parameters['field'] );
    }

    private function get_product_event_data( $product_id ) {
        return [
            'product' => $this->get_product_fields( $product_id ),
            'route'   => $this->get_route_data( $product_id ),
            'hut'     => $this->get_hut_data( $product_id ),
            'cave'    => $this->get_cave_data( $product_id ),
        ];
    }

    private function get_product_fields( $product_id ) {
        return [
            'event_start_date_time'  => get_field( 'event_start_date_time', $product_id ),
            'event_finish_date_time' => get_field( 'event_finish_date_time', $product_id ),
            'event_type'             => get_field( 'event_type', $product_id ),
            'event_trip_leader'      => get_field( 'event_trip_leader', $product_id ),
        ];
    }

    private function get_route_data( $product_id ) {
        $route_id = $this->get_referenced_post_id( 'event_route_id', $product_id );
        
        if ( ! $route_id ) {
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
        ];
    }

    private function get_hut_data( $product_id ) {
        $hut_id = $this->get_referenced_post_id( 'hut_id', $product_id );
        if ( ! $hut_id ) return null;

        $hut_data = get_fields( $hut_id );
        
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
        ];
    }

    private function get_cave_data( $product_id ) {
        $cave_id = $this->get_referenced_post_id( 'event_cave_id', $product_id );
        
        if ( ! $cave_id ) {
            return null;
        }

        $cave_data = get_fields( $cave_id );
        
        return [
            'id'          => $cave_id,
            'name'        => get_the_title( $cave_id ),
            'description' => $cave_data['location_description'] ?? '',
            'access'      => $cave_data['location_access_arrangement'] ?? '',
        ];
    }

    private function get_referenced_post_id( $field_name, $product_id ) {
        $value = get_field( $field_name, $product_id );
        
        if ( is_array( $value ) && isset( $value['ID'] ) ) {
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
        ];
    }

    private function get_route_difficulty( $route_data ) {
        return [
            'claustrophobia' => $route_data['route_difficulty_psychological_claustrophobia'] ?? 0,
            'tightness'      => $route_data['route_difficulty_objective_tightness'] ?? 0,
            'wetness'        => $route_data['route_difficulty_wetness'] ?? 0,
            'heights'        => $route_data['route_difficulty_exposure_to_heights'] ?? 0,
        ];
    }

    private function get_nested_property( $data, $path ) {
        $parts = explode( '.', $path );
        $value = $data;

        foreach ( $parts as $part ) {
            if ( ! isset( $value[$part] ) ) {
                return '';
            }
            $value = $value[$part];
        }

        return is_array( $value ) ? Clean::recursive( $value ) : Clean::string( $value );
    }
}
