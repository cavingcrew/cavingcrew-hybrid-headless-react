<?php
/**
 * Purchase Restrictions Class
 *
 * @package HybridHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

class Hybrid_Headless_Purchase_Restrictions {
    private $skip_products = array(1272);

    public function __construct() {
        if (get_option('hybrid_headless_enable_purchase_restrictions', true)) {
            add_filter('woocommerce_is_purchasable', array($this, 'disable_repeat_purchase'), 10, 2);
            add_action('woocommerce_single_product_summary', array($this, 'purchase_disabled_message'), 31);
            add_action('woocommerce_variable_add_to_cart', array($this, 'render_variation_messages'), 31);
        }
    }

    private function has_valid_purchase($customer_email, $user_id, $product_id) {
        if (!$product_id) return false;

        global $wpdb;
        $orders = $wpdb->get_col($wpdb->prepare("
            SELECT DISTINCT order_items.order_id
            FROM {$wpdb->prefix}woocommerce_order_items as order_items
            LEFT JOIN {$wpdb->prefix}woocommerce_order_itemmeta as order_item_meta ON order_items.order_item_id = order_item_meta.order_item_id
            LEFT JOIN {$wpdb->posts} AS posts ON order_items.order_id = posts.ID
            LEFT JOIN {$wpdb->postmeta} AS user_meta ON posts.ID = user_meta.post_id
            WHERE (
                (user_meta.meta_key = '_customer_user' AND user_meta.meta_value = %d) 
                OR (user_meta.meta_key = '_billing_email' AND user_meta.meta_value = %s)
            )
            AND order_items.order_item_type = 'line_item'
            AND order_item_meta.meta_key = '_product_id'
            AND order_item_meta.meta_value = %d
        ", $user_id, $customer_email, $product_id));

        if (empty($orders)) return false;

        foreach ($orders as $order_id) {
            $order = wc_get_order($order_id);
            if (!$order) continue;

            $status = $order->get_status();
            
            if (in_array($status, array('on-hold', 'processing'))) {
                return true;
            }
            
            if ($status === 'completed') {
                $attendance = get_post_meta($order_id, 'cc_attendance', true);
                if (!$attendance || stripos($attendance, 'cancelled') === false) {
                    return true;
                }
            }
        }

        return false;
    }

    public function disable_repeat_purchase($purchasable, $product) {
        if (defined('DOING_AJAX') && DOING_AJAX) return $purchasable;
        
        $current_user_id = get_current_user_id();
        $current_user_email = wp_get_current_user()->user_email;
        $product_id = $product->get_id();
        $parent_id = $product->is_type('variation') ? $product->get_parent_id() : $product_id;

        if (in_array($product_id, $this->skip_products) || in_array($parent_id, $this->skip_products)) {
            return $purchasable;
        }

        if ($product->is_type('variation')) {
            if ($this->has_valid_purchase($current_user_email, $current_user_id, $product_id) ||
                $this->has_valid_purchase($current_user_email, $current_user_id, $parent_id)) {
                return false;
            }

            $parent_product = wc_get_product($parent_id);
            if ($parent_product && $parent_product->is_type('variable')) {
                foreach ($parent_product->get_children() as $variation_id) {
                    if ($this->has_valid_purchase($current_user_email, $current_user_id, $variation_id)) {
                        return false;
                    }
                }
            }
        } else {
            if ($this->has_valid_purchase($current_user_email, $current_user_id, $product_id)) {
                return false;
            }

            if ($product->is_type('variable')) {
                foreach ($product->get_children() as $variation_id) {
                    if ($this->has_valid_purchase($current_user_email, $current_user_id, $variation_id)) {
                        return false;
                    }
                }
            }
        }

        return $purchasable;
    }

    public function purchase_disabled_message() {
        global $product;
        if (!$product) return;

        $current_user_id = get_current_user_id();
        $current_user_email = wp_get_current_user()->user_email;
        $product_id = $product->get_id();
        $parent_id = $product->is_type('variation') ? $product->get_parent_id() : $product_id;

        if (in_array($product_id, $this->skip_products) || in_array($parent_id, $this->skip_products)) {
            return;
        }

        $message = '';
        
        if ($product->is_type('variable')) {
            foreach ($product->get_children() as $variation_id) {
                if ($this->has_valid_purchase($current_user_email, $current_user_id, $variation_id)) {
                    $message = sprintf(
                        '<div class="woocommerce"><div class="woocommerce-info wc-nonpurchasable-message">%s</div></div>',
                        __('You\'ve already purchased a variation of this event. For additional registrations, please have each person sign up using their own account.', 'hybrid-headless')
                    );
                    break;
                }
            }
        } else {
            if ($this->has_valid_purchase($current_user_email, $current_user_id, $product_id)) {
                $message = sprintf(
                    '<div class="woocommerce"><div class="woocommerce-info wc-nonpurchasable-message">%s</div></div>',
                    __('You\'ve already signed up for this event. For additional registrations, please have each person sign up using their own account.', 'hybrid-headless')
                );
            }
        }

        if ($message) {
            echo $message;
        }
    }

    public function render_variation_messages($product) {
        // First validate we have a proper product object
        if (!$product instanceof WC_Product || !$product->is_type('variable')) {
            return;
        }

        if (in_array($product->get_id(), $this->skip_products)) {
            return;
        }

        $current_user_id = get_current_user_id();
        $current_user_email = wp_get_current_user()->user_email;
        $has_purchases = false;

        // Get children and validate they're variations
        $variation_ids = $product->get_children();
        
        if (!is_array($variation_ids)) {
            return;
        }

        foreach ($variation_ids as $variation_id) {
            $variation = wc_get_product($variation_id);
            
            // Skip invalid variations
            if (!$variation instanceof WC_Product_Variation) {
                continue;
            }

            if ($this->has_valid_purchase($current_user_email, $current_user_id, $variation_id)) {
                $has_purchases = true;
                echo sprintf(
                    '<div class="woocommerce"><div class="woocommerce-info wc-nonpurchasable-message js-variation-%s">%s</div></div>',
                    sanitize_html_class($variation_id),
                    __('You\'ve already purchased a variation of this event. For additional registrations, please have each person sign up using their own account.', 'hybrid-headless')
                );
            }
        }

        if ($has_purchases) {
            wc_enqueue_js("
                jQuery('.variations_form')
                .on('woocommerce_variation_select_change', function() {
                    jQuery('.wc-nonpurchasable-message').hide();
                })
                .on('found_variation', function(event, variation) {
                    jQuery('.wc-nonpurchasable-message').hide();
                    if (!variation.is_purchasable) {
                        jQuery('.wc-nonpurchasable-message.js-variation-' + variation.variation_id).show();
                    }
                })
                .find('.variations select').change();
            ");
        }
    }
}
