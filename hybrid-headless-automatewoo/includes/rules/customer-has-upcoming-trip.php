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
        $cutoff = $now + $period; // Calculate end of the period in UTC

        foreach ( $trips as $trip ) {
            $trip_date = aw_normalize_date( $trip['start'] ); // Normalize to DateTime object (UTC)
            if ( ! $trip_date ) continue;

            $trip_time = $trip_date->getTimestamp();

            // Check if the trip start time is after now and before or at the cutoff time
            if ( $trip_time > $now && $trip_time <= $cutoff ) {
                return true; // Found an upcoming trip within the specified period
            }
        }

        return false; // No upcoming trip found within the period
    }

    // --- Helper methods copied from abstract class ---

    protected function get_customer_trips( $customer ) {
         if ( ! $customer || ! $customer->get_user_id() ) {
            return [];
        }

        $orders = wc_get_orders([
            'customer_id' => $customer->get_user_id(),
            'status' => ['completed', 'processing'], // Consider which statuses indicate a 'trip'
            'limit' => -1,
            'return' => 'ids'
        ]);

        $trips = [];

        foreach ( $orders as $order_id ) {
            $order = wc_get_order( $order_id );
             if ( ! $order ) continue;
            foreach ( $order->get_items() as $item ) {
                $product = $item->get_product();
                // Ensure get_meta returns a valid date string
                if ( $product && ( $start_date = $product->get_meta( 'event_start_date_time' ) ) && strtotime( $start_date ) ) {
                    $trips[] = [
                        'start' => $start_date,
                        'product_id' => $product->get_id()
                    ];
                }
            }
        }

        return $trips;
    }

     protected function parse_time( $amount, $unit ) {
        $amount = (int) $amount;
        $multipliers = [
            'days' => DAY_IN_SECONDS,
            'weeks' => WEEK_IN_SECONDS,
            'months' => MONTH_IN_SECONDS // Note: MONTH_IN_SECONDS is an approximation
        ];

        return $amount * ( $multipliers[ $unit ] ?? DAY_IN_SECONDS );
    }

    // --- End of copied helper methods ---

}

error_log('[Rule Return] Reached end of customer-has-upcoming-trip.php, returning instance.'); // Add this log
return new Customer_Has_Upcoming_Trip();
