# Event Creation API Endpoints

This document explains the API endpoints used to create new event products in WooCommerce by duplicating template products.

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [API Endpoints](#api-endpoints)
  - [V1 Endpoint (Server-to-Server)](#v1-endpoint-server-to-server)
  - [V2 Endpoint (Client-to-Server)](#v2-endpoint-client-to-server)
- [Authentication](#authentication)
- [Request Parameters](#request-parameters)
- [Example Requests](#example-requests)
- [Response Structure](#response-structure)
- [Error Handling](#error-handling)
- [Implementation Details](#implementation-details)
  - [Template System](#template-system)
  - [Product Duplication Process](#product-duplication-process)
  - [Membership Discounts](#membership-discounts)
- [Security Considerations](#security-considerations)
- [Extending the Endpoints](#extending-the-endpoints)
- [Troubleshooting](#troubleshooting)

## Overview

These endpoints allow authorized users to create new event products by cloning predefined templates. They handle:

- Product duplication
- Metadata/ACF field updates
- Membership discount rules copying
- Inventory/SKU management
- Draft state initialization

## Key Features

1. **Template-based** - Uses predefined WooCommerce products as templates
2. **WooCommerce Memberships Integration** - Copies membership discount rules automatically
3. **Draft State** - New products are created as drafts for final review
4. **ACF Support** - Handles Advanced Custom Fields updates
5. **Automatic SKU Generation** - Creates unique SKUs to prevent conflicts

## API Endpoints

There are two endpoints available for creating events, each with different authentication methods:

### V1 Endpoint (Server-to-Server)

- **URL**: `/wp-json/wc-hybrid-headless/v1/products/create-event`
- **Authentication**: WooCommerce API Key with `manage_woocommerce` capability
- **Use Case**: Server-to-server API calls, automation scripts, CLI tools

### V2 Endpoint (Client-to-Server)

- **URL**: `/wp-json/hybrid-headless/v1/products/create-event`
- **Authentication**: WordPress cookie-based authentication
- **Use Case**: Browser-based applications, admin dashboards, frontend forms

## Authentication

### V1 Endpoint (Server-to-Server)
Requires WooCommerce API Key authentication with `manage_woocommerce` capability.

**Required Headers:**
```http
Authorization: Basic BASE64_ENCODED(API_KEY:SECRET)
Content-Type: application/json
```

### V2 Endpoint (Client-to-Server)
Uses WordPress cookie-based authentication. The user must be logged in with appropriate permissions:
- WordPress administrators
- Shop managers
- Committee members (users with valid committee_current user meta)

**Required Headers:**
```http
Content-Type: application/json
```

## Request Parameters

| Parameter             | Type     | Required | Description                | Example                                 |
|-----------------------|----------|----------|----------------------------|----------------------------------------|
| event_type            | string   | Yes      | Template type to use       | giggletrip, overnight, tuesday, training |
| event_start_date_time | datetime | Yes      | Event start time in UTC    | 2024-12-25 18:30:00                     |
| event_name            | string   | Yes      | Display name for the event | Christmas Special GiggleTrip            |

## Example Requests

### V1 Endpoint (Server-to-Server)

**cURL Example:**
```bash
curl -X POST https://yoursite.com/wp-json/wc-hybrid-headless/v1/products/create-event \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_API_KEYS_BASE64" \
  -d '{
    "event_type": "giggletrip",
    "event_start_date_time": "2024-12-25 18:30:00",
    "event_name": "Christmas Special GiggleTrip"
  }'
```

### V2 Endpoint (Client-to-Server)

**JavaScript Example:**
```javascript
async function createEvent() {
  // This assumes the user is already logged in to WordPress
  const response = await fetch('/wp-json/hybrid-headless/v1/products/create-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // No Authorization header needed - uses WordPress cookies
    },
    // Include credentials to send cookies
    credentials: 'same-origin',
    body: JSON.stringify({
      event_type: 'giggletrip',
      event_start_date_time: '2024-12-25 18:30:00',
      event_name: 'Christmas Special GiggleTrip'
    })
  });
  
  return response.json();
}
```

**React Example with Fetch:**
```javascript
import { useState } from 'react';

function EventCreationForm() {
  const [eventData, setEventData] = useState({
    event_type: 'giggletrip',
    event_start_date_time: '',
    event_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/wp-json/hybrid-headless/v1/products/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(eventData)
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields here */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Event'}
      </button>
      
      {result && (
        <div>
          {result.product_id ? (
            <p>Event created successfully! ID: {result.product_id}</p>
          ) : (
            <p>Error: {result.message || result.error}</p>
          )}
        </div>
      )}
    </form>
  );
}
```

## Response Structure

### Success Response (200 OK):

```json
{
  "product_id": 12345,
  "edit_url": "https://yoursite.com/wp-admin/post.php?post=12345&action=edit",
  "event_type": "giggletrip",
  "event_start_date_time": "2024-12-25 18:30:00",
  "event_name": "Christmas Special GiggleTrip",
  "created_at": "2024-03-14 15:30:45",
  "status": "draft"
}
```

### Error Response (4xx/5xx):

```json
{
  "code": "invalid_template",
  "message": "Invalid event type",
  "data": {
    "status": 400
  }
}
```

## Error Handling

| HTTP Code | Error Code         | Description                      |
|-----------|-------------------|----------------------------------|
| 400       | invalid_template  | Invalid event_type parameter     |
| 400       | invalid_date      | Malformed event_start_date_time  |
| 401       | rest_not_logged_in | User not logged in (V2 endpoint) |
| 401       | unauthorized      | Missing/invalid API credentials (V1 endpoint) |
| 403       | rest_forbidden    | Insufficient permissions         |
| 500       | creation_failed   | Internal server error during creation |

## Implementation Details

### Template System

Templates are defined in the $template_map array:

```php
[
  'giggletrip' => 11579,
  'overnight' => 11583,
  'tuesday' => 11576,
  'training' => 123,
  'horizontal_training' => 12759,
  'basic_srt' => 12758,
  'known_location' => 11595,
  'mystery' => 11576
]
```

To add a new template:
1. Create a new WooCommerce product with desired configuration
2. Add its ID to the template map
3. Ensure it contains all required ACF fields

### Product Duplication Process

1. Clone template product
2. Generate unique SKU with pattern: YYYY-MM-DD-templateSKU-uniqid
3. Update core product fields:
   - Name
   - Slug
   - Status (set to draft)
4. Update ACF fields:
   - event_start_date_time
   - event_type
5. Copy membership discounts
6. Store creator's user ID as post meta

### Membership Discounts

The endpoint handles WooCommerce Memberships integration by:

1. Copying _memberships_discount meta values
2. Replicating membership plan associations
3. Preserving discount amounts/types

## Security Considerations

### V1 Endpoint (Server-to-Server)
- API Key Validation: Uses WooCommerce's built-in authentication
- Capability Checks: Requires manage_woocommerce capability

### V2 Endpoint (Client-to-Server)
- WordPress Authentication: Uses WordPress cookie-based authentication
- Role-Based Access Control: Checks for administrator, shop manager, or committee member status
- CSRF Protection: Handled by WordPress REST API nonce verification

### Both Endpoints
- Input Sanitization:
  - Event names are sanitized with sanitize_text_field
  - Dates are validated with PHP DateTime
  - URLs are escaped with esc_url_raw
- Logging: Records user ID for audit trail

## Extending the Endpoints

1. Adding New Templates:

```php
// In create_event_product_core() method
$template_map['new_type'] = NEW_TEMPLATE_ID;
```

2. Additional Validations:

```php
// In get_event_creation_args()
'custom_field' => [
  'validate_callback' => function($param) {
    return isValidCustomField($param);
  }
]
```

3. Post-Creation Hooks:

```php
// After product creation
do_action('hybrid_headless_event_created', $new_product_id, $request);
```

## Troubleshooting

Common Issues:

1. **"Invalid template" Error**
   - Verify template product exists and is published
   - Check template map contains correct IDs

2. **Authentication Failures**
   - For V1: Verify API key has manage_woocommerce capability
   - For V2: Ensure user is logged in and has appropriate role

3. **Membership Discounts Not Copied**
   - Ensure WooCommerce Memberships is active
   - Verify template product has discounts configured

4. **ACF Fields Missing**
   - Confirm ACF field names match exactly
   - Check field group is assigned to products

5. **Draft Not Created**
   - Check user has publish_products capability
   - Verify no PHP errors during creation

Debugging Tips:

- Check WooCommerce error logs
- Temporarily enable WP_DEBUG
- Test with Postman/Insomnia for detailed response

---

> **Note:** Always test new event creation in a staging environment before production use. New products are created in draft state - remember to publish them manually when ready.

This documentation provides developers with both high-level understanding and practical implementation details while emphasizing security and best practices.

