# 12 — Migration and Legacy URL Audit

## Goal

Preserve crawlability, equity, and user access when URLs, domains, subdomains, languages, or platforms change.

## Inputs to request

- old domains and subdomains;
- old sitemap(s);
- old URL export;
- top traffic pages;
- top backlink pages;
- new URL mapping;
- launch date;
- Search Console/Bing/Yandex data;
- server redirect rules.

## Checks

- old URLs redirect to relevant new URLs;
- redirects are 301/308 when permanent;
- no redirect chains;
- no redirect loops;
- no mass redirect to homepage unless no relevant replacement exists;
- old HTTP/www variants are handled;
- old localized URLs map to correct locale;
- backlinks to old URLs are preserved through redirects;
- sitemap contains only new canonical URLs;
- internal links do not point to old URLs;
- canonical tags use new URLs;
- hreflang clusters use new URLs;
- old app/auth/private subdomains are not accidentally indexed.

## Validation

Batch-check old URLs:

- original URL;
- status;
- final URL;
- number of hops;
- final status;
- mapping quality.

## Reporting

For each migration issue include:

- old URL;
- expected new URL;
- actual final URL;
- redirect chain;
- business value if known;
- recommended redirect rule.
