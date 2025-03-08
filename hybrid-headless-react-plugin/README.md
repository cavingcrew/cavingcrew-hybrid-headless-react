# Hybrid Headless React Plugin for WordPress

## Overview

The Hybrid Headless React Plugin is a sophisticated WordPress plugin that enables a hybrid headless architecture, combining the power of WordPress/WooCommerce with modern frontend frameworks like Next.js. This plugin serves as the crucial bridge between your WordPress backend and headless frontend, offering a unique approach where some routes are served headlessly while maintaining traditional WordPress functionality for authenticated flows.

## Features

### Static Asset Handling
The plugin automatically serves and caches static assets with optimal headers:
- Next.js static files (`/_next/static`, `/_next/image`):
  - Immutable caching (1 year)
  - Gzip/Brotli compression support
- Application static files (`/static`):
  - 1 hour cache duration
  - Standard compression
- Automatic security validation for static file paths
- Direct filesystem serving for better performance

No additional server configuration required when using the PHP plugin - it handles static assets internally through WordPress's rewrite system.

### 1. Smart Route Handling
- Configurable proxy functionality that can be enabled/disabled via admin UI or WP-CLI
- Automatically detects and routes requests between headless and traditional WordPress paths
- Configurable route patterns for maximum flexibility
- Maintains WordPress functionality for critical paths (`/wp-admin`, `/my-account`, etc.)
- Seamless integration with WooCommerce checkout and cart processes
- Proxies specific routes to Next.js when enabled:
  - `/` (root)
  - `/categories/`
  - `/category/`
  - `/trips/`
  - `/trip/`
  - `/route-descriptions/`
  - `/_next/` (Next.js static assets)

### Server Configuration

#### Apache Configuration
For Apache servers, use this configuration to properly handle Next.js routes and client-side navigation:

# 1. FIRST: Block WC-Ajax specifically (before any proxying)
# Redirect root wc-ajax calls to /checkout/
RewriteEngine On
RewriteCond %{QUERY_STRING} wc-ajax=([^&]+) [NC]
RewriteRule ^/$ /index.php [QSA,L]

# Then your other rules continue as before...
<LocationMatch "^(/wp-admin|/wp-login\.php|/wp-json|/wp-content)">
ProxyPass !
</LocationMatch>

# 2. SECOND: WordPress-specific routes exclusions
<LocationMatch "^(/wp-admin|/wp-login\.php|/wp-json|/wp-content)">
ProxyPass !
</LocationMatch>

# 3. THIRD: Static Next.js assets
<Location "/_next/static">
ProxyPass http://localhost:3000/_next/static
ProxyPassReverse http://localhost:3000/_next/static
Header set Cache-Control "public, max-age=31536000, immutable"
</Location>

<Location "/_next/image">
ProxyPass http://localhost:3000/_next/image
ProxyPassReverse http://localhost:3000/_next/image
</Location>
# 4. FOURTH: Next.js routes
#<LocationMatch "^(/trips(/.*)?|/categories(/.*)?|/trip(/.*)?|/category(/.*)?|/test-client-nav)(\?.*)?$">
#<LocationMatch "^(/trips(/.*)?|/categories(/.*)?|/trip(?!/get-caving-crew-membership(/.*)?)(/.*)?|/category(/.*)?|/test-client-nav)(\?.*)?$">  
#<LocationMatch "^(/|/trips(/.*)?|/categories(/.*)?|/trip(?!/get-caving-crew-membership(/.*)?)(/.*)?|/category(/.*)?|/test-client-nav)(\?.*)?$">
#<LocationMatch "^(/trips(/.*)?|/categories(/.*)?|/trip(?!/get-caving-crew-membership(/.*)?)(/.*)?|/category(/.*)?|/test-client-nav|/(?!\?wc-ajax=))$">
#<LocationMatch "^(?!.*wc-ajax)(/|/trips(/.*)?|/categories(/.*)?|/trip(?!/get-caving-crew-membership(/.*)?)(/.*)?|/category(/.*)?|/test-client-nav)(\?.*)?$">
#<LocationMatch "^(?!.*wc\-ajax)(/|/trips(/.*)?|/categories(/.*)?|/trip(?!/get\-caving\-crew\-membership(/.*)?)(/.*)?|/category(/.*)?|/test\-client\-nav)(\?.*)?$">
<LocationMatch "^(/trips(/.*)?|/categories(/.*)?|/trip(?!/get-caving-crew-membership(/.*)?)(/.*)?|/category(/.*)?|/test-client-nav|/)?$">
RewriteEngine On
RewriteCond %{QUERY_STRING} !wc-ajax [NC]
ProxyPass http://localhost:3000
ProxyPassReverse http://localhost:3000
# Force these to be handled by Next.js
Header set X-NextJS-RSC "1"
Header set X-NextJS-Routing "client"
Header set X-NextJS-Client-Routing "enabled"
Header set Cache-Control "no-cache, no-store, must-revalidate"
</LocationMatch>


### 2. Advanced API Integration
- Custom REST API endpoints optimized for headless frontends
- Complete WooCommerce product data exposure
- Real-time stock level management
- Secure authentication handling
- CORS support with configurable origins
- Cached responses with configurable TTLs
- Automatic cache invalidation on updates

### 3. Performance Optimization
- Static file serving for Next.js assets
- Intelligent caching headers
- Optimized API responses
- Minimal database queries
- Support for CDN integration

### 4. Developer-Friendly
- Clear documentation and code structure
- Extensive hooks and filters
- Debugging tools and logging
- PHPUnit test suite included
- Easy local development setup

## Requirements

### Minimum Requirements
- PHP 7.4 or higher
- WordPress 5.8 or higher
- WooCommerce 5.0 or higher
- MySQL 5.7 or higher

### Recommended
- PHP 8.0 or higher
- WordPress 6.0 or higher
- WooCommerce 6.0 or higher
- Redis or Memcached for caching

## Installation

### Standard Installation
1. Download the plugin zip file
2. Go to WordPress admin → Plugins → Add New
3. Click "Upload Plugin" and select the zip file
4. Click "Install Now" and then "Activate"

### Composer Installation
```bash
composer require hybrid-headless/react-plugin
```

### Manual Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/hybrid-headless-react-plugin.git
   ```
2. Install dependencies:
   ```bash
   composer install
   ```
3. Build the plugin:
   ```bash
   composer run build
   ```

## Configuration

### Basic Setup
1. Navigate to Settings → Hybrid Headless in WordPress admin
2. Configure the following essential settings:
   - Frontend URL
   - Build Path
   - Homepage Handling
   - Route Patterns
   - Frontend Proxy

### Route Proxying Configuration

The plugin can be configured to either proxy frontend routes to Next.js or only provide API functionality.

#### Via WordPress Admin
1. Navigate to Settings → Hybrid Headless
2. Find the "Enable Frontend Proxy" setting
3. Check/uncheck the box to enable/disable route proxying
4. Save changes

#### Via WP-CLI
Enable route proxying:
```bash
wp hybrid-headless proxy enable
```

Disable route proxying:
```bash
wp hybrid-headless proxy disable
```

When proxying is disabled, the plugin will continue to provide API functionality but won't intercept and proxy frontend routes to Next.js. This is useful when you want to:
- Use the plugin only for its API capabilities
- Debug routing issues
- Temporarily disable frontend proxying without deactivating the entire plugin

### Advanced Configuration
Create a `hybrid-headless-config.php` file in your wp-content directory:

```php
define('HYBRID_HEADLESS_FRONTEND_URL', 'https://your-frontend.com');
define('HYBRID_HEADLESS_DEBUG', true);
define('HYBRID_HEADLESS_CACHE_TTL', 3600);
```

## Usage

### Route Handling
The plugin automatically handles routing based on the configured patterns:

```php
// Add custom frontend route
add_filter('hybrid_headless_frontend_routes', function($routes) {
    $routes['custom'] = '/custom-path/{slug}';
    return $routes;
});
```

### API Extensions
Add custom API endpoints:

```php
add_action('rest_api_init', function() {
    register_rest_route('hybrid-headless/v1', '/custom', [
        'methods' => 'GET',
        'callback' => 'your_custom_callback',
        'permission_callback' => '__return_true'
    ]);
});
```

### Frontend Integration
Example Next.js API call:

```javascript
const response = await fetch('${wordpressUrl}/wp-json/hybrid-headless/v1/products', {
    headers: {
        'Content-Type': 'application/json'
    }
});
```

## API Reference

All endpoints are prefixed with `/wp-json/hybrid-headless/v1/`

### Products API

#### List Products
`GET /products`

Query Parameters:
- `page` (integer, default: 1): Page number
- `per_page` (integer, default: 10): Items per page
- `category` (string, optional): Filter by category slug

Response:
```json
{
  "products": [
    {
      "id": 123,
      "name": "Product Name",
      "slug": "product-name",
      "price": "99.99",
      "regular_price": "129.99",
      "sale_price": "99.99",
      "stock_status": "instock",
      "stock_quantity": 10,
      "description": "Full description...",
      "short_description": "Short description...",
      "images": [
        {
          "id": 456,
          "src": "https://example.com/image.jpg",
          "alt": "Image description"
        }
      ],
      "categories": [
        {
          "id": 789,
          "name": "Category Name",
          "slug": "category-name"
        }
      ],
      "acf": {} // Custom fields if ACF is installed
    }
  ],
  "total": 100,
  "pages": 10
}
```

#### Get Single Product
`GET /products/{id}`
`GET /products/{slug}`

Response:
```json
{
  "id": 123,
  "name": "Product Name",
  "slug": "product-name",
  "price": "99.99",
  "regular_price": "129.99",
  "sale_price": "99.99",
  "stock_status": "instock",
  "stock_quantity": 10,
  "description": "Full description...",
  "short_description": "Short description...",
  "images": [
    {
      "id": 456,
      "src": "https://example.com/image.jpg",
      "alt": "Image description"
    }
  ],
  "categories": [
    {
      "id": 789,
      "name": "Category Name",
      "slug": "category-name"
    }
  ],
  "acf": {} // Custom fields if ACF is installed
}
```

### Categories API

#### List Categories
`GET /categories`

Response:
```json
[
  {
    "id": 789,
    "name": "Category Name",
    "slug": "category-name",
    "description": "Category description",
    "count": 15,
    "image": "https://example.com/category-image.jpg",
    "acf": {} // Custom fields if ACF is installed
  }
]
```

#### Get Single Category
`GET /categories/{slug}`

Response:
```json
{
  "id": 789,
  "name": "Category Name",
  "slug": "category-name",
  "description": "Category description",
  "count": 15,
  "image": "https://example.com/category-image.jpg",
  "acf": {} // Custom fields if ACF is installed
}
```

### Routes API

#### Get Available Routes
`GET /routes`

Response:
```json
{
  "frontend": {
    "home": "/",
    "trips": "/trips",
    "trip": "/trips/{slug}",
    "categories": "/categories",
    "category": "/categories/{slug}"
  },
  "wordpress": {
    "account": "/my-account",
    "checkout": "/checkout",
    "cart": "/cart",
    "login": "/wp-login.php",
    "admin": "/wp-admin"
  }
}
```

### Status API

#### Get API Status
`GET /status`

Response:
```json
{
  "status": "ok",
  "version": "1.2.1"
}
```

### Error Responses

All endpoints may return the following error responses:

#### 404 Not Found
```json
{
  "code": "not_found",
  "message": "Resource not found",
  "data": {
    "status": 404
  }
}
```

#### 400 Bad Request
```json
{
  "code": "bad_request",
  "message": "Invalid parameters",
  "data": {
    "status": 400,
    "params": ["invalid_parameter_name"]
  }
}
```

### Headers

#### Cache Control
The API uses various cache control headers depending on the endpoint:

- Product listings: `Cache-Control: public, max-age=300` (5 minutes)
- Single product: `Cache-Control: no-store, max-age=0` (for real-time stock)
- Categories: `Cache-Control: public, max-age=3600` (1 hour)
- Routes: `Cache-Control: public, max-age=86400` (24 hours)

#### CORS
The API supports CORS with the following headers:
```
Access-Control-Allow-Origin: [configured frontend URL]
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Authorization, Content-Type
```

### Authentication

The API supports standard WordPress authentication methods:

1. Cookie Authentication (for same-origin requests)
2. Application Passwords (for cross-origin requests)
3. JWT Authentication (if configured)

Example authenticated request:
```bash
curl -H "Authorization: Basic base64_encoded_credentials" \
     https://your-site.com/wp-json/hybrid-headless/v1/products
```

### Rate Limiting

The API implements WordPress's default rate limiting. Consider using caching for high-traffic scenarios.

### Extending the API

The API can be extended using WordPress filters:

```php
// Add custom data to product response
add_filter('hybrid_headless_product_data', function($data, $product) {
    $data['custom_field'] = get_post_meta($product->get_id(), 'custom_field', true);
    return $data;
}, 10, 2);
```

## Development

### Local Development Setup
1. Set up a local WordPress installation
2. Clone the plugin repository
3. Install dependencies:
   ```bash
   composer install
   ```
4. Run the development build:
   ```bash
   composer run build-dev
   ```

### Running Tests
```bash
composer run test
```

### Debugging
Enable debug mode in wp-config.php:
```php
define('HYBRID_HEADLESS_DEBUG', true);
```

Debug logs are stored in `wp-content/debug.log`

## Common Issues & Solutions

### CORS Issues
1. Verify your frontend URL is correctly set in the plugin settings
2. Check for any security plugins blocking API requests
3. Ensure proper headers are being sent from your frontend

### 404 Errors
1. Flush WordPress permalinks
2. Verify route patterns in plugin settings
3. Check .htaccess configuration

### Performance Issues
1. Enable object caching
2. Optimize database queries
3. Configure CDN for static assets

## Support & Contributing

### Getting Support
- Create an issue in the GitHub repository
- Check the [documentation](docs/README.md)
- Join our [community Slack](https://your-slack.com)

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `composer run test`
5. Submit a pull request

### Documentation
Full documentation is available in the [docs](docs/README.md) directory:
- [API Reference](docs/api.md)
- [Hooks Reference](docs/hooks.md)
- [Frontend Integration](docs/frontend.md)

## License
This project is licensed under the GPL v2 or later.

## Credits
Developed and maintained by [Your Company/Name]
Special thanks to all contributors!

## Changelog

### 1.0.0 (2024-01-01)
- Initial release
- Basic route handling
- WooCommerce integration
- Next.js asset serving

### 1.1.0 (2024-02-01)
- Added custom route patterns
- Improved caching
- Enhanced API responses

### 1.2.0 (2024-03-01)
- Updated route handling to include `/categories/`, `/category/`, `/trips/`, `/trip/`, `/route-descriptions/`, and `/` (root)
- Removed debugging code
- Improved documentation

### 1.2.1 (2024-03-02)
- Added proper handling of `/_next/` routes for Next.js static assets
- Improved 404 error handling
- Updated documentation for route handling
