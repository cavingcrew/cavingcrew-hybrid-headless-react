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
        register_setting( 'hybrid_headless', 'hybrid_headless_frontend_url' );
        register_setting( 'hybrid_headless', 'hybrid_headless_frontend_homepage', 'boolean' );

        add_settings_section(
            'hybrid_headless_main',
            __( 'Main Settings', 'hybrid-headless' ),
            array( $this, 'render_section_main' ),
            'hybrid-headless'
        );

        add_settings_field(
            'frontend_url',
            __( 'Frontend URL', 'hybrid-headless' ),
            array( $this, 'render_field_frontend_url' ),
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
     * Render frontend URL field
     */
    public function render_field_frontend_url() {
        $value = get_option( 'hybrid_headless_frontend_url' );
        ?>
        <input type="url" name="hybrid_headless_frontend_url" value="<?php echo esc_attr( $value ); ?>" class="regular-text">
        <p class="description">
            <?php esc_html_e( 'The URL where your Next.js frontend is hosted.', 'hybrid-headless' ); ?>
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
