<?php
namespace HybridHeadless\DataLayers;

use AutomateWoo\Data_Layer;

class OrderEventDataLayer extends Data_Layer {

    function __construct( $order, $customer, $product ) {
        $this->order = $order;
        $this->customer = $customer;
        $this->product = $product;
        
        parent::__construct([
            'order' => $order,
            'customer' => $customer,
            'product' => $product
        ]);
    }
}
