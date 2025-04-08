<?php
namespace HybridHeadlessAutomateWoo\Rules;
// Removed include attempt log

use AutomateWoo\DateTime; // Keep DateTime for return type hint if needed, or remove if not used directly

defined( 'ABSPATH' ) || exit;

// Extend the custom abstract class again
class Customer_Last_Trip_In_Period extends Customer_Trip_Date_Rule {

    // data_item is inherited from Abstract_Date via Customer_Trip_Date_Rule

    public function init() {
        $this->title = __( 'Customer - Last Trip Within Period', 'hybrid-headless-automatewoo' );
        $this->group = __( 'Customer', 'hybrid-headless-automatewoo' );
        // Parameters (time_unit, time_amount) are added in Customer_Trip_Date_Rule::init()
    }

    /**
     * Validate the rule.
     *
     * @param \AutomateWoo\Customer $customer
     * @param string $compare Comparison type (e.g., 'is', 'is_before'). Provided by Abstract_Date fields.
     * @param mixed $value Comparison value (e.g., date string, number of days). Provided by Abstract_Date fields.
     * @return bool
     */
    public function validate( $customer, $compare, $value ) {
        // Get the date of the customer's last trip using the inherited helper method
        $last_trip_date = $this->get_last_trip_date( $customer );

        if ( ! $last_trip_date ) {
            return false; // No last trip found, rule fails
        }

        // Use the validate_date method inherited from Abstract_Date to perform the comparison
        return $this->validate_date( $compare, $value, $last_trip_date );
    }

    /**
     * Get the DateTime object for the customer's last trip.
     * Helper method specific to this rule.
     *
     * @param \AutomateWoo\Customer $customer
     * @return DateTime|false
     */
    protected function get_last_trip_date( $customer ) {
        $trips = $this->get_customer_trips( $customer ); // Use inherited helper

        $valid_trips = array_filter( $trips, function( $trip ) {
            return ! empty( $trip['start'] );
        });

        if ( empty( $valid_trips ) ) {
            return false;
        }

        // Sort trips by start date descending to find the latest one
        usort( $valid_trips, function( $a, $b ) {
            return strtotime( $b['start'] ) <=> strtotime( $a['start'] );
        });

        // Return the date of the latest trip as a DateTime object
        // Ensure the date string is valid before creating DateTime
        $latest_start_date = $valid_trips[0]['start'];
        try {
            return new DateTime( $latest_start_date );
        } catch (\Exception $e) {
            // Log error if date is invalid
            error_log("Error creating DateTime for last trip date: " . $e->getMessage() . " Date string: " . $latest_start_date);
            return false;
        }
    }

    // Removed copied helper methods (get_customer_trips, parse_time) - they are in Customer_Trip_Date_Rule
}

// Removed return log
return new Customer_Last_Trip_In_Period();
