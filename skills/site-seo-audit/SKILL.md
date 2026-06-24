---
name: seo-audit
description: Use this skill to conduct SEO audits of websites, landing pages, ecommerce/product pages, blogs, multilingual sites, JavaScript-heavy apps, and to analyze previous or automated SEO audit reports. It covers technical SEO, indexability, rendering, metadata, content/search intent, structured data, performance, mobile usability, international SEO, local/entity trust, backlinks, GEO/AI-search readiness, analytics, and audit reporting.
---

# SEO Audit Skill

## Purpose

Act as an evidence-first SEO auditor. Your job is to verify how well a website can be crawled, rendered, indexed, understood, trusted, and used. Produce a prioritized report that separates verified issues from hypotheses.

This skill is designed as a thin controller. Read only the references needed for the requested audit scope.

## Core principles

1. **Verify before recommending.** Do not copy automated audit results blindly.
2. **Separate evidence from assumptions.** Mark unverified sections as `Not assessed`, `Requires crawl`, `Requires access`, or `Requires export`.
3. **Prioritize business impact.** Classify issues by risk to crawling, indexing, traffic, conversions, and maintainability.
4. **Do not promise rankings.** SEO fixes improve crawlability, quality signals, UX, and measurement; they do not guarantee positions.
5. **Do not invent missing data.** Never invent backlink counts, rankings, field Core Web Vitals, schema validation, business profile status, or analytics quality.
6. **Treat experimental GEO signals carefully.** `llms.txt` and AI-search readiness may be useful, but they are not a replacement for classic SEO.

## Input to request

Ask for missing inputs only when they materially affect the audit.

Minimum:

- Website URL.
- Target region/search engines: Google, Yandex, Bing, Baidu, Naver, Seznam, etc.
- Site type: landing, corporate site, ecommerce, SaaS, blog/media, marketplace, SPA/app, local business.
- Audit scope: quick page audit, full site audit, migration audit, previous-audit distillation, performance audit, local SEO audit, backlink audit, GEO/AI-search audit.

Useful additional inputs:

- Sitemap URL.
- Target keywords and priority pages.
- Access to Google Search Console / Bing Webmaster / Yandex Webmaster exports.
- Crawl export from Screaming Frog, Sitebulb, Ahrefs, Semrush, Netpeak Spider, etc.
- Lighthouse/PageSpeed reports.
- Backlink exports.
- Previous agency or automated audit reports.
- Old domains/subdomains and old URL lists for migration audits.

## Audit modes

### 1. Quick URL audit

Use for a single URL or small landing page check. Focus on:

- indexability;
- title/description/H1;
- canonical;
- robots/noindex;
- raw HTML vs rendered DOM;
- visible content/search intent;
- mobile/performance summary;
- structured data and social preview.

Read: `01`, `02`, `03`, `04`, `05`, `06`, `08`, `09`.

### 2. Full technical SEO audit

Use for full websites or launch readiness. Focus on:

- crawlability/indexability;
- sitemap/robots/canonical;
- status codes and redirects;
- metadata duplication;
- JS rendering;
- structured data;
- internal links;
- performance/mobile;
- reporting and scoring.

Read: `01` through `09`, plus specific advanced references as needed.

### 3. Multilingual/international audit

Use when the site has multiple languages, countries, regional domains, or localized URLs.

Read: `02`, `07`, `12`, `08`, `09`.

### 4. Migration / legacy URL audit

Use when a site moved domains, changed platform, changed URL structure, merged content, or has old app/subdomains.

Read: `02`, `07`, `12`, `08`, `09`.

### 5. Previous-audit distillation

Use when the user provides a previous agency audit, automated SEO audit, PDF, DOCX, screenshots, or pasted report.

Process:

1. Extract reusable audit patterns.
2. Separate site-specific findings from general checks.
3. Compare recommendations against current search engine documentation.
4. Keep only checks that are evidence-based, verifiable, and useful.
5. Convert accepted checks into skill references, audit checklist items, or report templates.

Read: `11`, then the relevant topic references.

### 6. Automated audit interpretation

Use when the user provides an SEO audit from a tool such as SEOptimer, Semrush, Ahrefs, Screaming Frog, Sitebulb, Lighthouse, PageSpeed Insights, or similar.

Treat the report as a signal source, not final truth. Validate the claims where possible.

Read: `11`, `16`, `17`, `18`, `19`, `20`, `21`, `22` depending on included sections.

### 7. GEO / AI-search readiness audit

Use when the request mentions AI search, GEO, LLM readability, ChatGPT Search, Perplexity, Bing Copilot, Google AI Overviews, or `llms.txt`.

Read: `16`, plus `03`, `04`, `05`, `19`.

### 8. Backlink / authority audit

Use only when backlink data or an export is available.

Read: `18`. If no backlink data is available, mark the section as `Not assessed`.

### 9. Local/entity trust audit

Use for local businesses, service-area businesses, agencies, studios, clinics, restaurants, physical stores, or region-focused companies.

Read: `19`, plus `05`, `07`, `22` when relevant.

## Reference routing

- `references/01-audit-workflow.md` — overall workflow, audit phases, URL sampling.
- `references/02-technical-indexability.md` — robots, sitemap, canonical, status codes, redirects, URL hygiene, crawl hygiene.
- `references/03-html-content-semantics.md` — titles, descriptions, headings, semantic HTML, image alt, visible content.
- `references/04-javascript-rendering.md` — raw HTML vs rendered DOM, SSR/CSR, JS-only content, metadata hydration.
- `references/05-structured-data.md` — JSON-LD, Schema.org, validation, anti-spam rules.
- `references/06-performance-mobile.md` — Core Web Vitals, mobile-first, PageSpeed, usability basics.
- `references/07-international-regional.md` — hreflang, x-default, regional engines, multilingual internal links.
- `references/08-reporting-scoring.md` — finding template, P0-P3 priorities, scoring, final report format.
- `references/09-cli-checks.md` — curl, grep, sitemap checks, Lighthouse, quick command snippets.
- `references/10-source-corpus.md` — source corpus and official documentation links.
- `references/11-third-party-audit-patterns.md` — how to extract reusable patterns from agency/automated audits.
- `references/12-migration-legacy-url-audit.md` — old domains, old URL maps, redirect validation, migration checks.
- `references/13-page-type-schema-matrix.md` — schema recommendations by page type.
- `references/14-social-preview-audit.md` — Open Graph, Twitter/X Cards, preview images, validators.
- `references/15-private-account-indexing.md` — login, account, checkout, dashboard, admin, private URLs.
- `references/16-generative-engine-optimization.md` — GEO, AI-search readiness, LLM readability, llms.txt.
- `references/17-keyword-consistency-content-fit.md` — keyword consistency, entity/topic coverage, search intent fit.
- `references/18-off-page-links-authority.md` — backlinks, anchors, referring domains, authority signals.
- `references/19-entity-social-local-presence.md` — social profiles, NAP, LocalBusiness, Google/Yandex Business, brand consistency.
- `references/20-performance-resource-inventory.md` — page weight, JS/CSS/image size, requests, compression, protocols, inline styles.
- `references/21-technical-environment-trust.md` — tech stack, DNS, SPF/DKIM/DMARC, CDN, charset, infrastructure context.
- `references/22-analytics-marketing-readiness.md` — analytics, GTM, Yandex Metrica, goals, ecommerce events, pixels.

## Evidence and confidence rules

Every important finding must include evidence.

Evidence may be:

- URL and status code;
- HTTP header;
- HTML snippet;
- rendered DOM observation;
- screenshot/page rendering observation;
- Lighthouse/PageSpeed metric;
- Search Console/Bing/Yandex export row;
- crawl export row;
- schema validator result;
- backlink export row;
- sitemap/robots file content.

Use confidence labels:

- `High` — directly verified from HTML, headers, crawl, official export, or measured tool output.
- `Medium` — supported by partial evidence or a consistent crawl sample.
- `Low` — best-practice recommendation not directly verified.

## Priority model

- `P0 Critical` — blocks crawling/indexing, exposes private pages, severe rendering failure, accidental noindex, broken production, major 5xx issue.
- `P1 High` — large impact on indexability, canonicalization, hreflang, metadata, core landing pages, internal links, mobile usability, LCP/INP.
- `P2 Medium` — improves snippets, structured data, content alignment, social previews, internal authority flow, non-blocking performance.
- `P3 Low` — cleanup, polish, optional marketing readiness, minor validation issues, low-impact consistency items.

## Required finding format

Use this format for each actionable issue:

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
- Owner: SEO / Frontend / Backend / DevOps / Content / Marketing
- Confidence: High / Medium / Low
```

## Required final report structure

```md
# SEO Audit Report: <site>

## Executive summary
- Overall status:
- Top risks:
- Top opportunities:
- What was verified:
- What was not assessed:

## Scorecard
- Technical Indexability:
- Metadata and SERP:
- Content and Intent Fit:
- JS Rendering:
- Structured Data:
- Links and Crawl Hygiene:
- Performance and Mobile:
- Off-page Links:
- Local / Entity / Social:
- Analytics / Measurement:

## Top 5 priorities

## Findings

## Recommended roadmap
- 0-7 days:
- 2-4 weeks:
- 1-3 months:

## Validation checklist

## Appendix
- Tested URLs:
- Tools/data used:
- Access/data required:
```

## Anti-patterns

Do not:

- promise ranking growth;
- recommend fake reviews, fake ratings, fake prices, or fake authors in structured data;
- treat `llms.txt` as mandatory for Google;
- treat social profiles, SPF/DMARC, or analytics pixels as direct ranking factors;
- automatically recommend `nofollow` for all external links;
- require AMP for all sites;
- recommend publishing fake physical addresses;
- overstate sitemap `priority` and `changefreq` for Google;
- assume a tool-generated score is correct without validation;
- mark a section as passed if it was not tested.
