# 14 — Social Preview Audit

## Goal

Ensure shared links render correctly in social platforms, messengers, and previews.

## Open Graph checks

- `og:title` exists and is page-specific;
- `og:description` exists and matches page intent;
- `og:url` matches canonical URL;
- `og:type` is appropriate: `website`, `article`, `product`, etc.;
- `og:site_name` is consistent with brand;
- `og:image` exists, returns 200, and is large enough;
- image is not blocked by robots or auth;
- image aspect ratio is suitable for sharing;
- localized pages use localized preview content when appropriate.

## Twitter/X Cards checks

- `twitter:card` exists;
- `twitter:title` and `twitter:description` are page-specific;
- `twitter:image` exists and returns 200;
- `twitter:site` / `twitter:creator` only when real accounts exist.

## Image recommendations

- Common Open Graph target: 1200×630.
- Avoid tiny, text-heavy, or cropped images.
- Ensure file size is reasonable.
- Use absolute image URLs.

## Validation

Use platform debuggers when available:

- Facebook Sharing Debugger;
- X/Twitter Card Validator;
- LinkedIn Post Inspector;
- manual Telegram/Slack preview check.

## Priority

Usually P2 unless previews are broken for a high-traffic campaign or brand-critical page.
