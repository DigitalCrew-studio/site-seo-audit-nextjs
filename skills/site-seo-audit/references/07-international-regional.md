# 07 — International and Regional SEO

## Goal

Validate localized versions and region-specific search engine requirements.

## hreflang checks

For each localized cluster:

- every localized URL has self-referencing hreflang;
- every localized URL references all valid alternates;
- clusters are reciprocal;
- `x-default` exists when there is a default/global selector or fallback page;
- hreflang URLs return 200;
- hreflang URLs are indexable;
- hreflang URLs do not redirect unexpectedly to another language;
- canonical is language-specific, unless a page is intentionally excluded;
- sitemap or HTML implementation is consistent.

## Localized internal links

Check:

- RU pages link primarily to RU URLs;
- EN pages link primarily to EN URLs;
- language switcher points to equivalent pages where available;
- missing translations are handled intentionally;
- no redirect loop caused by locale cookies or browser language.

## Regional engines

Consider target market:

- Google — global baseline, Search Console, CWV, structured data.
- Yandex — RU/CIS, Yandex Webmaster, Yandex Metrica, region/business profiles, turbo/schema validation where relevant.
- Bing/Yahoo — Bing Webmaster Tools, IndexNow, backlinks.
- Baidu — China-specific indexing, ICP/hosting/language considerations where relevant.
- Naver — Korea-specific search ecosystem and webmaster tools.
- Seznam — Czech market visibility and webmaster guidance.

## Regional business signals

For local/regional businesses:

- language-specific contact info;
- service area;
- local profiles;
- consistent NAP if public;
- translated metadata;
- localized content, not machine-translated boilerplate only.

## Reporting

For hreflang issues, include:

- source URL;
- declared alternate;
- expected alternate;
- status/indexability of alternate;
- reciprocity status;
- fix guidance.
