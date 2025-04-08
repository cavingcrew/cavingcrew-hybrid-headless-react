<?php
namespace HybridHeadlessAutomateWoo\Variables;

use AutomateWoo\Variable_Abstract_Datetime;

defined( 'ABSPATH' ) || exit;

class ProductEventFinishDate extends Variable_Abstract_Datetime {

    public function load_admin_details() {
        $this->description = __( 'Formatted event finish date from the product', 'hybrid-headless-automatewoo' );
        $this->group = __( 'Product', 'hybrid-headless-automatewoo' );
    }

    public function get_value( $product, $parameters ) {
        if ( ! $product || ! $product->get_id() ) return '';
        $date = get_field( 'event_finish_date_time', $product->get_id() );
        return $this->format_datetime( $date, $parameters, true );
    }
}

error_log('[Variable Load] Reached end of product-event-finish-date.php');
return new ProductEventFinishDate();
