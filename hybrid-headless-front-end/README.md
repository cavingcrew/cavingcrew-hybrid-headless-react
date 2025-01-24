# Hybrid WordPress + Next.js E-commerce Platform

## Updated Architecture Highlights

### Key Changes from Previous Version:
1. Unified authentication through WordPress session cookies
2. Real-time user status checks via `/user-status` endpoint
3. Hybrid cart management with WooCommerce session integration
4. Enhanced security with same-origin cookie policies
5. Simplified API authentication using WordPress credentials

## Updated Routing Architecture

### Authentication Flow
```
Next.js App → WordPress API (/user-status)
           ↖︎ WordPress Session Cookie
           
1. User visits Next.js page
2. Next.js calls /user-status endpoint with credentials: 'include'
3. WordPress checks authentication cookies
4. Returns user status including:
   - Login state
   - Membership status
   - Cart contents count
5. Next.js adapts UI based on auth state

### Cart Management Flow
```
Next.js → POST /cart → WordPress
                   ↖︎ Manages cart through WooCommerce session
                   
- Uses native WooCommerce cart functionality
- Maintains cart state through WordPress sessions
- Automatic cookie handling through same-origin policy

## Updated API Endpoints

### New Core Endpoints
`GET /hybrid-headless/v1/user-status`
```json
{
  "isLoggedIn": true,
  "isMember": false,
  "cartCount": 3
}
```

`POST /hybrid-headless/v1/cart`
```json
{
  "product_id": 123,
  "variation_id": 456,
  "quantity": 1
}
```

## Updated Security Implementation

### Key Security Features:
1. **Same-Origin Cookie Policy**
   - Cookies set to `.cavingcrew.com` domain
   - Secure/HttpOnly flags enabled
   - SameSite=Lax policy

2. **CORS Configuration**
```php
// WordPress CORS headers
header('Access-Control-Allow-Origin: [frontend URL]');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Credentials: true');
```

3. **Authentication Flow**
   - No JWT tokens required
   - Uses native WordPress authentication cookies
   - Automatic credential handling through same-origin requests

## Updated Frontend Integration

### Key Client-Side Patterns
1. User Status Checking
```typescript
const { data: userStatus } = useQuery({
  queryKey: ['userStatus'],
  queryFn: () => apiService.getUserStatus(),
  refetchInterval: 30000 // Refresh every 30 seconds
});
```

2. Cart Management
```typescript
const handleAddToCart = async () => {
  await apiService.addToCart(productId, variationId);
  window.location.href = '/cart'; // Native WooCommerce cart
};
```

## Updated Performance Considerations

1. **Caching Strategy**
   - User status: 30-second client-side polling
   - Product data: 5-minute API cache
   - Stock levels: Real-time updates with 30-second polling

2. **Critical Security Headers**
```php
// In products controller
header('Cache-Control: no-store, max-age=0');
header('Pragma: no-cache');
```

## Updated Project Structure Highlights

### Key Additions
```
/hybrid-headless-front-end/
  ├── lib/
  │   ├── api-service.ts      # Updated with auth handling
  │   └── hooks/
  │       └── useTrips.ts     # Real-time stock monitoring
  └── components/
      └── trips/
          └── TripSignupWidget.tsx # Integrated auth checks

/hybrid-headless-react-plugin/
  └── includes/api/
      ├── class-rest-api.php       # User status endpoint
      └── class-products-controller.php # Cart integration
```

## Updated Deployment Notes

### Required WordPress Configuration
```php
// wp-config.php additions
define('COOKIE_DOMAIN', '.cavingcrew.com');
define('COOKIE_SECURE', true);
define('COOKIE_HTTPONLY', true);
define('COOKIE_SAMESITE', 'Lax');
```

### NGINX Proxy Configuration
```nginx
# Ensure cookie passing to Next.js
proxy_cookie_domain ~\.cavingcrew.com $host;
```
