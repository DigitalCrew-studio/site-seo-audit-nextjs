# 05 — Structured Data

## Goal

Use structured data to clarify entities and page type without misrepresenting content.

## Core checks

- JSON-LD exists where relevant;
- schema matches page type;
- required/recommended properties are present;
- URLs are canonical;
- images return 200 and are crawlable;
- dates use valid formats;
- organization/person details are consistent;
- schema validates in relevant validators;
- schema content matches visible page content.

## Common useful types

- `Organization`;
- `WebSite`;
- `WebPage`;
- `BreadcrumbList`;
- `Article`;
- `BlogPosting`;
- `Product`;
- `Offer`;
- `AggregateOffer`;
- `Review` / `AggregateRating` only when real and visible;
- `LocalBusiness` / `ProfessionalService` when accurate;
- `FAQPage` only when eligible and visible.

## Anti-spam rules

Do not recommend:

- fake reviews;
- fake ratings;
- fake prices;
- fake availability;
- fake authors;
- fake addresses;
- schema for invisible content;
- over-marking every paragraph with irrelevant schema.

## Validation methods

Use:

- Google Rich Results Test;
- Schema Markup Validator;
- Yandex structured data validator for Yandex-oriented projects;
- manual JSON-LD inspection;
- crawl extraction.

## Reporting

For each schema finding, include:

- page type;
- detected schema;
- expected schema;
- invalid/missing properties;
- visible content source;
- validator result if available;
- confidence.
