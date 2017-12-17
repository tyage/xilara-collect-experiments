# Open Bug Bounty Collector

## Collect Reports

```bash
# Collect report list page ( to data/openbugbounty/lists )
node --experimental-modules ./scripts/collect-list.mjs

# Aggregate report from list page ( to data/openbugbounty/reports.json )
node --experimental-modules ./scripts/aggregate-report.mjs

# Collect each report using report list ( to data/openbugbounty/reports )
node --experimental-modules ./scripts/collect-reports.mjs
```

## Analyze Reports

```bash
node --experimental-modules ./scripts/analyze-reports.mjs
```

## Collect Responses

```bash
# Collect each PoC responses ( to data/openbugbounty/responses )
node --experimental-modules ./scripts/collect-poc-responses.mjs

# Collect each safe responses ( to data/openbugbounty/responses )
node --experimental-modules ./scripts/collect-safe-responses.mjs
```
