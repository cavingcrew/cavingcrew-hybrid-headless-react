<?php
namespace HybridHeadlessAutomateWoo\Rules;

use AutomateWoo\DateTime;
use AutomateWoo\Rules\Abstract_Date; // Use the correct base class
use AutomateWoo\Customer; // Keep for type hinting

defined( 'ABSPATH' ) || exit;

// Extend Abstract_Date directly
class Customer_Has_Upcoming_Trip extends Abstract_Date {

    // data_item is inherited from Abstract_Date
    public $data_item = 'customer';

    /**
     * Constructor.
     */
    public function __construct() {
        // Enable comparisons like 'is within the next X days'
        $this->has_is_future_comparision = true;
        parent::__construct();
    }

    /**
     * Init.
     */
    public function init() {
        $this->title = __( 'Customer - Has Upcoming Trip Within Period', 'hybrid-headless-automatewoo' );
        $this->group = __( 'Customer', 'hybrid-headless-automatewoo' );
        // No need to add parameters, Abstract_Date handles comparison fields
    }

    /**
     * Validate the rule using Abstract_Date's comparison logic.
     * Checks if the customer's *next* upcoming trip falls within the specified future period.
     *
     * @param Customer $customer
     * @param string   $compare Comparison type (e.g., 'is_future').
     * @param array    $value   Comparison value (e.g., ['number' => 7, 'unit' => 'days']).
     * @return bool
     */
    public function validate( $customer, $compare, $value ) {
        $next_trip_date = $this->get_next_upcoming_trip_date( $customer );

        if ( ! $next_trip_date ) {
            // No upcoming trips found, rule fails
            return false;
        }

        // Use the validate_date method inherited from Abstract_Date
        return $this->validate_date( $compare, $value, $next_trip_date );
    }

    /**
     * Get the DateTime object for the customer's *next* upcoming trip.
     * Helper method specific to this rule.
     *
     * @param Customer $customer
     * @return DateTime|false DateTime object in UTC.
     */
    protected function get_next_upcoming_trip_date( $customer ) {
        $trips = $this->get_customer_trips( $customer );
        $now = new DateTime(); // Current time in UTC

        $upcoming_trips = array_filter( $trips, function( $trip ) use ( $now ) {
            // Ensure start date is valid and in the future
            $start_date = aw_normalize_date( $trip['start'] );
            return $start_date && $start_date > $now;
        });

        if ( empty( $upcoming_trips ) ) {
            return false;
        }

        // Sort upcoming trips by start date ascending to find the soonest one
        usort( $upcoming_trips, function( $a, $b ) {
            // Convert to timestamps for reliable comparison
            $time_a = aw_normalize_date( $a['start'] )->getTimestamp();
            $time_b = aw_normalize_date( $b['start'] )->getTimestamp();
            return $time_a <=> $time_b;
        });

        // Return the date of the soonest upcoming trip as a DateTime object
        return aw_normalize_date( $upcoming_trips[0]['start'] );
    }


    /**
     * Get all trip start dates for a customer.
     * Copied from deleted Customer_Trip_Date_Rule.
     *
     * @param Customer $customer
     * @return array Array of trip data ['start' => 'Y-m-d H:i:s', 'product_id' => int].
     */
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
}
return new Customer_Has_Upcoming_Trip();
