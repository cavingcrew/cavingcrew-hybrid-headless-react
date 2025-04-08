<?php
namespace HybridHeadlessAutomateWoo\Rules;
error_log('[Rule Include Attempt] Including customer-last-trip-in-period.php'); // Moved after namespace

use AutomateWoo\Clean;
use AutomateWoo\DateTime;
use AutomateWoo\Rules\Abstract_Date;
// Removed duplicate use statements

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

error_log('[Rule Return] Reached end of customer-last-trip-in-period.php, returning instance.'); // Add this log
return new Customer_Last_Trip_In_Period();
