# Event Creation API Endpoint

This document explains the `/hybrid-headless/v1/products/create-event` API endpoint used to create new event products in WooCommerce by duplicating template products.

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [API Usage](#api-usage)
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
- [Extending the Endpoint](#extending-the-endpoint)
- [Troubleshooting](#troubleshooting)

## Overview

This endpoint allows authorized users to create new event products by cloning predefined templates. It handles:

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

## API Usage

### Authentication
Requires WooCommerce API Key authentication with `manage_woocommerce` capability.

**Required Headers:**
 ```http                                                                                                                                                                                                                           
 Authorization: Basic BASE64_ENCODED(API_KEY:SECRET)                                                                                                                                                                               
 Content-Type: application/json                                                                                                                                                                                                    
                                                                                                                                                                                                                                   

                                                                                                        Request Parameters                                                                                                         

                                                                                                                    
  Parameter               Type       Required   Description                  Example                                   
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
  event_type              string     Yes        Template type to use         giggletrip, overnight, tuesday, training  
  event_start_date_time   datetime   Yes        Event start time in UTC      2024-12-25 18:30:00                       
  event_name              string     Yes        Display name for the event   Christmas Special GiggleTrip              
                                                                                                                       

                                                                                                         Example Requests                                                                                                          

cURL Example:                                                                                                                                                                                                                      

                                                                                                                                                                                                                                   
 curl -X POST https://yoursite.com/wp-json/hybrid-headless/v1/products/create-event \                                                                                                                                              
   -H "Content-Type: application/json" \                                                                                                                                                                                           
   -H "Authorization: Basic YOUR_API_KEYS_BASE64" \                                                                                                                                                                                
   -d '{                                                                                                                                                                                                                           
     "event_type": "giggletrip",                                                                                                                                                                                                   
     "event_start_date_time": "2024-12-25 18:30:00",                                                                                                                                                                               
     "event_name": "Christmas Special GiggleTrip"                                                                                                                                                                                  
   }'                                                                                                                                                                                                                              
                                                                                                                                                                                                                                   

JavaScript Example:                                                                                                                                                                                                                

                                                                                                                                                                                                                                   
 async function createEvent() {                                                                                                                                                                                                    
   const response = await fetch('/wp-json/hybrid-headless/v1/products/create-event', {                                                                                                                                             
     method: 'POST',                                                                                                                                                                                                               
     headers: {                                                                                                                                                                                                                    
       'Content-Type': 'application/json',                                                                                                                                                                                         
       'Authorization': 'Basic YOUR_API_KEYS_BASE64'                                                                                                                                                                               
     },                                                                                                                                                                                                                            
     body: JSON.stringify({                                                                                                                                                                                                        
       event_type: 'giggletrip',                                                                                                                                                                                                   
       event_start_date_time: '2024-12-25 18:30:00',                                                                                                                                                                               
       event_name: 'Christmas Special GiggleTrip'                                                                                                                                                                                  
     })                                                                                                                                                                                                                            
   });                                                                                                                                                                                                                             
                                                                                                                                                                                                                                   
   return response.json();                                                                                                                                                                                                         
 }                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                   

                                                                                                        Response Structure                                                                                                         

Success Response (200 OK):                                                                                                                                                                                                         

                                                                                                                                                                                                                                   
 {                                                                                                                                                                                                                                 
   "product_id": 12345,                                                                                                                                                                                                            
   "edit_url": "https://yoursite.com/wp-admin/post.php?post=12345&action=edit"                                                                                                                                                     
 }                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                   

Error Response (4xx/5xx):                                                                                                                                                                                                          

                                                                                                                                                                                                                                   
 {                                                                                                                                                                                                                                 
   "code": "invalid_template",                                                                                                                                                                                                     
   "message": "Invalid event type",                                                                                                                                                                                                
   "data": {                                                                                                                                                                                                                       
     "status": 400                                                                                                                                                                                                                 
   }                                                                                                                                                                                                                               
 }                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                   

                                                                                                          Error Handling                                                                                                           

                                                                  
  HTTP Code   Error Code         Description                      
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
  400         invalid_template   Invalid event_type parameter           
  400         invalid_date       Malformed event_start_date_time        
  401         unauthorized       Missing/invalid API credentials        
  403         forbidden          Insufficient permissions               
  500         product_creation   Internal server error during creation  
                                                                        


                                                                                                      Implementation Details                                                                                                       

                                                                                                          Template System                                                                                                          

Templates are defined in the $template_map array:                                                                                                                                                                                  

                                                                                                                                                                                                                                   
 [                                                                                                                                                                                                                                 
   'giggletrip' => 11579,                                                                                                                                                                                                          
   'overnight' => 11583,                                                                                                                                                                                                           
   'tuesday' => 11576,                                                                                                                                                                                                             
   'training' => 123                                                                                                                                                                                                               
 ]                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                   

To add a new template:                                                                                                                                                                                                             

 1 Create a new WooCommerce product with desired configuration                                                                                                                                                                     
 2 Add its ID to the template map                                                                                                                                                                                                  
 3 Ensure it contains all required ACF fields                                                                                                                                                                                      

                                                                                                    Product Duplication Process                                                                                                    

 1 Clone template product                                                                                                                                                                                                          
 2 Generate unique SKU with pattern: YYYY-MM-DD-templateSKU-uniqid                                                                                                                                                                 
 3 Update core product fields:                                                                                                                                                                                                     
    • Name                                                                                                                                                                                                                         
    • Slug                                                                                                                                                                                                                         
    • Status (set to draft)                                                                                                                                                                                                        
 4 Update ACF fields:                                                                                                                                                                                                              
    • event_start_date_time                                                                                                                                                                                                        
    • event_type                                                                                                                                                                                                                   
 5 Copy membership discounts                                                                                                                                                                                                       

                                                                                                       Membership Discounts                                                                                                        

The endpoint handles WooCommerce Memberships integration by:                                                                                                                                                                       

 1 Copying _memberships_discount meta values                                                                                                                                                                                       
 2 Replicating membership plan associations                                                                                                                                                                                        
 3 Preserving discount amounts/types                                                                                                                                                                                               


                                                                                                      Security Considerations                                                                                                      

 • API Key Validation: Uses WooCommerce's built-in authentication                                                                                                                                                                  
 • Input Sanitization:                                                                                                                                                                                                             
    • Event names are sanitized with sanitize_text_field                                                                                                                                                                           
    • Dates are validated with PHP DateTime                                                                                                                                                                                        
    • URLs are escaped with esc_url_raw                                                                                                                                                                                            
 • Capability Checks: Requires manage_woocommerce capability                                                                                                                                                                       
 • Nonce Verification: Handled by WooCommerce API layer                                                                                                                                                                            


                                                                                                      Extending the Endpoint                                                                                                       

1. Adding New Templates:                                                                                                                                                                                                           

                                                                                                                                                                                                                                   
 // In create_event_product() method                                                                                                                                                                                               
 $template_map['new_type'] = NEW_TEMPLATE_ID;                                                                                                                                                                                      
                                                                                                                                                                                                                                   

2. Additional Validations:                                                                                                                                                                                                         

                                                                                                                                                                                                                                   
 // In get_event_creation_args()                                                                                                                                                                                                   
 'custom_field' => [                                                                                                                                                                                                               
   'validate_callback' => function($param) {                                                                                                                                                                                       
     return isValidCustomField($param);                                                                                                                                                                                            
   }                                                                                                                                                                                                                               
 ]                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                   

3. Post-Creation Hooks:                                                                                                                                                                                                            

                                                                                                                                                                                                                                   
 // After product creation                                                                                                                                                                                                         
 do_action('hybrid_headless_event_created', $new_product_id, $request);                                                                                                                                                            
                                                                                                                                                                                                                                   


                                                                                                          Troubleshooting                                                                                                          

Common Issues:                                                                                                                                                                                                                     

 1 "Invalid template" Error                                                                                                                                                                                                        
    • Verify template product exists and is published                                                                                                                                                                              
    • Check template map contains correct IDs                                                                                                                                                                                      
 2 Membership Discounts Not Copied                                                                                                                                                                                                 
    • Ensure WooCommerce Memberships is active                                                                                                                                                                                     
    • Verify template product has discounts configured                                                                                                                                                                             
 3 ACF Fields Missing                                                                                                                                                                                                              
    • Confirm ACF field names match exactly                                                                                                                                                                                        
    • Check field group is assigned to products                                                                                                                                                                                    
 4 Draft Not Created                                                                                                                                                                                                               
    • Check user has publish_products capability                                                                                                                                                                                   
    • Verify no PHP errors during creation                                                                                                                                                                                         

Debugging Tips:                                                                                                                                                                                                                    

 • Check WooCommerce error logs                                                                                                                                                                                                    
 • Temporarily enable WP_DEBUG                                                                                                                                                                                                     
 • Test with Postman/Insomnia for detailed response                                                                                                                                                                                

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

▌ Note: Always test new event creation in a staging environment before production use. New products are created in draft state - remember to publish them manually when ready.                                                   

                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                   
 This documentation provides junior developers with both high-level understanding and practical implementation details while emphasizing security and best practices.                                                              
                                                                                                                                                                                                                                   

