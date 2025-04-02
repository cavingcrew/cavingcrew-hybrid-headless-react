# AutomateWoo Integration Guide

## Table of Contents
- [Order Event Date Trigger](#order-event-date-trigger)
- [Product Event Data Variable](#product-event-data-variable)
- [Best Practices](#best-practices)

---

## Order Event Date Trigger

### Overview
Triggers workflows based on proximity to event dates from ordered products. Useful for pre-event reminders and post-event follow-ups.

### Configuration
1. **Trigger Setup:**
   - Select workflows → Add Trigger → "Order Event Date"
2. **Options:**
   - Direction: Before/After event
   - Units: Days or Hours
   - Amount: Number of time units
3. **Data Available:**
   - Order details
   - Customer info
   - Event product data

### Example Workflows
- "3 Day Pre-Event Reminder":
  - Trigger: 3 days before event_start_date_time
  - Action: Send email with event details
- "Post-Event Survey":
  - Trigger: 1 day after event_finish_date_time 
  - Action: Send feedback request email

---

## Product Event Data Variable

### Access Syntax
Use dot notation to navigate nested data:
```plaintext
{{ product_event_data.field.subfield }}
```

## Date Formatting Variables

### Product Event Start Date
```plaintext
{{ product_event_start_date }} // Raw value: 2023-12-25 09:00:00
{{ product_event_start_date format="site" }} // 25/12/2023
{{ product_event_start_date format="d/m/Y H:i" }} // 25/12/2023 09:00
{{ product_event_start_date modify="+3 days" }} // 2023-12-28 09:00:00
```

### Product Event Finish Date  
```plaintext
{{ product_event_finish_date format="mysql" }} // 2023-12-26 17:00:00
{{ product_event_finish_date format="F j, Y" }} // December 26, 2023
```

**Format Parameters:**
- `format`: Choose from:
  - `mysql` - Default database format
  - `site` - WordPress settings format
  - `custom` - Use with `custom-format` parameter
- `custom-format`: PHP date format (e.g. "Y-m-d H:i")
- `modify`: Time modifier (e.g. "+3 days", "-1 hour")

---

## Existing Product Event Data Variable
Still available for raw data access:
```plaintext
{{ product_event_data.product.event_start_date_time }} // 2023-12-25T09:00:00+00:00
{{ product_event_data.product.event_finish_date_time }} // 2023-12-26T17:00:00+00:00
{{ product_event_data.product.event_type }} // "training", "overnight", etc.
{{ product_event_data.product.event_trip_leader }} // "John Doe"
```

Use the dedicated date variables for formatted dates in emails and messages.

#### Route Details
```plaintext
route.name - "Giant's Hole Main Route"
route.entrance.coordinates - "53.123,-1.456" 
route.difficulty.claustrophobia - 3 
route.difficulty.wetness - 2
```

#### Hut Facilities  
```plaintext
hut.name - "Peak Cavern Hut"
hut.capacity - "12"
hut.parking.instructions - "Park in layby, 5 min walk"
hut.facilities - ["Kitchen", "Showers", "Bunks"]
```

---

## Trip Date Rules

### Customer - Last Trip Within Time Period
Checks if the customer's most recent completed trip started within a specified time period.

**Parameters:**
- Time Amount: Number of units (e.g. 30)
- Time Unit: Days/Weeks/Months

**Example:**
```plaintext
If Customer's last trip started within the last 6 months
→ Send re-engagement email
```

### Customer - Has Upcoming Trip Within Time Period
Checks if the customer has any trips starting within a specified future window.

**Parameters:**
- Time Amount: Number of units (e.g. 14)
- Time Unit: Days/Weeks/Months

**Example:**
```plaintext
If Customer has trip starting in next 7 days
→ Send pre-trip preparation guide
```

## Best Practices

1. **Time Zones:**  
   All dates use WordPress configured timezone.

2. **Fallbacks for Empty Values:**
   ```plaintext
   {{ product_event_data.route.name | default: "The Adventure" }}
   ```

3. **Testing:**  
   - Verify trigger timing with test orders
   - Check variable output in workflow preview

4. **Performance:**  
   - Heavy use of product_event_data may impact performance
   - Consider caching for complex workflows

For support, contact tech@climbingclan.com.
