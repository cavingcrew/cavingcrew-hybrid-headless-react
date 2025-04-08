<?php
namespace HybridHeadlessAutomateWoo\Rules;

use AutomateWoo\Customer;
use AutomateWoo\Clean;

defined( 'ABSPATH' ) || exit;

class Customer_Has_Upcoming_Trip extends Customer_Trip_Date_Rule {

    public function init() {
        $this->title = __( 'Customer - Has Upcoming Trip', 'hybrid-headless-automatewoo' );
        $this->group = __( 'Customer', 'hybrid-headless-automatewoo' );
        // The parent init() is called automatically by the constructor chain.
        // Do not call parent::init() here.
    }

    public function validate( $customer, $compare_type, $value ) {
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

return new Customer_Has_Upcoming_Trip();
