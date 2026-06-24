# 02 — Technical Indexability

## Goal

Verify whether search engines can crawl, render, index, and canonicalize the right URLs.

## Indexability checklist

For each important URL:

- returns 200;
- final URL is HTTPS;
- final URL uses preferred host (`www` or non-`www`);
- not blocked by robots.txt;
- no `<meta name="robots" content="noindex">`;
- no `X-Robots-Tag: noindex` header;
- canonical points to the preferred indexable URL;
- URL is included in sitemap if it should be indexed;
- not redirected through unnecessary chains;
- not a duplicate parameterized URL;
- main content appears in raw HTML or is reliably renderable.

## robots.txt

Check:

- file exists at `/robots.txt`;
- returns 200 or expected status;
- does not block important sections;
- blocks crawl traps where appropriate;
- references sitemap URL(s);
- does not use unsupported directives as critical controls;
- does not rely on robots.txt to prevent indexing of already-linked sensitive URLs.

Use robots.txt for crawl control, not as the only privacy/indexing control.

## Sitemap

Check:

- sitemap exists and returns 200;
- XML is valid;
- only canonical, indexable, 200 URLs are included;
- important public pages are included;
- no private, login, account, admin, checkout-only, parameter, or noindex URLs are included;
- `lastmod` reflects meaningful page updates;
- sitemap index is used for large or multilingual sites;
- localized alternates are present in sitemap or HTML when applicable.

Important nuance:

- `lastmod` is useful only when accurate.
- `priority` and `changefreq` can be present for compatibility, but do not overstate their impact for Google.

## Canonical

Check:

- canonical is absolute or consistently resolvable;
- canonical URL returns 200;
- canonical is not blocked/noindexed;
- canonical does not point to a redirect;
- canonical matches preferred host/protocol/trailing-slash policy;
- paginated, filtered, and parameter URLs use canonical intentionally;
- localized pages do not canonicalize to a different language unless intentionally excluded.

## Status codes

Classify:

- `200` — valid indexable page, if allowed.
- `301` — permanent redirect; should point to relevant replacement.
- `302/307/308` — verify whether temporary/permanent behavior is intended.
- `404` — page not found; acceptable for deleted pages.
- `410` — permanently gone; useful for intentionally removed pages.
- `5xx` — server failure; high priority if recurring or on important pages.

## Crawl hygiene

Check:

- internal links to 404/410;
- internal links to 5xx;
- internal links to redirected URLs;
- redirect chains;
- redirect loops;
- soft 404 pages;
- orphan pages;
- canonicalized pages still heavily linked internally;
- sitemap contains non-indexable URLs.

## HTTPS and host normalization

Check:

- HTTP redirects to HTTPS;
- one preferred host is enforced;
- old hosts/subdomains redirect intentionally;
- redirects preserve path when a relevant equivalent exists;
- all internal links point directly to final canonical URLs.

## URL hygiene

Flag as warnings unless causing crawl/index issues:

- mixed uppercase/lowercase;
- repeated slashes;
- excessive length;
- unsafe or unencoded characters;
- underscores instead of hyphens;
- inconsistent trailing slashes;
- parameter URLs exposed as indexable;
- duplicate content under multiple URL variants.

## Validation methods

Use:

- curl status and headers;
- rendered browser inspection;
- crawl export;
- sitemap validator;
- Search Console URL inspection when available;
- Bing/Yandex webmaster diagnostics when relevant.
