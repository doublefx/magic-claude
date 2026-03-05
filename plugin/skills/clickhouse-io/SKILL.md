---
name: clickhouse-io
description: ClickHouse database patterns, query optimization, analytics, and data engineering best practices for high-performance analytical workloads.
context: fork
agent: general-purpose
allowed-tools: Read
---

# ClickHouse Analytics Patterns

Column-oriented OLAP database optimized for fast analytical queries on large datasets.

## Load Reference on First Use

Read the matching reference as soon as the topic comes up:

| Topic | Reference |
|-------|-----------|
| Table design, engines, partitioning | [references/table-design.md](references/table-design.md) |
| Query optimization, aggregations, analytics queries | [references/query-patterns.md](references/query-patterns.md) |
| Bulk insert, streaming, materialized views, ETL/CDC | [references/data-ingestion.md](references/data-ingestion.md) |
| Performance monitoring, best practices | [references/performance.md](references/performance.md) |

## Key Principles

- **Engine choice**: MergeTree (default) → ReplacingMergeTree (dedup) → AggregatingMergeTree (pre-aggregation)
- **Partition by time** (month or day); order by most-filtered columns first
- **Batch inserts only** — never insert one row at a time; minimum 1,000 rows
- **Specify columns** — never `SELECT *`; use `uniq()` over `COUNT(DISTINCT)`
- **Materialized views** for real-time aggregations feeding into AggregatingMergeTree tables
- **Denormalize** — minimize JOINs; design tables for your query patterns
