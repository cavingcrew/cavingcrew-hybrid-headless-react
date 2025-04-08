<?php
namespace HybridHeadlessAutomateWoo\Rules;

use AutomateWoo\Rules;
use AutomateWoo\Customer;
use AutomateWoo\Clean;

defined( 'ABSPATH' ) || exit;

abstract class Customer_Trip_Date_Rule extends  Rules\Abstract_Date  {

    public $type = 'customer';

    public function init() {
        $this->add_parameter_select_field( 'time_unit', __( 'Time Unit', 'hybrid-headless-automatewoo' ), [
            'days' => __( 'Days', 'hybrid-headless-automatewoo' ),
            'weeks' => __( 'Weeks', 'hybrid-headless-automatewoo' ),
            'months' => __( 'Months', 'hybrid-headless-automatewoo' )
        ], true );

        $this->add_parameter_number_field( 'time_amount', __( 'Time Amount', 'hybrid-headless-automatewoo' ), true );
    }

    protected function get_customer_trips( $customer ) {
        $orders = wc_get_orders([
            'customer_id' => $customer->get_user_id(),
            'status' => ['completed', 'processing'],
            'limit' => -1,
            'return' => 'ids'
        ]);

        $trips = [];

        foreach ( $orders as $order_id ) {
            $order = wc_get_order( $order_id );
            foreach ( $order->get_items() as $item ) {
                $product = $item->get_product();
                if ( $product && $start_date = $product->get_meta( 'event_start_date_time' ) ) {
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
        $multipliers = [
            'days' => DAY_IN_SECONDS,
            'weeks' => WEEK_IN_SECONDS,
            'months' => MONTH_IN_SECONDS
        ];

        return $amount * ( $multipliers[ $unit ] ?? DAY_IN_SECONDS );
    }
}
