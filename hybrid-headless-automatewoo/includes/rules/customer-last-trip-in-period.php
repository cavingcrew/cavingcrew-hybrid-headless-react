<?php
error_log('[Rule Include Attempt] Including customer-last-trip-in-period.php'); // Add this log

namespace HybridHeadlessAutomateWoo\Rules;

use AutomateWoo\Clean;
use AutomateWoo\DateTime;
use AutomateWoo\Rules\Abstract_Date; // Keep this
use AutomateWoo\DateTime; // Keep this
use AutomateWoo\Clean; // Keep this

defined( 'ABSPATH' ) || exit;

// Extend Abstract_Date directly
class Customer_Last_Trip_In_Period extends Abstract_Date {

    public $data_item = 'customer';

    public function init() {
        $this->title = __( 'Customer - Last Trip Within Period', 'hybrid-headless-automatewoo' );
        $this->group = __( 'Customer', 'hybrid-headless-automatewoo' );

        // Add parameters previously defined in the abstract class or needed by Abstract_Date
        $this->add_parameter_select_field( 'time_unit', __( 'Time Unit', 'hybrid-headless-automatewoo' ), [
            'days' => __( 'Days', 'hybrid-headless-automatewoo' ),
            'weeks' => __( 'Weeks', 'hybrid-headless-automatewoo' ),
            'months' => __( 'Months', 'hybrid-headless-automatewoo' )
        ], true );
        $this->add_parameter_number_field( 'time_amount', __( 'Time Amount', 'hybrid-headless-automatewoo' ), true );
    }

    public function validate( $customer, $compare, $value ) {
        // $value parameter from Abstract_Date might represent the date comparison value,
        // ensure logic aligns with how Abstract_Date validation works.
        // For now, let's assume we just need the last trip date.

        $trips = $this->get_customer_trips( $customer );
        $last_trip_date = $this->get_last_trip_date( $trips );

        if ( ! $last_trip_date ) {
            return false; // No last trip found
        }

        return $this->validate_date( $compare, $value, $last_trip_date );
    }

    protected function get_last_trip_date( $trips ) {
        $valid_trips = array_filter( $trips, function( $trip ) {
            return ! empty( $trip['start'] );
        });

        if ( empty( $valid_trips ) ) {
            return false;
        }

        usort( $valid_trips, function( $a, $b ) {
            return strtotime( $b['start'] ) <=> strtotime( $a['start'] );
        });

        return new DateTime( $valid_trips[0]['start'] );
    }
}

return new Customer_Last_Trip_In_Period();
