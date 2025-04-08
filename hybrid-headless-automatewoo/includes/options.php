<?php
namespace HybridHeadlessAutomateWoo;

use AutomateWoo\Options_API;

defined( 'ABSPATH' ) || exit;

class Options extends Options_API {
    public $prefix = 'hybrid_headless_automatewoo_';

    public function __construct() {
        $this->defaults = [
            // Add default settings here
        ];
    }
}
