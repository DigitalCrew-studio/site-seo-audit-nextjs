# 20 — Performance Resource Inventory

## Goal

Go beyond Core Web Vitals and inspect what makes the page heavy or slow.

## Collect

- TTFB/server response;
- FCP;
- LCP;
- INP or TBT;
- CLS;
- Speed Index;
- total page weight;
- HTML size;
- CSS size;
- JS size;
- image size;
- font size;
- third-party size;
- request count;
- number of JS files;
- number of CSS files;
- number of images;
- compression: gzip/br/deflate;
- HTTP/2 or HTTP/3;
- redirects before final page;
- console errors;
- render-blocking resources;
- unused JS/CSS;
- inline styles/scripts.

## Interpretation

Prioritize by user impact:

- LCP image/media issues;
- excessive JS causing INP/TBT;
- slow TTFB;
- render-blocking resources;
- third-party scripts;
- redirect overhead;
- large unoptimized images;
- too many requests.

## Inline styles

Flag as low priority unless:

- they significantly inflate HTML;
- prevent caching;
- cause maintainability issues;
- are part of critical rendering/performance problem.

## Reporting

For each issue:

- metric;
- measured value;
- tool/source;
- likely cause;
- expected benefit;
- recommended fix;
- owner;
- validation method.
