# 01 — Audit Workflow

## Goal

Run audits in a repeatable sequence so findings are evidence-based and prioritized.

## Phase 1 — Scope and assumptions

Collect:

- site URL;
- target market/search engines;
- site type;
- priority pages;
- target keywords if available;
- access/export availability;
- whether the user wants technical, content, performance, off-page, local, GEO, or full audit.

If no crawl/export is available, perform a URL-level audit and clearly mark sitewide conclusions as sampled.

## Phase 2 — URL discovery

Sources to use:

- homepage navigation;
- footer links;
- sitemap.xml and sitemap indexes;
- robots.txt sitemap declarations;
- search console exports;
- crawl exports;
- backlinks/top pages exports;
- user-provided priority pages;
- old URL lists for migrations.

Classify URLs:

- homepage;
- service/landing pages;
- category/listing pages;
- product pages;
- blog/articles;
- legal pages;
- account/auth/private pages;
- localized versions;
- old/legacy URLs;
- assets and files.

## Phase 3 — Technical gate checks

Before content analysis, verify:

- HTTP/HTTPS and canonical host;
- status code;
- robots.txt;
- meta robots / X-Robots-Tag;
- canonical;
- redirects;
- sitemap inclusion;
- raw HTML availability;
- core content availability.

If a page is not indexable, do not over-invest in content/meta recommendations until indexability is resolved.

## Phase 4 — Page-level analysis

For each sampled priority URL, inspect:

- title;
- meta description;
- canonical;
- H1;
- heading hierarchy;
- visible content;
- internal links;
- images and alt;
- schema;
- social preview tags;
- raw HTML vs rendered DOM;
- mobile usability;
- performance signals.

## Phase 5 — Sitewide analysis

When crawl data exists, analyze:

- duplicate titles/descriptions/H1;
- non-200 URLs;
- internal 404/5xx;
- links to redirects;
- redirect chains;
- duplicate canonicals;
- orphan pages;
- sitemap vs crawl mismatch;
- hreflang clusters;
- URL hygiene;
- internal link depth.

## Phase 6 — Advanced layers

Apply only when data is available or requested:

- keyword consistency and intent fit;
- off-page/backlinks;
- local/entity/social presence;
- GEO/LLM readiness;
- performance resource inventory;
- technical environment/trust;
- analytics/marketing readiness.

## Phase 7 — Reporting

Report only actionable findings. For every finding include:

- priority;
- affected URL(s);
- evidence;
- expected state;
- recommended fix;
- validation method;
- owner;
- confidence.

## Sampling rules

For small sites: inspect all indexable pages.

For medium/large sites, sample:

- homepage;
- 3-5 main service/category pages;
- 3-5 product/article pages;
- 1-2 legal pages;
- 1 localized cluster per language;
- 1 auth/private flow if relevant;
- top pages by organic traffic/backlinks if available.

## Output discipline

Do not bury critical issues. Put top 5 priorities before detailed checklists.
