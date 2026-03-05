# ClickHouse — Performance & Monitoring

## Query Performance Analysis

```sql
-- Slow queries (>1s in last hour)
SELECT query_id, user, query,
    query_duration_ms,
    read_rows,
    formatReadableSize(read_bytes) AS read_size,
    formatReadableSize(memory_usage) AS memory
FROM system.query_log
WHERE type = 'QueryFinish'
  AND query_duration_ms > 1000
  AND event_time >= now() - INTERVAL 1 HOUR
ORDER BY query_duration_ms DESC
LIMIT 10;
```

## Table Statistics

```sql
-- Table sizes and row counts
SELECT database, table,
    formatReadableSize(sum(bytes)) AS size,
    sum(rows) AS rows,
    max(modification_time) AS latest_modification
FROM system.parts
WHERE active
GROUP BY database, table
ORDER BY sum(bytes) DESC;
```

## Best Practices

### Partitioning
- Partition by time (month or day)
- Avoid too many partitions — each adds overhead at query time
- Use `DATE` type for partition key, not `DateTime`

### Ordering Key
- Put most frequently filtered columns first
- High cardinality before low cardinality
- Impacts both query performance and compression ratio

### Inserts
- **Batch inserts only** — never insert one row at a time
- Minimum batch size: 1,000 rows; optimal: 10,000–100,000
- Use async inserts for low-frequency writes

### Queries
- `SELECT *` is harmful — always specify columns
- Avoid `FINAL` — merge data ahead of time instead
- Minimize JOINs — denormalize for analytics workloads
- Use `uniq()` over `COUNT(DISTINCT)` — faster approximation

### Monitoring Checklist
- [ ] Track `query_duration_ms` > 1s in `system.query_log`
- [ ] Monitor disk usage via `system.parts`
- [ ] Check merge operations: `system.merges`
- [ ] Review slow query log weekly
- [ ] Alert on queries reading > 100M rows
