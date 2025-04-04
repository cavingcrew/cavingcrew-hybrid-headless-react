<?php
namespace HybridHeadless\Triggers;

use AutomateWoo\Customer_Factory;
use AutomateWoo\Exceptions\InvalidArgument;
use AutomateWoo\Fields\Number;
use AutomateWoo\Fields\Select;
use AutomateWoo\Triggers\AbstractBatchedDailyTrigger;
use AutomateWoo\Workflow;

defined( 'ABSPATH' ) || exit;

class Order_Event_Date_Trigger extends AbstractBatchedDailyTrigger {

    public $supplied_data_items = [ 'order', 'customer', 'product' ];

    public function load_admin_details() {
        $this->title = __( 'Order Event Date', 'hybrid-headless' );
        $this->description = __( 'Triggers based on time relative to a product\'s event date', 'hybrid-headless' );
        $this->group = __( 'Orders', 'hybrid-headless' );
    }

    public function load_fields() {
        $when = new Select( true );
        $when->set_name( 'when' );
        $when->set_title( __( 'When', 'hybrid-headless' ) );
        $when->set_options([
            'before' => __( 'Before', 'hybrid-headless' ),
            'after' => __( 'After', 'hybrid-headless' ),
        ]);

        $unit = new Select( true );
        $unit->set_name( 'unit' );
        $unit->set_title( __( 'Time Unit', 'hybrid-headless' ) );
        $unit->set_options([
            'days' => __( 'Days', 'hybrid-headless' ),
            'hours' => __( 'Hours', 'hybrid-headless' ),
        ]);

        $amount = new Number();
        $amount->set_name( 'amount' );
        $amount->set_title( __( 'Time Amount', 'hybrid-headless' ) );
        $amount->set_required();

        $this->add_field( $when );
        $this->add_field( $unit );
        $this->add_field( $amount );
    }

    public function get_batch_for_workflow( Workflow $workflow, int $offset, int $limit ): array {
        $when = $workflow->get_trigger_option( 'when' );
        $unit = $workflow->get_trigger_option( 'unit' );
        $amount = (int) $workflow->get_trigger_option( 'amount' );

        // Calculate target timestamp
        $now = current_time( 'timestamp' );
        $modifier = $when === 'before' ? "-$amount $unit" : "+$amount $unit";
        $target_timestamp = strtotime( $modifier, $now );

        // Get orders with event dates matching the target time
        return $this->query_orders_by_event_date( $target_timestamp, $offset, $limit );
    }

    private function query_orders_by_event_date( $target_timestamp, $offset, $limit ) {
        global $wpdb;

        $target_date = date( 'Y-m-d H:i:s', $target_timestamp );
        
        // Validate we have a proper timestamp  
        if ( ! $target_timestamp ) {
            AutomateWoo\Logger::error(
                'order-event-date-trigger',
                'Invalid target timestamp',
                [
                    'timestamp' => $target_timestamp,
                    'offset' => $offset,
                    'limit' => $limit  
                ]
            );
            return [];
        }

        // Ensure we're working with valid SQL dates
        $from_date = date( 'Y-m-d H:i:s', $target_timestamp - HOUR_IN_SECONDS );
        $to_date = date( 'Y-m-d H:i:s', $target_timestamp + HOUR_IN_SECONDS );
        $meta_key = 'event_start_date_time';

        $order_ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT DISTINCT order_items.order_id
                FROM {$wpdb->prefix}woocommerce_order_items AS order_items
                INNER JOIN {$wpdb->prefix}woocommerce_order_itemmeta AS item_meta
                    ON order_items.order_item_id = item_meta.order_item_id
                INNER JOIN {$wpdb->postmeta} AS post_meta
                    ON item_meta.meta_value = post_meta.post_id
                WHERE order_items.order_item_type = 'line_item'
                    AND item_meta.meta_key = '_product_id'
                    AND post_meta.meta_key = %s
                    AND post_meta.meta_value BETWEEN %s AND %s
                ORDER BY order_items.order_id ASC
                LIMIT %d, %d",
                $meta_key,
                date( 'Y-m-d H:i:s', $target_timestamp - HOUR_IN_SECONDS ),
                date( 'Y-m-d H:i:s', $target_timestamp + HOUR_IN_SECONDS ),
                $offset,
                $limit
            )
        );

        return array_map( function( $order_id ) {
            return [ 'order_id' => $order_id ];
        }, $order_ids );
    }

    public function process_item_for_workflow( Workflow $workflow, array $item ) {
        $order = wc_get_order( $item['order_id'] );
        
        if ( ! $order ) {
            throw new InvalidArgument( __( 'Order not found', 'hybrid-headless' ) );
        }

        $customer = Customer_Factory::get_by_order( $order );
        $product = $this->get_primary_product( $order );

        $workflow->maybe_run([
            'order' => $order,
            'customer' => $customer,
            'product' => $product,
        ]);
    }

    private function get_primary_product( \WC_Order $order ) {
        foreach ( $order->get_items() as $item ) {
            if ( $product = $item->get_product() ) {
                return $product;
            }
        }
        return null;
    }

    public function validate_workflow( Workflow $workflow ) {
        $order = $workflow->data_layer()->get_order();
        $product = $workflow->data_layer()->get_product();

        if ( ! $order || ! $product ) {
            return false;
        }

        // Ensure we haven't already triggered for this order in the last hour
        return ! $workflow->has_run_for_data_item( 'order', HOUR_IN_SECONDS );
    }
}
