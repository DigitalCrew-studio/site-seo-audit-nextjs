# 18 — Off-Page Links and Authority

## Goal

Analyze backlinks and external authority only when data exists.

## Data sources

- Google Search Console Links report;
- Bing Webmaster backlinks;
- Ahrefs;
- Semrush;
- Majestic;
- Moz;
- Screaming Frog integrations;
- user-provided backlink CSV/XLSX exports.

## Hard rule

Do not invent backlink data. If no backlink export or tool data is available, mark this section as `Not assessed`.

## Metrics to inspect

- total backlinks;
- referring domains;
- dofollow/nofollow split;
- sponsored/ugc if available;
- top referring domains;
- top linked pages;
- top anchors;
- branded vs commercial anchors;
- referring countries;
- TLD distribution;
- IP/subnet diversity if available;
- backlinks to redirected/404/non-canonical URLs;
- lost high-value backlinks if historical data exists.

## Risk patterns

- suspicious exact-match commercial anchors;
- low-quality/spam domains;
- unnatural country/TLD distribution;
- backlinks pointing mostly to non-preferred host;
- many links to 404/redirected pages;
- high-value links not preserved after migration;
- sudden spikes without explanation.

## Recommendations

- reclaim links to 404 pages with redirects;
- update internal links to top-linked pages;
- strengthen pages that already attract backlinks;
- avoid manipulative link schemes;
- do not recommend disavow unless there is strong evidence and clear risk.

## Reporting

Include data source and export date. Use confidence `High` only for actual tool/export data.
