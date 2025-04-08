<?php
namespace HybridHeadlessAutomateWoo\Triggers;

use AutomateWoo\Customer_Factory;
use AutomateWoo\Trigger;

defined('ABSPATH') || exit;

/**
 * This is a test trigger that follows best practices.
 * Trigger with: do_action('hybrid_headless_test_trigger', $user_id);
 */
class Test_Trigger extends Trigger {

    /**
     * Define which data items are set by this trigger
     *
     * @var array
     */
    public $supplied_data_items = ['customer'];

    /**
     * Set up the trigger
     */
    public function init() {
        $this->title = __('Test Trigger', 'hybrid-headless-automatewoo');
        $this->description = __('This is a test trigger to verify plugin loading', 'hybrid-headless-automatewoo');
        $this->group = __('Custom Triggers', 'hybrid-headless-automatewoo');
    }

    /**
     * Add any fields to the trigger (optional)
     */
    public function load_fields() {
        // No fields needed for this test trigger
    }

    /**
     * Defines when the trigger is run
     */
    public function register_hooks() {
        add_action('hybrid_headless_test_trigger', [$this, 'catch_hooks']);
    }

    /**
     * Catches the action and calls the maybe_run() method.
     *
     * @param int $user_id
     */
    public function catch_hooks($user_id) {
        // Log that the hook was caught
        error_log("Test trigger caught hook for user ID: $user_id");
        
        // Get/create customer object from the user id
        $customer = Customer_Factory::get_by_user_id($user_id);
        
        if (!$customer) {
            error_log("Could not create customer for user ID: $user_id");
            return;
        }
        
        $this->maybe_run([
            'customer' => $customer,
        ]);
    }

    /**
     * Performs any validation if required. If this method returns true the trigger will fire.
     *
     * @param \AutomateWoo\Workflow $workflow
     * @return bool
     */
    public function validate_workflow($workflow) {
        // Get objects from the data layer
        $customer = $workflow->data_layer()->get_customer();
        
        if (!$customer) {
            return false;
        }
        
        // Prevent duplicate runs
        if ($workflow->has_run_for_data_item('customer', DAY_IN_SECONDS)) {
            return false;
        }
        
        return true;
    }
}
