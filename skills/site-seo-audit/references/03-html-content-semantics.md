# 03 — HTML, Content and Semantics

## Goal

Ensure search engines and users can understand each page's topic, hierarchy, and content.

## Title tag

Check:

- exists;
- unique for important pages;
- accurately describes the page;
- includes primary topic naturally;
- not keyword-stuffed;
- not too generic;
- not duplicated across templates;
- brand appended consistently when useful.

Do not treat character counts as strict rules. Use length as a snippet-risk signal, not a ranking formula.

## Meta description

Check:

- exists for important pages;
- unique and page-specific;
- summarizes value proposition;
- aligns with visible content;
- avoids keyword stuffing;
- avoids duplicate boilerplate.

Search engines may rewrite snippets. Still, good descriptions improve control and CTR potential.

## SERP preview

For priority pages, include:

- Title;
- URL;
- Description;
- Risk notes: truncation, generic copy, mismatch, weak CTA, missing intent.

## Headings

Check:

- one clear H1 for the main page topic;
- logical H2/H3 structure;
- headings describe sections;
- headings are not used only for styling;
- important sections are not hidden behind images or animations;
- mobile version keeps important headings/content.

## Semantic HTML

Prefer meaningful elements:

- `header`;
- `nav`;
- `main`;
- `section`;
- `article`;
- `aside`;
- `footer`;
- real `a href` links;
- real `button` for actions.

Flag div-only structures only when they reduce accessibility, crawlability, or maintainability.

## Visible content

Check:

- page explains what it offers;
- first screen communicates page purpose;
- text matches search intent;
- thin pages are identified;
- duplicated boilerplate is separated from unique content;
- important facts are in text/HTML, not only images/video/canvas;
- calls to action are clear but not replacing useful content.

## Image alt

Rules:

- informative images need descriptive alt text;
- decorative images should use `alt=""`;
- product images should include product name and primary descriptor;
- icons may use empty alt if accompanied by visible text;
- avoid keyword stuffing;
- CMS fallback alt templates are acceptable but should not overwrite manual alt.

Suggested CMS fallback:

- one image in a section: `{section heading}`;
- multiple images: `{section heading} - image {number}`;
- product image: `{product name} {product type}`.

## Internal links

Check:

- important pages are linked from navigation, footer, content, or hubs;
- anchors are descriptive;
- links use crawlable `<a href>`;
- localized pages link to same-locale pages when appropriate;
- internal links point to canonical final URLs;
- no excessive links to noindex or redirected URLs.

## Content quality notes

Do not reduce content analysis to keyword density. Evaluate intent match, completeness, specificity, freshness, trust, and usefulness.
