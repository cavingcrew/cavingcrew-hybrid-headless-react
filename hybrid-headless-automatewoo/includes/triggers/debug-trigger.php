<?php
namespace HybridHeadlessAutomateWoo\Triggers;

defined('ABSPATH') || exit;

class Debug_Trigger extends \AutomateWoo\Trigger {
    public function init() {
        $this->title = 'Debug Trigger';
        $this->group = 'Other';
    }

    /**
     * Register the hooks for this trigger.
     * Required implementation from AutomateWoo\Trigger.
     * Can be empty if the trigger is manual or initiated differently.
     */
    public function register_hooks() {
        // No specific WordPress hooks needed for this debug trigger.
    }
}
