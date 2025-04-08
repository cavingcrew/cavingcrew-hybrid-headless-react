<?php
namespace HybridHeadlessAutomateWoo\Rules;

use AutomateWoo\Clean;
use AutomateWoo\DateTime;
use AutomateWoo\Rules\Abstract_Date;
use AutomateWoo\Rules\Rule;

defined( 'ABSPATH' ) || exit;

class Customer_Last_Trip_In_Period extends Abstract_Date {

    public $data_item = 'customer';

    public function init() {
        $this->title = __( 'Customer - Last Trip Within Period', 'hybrid-headless-automatewoo' );
        $this->group = __( 'Customer', 'hybrid-headless-automatewoo' );
        // The parent init() is called automatically by the constructor chain.
        // Do not call parent::init() here.
    }

    public function validate( $customer, $compare, $value ) {
        $time_amount = Clean::string( $this->get_parameter( 'time_amount' ) );
        $time_unit = Clean::string( $this->get_parameter( 'time_unit' ) );
        $period = $this->parse_time( $time_amount, $time_unit );

        $trips = $this->get_customer_trips( $customer );
        $now = current_time( 'timestamp' );

        $last_trip_date = $this->get_last_trip_date( $trips );
        if ( ! $last_trip_date ) {
            return false;
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
