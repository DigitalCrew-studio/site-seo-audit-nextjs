# 11 — Third-Party Audit Patterns

## Goal

Convert previous agency audits and automated audit reports into reusable, validated audit procedures.

## Use cases

- User uploads an SEO agency audit.
- User pastes a SEOptimer/Semrush/Ahrefs/Screaming Frog/Sitebulb/PageSpeed report.
- User asks what to add to this skill based on another audit.
- User asks to compare two audits.

## Process

1. Extract all reported checks.
2. Classify each check:
   - technical SEO;
   - content/search intent;
   - rendering;
   - structured data;
   - performance/mobile;
   - backlinks/off-page;
   - social/entity/local;
   - analytics/marketing;
   - experimental/GEO;
   - tool-specific marketing upsell.
3. Separate site-specific findings from reusable patterns.
4. Verify whether each recommendation matches official documentation or accepted industry practice.
5. Keep useful checks as reference procedures.
6. Reject or downgrade unsupported, outdated, or overgeneralized checks.

## Automated reports are hypotheses

Treat automated checks as signals, not final truth.

Example:

- “Title too short” → inspect title quality, not just length.
- “No Facebook Pixel” → marketing readiness, not SEO issue.
- “No AMP” → optional for specific media/news cases, not universal.
- “No llms.txt” → optional experimental GEO signal, not Google ranking issue.
- “Inline styles” → low-priority maintainability/performance signal unless causing measurable impact.

## Useful patterns from agency-style audits

Keep:

- priority/status/fix/validation format;
- sitemap-index and hreflang validation;
- raw HTML vs rendered DOM comparison;
- crawl hygiene: 404, 301, 5xx, soft 404;
- old domains/subdomains migration checks;
- URL hygiene;
- page-type schema matrix;
- OG/Twitter preview validation;
- CMS alt fallback rules;
- localized internal link checks;
- private/account indexing checks.

## Useful patterns from automated SEO-score reports

Keep:

- category scorecards;
- SERP snippet preview;
- keyword consistency / intent fit;
- backlink summary when data exists;
- top pages by backlinks;
- top anchors;
- on-page link counts;
- social/entity presence;
- local SEO/NAP checks;
- performance resource inventory;
- technology/DNS/email trust appendix;
- analytics/marketing readiness.

## Reject or downgrade

- “Install every social platform” — recommend only relevant maintained profiles.
- “Facebook Pixel required” — marketing readiness only.
- “AMP required” — optional for select use cases.
- “nofollow all outbound links” — classify links by sponsored/ugc/untrusted/editorial.
- “priority/changefreq are critical Google ranking fields” — inaccurate.
- “Schema directly boosts rankings” — overstatement; use for understanding/rich-result eligibility.
