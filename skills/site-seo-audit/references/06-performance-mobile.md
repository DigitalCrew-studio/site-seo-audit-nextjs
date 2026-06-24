# 06 — Performance and Mobile

## Goal

Assess page experience, speed, and mobile usability without overstating indirect SEO effects.

## Core Web Vitals

Check field data when available:

- LCP — loading experience;
- INP — responsiveness;
- CLS — visual stability.

If only lab data is available, label it as lab data.

## PageSpeed / Lighthouse

Collect:

- performance score;
- FCP;
- LCP;
- TBT;
- Speed Index;
- CLS;
- opportunities;
- diagnostics.

Separate mobile and desktop.

## Mobile usability

Check:

- viewport meta tag;
- no horizontal scroll;
- readable font sizes;
- tap targets;
- menu usability;
- content parity between mobile and desktop;
- intrusive popups;
- above-the-fold clarity;
- important links visible/crawlable.

## Common performance causes

- heavy JavaScript;
- unused JavaScript;
- render-blocking CSS/JS;
- large images;
- unoptimized hero media;
- slow server response/TTFB;
- redirect overhead;
- third-party scripts;
- excessive requests;
- missing compression;
- layout shifts from images/fonts/ads.

## Usability extras

Check as P2/P3 depending on severity:

- favicon exists and is crawlable;
- no Flash/deprecated tech;
- iframes do not contain critical SEO content;
- email addresses are not exposed if privacy/spam risk matters;
- JS errors are not breaking user flows.

## Reporting

Always include:

- measured metric;
- source/tool;
- user impact;
- likely technical cause;
- recommended owner;
- validation method.
