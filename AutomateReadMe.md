# AutomateWoo Integration Guide

## Table of Contents
- [Order Event Date Trigger](#order-event-date-trigger)
- [Product Event Data Variable](#product-event-data-variable)
- [Trip Date Rules](#trip-date-rules)
- [Best Practices](#best-practices)

---

## Trigger, Rule, and Variable Registration

AutomateWoo components (Triggers, Rules, Variables) within this plugin are managed through the main `Hybrid_Headless_Addon` class (`hybrid-headless-automatewoo/includes/hybrid-headless-addon.php`). The addon uses standard AutomateWoo filter hooks for registration.

### 1. Triggers

-   **Registration Hook:** `automatewoo/triggers`
-   **Method:** `Hybrid_Headless_Addon::register_triggers()`
-   **Mechanism:** Adds entries to an array where the key is a unique trigger identifier (e.g., `hh_order_event_date`) and the value is the **fully qualified class name** (e.g., `HybridHeadlessAutomateWoo\Triggers\Order_Event_Date_Trigger`).
-   **Loading:** AutomateWoo uses the class name. The plugin's PSR-4 style autoloader (`Hybrid_Headless_Addon::autoload()`) converts the namespace and class name into a file path (e.g., `includes/triggers/order-event-date-trigger.php`) and includes the file. AutomateWoo then instantiates the class.

### 2. Rules

-   **Registration Hook:** `automatewoo/rules/includes`
-   **Method:** `Hybrid_Headless_Addon::register_rules()`
-   **Mechanism:** Adds entries to an array where the key is a unique rule identifier (e.g., `customer_last_trip_in_period`) and the value is the **absolute file path** to the rule's PHP file (e.g., `/path/to/wp-content/plugins/hybrid-headless-automatewoo/includes/rules/customer-last-trip-in-period.php`).
-   **Loading:** AutomateWoo includes the specified PHP file. Crucially, the rule file **must** end with `return new RuleClassName();`. AutomateWoo executes the included file and uses the returned rule object instance.

### 3. Variables

-   **Registration Hook:** `automatewoo/variables`
-   **Method:** `Hybrid_Headless_Addon::register_variables()`
-   **Mechanism:** Adds entries to a nested array. The top-level key is the data type (e.g., `product`), the second-level key is the variable name (e.g., `event_start_date`), and the value is the **fully qualified class name** (e.g., `HybridHeadlessAutomateWoo\Variables\ProductEventStartDate`).
-   **Loading:** Similar to triggers, AutomateWoo uses the class name, and the plugin's autoloader includes the corresponding file (e.g., `includes/variables/product-event-start-date.php`). AutomateWoo then instantiates the class.

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

These rules allow workflows to trigger based on a customer's trip history or upcoming trips, using the `event_start_date_time` meta field associated with products in their completed/processing orders.

Both rules now extend `AutomateWoo\Rules\Abstract_Date`, leveraging its built-in date comparison logic and UI fields.

### Customer - Last Trip Within Period (`customer_last_trip_in_period.php`)

-   **Functionality:** Checks if the customer's **most recent** trip (based on the latest `event_start_date_time` from their orders) occurred within a specified past time frame.
-   **UI Fields:** Uses the standard `Abstract_Date` "past" comparison fields (e.g., "is within the last", "is before", "is after"). You select the comparison type and specify the number of days/weeks/months.
-   **Example Use Case:** Send a "We miss you" email if the customer's last trip was more than 6 months ago.
    ```plaintext
    Rule: Customer - Last Trip Within Period | is before | 6 | Months ago
    ```

### Customer - Has Upcoming Trip Within Period (`customer_has_upcoming_trip.php`)

-   **Functionality:** Checks if the customer's **next upcoming** trip (based on the soonest future `event_start_date_time` from their orders) is scheduled within a specified future time frame.
-   **UI Fields:** Uses the standard `Abstract_Date` "future" comparison fields (e.g., "is within the next", "is after"). You select the comparison type and specify the number of days/weeks/months.
-   **Example Use Case:** Send a pre-trip preparation email 7 days before their next trip.
    ```plaintext
    Rule: Customer - Has Upcoming Trip Within Period | is within the next | 7 | Days
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
