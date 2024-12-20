# Hybrid WordPress + Next.js E-commerce Platform

## Project Structure

This repository contains both the frontend Next.js application and the WordPress plugin required for headless e-commerce functionality.

```
/hybrid-headless-front-end/     # Next.js TypeScript application
/hybrid-headless-react-plugin/  # WordPress plugin for headless integration
```

## Architecture Overview

This is a hybrid architecture combining WordPress/WooCommerce with Next.js to create a high-performance e-commerce platform. The system uses WordPress headlessly for specific routes while maintaining traditional WordPress functionality for authenticated user flows.

## Routing Architecture

### Overview
The application uses a sophisticated hybrid routing system that combines static routes with dynamic routing capabilities, all while maintaining a static export. Here's how it works:

### Route Structure

#### Static Routes
Pre-defined routes with dedicated page components:
```
/                   -> app/page.tsx
/trips             -> app/trips/page.tsx
/trips/[slug]      -> app/trips/[slug]/page.tsx
/categories        -> app/categories/page.tsx
/categories/[slug] -> app/categories/[slug]/page.tsx
```

#### Dynamic Parameters
Routes that use URL parameters:
- `[slug]` captures a single URL segment
- Example: `/trips/mountain-adventure` → `slug = "mountain-adventure"`

#### Catch-all Route
A fallback route that handles any undefined paths:
- Located at `app/[...slug]/page.tsx`
- Captures all segments of the URL
- Example: `/any/unknown/path` → `slug = ["any", "unknown", "path"]`

### Route Priority
Routes are matched in order of specificity:
1. Exact static routes (`/trips`, `/categories`)
2. Dynamic parameter routes (`/trips/[slug]`, `/categories/[slug]`)
3. Catch-all route (`[...slug]`)

This is configured in `next.config.js`:
```javascript
async rewrites() {
  return [
    { source: '/trips', destination: '/trips' },
    { source: '/trips/:slug', destination: '/trips/:slug' },
    { source: '/categories', destination: '/categories' },
    { source: '/categories/:slug', destination: '/categories/:slug' },
    { source: '/:path*', destination: '/:path*' }
  ];
}
```

### Routing Flow Examples

#### Frontend (Next.js) Routes

1. **Product Page Example** (`/trips/mountain-adventure`)
```
User requests /trips/mountain-adventure
↓
WordPress receives request
↓
Hybrid_Headless_Routes_Controller checks if it's a frontend route
↓
Matches '^trips/[^/]+/?' pattern, confirms it's a frontend route
↓
Serves static Next.js app (index.html)
↓
Next.js app boots up in browser
↓
Next.js client-side routing matches /trips/[slug]
↓
TripPage component renders
↓
Component fetches trip data from WordPress API
```

2. **Category Listing Example** (`/categories`)
```
User requests /categories
↓
WordPress receives request
↓
Hybrid_Headless_Routes_Controller checks if it's a frontend route
↓
Matches '^categories/?' pattern, confirms it's a frontend route
↓
Serves static Next.js app (index.html)
↓
Next.js app boots up in browser
↓
Next.js client-side routing matches /categories
↓
CategoriesPage component renders
↓
Component fetches categories data from WordPress API
```

#### WordPress Routes

1. **Checkout Example** (`/checkout`)
```
User requests /checkout
↓
WordPress receives request
↓
Hybrid_Headless_Routes_Controller checks if it's a frontend route
↓
No match found in frontend patterns
↓
WordPress handles request normally
↓
WooCommerce checkout page renders
↓
Traditional WordPress/WooCommerce functionality takes over
```

2. **My Account Example** (`/my-account`)
```
User requests /my-account
↓
WordPress receives request
↓
Hybrid_Headless_Routes_Controller checks if it's a frontend route
↓
No match found in frontend patterns
↓
WordPress handles request normally
↓
WooCommerce account page renders
↓
User authentication and account management handled by WordPress
```

3. **Admin Example** (`/wp-admin`)
```
User requests /wp-admin
↓
WordPress receives request
↓
Hybrid_Headless_Routes_Controller checks if it's a frontend route
↓
No match found in frontend patterns
↓
WordPress handles request normally
↓
WordPress login/admin interface renders
↓
Traditional WordPress admin functionality available
```

#### Client-Side Navigation

When navigating between frontend routes after initial load:
```
User clicks link to /trips/new-adventure
↓
Next.js intercepts click event
↓
Client-side routing handles navigation
↓
URL updates without full page reload
↓
New component renders
↓
Component fetches new data from WordPress API
↓
UI updates smoothly
```

This hybrid approach provides:
- Fast, app-like experience for content browsing
- Traditional WordPress functionality where needed
- Seamless transitions between modes
- Proper handling of authenticated routes

### Static Export

#### Configuration
The app is configured for static export in `next.config.js`:
```javascript
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};
```

#### Build Process
1. Run `npm run build` to generate static files
2. Output is created in the `out` directory
3. Files are copied to the WordPress plugin's `dist` directory
4. Plugin serves these static files for frontend routes

#### Deployment
The `deploy.sh` script handles the deployment process:
1. Builds the Next.js application
2. Copies build files to plugin directory
3. Syncs with WordPress server
4. Manages plugin activation/deactivation

### How It Works Together

1. **Initial Request**
   - User visits a URL (e.g., `/trips/mountain-adventure`)
   - WordPress plugin checks if it's a frontend route
   - If yes, serves the static Next.js app

2. **Client-Side Navigation**
   - Next.js router checks for matching static routes
   - If found, renders the corresponding page component
   - If not found, falls back to catch-all route

3. **Data Fetching**
   - Pages fetch data from WordPress REST API
   - API calls are made client-side using `apiService`
   - Loading and error states are handled by components

4. **Static Assets**
   - Images, scripts, and styles are served from `/dist/_next/`
   - WordPress plugin handles static file serving
   - Cache headers are set for optimal performance

### Development Workflow

1. **Local Development**
   ```bash
   npm run dev
   ```
   - Runs Next.js development server
   - Hot reloading enabled
   - API calls to WordPress backend

2. **Building for Production**
   ```bash
   npm run build
   ```
   - Generates static export
   - Creates optimized production build
   - Prepares files for WordPress plugin

3. **Deployment**
   ```bash
   npm run deploy
   ```
   - Runs build process
   - Syncs files with WordPress server
   - Manages plugin state

### Important Considerations

1. **SEO and Performance**
   - Static export provides excellent performance
   - Initial HTML is pre-rendered
   - Client-side navigation is smooth and fast

2. **API Integration**
   - All data fetching happens client-side
   - API responses should be fast for optimal UX
   - Consider implementing caching strategies

3. **Error Handling**
   - 404 pages for unknown routes
   - Loading states during data fetching
   - Error boundaries for component failures

4. **Browser Support**
   - Works in modern browsers
   - Requires JavaScript enabled
   - Consider polyfills if needed

## Frontend Features

### Components
- Built with TypeScript for type safety
- Uses Mantine UI framework
- Implements loading and error states
- Responsive design patterns

### Data Management
- Client-side data fetching
- Real-time stock updates
- Efficient caching strategies
- Type-safe API integration

## Backend Integration

The WordPress plugin provides:
- REST API endpoints for Next.js integration
- Custom route handling for hybrid setup
- Advanced Custom Fields (ACF) integration
- WooCommerce data exposure
- Cache control and optimization
- Authentication handling

## Development

### Frontend Development
```bash
cd hybrid-headless-front-end
npm install
npm run dev
```

### Plugin Development
The plugin should be installed in your WordPress development environment's plugins directory.

## Requirements

### Frontend
- Node.js 14+
- React 17+
- TypeScript 4+

### Backend
- PHP 7.4+
- WordPress 5.8+
- WooCommerce 5+
- Advanced Custom Fields PRO

## Security

The platform implements several security measures:
- API rate limiting
- CORS configuration
- Authentication tokens
- GDPR compliance
- Secure communication between frontend and backend

## Performance

The application is optimized for:
- Sub-1s initial page load
- Optimal Core Web Vitals
- Efficient stock level updates
- Browser-level caching
- API response caching

## Monitoring

The platform includes:
- Real-time performance metrics
- Error tracking
- User behavior analytics
- API performance monitoring

## Documentation

For detailed technical specifications and architecture decisions, see [spec.md](spec.md).
