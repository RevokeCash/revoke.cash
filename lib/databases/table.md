Clickhousedb table for tracking page views

```sql
CREATE TABLE page_view (
    event_date Date DEFAULT today(),                -- Stores the date of the event, defaulting to the current date
    event_date_time DateTime DEFAULT now(),         -- Timestamp of the event
    path String,                                    -- Path of the page
    affiliate String,                                -- Affiliate identifier
    referrer String,                                -- URL of the referrer
    agent String,                                   -- User agent of the client
    hostname String                                 -- Hostname where the event was recorded
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, event, customer, source);     -- Adjust the ORDER BY clause based on your query patterns
```
