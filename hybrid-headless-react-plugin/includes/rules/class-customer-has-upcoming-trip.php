<?php
namespace HybridHeadless\Rules;

use AutomateWoo\Customer;

defined( 'ABSPATH' ) || exit;

class Customer_Has_Upcoming_Trip extends Customer_Trip_Date_Rule {

    public function get_title() {
        return __( 'Customer - Has Upcoming Trip Within Time Period', 'hybrid-headless' );
    }

    public function validate( $customer, $compare, $value = null ) {
        $time_amount = Clean::string( $this->get_parameter( 'time_amount' ) );
        $time_unit = Clean::string( $this->get_parameter( 'time_unit' ) );
        $period = $this->parse_time( $time_amount, $time_unit );

        $trips = $this->get_customer_trips( $customer );
        $now = current_time( 'timestamp' );
        $cutoff = $now + $period;

        foreach ( $trips as $trip ) {
            $trip_time = strtotime( $trip['start'] );
            if ( $trip_time && $trip_time > $now && $trip_time <= $cutoff ) {
                return true;
            }
        }

        return false;
    }
}
