<?php
/**
 * Product Duplicator Class
 * 
 * @package HybridHeadless
 */

if (!defined('ABSPATH')) {
    exit;
}

class WC_Product_Duplicator {
    /**
     * Duplicate a product
     *
     * @param WC_Product $product Product to duplicate
     * @return WC_Product New duplicated product
     */
    public function duplicate($product) {
        // DEBUG: Log original product meta
        $original_meta = get_post_meta($product->get_id());
        error_log('[Duplicator] Original product meta: ' . print_r(array_keys($original_meta), true));
        
        // Create new product as a duplicate
        $new_product = clone $product;
        $new_product->set_id(0); // Reset ID to create new
        
        // Reset unique attributes
        $new_product->set_date_created(null);
        $new_product->set_date_modified(null);
        $new_product->set_rating_counts(0);
        $new_product->set_average_rating(0);
        $new_product->set_review_count(0);
        $new_product->set_total_sales(0);
        
        // Save the duplicate
        $new_id = $new_product->save();
        
        // DEBUG: Log meta before copying
        $meta_before = get_post_meta($new_id);
        error_log('[Duplicator] New product meta before copy (' . $new_id . '): ' . print_r(array_keys($meta_before), true));
        
        // Copy all product meta
        $meta_data = get_post_meta($product->get_id());
        foreach ($meta_data as $meta_key => $meta_values) {
            error_log('[Duplicator] Copying meta key: ' . $meta_key);
            foreach ($meta_values as $meta_value) {
                add_post_meta($new_id, $meta_key, maybe_unserialize($meta_value));
            }
        }
        
        // DEBUG: Log meta after copying
        $meta_after = get_post_meta($new_id);
        error_log('[Duplicator] New product meta after copy (' . $new_id . '): ' . print_r(array_keys($meta_after), true));
        
        // Copy variations if variable product
        if ($product->is_type('variable')) {
            foreach ($product->get_children() as $child_id) {
                $variation = wc_get_product($child_id);
                if ($variation && $variation->is_type('variation')) {
                    $this->duplicate_variation($variation, $new_id);
                }
            }
        }
        
        return wc_get_product($new_id);
    }
    
    /**
     * Duplicate a product variation
     *
     * @param WC_Product_Variation $variation Variation to duplicate
     * @param int $new_parent_id New parent product ID
     * @return int New variation ID
     */
    private function duplicate_variation($variation, $new_parent_id) {
        // DEBUG: Log original variation meta
        $original_meta = get_post_meta($variation->get_id());
        error_log('[Duplicator] Original variation meta: ' . print_r(array_keys($original_meta), true));
        
        $new_variation = clone $variation;
        $new_variation->set_id(0);
        $new_variation->set_parent_id($new_parent_id);
        
        // Reset unique attributes
        $new_variation->set_date_created(null);
        $new_variation->set_date_modified(null);
        $new_variation->set_rating_counts(0);
        $new_variation->set_average_rating(0);
        $new_variation->set_review_count(0);
        
        $new_variation_id = $new_variation->save();
        
        // DEBUG: Log meta before copying
        $meta_before = get_post_meta($new_variation_id);
        error_log('[Duplicator] New variation meta before copy (' . $new_variation_id . '): ' . print_r(array_keys($meta_before), true));
        
        // Copy variation meta
        $meta_data = get_post_meta($variation->get_id());
        foreach ($meta_data as $meta_key => $meta_values) {
            error_log('[Duplicator] Copying variation meta key: ' . $meta_key);
            foreach ($meta_values as $meta_value) {
                add_post_meta($new_variation_id, $meta_key, maybe_unserialize($meta_value));
            }
        }
        
        // DEBUG: Log meta after copying
        $meta_after = get_post_meta($new_variation_id);
        error_log('[Duplicator] New variation meta after copy (' . $new_variation_id . '): ' . print_r(array_keys($meta_after), true));
        
        return $new_variation_id;
    }
}
