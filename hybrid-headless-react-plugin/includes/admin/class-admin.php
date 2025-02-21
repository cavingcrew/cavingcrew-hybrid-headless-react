<?php
/**
 * Admin functionality
 *
 * @package HybridHeadless
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Admin Class
 */
class Hybrid_Headless_Admin {
    /**
     * Constructor
     */
    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_menu_items' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
    }

    /**
     * Add menu items
     */
    public function add_menu_items() {
        add_options_page(
            __( 'Hybrid Headless Settings', 'hybrid-headless' ),
            __( 'Hybrid Headless', 'hybrid-headless' ),
            'manage_options',
            'hybrid-headless',
            array( $this, 'render_settings_page' )
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting( 'hybrid_headless', 'hybrid_headless_frontend_homepage', 'boolean' );
        register_setting( 'hybrid_headless', 'hybrid_headless_build_path' );
        register_setting('hybrid_headless', 'hybrid_headless_enable_proxy', array(
            'type' => 'boolean',
            'default' => true,
            'sanitize_callback' => 'rest_sanitize_boolean',
        ));

        register_setting('hybrid_headless', 'hybrid_headless_disable_notices', array(
            'type' => 'boolean',
            'default' => true,
            'sanitize_callback' => 'rest_sanitize_boolean',
        ));

        register_setting('hybrid_headless', 'hybrid_headless_enable_purchase_restrictions', array(
            'type' => 'boolean',
            'default' => true,
            'sanitize_callback' => 'rest_sanitize_boolean',
        ));

        add_settings_section(
            'hybrid_headless_main',
            __( 'Main Settings', 'hybrid-headless' ),
            array( $this, 'render_section_main' ),
            'hybrid-headless'
        );

        add_settings_field(
            'build_path',
            __( 'Next.js Build Path', 'hybrid-headless' ),
            array( $this, 'render_field_build_path' ),
            'hybrid-headless',
            'hybrid_headless_main'
        );

        add_settings_field(
            'frontend_homepage',
            __( 'Frontend Homepage', 'hybrid-headless' ),
            array( $this, 'render_field_frontend_homepage' ),
            'hybrid-headless',
            'hybrid_headless_main'
        );

        add_settings_field(
            'enable_proxy',
            __('Enable Frontend Proxy', 'hybrid-headless'),
            array($this, 'render_field_enable_proxy'),
            'hybrid-headless',
            'hybrid_headless_main'
        );

        add_settings_field(
            'disable_notices',
            __('Suppress WooCommerce Notices', 'hybrid-headless'),
            array($this, 'render_field_disable_notices'),
            'hybrid-headless',
            'hybrid_headless_main'
        );

        add_settings_field(
            'enable_purchase_restrictions',
            __('Enable Purchase Restrictions', 'hybrid-headless'),
            array($this, 'render_field_enable_purchase_restrictions'),
            'hybrid-headless',
            'hybrid_headless_main'
        );
    }

    /**
     * Render disable notices field
     */
    public function render_field_enable_purchase_restrictions() {
        $value = get_option('hybrid_headless_enable_purchase_restrictions', true);
        ?>
        <label>
            <input type="checkbox" name="hybrid_headless_enable_purchase_restrictions" value="1" <?php checked($value); ?>>
            <?php esc_html_e('Prevent repeat purchases of events', 'hybrid-headless'); ?>
        </label>
        <p class="description">
            <?php esc_html_e('When enabled, users cannot purchase events they already own', 'hybrid-headless'); ?>
        </p>
        <?php
    }

    public function render_field_disable_notices() {
        $value = get_option('hybrid_headless_disable_notices', true);
        ?>
        <label>
            <input type="checkbox" name="hybrid_headless_disable_notices" value="1" <?php checked($value); ?>>
            <?php esc_html_e('Suppress WooCommerce notices (recommended)', 'hybrid-headless'); ?>
        </label>
        <p class="description">
            <?php esc_html_e('When enabled, suppresses all WooCommerce success/notice messages', 'hybrid-headless'); ?>
        </p>
        <?php
    }

    /**
     * Render enable proxy field
     */
    public function render_field_enable_proxy() {
        $value = get_option('hybrid_headless_enable_proxy', true);
        ?>
        <label>
            <input type="checkbox" name="hybrid_headless_enable_proxy" value="1" <?php checked($value); ?>>
            <?php esc_html_e('Enable frontend route proxying to Next.js', 'hybrid-headless'); ?>
        </label>
        <p class="description">
            <?php esc_html_e('When disabled, the plugin will only provide API functionality without proxying frontend routes.', 'hybrid-headless'); ?>
        </p>
        <?php
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields( 'hybrid_headless' );
                do_settings_sections( 'hybrid-headless' );
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    /**
     * Render main section
     */
    public function render_section_main() {
        echo '<p>' . esc_html__( 'Configure the hybrid headless setup.', 'hybrid-headless' ) . '</p>';
    }

    /**
     * Render build path field
     */
    public function render_field_build_path() {
        $value = get_option( 'hybrid_headless_build_path', 'dist' );
        ?>
        <input type="text" name="hybrid_headless_build_path" value="<?php echo esc_attr( $value ); ?>" class="regular-text">
        <p class="description">
            <?php esc_html_e( 'The path within the plugin directory where the Next.js build is located.', 'hybrid-headless' ); ?>
        </p>
        <?php
    }

    /**
     * Render frontend homepage field
     */
    public function render_field_frontend_homepage() {
        $value = get_option( 'hybrid_headless_frontend_homepage', false );
        ?>
        <label>
            <input type="checkbox" name="hybrid_headless_frontend_homepage" value="1" <?php checked( $value ); ?>>
            <?php esc_html_e( 'Use Next.js frontend for homepage', 'hybrid-headless' ); ?>
        </label>
        <?php
    }
}
