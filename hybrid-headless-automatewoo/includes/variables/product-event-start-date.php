<?php
namespace HybridHeadlessAutomateWoo\Variables;

use AutomateWoo\Variable_Abstract_Datetime;

defined( 'ABSPATH' ) || exit;

class ProductEventStartDate extends Variable_Abstract_Datetime {

    public function load_admin_details() {
        $this->description = __( 'Formatted event start date from the product', 'hybrid-headless-automatewoo' );
        $this->group = __( 'Product', 'hybrid-headless-automatewoo' );
    }

    public function get_value( $product, $parameters ) {
        if ( ! $product || ! $product->get_id() ) return '';
        $date = get_field( 'event_start_date_time', $product->get_id() );
        return $this->format_datetime( $date, $parameters, true );
    }
}

return new ProductEventStartDate();
