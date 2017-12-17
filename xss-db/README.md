# Open Bug Bounty Collector

## Collect Report Information

```bash
# Collect report list page ( to data/openbugbounty/lists )
node --experimental-modules ./scripts/collect-list.mjs

# Aggregate report from list page ( to data/openbugbounty/reports.json )
node --experimental-modules ./scripts/aggregate-report.mjs

# Collect each report using report list ( to data/openbugbounty/reports )
node --experimental-modules ./scripts/collect-reports.mjs

# Collect each responses ( to data/openbugbounty/responses )
node --experimental-modules ./scripts/collect-responses.mjs
```

## Analyse Reports

```bash
node --experimental-modules ./scripts/reports-analyse.mjs
```

## Create Safe Request

```bash
# Extract Provided PoC
node --experimental-modules ./scripts/extract-poc.mjs
```
