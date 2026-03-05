# ClickHouse — Data Ingestion

## Bulk Insert (Recommended)

```typescript
import { ClickHouse } from 'clickhouse'

const clickhouse = new ClickHouse({
  url: process.env.CLICKHOUSE_URL,
  port: 8123,
  basicAuth: {
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD
  }
})

// GOOD: Batch insert
async function bulkInsertTrades(trades: Trade[]) {
  const values = trades.map(t =>
    `('${t.id}', '${t.market_id}', '${t.user_id}', ${t.amount}, '${t.timestamp.toISOString()}')`
  ).join(',')

  await clickhouse.query(`
    INSERT INTO trades (id, market_id, user_id, amount, timestamp)
    VALUES ${values}
  `).toPromise()
}

// BAD: Individual inserts (never in a loop)
async function insertTrade(trade: Trade) {
  await clickhouse.query(`INSERT INTO trades VALUES ('${trade.id}', ...)`).toPromise()
}
```

## Streaming Insert

```typescript
async function streamInserts() {
  const stream = clickhouse.insert('trades').stream()
  for await (const batch of dataSource) {
    stream.write(batch)
  }
  await stream.end()
}
```

## Materialized Views (Real-time Aggregations)

```sql
-- Step 1: Create target table
CREATE TABLE market_stats_hourly (
    hour DateTime,
    market_id String,
    total_volume AggregateFunction(sum, UInt64),
    total_trades AggregateFunction(count, UInt32),
    unique_users AggregateFunction(uniq, String)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, market_id);

-- Step 2: Create materialized view feeding into it
CREATE MATERIALIZED VIEW market_stats_hourly_mv
TO market_stats_hourly
AS SELECT
    toStartOfHour(timestamp) AS hour,
    market_id,
    sumState(amount) AS total_volume,
    countState() AS total_trades,
    uniqState(user_id) AS unique_users
FROM trades
GROUP BY hour, market_id;
```

## ETL Pipeline

```typescript
async function etlPipeline() {
  // 1. Extract
  const rawData = await extractFromPostgres()

  // 2. Transform
  const transformed = rawData.map(row => ({
    date: new Date(row.created_at).toISOString().split('T')[0],
    market_id: row.market_slug,
    volume: parseFloat(row.total_volume),
    trades: parseInt(row.trade_count)
  }))

  // 3. Load
  await bulkInsertToClickHouse(transformed)
}

setInterval(etlPipeline, 60 * 60 * 1000) // Every hour
```

## Change Data Capture (CDC)

```typescript
const pgClient = new Client({ connectionString: process.env.DATABASE_URL })
pgClient.query('LISTEN market_updates')

pgClient.on('notification', async (msg) => {
  const update = JSON.parse(msg.payload)
  await clickhouse.insert('market_updates', [{
    market_id: update.id,
    event_type: update.operation, // INSERT, UPDATE, DELETE
    timestamp: new Date(),
    data: JSON.stringify(update.new_data)
  }])
})
```
