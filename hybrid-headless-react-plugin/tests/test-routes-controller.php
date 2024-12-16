<?php
/**
 * Routes Controller Test
 */
class Test_Routes_Controller extends WP_UnitTestCase {
    private $routes_controller;

    public function setUp(): void {
        parent::setUp();
        $this->routes_controller = new Hybrid_Headless_Routes_Controller();
    }

    public function test_get_routes() {
        $response = $this->routes_controller->get_routes();
        $data = $response->get_data();

        $this->assertArrayHasKey( 'frontend', $data );
        $this->assertArrayHasKey( 'wordpress', $data );
        
        // Test frontend routes
        $this->assertArrayHasKey( 'home', $data['frontend'] );
        $this->assertArrayHasKey( 'trips', $data['frontend'] );
        
        // Test WordPress routes
        $this->assertArrayHasKey( 'account', $data['wordpress'] );
        $this->assertArrayHasKey( 'checkout', $data['wordpress'] );
    }

    public function test_is_frontend_route() {
        $method = new ReflectionMethod(
            'Hybrid_Headless_Routes_Controller',
            'is_frontend_route'
        );
        $method->setAccessible( true );

        // Test frontend routes
        $this->assertTrue( $method->invoke( $this->routes_controller, 'trips' ) );
        $this->assertTrue( $method->invoke( $this->routes_controller, 'trips/sample-trip' ) );
        $this->assertTrue( $method->invoke( $this->routes_controller, 'categories' ) );
        
        // Test non-frontend routes
        $this->assertFalse( $method->invoke( $this->routes_controller, 'my-account' ) );
        $this->assertFalse( $method->invoke( $this->routes_controller, 'checkout' ) );
    }
}
