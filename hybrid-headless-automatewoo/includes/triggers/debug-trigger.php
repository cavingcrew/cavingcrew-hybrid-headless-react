<?php
namespace HybridHeadlessAutomateWoo\Triggers;

defined('ABSPATH') || exit;

class Debug_Trigger extends \AutomateWoo\Trigger {
    public function init() {
        $this->title = 'Debug Trigger';
        $this->group = 'Other';
    }
}
