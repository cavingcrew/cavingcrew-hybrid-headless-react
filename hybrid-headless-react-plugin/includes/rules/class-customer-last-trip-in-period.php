<?php
namespace HybridHeadless\Rules;

use AutomateWoo\Customer;

defined( 'ABSPATH' ) || exit;

class Customer_Last_Trip_In_Period extends Customer_Trip_Date_Rule {

    public function get_title() {
        return __( 'Customer - Last Trip Within Time Period', 'hybrid-headless' );
    }

    public function validate( $customer, $compare, $value = null ) {
        $time_amount = Clean::string( $this->get_parameter( 'time_amount' ) );
        $time_unit = Clean::string( $this->get_parameter( 'time_unit' ) );
        $period = $this->parse_time( $time_amount, $time_unit );

        $trips = $this->get_customer_trips( $customer );
        $now = current_time( 'timestamp' );

        // Filter past trips and find most recent
        $past_trips = array_filter( $trips, function( $trip ) use ( $now ) {
            $trip_time = strtotime( $trip['start'] );
            return $trip_time && $trip_time < $now;
        });

        if ( empty( $past_trips ) ) {
            return false;
        }

        usort( $past_trips, function( $a, $b ) {
            return strtotime( $b['start'] ) <=> strtotime( $a['start'] );
        });

        $last_trip_time = strtotime( $past_trips[0]['start'] );
        return $last_trip_time >= ( $now - $period );
    }
}
