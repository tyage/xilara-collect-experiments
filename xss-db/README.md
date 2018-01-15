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

## Collect Responses

ここは OpenBugBounty 特有のものではなく、一般化できそう.

```bash
# Collect each PoC responses ( to data/openbugbounty/responses )
node --experimental-modules ./scripts/collect-poc-responses.mjs

# Filter valid PoC by confirming `alert`, `prompt` and `confirm` ( to data/openbugbounty/valid-reports.json )
node --experimental-modules ./scripts/collect-valid-reports.mjs

# Collect each safe responses ( to data/openbugbounty/responses )
node --experimental-modules ./scripts/collect-safe-responses.mjs
```

## Analyze Reports

```bash
# Analyze reports
node --experimental-modules ./scripts/analyze-reports.mjs

# Analyze PoC
node --experimental-modules ./scripts/analyze-pocs.mjs
```

# Check Responses

```bash
# Generate template with some responses
./node_modules/.bin/pm2 start generate-templates.config.js

# Check if response is acceptable
node --experimental-modules ./scripts/template-matching.mjs --template=./data/openbugbounty/templates/[rid] ./data/openbugbounty/responses/[rid]/[file]
```
