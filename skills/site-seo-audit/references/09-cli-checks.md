# 09 — CLI Checks

## Status and headers

```bash
curl -I https://example.com/
curl -IL http://example.com/
curl -I https://example.com/robots.txt
curl -I https://example.com/sitemap.xml
```

Check:

- status code;
- final URL;
- redirects;
- canonical host/protocol;
- `x-robots-tag`;
- content type;
- cache headers;
- compression.

## Fetch raw HTML

```bash
curl -L https://example.com/ -o page.html
grep -i "<title\|description\|canonical\|robots\|hreflang\|application/ld+json" page.html
```

## Check robots.txt

```bash
curl -L https://example.com/robots.txt
```

Inspect:

- disallow rules;
- sitemap declarations;
- accidental full-site block.

## Check sitemap

```bash
curl -L https://example.com/sitemap.xml -o sitemap.xml
xmllint --noout sitemap.xml
```

Extract URLs:

```bash
grep -oE '<loc>[^<]+' sitemap.xml | sed 's/<loc>//'
```

## Batch status check

```bash
while read -r url; do
  code=$(curl -L -s -o /dev/null -w "%{http_code}" "$url")
  final=$(curl -L -s -o /dev/null -w "%{url_effective}" "$url")
  echo "$code $final $url"
done < urls.txt
```

## Lighthouse CLI

```bash
npx lighthouse https://example.com/ --preset=desktop --output=json --output-path=lh-desktop.json
npx lighthouse https://example.com/ --output=json --output-path=lh-mobile.json
```

## Simple link extraction

```bash
grep -oE 'href="[^"]+"' page.html | sed 's/href="//;s/"//'
```

## Notes

CLI checks are supporting evidence. Use browser rendering, crawlers, and official webmaster tools when deeper verification is needed.
