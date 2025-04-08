<?php
error_log('[Rule Include Attempt] Including customer-has-upcoming-trip.php'); // Add this log

namespace HybridHeadlessAutomateWoo\Rules;

use AutomateWoo\Customer; // Keep
use AutomateWoo\Clean; // Keep
use AutomateWoo\Rules\Abstract_Date; // Add this

defined( 'ABSPATH' ) || exit;

// Extend Abstract_Date directly
class Customer_Has_Upcoming_Trip extends Abstract_Date {

    // Define data_item for Abstract_Date
    public $data_item = 'customer';

    public function init() {
        $this->title = __( 'Customer - Has Upcoming Trip', 'hybrid-headless-automatewoo' );
        $this->group = __( 'Customer', 'hybrid-headless-automatewoo' );

        // Add parameters needed for the rule
        $this->add_parameter_select_field( 'time_unit', __( 'Time Unit', 'hybrid-headless-automatewoo' ), [
            'days' => __( 'Days', 'hybrid-headless-automatewoo' ),
            'weeks' => __( 'Weeks', 'hybrid-headless-automatewoo' ),
            'months' => __( 'Months', 'hybrid-headless-automatewoo' )
        ], true );
        $this->add_parameter_number_field( 'time_amount', __( 'Time Amount', 'hybrid-headless-automatewoo' ), true );

        // Note: Abstract_Date adds its own comparison fields (is, is_not, before, after etc.)
        // We might not need $compare_type and $value in validate() if we structure it differently.
        // For now, keep the existing validate signature but ignore $compare_type and $value.
    }

    // Keep validate signature for now, but logic only checks for *any* upcoming trip in the period.
    public function validate( $customer, $compare_type, $value ) {
        $time_amount = Clean::int( $this->get_parameter( 'time_amount' ) );
        $time_unit = Clean::string( $this->get_parameter( 'time_unit' ) );

        if ( ! $time_amount || ! $time_unit ) {
            return false; // Parameters not set
        }

        $period = $this->parse_time( $time_amount, $time_unit );
        $trips = $this->get_customer_trips( $customer );
        $now = current_time( 'timestamp', true ); // Use UTC timestamp
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

// Removed logging from here as it's not the primary issue
return new Customer_Has_Upcoming_Trip();
