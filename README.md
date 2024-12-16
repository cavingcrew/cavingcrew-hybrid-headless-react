# Hybrid WordPress + Next.js E-commerce Platform

## Project Structure

This repository contains both the frontend Next.js application and the WordPress plugin required for headless e-commerce functionality.

```
/frontend/    # Next.js TypeScript application
/plugin/      # WordPress plugin for headless integration
```

## Architecture Overview

This is a hybrid architecture combining WordPress/WooCommerce with Next.js to create a high-performance e-commerce platform. The system uses WordPress headlessly for specific routes while maintaining traditional WordPress functionality for authenticated user flows.

### Frontend (Next.js)

Located in `/frontend/`, this TypeScript-based Next.js application handles:
- Static generation of product pages
- Client-side data fetching for dynamic content
- Public-facing routes only:
  - Homepage (/)
  - Product listings (/trips/*)
  - Product category pages
  - Selected static content pages

Key features:
- Built with TypeScript for type safety
- Uses Next.js for static and server-side rendering
- Implements Incremental Static Regeneration (ISR) for product updates
- Handles real-time stock level updates
- Optimized for Core Web Vitals

### Backend (WordPress Plugin)

Located in `/plugin/`, this custom WordPress plugin provides:
- REST API endpoints for Next.js integration
- Custom route handling for hybrid setup
- Advanced Custom Fields (ACF) integration
- WooCommerce data exposure
- Cache control and optimization
- Authentication handling

## Deployment

The project is designed to be deployed as follows:

1. Frontend:
   - Built using `npm run build` in the `/frontend` directory
   - Deployed to static hosting (Vercel/Netlify)
   - Configured for optimal caching and performance

2. Plugin:
   - Installed on WordPress instance
   - Configured for headless operation
   - Optimized for API performance

## Route Architecture

The platform uses a hybrid routing approach:

### Next.js Handled Routes (Public)
- Homepage (/)
- Product listings (/trips/*)
- Product category pages
- Static content pages

### WordPress Handled Routes (Traditional)
- /my-account/*
- /checkout/*
- /basket/*
- /wp-admin/*
- All authenticated user flows

## Development

### Frontend Development
```bash
cd frontend
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
