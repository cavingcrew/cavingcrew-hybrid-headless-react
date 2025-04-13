<?php
namespace HybridHeadlessAutomateWoo\Rules;

use AutomateWoo\DateTime;
use AutomateWoo\Rules\Abstract_Date; // Use the correct base class
use AutomateWoo\Customer; // Keep for type hinting

defined( 'ABSPATH' ) || exit;

// Extend Abstract_Date directly
class Customer_Last_Trip_In_Period extends Abstract_Date {

    // data_item is inherited from Abstract_Date
    public $data_item = 'customer';

    /**
     * Constructor.
     */
    public function __construct() {
        // Enable comparisons like 'is within the last X days'
        $this->has_is_past_comparision = true;
        parent::__construct();
    }

    /**
     * Init.
     */
    public function init() {
        $this->title = __( 'Customer - Last Trip Within Period', 'hybrid-headless-automatewoo' );
        $this->group = __( 'Customer', 'hybrid-headless-automatewoo' );
        // No need to add parameters, Abstract_Date handles comparison fields
    }

    /**
     * Validate the rule using Abstract_Date's comparison logic.
     *
     * @param \AutomateWoo\Customer $customer
     * @param string $compare Comparison type (e.g., 'is', 'is_before'). Provided by Abstract_Date fields.
     * @param Customer $customer
     * @param string   $compare Comparison type (e.g., 'is_past').
     * @param array    $value   Comparison value (e.g., ['number' => 7, 'unit' => 'days']).
     * @return bool
     */
    public function validate( $customer, $compare, $value ) {
        $last_trip_date = $this->get_last_trip_date( $customer );

        if ( ! $last_trip_date ) {
            // No trips found for customer, rule fails
            return false; // No last trip found, rule fails
        }

        // Use the validate_date method inherited from Abstract_Date to perform the comparison
        return $this->validate_date( $compare, $value, $last_trip_date );
    }

    /**
     * Get the DateTime object for the customer's last trip.
     * Helper method specific to this rule.
     *
     * @param Customer $customer
     * @return DateTime|false DateTime object in UTC.
     */
    protected function get_last_trip_date( $customer ) {
        $trips = $this->get_customer_trips( $customer );

        $valid_trips = array_filter( $trips, function( $trip ) {
            // Ensure start date is valid before attempting to use it
            return ! empty( $trip['start'] ) && strtotime( $trip['start'] ) !== false;
        });

        if ( empty( $valid_trips ) ) {
            return false;
        }

        // Sort trips by start date descending to find the latest one
        usort( $valid_trips, function( $a, $b ) {
            return strtotime( $b['start'] ) <=> strtotime( $a['start'] );
        });

        // Return the date of the latest trip as a DateTime object (already normalized by aw_normalize_date)
        return aw_normalize_date( $valid_trips[0]['start'] );
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
return new Customer_Last_Trip_In_Period();
