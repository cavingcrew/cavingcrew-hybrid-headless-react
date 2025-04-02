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

### Available Fields

#### Product Info
```plaintext
product.event_start_date_time - "2023-12-25 09:00:00"
product.event_finish_date_time 
product.event_type - "training", "overnight", etc.
product.event_trip_leader - "John Doe"
```

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
