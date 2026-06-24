# 04 — JavaScript Rendering

## Goal

Detect SEO-critical elements that exist only after client-side rendering or hydration.

## Raw HTML vs rendered DOM

Compare both states for:

- title;
- meta description;
- canonical;
- meta robots;
- hreflang;
- Open Graph;
- Twitter/X Cards;
- JSON-LD;
- H1;
- primary content;
- internal links;
- pagination;
- product/service data;
- breadcrumbs.

If SEO-critical metadata or content exists only after client-side JS, flag as rendering risk.

## What to inspect

Use:

- View Source / raw HTML fetch;
- rendered browser DOM;
- curl output;
- headless browser when available;
- Google Search Console URL Inspection if accessible;
- crawlers with JS rendering enabled/disabled.

## Common risks

- empty root div with all content hydrated later;
- client-only title/meta updates;
- canonical missing in raw HTML;
- JSON-LD injected only after delayed JS;
- internal links rendered as buttons without href;
- content behind infinite scroll without crawlable pagination;
- localized content redirects based on client state;
- auth or geolocation logic hides public content;
- delayed API failures cause empty SEO content.

## Recommendations

For SEO-critical pages prefer:

- server-side rendering;
- static generation;
- hybrid rendering with core content in initial HTML;
- crawlable links;
- stable metadata in HTML head;
- progressive enhancement.

## Validation

A fix is valid when:

- raw HTML contains core metadata and main content;
- rendered DOM matches user-facing page;
- crawlers can access links;
- no hydration errors remove/replace SEO-critical content;
- URL inspection/crawler rendering confirms visibility.
