# 16 — Generative Engine Optimization / AI-Search Readiness

## Goal

Assess whether a site is easy for AI systems, answer engines, and search engines with generative features to understand.

## Important framing

GEO is not a replacement for SEO. Treat it as an additional layer of clarity, crawlability, and entity consistency.

`llms.txt` is optional and experimental. Do not present it as mandatory for Google Search or as a ranking guarantee.

## Checks

### Entity clarity

- Organization/Person/LocalBusiness schema exists when relevant;
- brand name is consistent across title, schema, footer, social links, and contact page;
- homepage clearly states who the entity is, what it does, where it operates, and how to contact it;
- service pages clearly state the service and audience;
- about/contact pages reinforce trust and identity.

### LLM readability

- key facts are in HTML text;
- summaries exist near the top of important pages;
- headings structure the content logically;
- important information is not trapped in images, canvas, sliders, video-only content, or JS-only widgets;
- pages answer common user questions directly;
- content uses specific names, services, regions, and capabilities;
- schema aligns with visible text.

### AI crawler access

- important public content is not accidentally blocked;
- robots.txt policy for AI crawlers is intentional;
- CDN/firewall bot controls do not block desired crawlers unexpectedly;
- rate limiting does not prevent normal crawling.

### llms.txt

If requested or relevant, check:

- `/llms.txt` exists or intentionally does not;
- returns 200 and `text/plain` or appropriate content type;
- contains Markdown-style site summary;
- links to canonical important pages;
- excludes private/admin URLs;
- does not contradict sitemap/robots/canonical strategy.

## Recommended llms.txt content

- project/site name;
- concise description;
- primary services/products;
- important documentation/service pages;
- contact/about pages;
- optional policy for AI usage if the organization has one.

## Reporting

Use `P2` for entity clarity and HTML readability issues affecting important pages.
Use `P3` for optional `llms.txt` unless the user specifically prioritizes AI-agent discoverability.
