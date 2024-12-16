<?php
/**
 * Uninstall plugin
 *
 * @package HybridHeadless
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

// Delete plugin options
delete_option( 'hybrid_headless_frontend_homepage' );
delete_option( 'hybrid_headless_build_path' );

// Clean up build directories
$build_paths = array( 'dist', 'dist-dev' );
foreach ( $build_paths as $path ) {
    $build_dir = plugin_dir_path( __FILE__ ) . $path;
    if ( is_dir( $build_dir ) ) {
        array_map( 'unlink', glob( "$build_dir/*.*" ) );
        rmdir( $build_dir );
    }
}
