<?php
/**
 * Build script for Next.js integration
 *
 * @package HybridHeadless
 */

if (php_sapi_name() !== 'cli') {
    die('This script can only be run from the command line.');
}

// Configuration
$next_app_dir = dirname(__DIR__, 2) . '/hybrid-headless-front-end';
$plugin_build_dir = dirname(__DIR__) . '/' . (getenv('BUILD_PATH') ?: 'dist');

// Ensure build directory exists
if (!file_exists($plugin_build_dir)) {
    mkdir($plugin_build_dir, 0755, true);
}

echo "Building Next.js application...\n";

// Build Next.js app
$build_command = "cd $next_app_dir && npm run build";
passthru($build_command, $build_result);

if ($build_result !== 0) {
    die("Next.js build failed\n");
}

echo "Copying build files to plugin...\n";

// Copy build files to plugin
$next_build_dir = "$next_app_dir/.next/static";
$plugin_static_dir = "$plugin_build_dir/_next/static";

if (!file_exists($plugin_static_dir)) {
    mkdir($plugin_static_dir, 0755, true);
}

// Copy static files
copy_directory($next_build_dir, $plugin_static_dir);

// Copy index.html
copy("$next_app_dir/out/index.html", "$plugin_build_dir/index.html");

echo "Build complete!\n";

/**
 * Recursively copy a directory
 *
 * @param string $src Source directory
 * @param string $dst Destination directory
 */
function copy_directory($src, $dst) {
    $dir = opendir($src);
    @mkdir($dst);
    while (($file = readdir($dir))) {
        if (($file != '.') && ($file != '..')) {
            if (is_dir($src . '/' . $file)) {
                copy_directory($src . '/' . $file, $dst . '/' . $file);
            } else {
                copy($src . '/' . $file, $dst . '/' . $file);
            }
        }
    }
    closedir($dir);
}
