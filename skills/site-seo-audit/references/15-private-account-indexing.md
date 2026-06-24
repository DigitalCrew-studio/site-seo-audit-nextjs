# 15 — Private and Account Page Indexing

## Goal

Avoid accidental indexing of thin, private, duplicate, or sensitive account pages.

## URL patterns to inspect

- `/login`;
- `/signin`;
- `/register`;
- `/account`;
- `/dashboard`;
- `/profile`;
- `/checkout`;
- `/cart`;
- `/admin`;
- `/app`;
- `/cabinet`;
- `/settings`;
- payment callback URLs;
- KYC/support/private flows.

## Rules

- Public login pages may be indexable only if they provide useful public context and are intentionally discoverable.
- Thin auth placeholders usually should be `noindex`.
- Private/authenticated pages should not be indexable.
- Sensitive URLs should not rely only on robots.txt.
- Admin/private pages should require authentication and return appropriate status/redirect behavior.
- Do not include private URLs in sitemap.

## Checks

- status code without auth;
- robots meta;
- X-Robots-Tag;
- canonical;
- sitemap inclusion;
- internal links from public pages;
- whether content is thin/duplicate;
- whether protected content leaks in raw HTML.

## Reporting

Use P0 if private/sensitive content is indexable or exposed.
Use P1/P2 for thin public auth pages depending on site type.
