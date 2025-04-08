# AutomateWoo Integration Guide

## Table of Contents
- [Order Event Date Trigger](#order-event-date-trigger)
- [Product Event Data Variable](#product-event-data-variable)
- [Trip Date Rules](#trip-date-rules)
- [Best Practices](#best-practices)

---

## Trigger Registration and Loading

AutomateWoo triggers within this plugin are managed through the main `Hybrid_Headless_Addon` class (`hybrid-headless-automatewoo/includes/hybrid-headless-addon.php`).

1.  **Registration:** Triggers are registered using the `automatewoo/triggers` filter hook within the `Hybrid_Headless_Addon::register_triggers()` method. Each trigger is added to an array where the key is a unique identifier (e.g., `hh_order_event_date`) and the value is the fully qualified class name (e.g., `HybridHeadlessAutomateWoo\Triggers\Order_Event_Date_Trigger`).
2.  **Autoloading:** When AutomateWoo needs to load a specific trigger (either in the admin UI or during workflow execution), it uses the registered class name. The plugin's autoloader (`Hybrid_Headless_Addon::autoload()`) intercepts requests for classes within the `HybridHeadlessAutomateWoo` namespace. It converts the class name into a file path (e.g., `HybridHeadlessAutomateWoo\Triggers\Order_Event_Date_Trigger` becomes `includes/triggers/order-event-date-trigger.php`) and includes the corresponding file.
3.  **Instantiation:** AutomateWoo then instantiates the trigger class. The trigger's `init()` method sets up basic details like title and description, `load_fields()` defines any UI options, and `register_hooks()` (for non-batched triggers) tells AutomateWoo which WordPress actions or filters the trigger should listen to. For batched triggers like `Order_Event_Date_Trigger`, the process involves `get_batch_for_workflow` and `process_item_for_workflow`.

See `Test_Trigger` (`includes/triggers/test-trigger.php`) for a basic example of a trigger listening to a custom action.

---

## Order Event Date Trigger

### Overview
Triggers workflows based on proximity to event dates associated with products within customer orders. This is useful for sending pre-event reminders or post-event follow-ups. It extends AutomateWoo's `AbstractBatchedDailyTrigger`, meaning it runs once daily to find matching orders.

### Implementation Details (`includes/triggers/order-event-date-trigger.php`)
- **Registration:** Registered in `Hybrid_Headless_Addon::register_triggers` with the key `hh_order_event_date`.
- **Configuration Fields:** The `load_fields()` method defines the UI options seen in the workflow editor:
    - `When`: Select 'Before' or 'After' the event date.
    - `Time Unit`: Choose 'Days' or 'Hours'.
    - `Time Amount`: Specify the number of days or hours.
- **Batch Processing:**
    - `get_batch_for_workflow()`: Runs daily. It calculates a target date/time based on the workflow's settings (e.g., 3 days before now) and queries the database for order items linked to products whose `event_start_date_time` meta field falls within a narrow window around that target time. It returns an array of matching `order_id`s.
    - `process_item_for_workflow()`: AutomateWoo calls this method for each `order_id` found in the batch. It fetches the full `WC_Order` object, the associated `AutomateWoo\Customer`, and the primary product from the order. It then calls `$workflow->maybe_run()` with this data.
- **Validation:** The `validate_workflow()` method performs final checks before execution, ensuring the order and product exist and preventing duplicate runs for the same order within a short timeframe.
- **Data Available:** Provides `order`, `customer`, and `product` data items to the workflow actions.

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
