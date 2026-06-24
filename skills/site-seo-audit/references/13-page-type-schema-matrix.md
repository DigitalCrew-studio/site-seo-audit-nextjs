# 13 — Page-Type Schema Matrix

## Goal

Choose schema by page type and visible content.

| Page type | Recommended schema | Notes |
|---|---|---|
| Home | `Organization`, `WebSite`, `WebPage` | Use consistent brand, logo, sameAs. |
| Service page | `WebPage`, `Service`, `BreadcrumbList` | Only use Service if the page describes a real service. |
| Local/service-area page | `LocalBusiness` or `ProfessionalService`, `WebPage`, `BreadcrumbList` | Only with accurate NAP/service area. |
| Blog article | `Article` or `BlogPosting`, `BreadcrumbList` | Include real author, dates, image. |
| News article | `NewsArticle`, `BreadcrumbList` | Use only for actual news. |
| Product page | `Product`, `Offer`, optional `Review`/`AggregateRating` | Price/rating/reviews must be real and visible. |
| Category/catalog | `CollectionPage`, optional `AggregateOffer` when valid | Do not fake prices/counts. |
| FAQ section | `FAQPage` | Only if FAQ is visible and eligible. |
| Contact page | `ContactPage`, `Organization` | Include real contact methods. |
| About page | `AboutPage`, `Organization` | Useful for entity clarity. |
| Breadcrumbs | `BreadcrumbList` | All non-home pages when breadcrumbs exist. |

## Validation rules

- Schema must match visible content.
- Do not add fake ratings or reviews.
- Do not add fake address/phone.
- Do not add fake author biographies.
- Use canonical URLs.
- Images should be crawlable.
- Avoid duplicate conflicting schema blocks.
