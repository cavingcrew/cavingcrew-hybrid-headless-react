<?php
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Clean up any options or data when uninstalling
delete_option('hybrid_headless_automatewoo_version');
