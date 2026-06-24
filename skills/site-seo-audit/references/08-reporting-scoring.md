# 08 — Reporting and Scoring

## Finding template

```md
### [P1] Issue title

- Area:
- Affected URL(s):
- Evidence:
- Current state:
- Expected state:
- Why it matters:
- Recommended fix:
- Validation method:
- Owner:
- Confidence:
```

## Priority levels

- `P0 Critical` — immediate risk: noindex on important pages, production robots block, severe 5xx, private data indexed, site inaccessible.
- `P1 High` — significant SEO impact: broken canonical/hreflang, missing content in raw HTML, crawl traps, major CWV failures, internal links to wrong locale.
- `P2 Medium` — meaningful improvement: weak metadata, schema gaps, content mismatch, social previews, alt patterns, resource optimization.
- `P3 Low` — cleanup: minor validation, favicon, optional marketing pixels, low-impact consistency.

## Category scoring model

Use only when the user asks for scoring or the audit report has score categories.

Default 100-point model:

- Technical Indexability — 20
- Metadata and SERP Presentation — 10
- Content and Search Intent Fit — 15
- JavaScript Rendering and Raw HTML — 10
- Structured Data and Entity Clarity — 10
- Internal Links and Crawl Hygiene — 10
- Performance and Mobile Usability — 15
- Off-page Links and Authority — 5
- Local / Social / Brand Entity — 3
- Analytics and Marketing Readiness — 2

Rules:

- Do not score unassessed categories unless clearly marked as estimated.
- Show `Verified score` and `Potential score` when data is missing.
- A high score does not guarantee rankings.
- Scores are diagnostic, not predictive.

## Report structure

```md
# SEO Audit Report: <site>

## Executive summary
- Overall status:
- Top risks:
- Top opportunities:
- What was verified:
- What was not assessed:

## Scorecard

## Top 5 priorities

## Findings

## Roadmap
- 0-7 days:
- 2-4 weeks:
- 1-3 months:

## Validation checklist

## Appendix
- Tested URLs:
- Tools/data used:
- Access/data required:
```

## Writing style

- Start with business impact.
- Keep findings concrete.
- Avoid vague advice like “improve SEO”.
- Include technical implementation hints where useful.
- Separate SEO, UX, performance, marketing readiness, and experimental GEO signals.
