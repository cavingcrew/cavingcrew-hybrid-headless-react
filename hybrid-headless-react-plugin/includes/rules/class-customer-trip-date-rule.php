<?php
namespace HybridHeadless\Rules;

use AutomateWoo\Rules\Rule;
use AutomateWoo\DataTypes\DataTypes;
use AutomateWoo\DateTime;
use AutomateWoo\Clean;

defined( 'ABSPATH' ) || exit;

abstract class Customer_Trip_Date_Rule extends Rule {

    /**
     * The data item type used by this rule
     * @var string
     */
    public $data_item = DataTypes::CUSTOMER;

    /**
     * Init the rule
     */
    public function init() {
        $this->add_parameter_select_field( 'time_unit', __( 'Time Unit', 'hybrid-headless' ), [
            'days' => __( 'Days', 'hybrid-headless' ),
            'weeks' => __( 'Weeks', 'hybrid-headless' ),
            'months' => __( 'Months', 'hybrid-headless' )
        ], true );

        $this->add_parameter_number_field( 'time_amount', __( 'Time Amount', 'hybrid-headless' ), true );
    }

    /**
     * Get all trips for a customer
     * 
     * @param \AutomateWoo\Customer $customer
     * @return array Array of trip data including start dates
     */
    protected function get_customer_trips( $customer ) {
        if ( ! $customer->get_user_id() ) {
            return [];
        }

        $orders = wc_get_orders([
            'customer_id' => $customer->get_user_id(),
            'status' => ['completed', 'processing'],
            'limit' => -1,
            'return' => 'ids'
        ]);

        $trips = [];

        foreach ( $orders as $order_id ) {
            $order = wc_get_order( $order_id );
            
            if ( ! $order ) {
                continue;
            }

            foreach ( $order->get_items() as $item ) {
                $product = $item->get_product();
                
                if ( ! $product ) {
                    continue;
                }

                $start_date = $product->get_meta( 'event_start_date_time' );
                
                if ( $start_date ) {
                    try {
                        $date = new DateTime( $start_date );
                        $trips[] = [
                            'start' => $date,
                            'product_id' => $product->get_id()
                        ];
                    } catch ( \Exception $e ) {
                        continue;
                    }
                }
            }
        }

        // Sort trips by start date
        usort( $trips, function( $a, $b ) {
            return $a['start'] <=> $b['start'];
        });

        return $trips;
    }

    /**
     * Convert time amount and unit to seconds
     * 
     * @param int $amount
     * @param string $unit
     * @return int
     */
    protected function parse_time( $amount, $unit ) {
        $multipliers = [
            'days' => DAY_IN_SECONDS,
            'weeks' => WEEK_IN_SECONDS,
            'months' => MONTH_IN_SECONDS
        ];

        return $amount * ( $multipliers[ $unit ] ?? DAY_IN_SECONDS );
    }

    /**
     * Validate the rule
     * 
     * @param \AutomateWoo\Customer $customer
     * @param string $compare
     * @param array|null $value
     * @return bool
     */
    abstract public function validate( $customer, $compare, $value = null );
}
