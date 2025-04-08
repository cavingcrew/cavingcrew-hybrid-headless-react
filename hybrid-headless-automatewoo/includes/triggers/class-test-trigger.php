<?php
namespace HybridHeadlessAutomateWoo\Triggers;

use AutomateWoo\Trigger;

defined('ABSPATH') || exit;

class Test_Trigger extends Trigger {
    public function load_admin_details() {
        $this->title = __('Test Trigger', 'hybrid-headless-automatewoo');
        $this->description = __('This is a test trigger to verify plugin loading', 'hybrid-headless-automatewoo');
        $this->group = __('Orders', 'hybrid-headless-automatewoo');
    }
}
