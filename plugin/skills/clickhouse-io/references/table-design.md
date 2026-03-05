# ClickHouse — Table Design

## MergeTree (Most Common)

```sql
CREATE TABLE markets_analytics (
    date Date,
    market_id String,
    volume UInt64,
    trades UInt32,
    unique_traders UInt32,
    avg_trade_size Float64,
    created_at DateTime
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, market_id)
SETTINGS index_granularity = 8192;
```

## ReplacingMergeTree (Deduplication)

```sql
CREATE TABLE user_events (
    event_id String,
    user_id String,
    event_type String,
    timestamp DateTime,
    properties String
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (user_id, event_id, timestamp)
PRIMARY KEY (user_id, event_id);
```

## AggregatingMergeTree (Pre-aggregation)

```sql
CREATE TABLE market_stats_hourly (
    hour DateTime,
    market_id String,
    total_volume AggregateFunction(sum, UInt64),
    total_trades AggregateFunction(count, UInt32),
    unique_users AggregateFunction(uniq, String)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, market_id);

-- Query
SELECT hour, market_id,
    sumMerge(total_volume) AS volume,
    countMerge(total_trades) AS trades,
    uniqMerge(unique_users) AS users
FROM market_stats_hourly
WHERE hour >= toStartOfHour(now() - INTERVAL 24 HOUR)
GROUP BY hour, market_id
ORDER BY hour DESC;
```

## Partitioning & Ordering Key Rules

- Partition by time (month or day): `PARTITION BY toYYYYMM(date)`
- Avoid too many partitions (performance impact)
- Ordering key: most frequently filtered columns first, high cardinality first
- The ordering key drives compression — choose carefully

## Data Types

| Use | Instead of |
|-----|-----------|
| `LowCardinality(String)` | `String` for repeated values |
| `Enum8`/`Enum16` | `String` for categorical data |
| `UInt32` | `UInt64` when values fit |
| `Date` | `DateTime` for date-only partition keys |
