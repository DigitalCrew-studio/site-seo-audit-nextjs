import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Breadcrumbs, PageHeader } from "@/components/ui";
import { SITE_URL, withHreflang } from "@/lib/site";
import { pageBreadcrumb, webPageSchema } from "@/lib/structuredData";

const SITE_NAME = "Seofriendly";
const PAGE_TITLE = "База знаний SEO — термины, нормы и проверки";
const PAGE_DESCRIPTION =
  "Справочник Seofriendly по SEO-терминам: robots.txt, sitemap.xml, canonical, Core Web Vitals, Schema.org, GEO, llms.txt, GA4, SPF, DKIM, DMARC и другие понятия с нормами проверки.";

type KnowledgeTerm = {
  term: string;
  meaning: string;
  norm: string;
  check: string;
  source: string;
  sourceLabel: string;
};

type KnowledgeSection = {
  title: string;
  description: string;
  terms: KnowledgeTerm[];
};

const SOURCE_GROUPS = [
  "Google Search Central",
  "Schema.org",
  "web.dev и Lighthouse",
  "GEO / AI Search",
  "Bing, IndexNow и Yandex Webmaster",
  "Backlinks, Local SEO, Analytics, DNS trust",
] as const;

const SECTION_IDS: Record<string, string> = {
  "Индексация и обход сайта": "indexability",
  "Сниппеты, контент и семантика": "serp-content",
  "Structured data и социальные превью": "structured-data",
  "Производительность и мобильная пригодность": "performance",
  "GEO, AI Search и LLM readiness": "geo-llm",
  "Поисковые системы и webmaster-инструменты": "search-engines",
  "Ссылки, локальное SEO и entity trust": "links-local",
  "Аналитика, маркетинг и техническое доверие": "analytics-trust",
};

const TERM_IDS: Record<string, string> = {
  SEO: "seo",
  URL: "url",
  "HTTP / HTTPS": "http-https",
  "robots.txt": "robots-txt",
  "sitemap.xml": "sitemap-xml",
  canonical: "canonical",
  noindex: "noindex",
  "X-Robots-Tag": "x-robots-tag",
  Googlebot: "googlebot",
  hreflang: "hreflang",
  SERP: "serp",
  "Title tag": "title-tag",
  "Meta description": "meta-description",
  H1: "h1",
  "Alt text": "alt-text",
  "Crawlable links": "crawlable-links",
  "Structured data": "structured-data-term",
  "JSON-LD": "json-ld",
  Organization: "organization",
  BreadcrumbList: "breadcrumblist",
  "Product / Offer": "product-offer",
  "OG / Open Graph": "open-graph",
  "Twitter Cards / X Cards": "twitter-cards",
  "CWV / Core Web Vitals": "core-web-vitals",
  LCP: "lcp",
  INP: "inp",
  CLS: "cls",
  FCP: "fcp",
  TBT: "tbt",
  TTFB: "ttfb",
  "Viewport meta": "viewport-meta",
  "Brotli / gzip": "brotli-gzip",
  GEO: "geo",
  LLM: "llm",
  "llms.txt": "llms-txt",
  "GPTBot / AI crawlers": "ai-crawlers",
  GSC: "gsc",
  "Bing Webmaster Tools": "bing-webmaster-tools",
  IndexNow: "indexnow",
  "Yandex Webmaster": "yandex-webmaster",
  "Baidu / Naver / Seznam": "regional-search-engines",
  Backlinks: "backlinks",
  "Referring domains": "referring-domains",
  "Anchor text": "anchor-text",
  NAP: "nap",
  GBP: "gbp",
  sameAs: "sameas",
  GA4: "ga4",
  GTM: "gtm",
  "Yandex Metrica": "yandex-metrica",
  SPF: "spf",
  DKIM: "dkim",
  DMARC: "dmarc",
  HSTS: "hsts",
  "CDN / WAF": "cdn-waf",
};

function getSectionId(title: string) {
  return SECTION_IDS[title] ?? title;
}

function getTermId(term: string) {
  return TERM_IDS[term] ?? term;
}

const KNOWLEDGE_SECTIONS: KnowledgeSection[] = [
  {
    title: "Индексация и обход сайта",
    description:
      "Базовый слой технического SEO: поисковик должен получить правильный URL, увидеть доступную страницу и понять, какую версию индексировать.",
    terms: [
      {
        term: "SEO",
        meaning: "Search Engine Optimization: улучшение сайта для поиска, пользователей и измеримости результата.",
        norm: "SEO-рекомендации должны улучшать доступность, понятность, качество контента и техническую надёжность, но не обещать позиции.",
        check: "Сверять выводы с официальной документацией поисковиков и фактическими данными аудита.",
        source: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        sourceLabel: "Google SEO Starter Guide",
      },
      {
        term: "URL",
        meaning: "Адрес страницы или файла в интернете.",
        norm: "Индексируемые URL должны возвращать 200, быть каноническими, открытыми для обхода и включёнными в sitemap, если страница важна.",
        check: "Проверить статус, редиректы, canonical, robots.txt, sitemap.xml и внутренние ссылки.",
        source: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
        sourceLabel: "Consolidate duplicate URLs",
      },
      {
        term: "HTTP / HTTPS",
        meaning: "Протокол передачи страницы. HTTPS добавляет шифрование и является нормой для публичных сайтов.",
        norm: "HTTP-версии должны перенаправлять на HTTPS, а внутренние ссылки должны вести сразу на финальные HTTPS URL.",
        check: "curl -IL для HTTP и HTTPS вариантов, проверка финального URL и количества редиректов.",
        source: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        sourceLabel: "Google SEO Starter Guide",
      },
      {
        term: "robots.txt",
        meaning: "Файл правил обхода для роботов по адресу /robots.txt.",
        norm: "Не должен блокировать важные публичные страницы. Может указывать Sitemap. Не является надёжной защитой приватных данных от индексации.",
        check: "Открыть /robots.txt, проверить Disallow, Allow, Sitemap и доступность важных разделов.",
        source: "https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt",
        sourceLabel: "Google robots.txt",
      },
      {
        term: "sitemap.xml",
        meaning: "XML-карта сайта со списком URL, которые сайт предлагает поисковику для обхода.",
        norm: "В sitemap должны быть только канонические, индексируемые URL со статусом 200. lastmod полезен только при точном обновлении.",
        check: "Открыть /sitemap.xml, проверить XML, статусы URL, canonical и отсутствие noindex/private страниц.",
        source: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap",
        sourceLabel: "Build and submit a sitemap",
      },
      {
        term: "canonical",
        meaning: "Сигнал о предпочтительной версии страницы среди дублей.",
        norm: "Canonical должен указывать на индексируемый 200 URL той же логической страницы, без редиректа и блокировок.",
        check: "Проверить link rel=canonical в HTML, статус canonical URL и совпадение с preferred host/protocol.",
        source: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
        sourceLabel: "Canonicalization",
      },
      {
        term: "noindex",
        meaning: "Директива, запрещающая индексацию страницы.",
        norm: "Не должно быть noindex на важных публичных страницах. Для приватных и тонких страниц noindex часто уместен.",
        check: "Проверить meta robots в HTML и X-Robots-Tag в HTTP-заголовках.",
        source: "https://developers.google.com/search/docs/crawling-indexing/block-indexing",
        sourceLabel: "Block Search indexing",
      },
      {
        term: "X-Robots-Tag",
        meaning: "HTTP-заголовок для управления индексацией HTML и файлов вроде PDF.",
        norm: "Не должен случайно содержать noindex на индексируемых страницах или важных файлах.",
        check: "curl -I URL и анализ заголовков ответа.",
        source: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag",
        sourceLabel: "Robots meta tag and X-Robots-Tag",
      },
      {
        term: "Googlebot",
        meaning: "Основной краулер Google Search.",
        norm: "Сайт должен отдавать Googlebot тот же основной контент, что и пользователю, без случайных блокировок CDN/WAF.",
        check: "Проверить robots.txt, серверные ответы, rendering и данные Search Console при наличии доступа.",
        source: "https://developers.google.com/search/docs/crawling-indexing/googlebot",
        sourceLabel: "Googlebot",
      },
      {
        term: "hreflang",
        meaning: "Разметка языковых и региональных альтернатив страницы.",
        norm: "Каждая языковая версия должна ссылаться на себя и на остальные версии; кластеры должны быть взаимными, URL — 200 и indexable.",
        check: "Проверить hreflang в HTML или sitemap, self-reference, reciprocity, x-default и canonical.",
        source: "https://developers.google.com/search/docs/specialty/international/localized-versions",
        sourceLabel: "Localized versions",
      },
    ],
  },
  {
    title: "Сниппеты, контент и семантика",
    description:
      "Эти элементы помогают поисковику и пользователю быстро понять тему страницы и обещание результата в выдаче.",
    terms: [
      {
        term: "SERP",
        meaning: "Search Engine Results Page: страница результатов поиска.",
        norm: "Сниппет должен точно соответствовать содержанию страницы и не вводить пользователя в заблуждение.",
        check: "Сравнить title, URL, description, видимый H1 и первый экран страницы.",
        source: "https://developers.google.com/search/docs/appearance/title-link",
        sourceLabel: "Title links in Search",
      },
      {
        term: "Title tag",
        meaning: "HTML-тег title, главный источник заголовка результата в поиске.",
        norm: "Уникальный, конкретный, без keyword stuffing; длина — риск обрезки, а не строгий ranking-фактор.",
        check: "Проверить <title> в raw HTML и соответствие теме страницы.",
        source: "https://developers.google.com/search/docs/appearance/title-link",
        sourceLabel: "Title links",
      },
      {
        term: "Meta description",
        meaning: "Описание страницы, которое поисковик может использовать в сниппете.",
        norm: "Должно быть уникальным, полезным, соответствовать видимому контенту. Поисковик может переписать сниппет.",
        check: "Проверить meta name=description и сравнить с интентом страницы.",
        source: "https://developers.google.com/search/docs/appearance/snippet",
        sourceLabel: "Snippets",
      },
      {
        term: "H1",
        meaning: "Главный видимый заголовок страницы.",
        norm: "Один понятный главный H1 для основной темы; H2/H3 должны раскрывать структуру, а не быть декоративными.",
        check: "Проверить DOM, raw HTML и мобильную версию.",
        source: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        sourceLabel: "SEO Starter Guide",
      },
      {
        term: "Alt text",
        meaning: "Текстовая альтернатива изображения в атрибуте alt.",
        norm: "Информативные изображения получают описательный alt, декоративные — пустой alt=\"\". Не использовать keyword stuffing.",
        check: "Проверить img alt для hero, product и content images.",
        source: "https://developers.google.com/search/docs/appearance/google-images",
        sourceLabel: "Google Images SEO",
      },
      {
        term: "Crawlable links",
        meaning: "Ссылки, которые поисковик может обнаружить и перейти по ним.",
        norm: "Важные внутренние переходы должны быть настоящими <a href>, а не только кнопками, onclick или JS-состоянием.",
        check: "Проверить HTML/DOM на наличие href и финальные URL внутренних ссылок.",
        source: "https://developers.google.com/search/docs/crawling-indexing/links-crawlable",
        sourceLabel: "Make links crawlable",
      },
    ],
  },
  {
    title: "Structured data и социальные превью",
    description:
      "Разметка сущностей и карточек не заменяет контент, но помогает системам понять тип страницы, бренд, товар, статью и внешний вид ссылки при шаринге.",
    terms: [
      {
        term: "Structured data",
        meaning: "Машиночитаемая разметка сущностей и свойств страницы.",
        norm: "Разметка должна соответствовать видимому контенту и правилам поисковиков. Нельзя добавлять фейковые отзывы, рейтинги, цены или авторов.",
        check: "Проверить JSON-LD, Schema Markup Validator и Google Rich Results Test.",
        source: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
        sourceLabel: "Structured data introduction",
      },
      {
        term: "JSON-LD",
        meaning: "Рекомендуемый формат структурированных данных в виде script type=application/ld+json.",
        norm: "Должен быть валидным JSON, использовать canonical URL и не конфликтовать с другими schema-блоками.",
        check: "Извлечь JSON-LD из HTML и прогнать через validator.schema.org.",
        source: "https://schema.org/",
        sourceLabel: "Schema.org",
      },
      {
        term: "Organization",
        meaning: "Schema.org тип для компании, проекта или организации.",
        norm: "Название, logo, url и sameAs должны соответствовать реальному бренду и официальным профилям.",
        check: "Проверить Organization JSON-LD и совпадение с футером, about/contact и соцссылками.",
        source: "https://developers.google.com/search/docs/appearance/structured-data/organization",
        sourceLabel: "Organization structured data",
      },
      {
        term: "BreadcrumbList",
        meaning: "Schema.org разметка хлебных крошек.",
        norm: "Порядок элементов должен совпадать с видимой навигацией и вести на canonical URL.",
        check: "Проверить JSON-LD и видимые breadcrumbs на странице.",
        source: "https://developers.google.com/search/docs/appearance/structured-data/breadcrumb",
        sourceLabel: "Breadcrumb structured data",
      },
      {
        term: "Product / Offer",
        meaning: "Разметка товара и коммерческого предложения.",
        norm: "Цена, наличие, рейтинг и отзывы должны быть реальными и видимыми на странице.",
        check: "Сравнить Product JSON-LD с карточкой товара и валидатором rich results.",
        source: "https://developers.google.com/search/docs/appearance/structured-data/product",
        sourceLabel: "Product structured data",
      },
      {
        term: "OG / Open Graph",
        meaning: "Мета-теги для превью ссылок в соцсетях и мессенджерах.",
        norm: "og:title, og:description, og:url, og:image должны быть page-specific; изображение обычно делают около 1200x630.",
        check: "Проверить head, абсолютный og:image URL, статус изображения и дебаггеры платформ.",
        source: "https://ogp.me/",
        sourceLabel: "Open Graph protocol",
      },
      {
        term: "Twitter Cards / X Cards",
        meaning: "Разметка карточки ссылки для X/Twitter.",
        norm: "twitter:card, title, description и image должны соответствовать странице; аккаунты указывать только если они реальные.",
        check: "Проверить meta twitter:* и preview validator, если доступен.",
        source: "https://developer.x.com/en/docs/x-for-websites/cards/overview/abouts-cards",
        sourceLabel: "X Cards overview",
      },
    ],
  },
  {
    title: "Производительность и мобильная пригодность",
    description:
      "Метрики из web.dev, PageSpeed Insights и Lighthouse важны как диагностика пользовательского опыта. Field data и lab data нужно разделять.",
    terms: [
      {
        term: "CWV / Core Web Vitals",
        meaning: "Набор ключевых пользовательских метрик: LCP, INP, CLS.",
        norm: "Для хорошего URL: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 по полевым данным 75-го перцентиля.",
        check: "PageSpeed Insights, CrUX/Search Console Core Web Vitals, Lighthouse как lab-подсказка.",
        source: "https://web.dev/articles/defining-core-web-vitals-thresholds",
        sourceLabel: "Core Web Vitals thresholds",
      },
      {
        term: "LCP",
        meaning: "Largest Contentful Paint: время появления крупнейшего видимого элемента.",
        norm: "Хорошо: <= 2.5s. Нужно улучшить: 2.5-4s. Плохо: > 4s.",
        check: "Определить LCP-элемент в Lighthouse/PageSpeed и проверить hero image, TTFB, CSS/JS блокировки.",
        source: "https://web.dev/articles/optimize-lcp",
        sourceLabel: "Optimize LCP",
      },
      {
        term: "INP",
        meaning: "Interaction to Next Paint: отзывчивость страницы на пользовательские действия.",
        norm: "Хорошо: <= 200ms. Нужно улучшить: 200-500ms. Плохо: > 500ms.",
        check: "Использовать field data, DevTools Performance и искать тяжёлый JS, long tasks, third-party scripts.",
        source: "https://web.dev/articles/optimize-inp",
        sourceLabel: "Optimize INP",
      },
      {
        term: "CLS",
        meaning: "Cumulative Layout Shift: суммарные сдвиги макета.",
        norm: "Хорошо: <= 0.1. Нужно улучшить: 0.1-0.25. Плохо: > 0.25.",
        check: "Проверить размеры изображений, font loading, баннеры, iframe, ads и динамические блоки.",
        source: "https://web.dev/articles/optimize-cls",
        sourceLabel: "Optimize CLS",
      },
      {
        term: "FCP",
        meaning: "First Contentful Paint: когда браузер впервые нарисовал текст или изображение.",
        norm: "Используется как лабораторная диагностика ранней загрузки, не входит в CWV как основной фактор.",
        check: "Lighthouse/PageSpeed, network waterfall, render-blocking resources.",
        source: "https://developers.google.com/speed/docs/insights/v5/about",
        sourceLabel: "PageSpeed Insights",
      },
      {
        term: "TBT",
        meaning: "Total Blocking Time: лабораторная оценка блокировки главного потока JS.",
        norm: "Чем ниже, тем лучше; используется в Lighthouse как lab-прокси проблем отзывчивости, но не заменяет INP.",
        check: "Lighthouse diagnostics, DevTools long tasks, объём JS и third-party scripts.",
        source: "https://developer.chrome.com/docs/lighthouse/performance/performance-scoring",
        sourceLabel: "Lighthouse performance scoring",
      },
      {
        term: "TTFB",
        meaning: "Time To First Byte: время до первого байта ответа сервера.",
        norm: "Низкий TTFB помогает LCP; высокий TTFB часто указывает на сервер, кеширование, CDN или редиректы.",
        check: "curl timing, Lighthouse, WebPageTest/DevTools network.",
        source: "https://web.dev/articles/optimize-lcp",
        sourceLabel: "LCP and server response",
      },
      {
        term: "Viewport meta",
        meaning: "HTML meta viewport для корректного отображения на мобильных устройствах.",
        norm: "Обычно нужен <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
        check: "Проверить head, мобильный rendering, отсутствие горизонтального скролла и размер tap targets.",
        source: "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag",
        sourceLabel: "MDN viewport meta tag",
      },
      {
        term: "Brotli / gzip",
        meaning: "Сжатие HTTP-ответов для уменьшения размера передачи.",
        norm: "HTML, CSS, JS, JSON и SVG обычно должны отдаваться со сжатием br или gzip.",
        check: "curl -I с Accept-Encoding и анализ Content-Encoding.",
        source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression",
        sourceLabel: "HTTP compression",
      },
    ],
  },
  {
    title: "GEO, AI Search и LLM readiness",
    description:
      "Экспериментальный слой поверх классического SEO: помогает AI-системам понять сущность, факты и важные страницы, но не гарантирует попадание в AI-ответы.",
    terms: [
      {
        term: "GEO",
        meaning: "Generative Engine Optimization: подготовка контента к пониманию генеративными поисковыми системами.",
        norm: "Не заменяет SEO. Базовая норма — ясные факты в HTML, понятная структура, schema и доступность публичного контента.",
        check: "Проверить entity clarity, headings, summary, schema, robots policy для AI crawlers.",
        source: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
        sourceLabel: "Google AI optimization guide",
      },
      {
        term: "LLM",
        meaning: "Large Language Model: большая языковая модель, например системы ответов и AI-ассистенты.",
        norm: "Ключевые сведения должны быть текстом в HTML, а не только в картинках, canvas, видео или JS-only виджетах.",
        check: "Сравнить raw HTML, rendered DOM и видимый контент важных страниц.",
        source: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
        sourceLabel: "AI features and your website",
      },
      {
        term: "llms.txt",
        meaning: "Текстовый Markdown-файл с кратким описанием сайта и ссылками для AI-агентов.",
        norm: "Опционально и экспериментально. Не является обязательным для Google и не гарантирует ranking. Не должен противоречить sitemap, robots и canonical.",
        check: "Открыть /llms.txt, проверить 200, text/plain, полезные canonical ссылки и отсутствие private/admin URL.",
        source: "https://llmstxt.org/",
        sourceLabel: "llms.txt proposal",
      },
      {
        term: "GPTBot / AI crawlers",
        meaning: "Краулеры AI-платформ, которые могут собирать публичный веб-контент по своим правилам.",
        norm: "Доступ или блокировка должны быть осознанной политикой, а не случайным эффектом WAF, CDN или robots.txt.",
        check: "Проверить robots.txt, CDN bot rules, server logs при наличии и официальные user-agent политики.",
        source: "https://openai.com/gptbot",
        sourceLabel: "OpenAI GPTBot",
      },
    ],
  },
  {
    title: "Поисковые системы и webmaster-инструменты",
    description:
      "Source corpus опирается не только на Google: для рынка и региона могут быть важны Bing, IndexNow, Yandex, Baidu, Naver и Seznam.",
    terms: [
      {
        term: "GSC",
        meaning: "Google Search Console: официальный инструмент Google для мониторинга сайта в поиске.",
        norm: "Используется для подтверждения индексации, запросов, страниц, CWV и технических проблем. Без доступа эти разделы надо помечать как not assessed.",
        check: "Проверить Coverage/Pages, URL Inspection, Performance, Links, Core Web Vitals.",
        source: "https://search.google.com/search-console/about",
        sourceLabel: "Google Search Console",
      },
      {
        term: "Bing Webmaster Tools",
        meaning: "Панель Microsoft/Bing для индексации, sitemap, backlinks и диагностики.",
        norm: "Релевантна для Bing/Yahoo и рынков, где Bing даёт заметную долю поиска.",
        check: "Проверить sitemap, IndexNow, crawl errors, backlinks и рекомендации Bing.",
        source: "https://www.bing.com/webmasters/about",
        sourceLabel: "Bing Webmaster Tools",
      },
      {
        term: "IndexNow",
        meaning: "Протокол уведомления поисковиков об изменениях URL.",
        norm: "Полезен для Bing и поддерживающих поисковиков; не заменяет sitemap и внутреннюю перелинковку.",
        check: "Проверить наличие key-файла/endpoint и отправку изменённых URL.",
        source: "https://www.indexnow.org/",
        sourceLabel: "IndexNow",
      },
      {
        term: "Yandex Webmaster",
        meaning: "Инструмент Яндекса для диагностики сайта в поиске Яндекса.",
        norm: "Важен для RU/CIS проектов: sitemap, robots, canonical, региональность, микроразметка и ошибки обхода.",
        check: "Проверить данные в Yandex Webmaster и валидатор микроразметки.",
        source: "https://webmaster.yandex.com/",
        sourceLabel: "Yandex Webmaster",
      },
      {
        term: "Baidu / Naver / Seznam",
        meaning: "Региональные поисковые экосистемы Китая, Кореи и Чехии.",
        norm: "Оцениваются только если целевой рынок соответствует региону; требования и инструменты отличаются от Google.",
        check: "Использовать соответствующие webmaster-инструменты и региональные правила индексации.",
        source: "https://searchadvisor.naver.com/guide",
        sourceLabel: "Naver Search Advisor",
      },
    ],
  },
  {
    title: "Ссылки, локальное SEO и entity trust",
    description:
      "Эти блоки нельзя оценивать по догадкам. Нужны выгрузки backlink-инструментов, профили бизнеса или видимые данные сайта.",
    terms: [
      {
        term: "Backlinks",
        meaning: "Внешние ссылки с других сайтов на ваш сайт.",
        norm: "Оцениваются только по данным GSC, Bing, Ahrefs, Semrush, Majestic или экспортам. Без данных раздел помечается Not assessed.",
        check: "Проверить referring domains, anchors, top linked pages, ссылки на 404/redirect/non-canonical URL.",
        source: "https://support.google.com/webmasters/answer/9049606",
        sourceLabel: "Google links report",
      },
      {
        term: "Referring domains",
        meaning: "Количество уникальных доменов, которые ссылаются на сайт.",
        norm: "Важнее качества и релевантность доменов, чем голое количество ссылок.",
        check: "Сравнить топ-домены, тематику, страны, распределение ссылок и историю потерь.",
        source: "https://majestic.com/support/faq/what-are-referring-domains",
        sourceLabel: "Majestic referring domains",
      },
      {
        term: "Anchor text",
        meaning: "Текст внешней или внутренней ссылки.",
        norm: "Профиль должен выглядеть естественно: branded, URL, navigation и умеренные коммерческие anchors. Спам exact-match — риск.",
        check: "Проанализировать anchor export из Ahrefs/Semrush/GSC.",
        source: "https://ahrefs.com/blog/anchor-text/",
        sourceLabel: "Ahrefs anchor text",
      },
      {
        term: "NAP",
        meaning: "Name, Address, Phone: название, адрес и телефон локального бизнеса.",
        norm: "Данные должны быть консистентны на сайте, в schema, Google Business Profile, Yandex Business и картах. Фейковый адрес использовать нельзя.",
        check: "Сравнить contact/about, LocalBusiness schema и публичные профили.",
        source: "https://support.google.com/business/answer/3038177",
        sourceLabel: "Google Business Profile",
      },
      {
        term: "GBP",
        meaning: "Google Business Profile: карточка компании в Google.",
        norm: "Релевантно для локальных и service-area бизнесов; категория, контакты, часы, сайт и адрес должны быть точными.",
        check: "Проверить карточку, верификацию, NAP, категории и ссылку на сайт.",
        source: "https://business.google.com/us/business-profile/",
        sourceLabel: "Google Business Profile",
      },
      {
        term: "sameAs",
        meaning: "Schema.org свойство для официальных профилей бренда или персоны.",
        norm: "Указывать только реальные официальные профили, которые бренд поддерживает.",
        check: "Сравнить Organization schema с футером и профилями соцсетей.",
        source: "https://schema.org/Organization",
        sourceLabel: "Schema.org Organization",
      },
    ],
  },
  {
    title: "Аналитика, маркетинг и техническое доверие",
    description:
      "Эти проверки помогают измерять SEO и поддерживать доверие к домену, но не все являются прямыми SEO-факторами.",
    terms: [
      {
        term: "GA4",
        meaning: "Google Analytics 4: аналитика посещений, событий и конверсий.",
        norm: "Должны отслеживаться ключевые действия: формы, звонки, email/messenger clicks, checkout, purchase или заявки.",
        check: "Проверить GA4 property, events, conversions, ecommerce events и отсутствие дублей тегов.",
        source: "https://support.google.com/analytics/answer/10089681",
        sourceLabel: "Google Analytics 4",
      },
      {
        term: "GTM",
        meaning: "Google Tag Manager: контейнер для тегов аналитики и маркетинга.",
        norm: "Полезен для управления тегами, но отсутствующий GTM сам по себе не SEO-ошибка.",
        check: "Проверить контейнер, дубли, consent mode и события.",
        source: "https://support.google.com/tagmanager/answer/6102821",
        sourceLabel: "Google Tag Manager",
      },
      {
        term: "Yandex Metrica",
        meaning: "Система аналитики Яндекса.",
        norm: "Важна для RU/CIS проектов, целей, ecommerce и анализа поведения, но missing pixel — это measurement gap, не ranking-фактор.",
        check: "Проверить счётчик, цели, ecommerce и consent/privacy настройки.",
        source: "https://yandex.com/support/metrica/en/",
        sourceLabel: "Yandex Metrica",
      },
      {
        term: "SPF",
        meaning: "DNS-запись, которая указывает разрешённые серверы отправки почты домена.",
        norm: "Нужна для email deliverability и защиты от подделки, но не является прямым SEO-ranking фактором.",
        check: "Проверить TXT SPF запись домена через DNS lookup.",
        source: "https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/",
        sourceLabel: "SPF record",
      },
      {
        term: "DKIM",
        meaning: "Подпись email-сообщений, подтверждающая, что письмо не изменено и отправлено авторизованно.",
        norm: "Нужен для доверия к почте домена; не должен подаваться как прямой фактор ранжирования.",
        check: "Проверить DKIM selector в DNS, если известен почтовый провайдер.",
        source: "https://www.cloudflare.com/learning/dns/dns-records/dns-dkim-record/",
        sourceLabel: "DKIM record",
      },
      {
        term: "DMARC",
        meaning: "Политика обработки писем, которые не прошли SPF/DKIM.",
        norm: "Желательно иметь DMARC с осознанной политикой none/quarantine/reject и отчётами.",
        check: "Проверить TXT запись _dmarc.example.com.",
        source: "https://dmarc.org/overview/",
        sourceLabel: "DMARC overview",
      },
      {
        term: "HSTS",
        meaning: "HTTP Strict-Transport-Security: заголовок, заставляющий браузер использовать HTTPS.",
        norm: "Полезен для безопасности HTTPS, но требует аккуратной настройки, особенно с поддоменами.",
        check: "curl -I и проверка Strict-Transport-Security.",
        source: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
        sourceLabel: "MDN HSTS",
      },
      {
        term: "CDN / WAF",
        meaning: "Content Delivery Network и Web Application Firewall: доставка и защита трафика.",
        norm: "Не должны случайно блокировать поисковых и нужных AI-краулеров или отдавать им неполный контент.",
        check: "Проверить bot rules, cache headers, geo/firewall rules, server logs и ответы для user-agent.",
        source: "https://developers.cloudflare.com/ai-crawl-control/",
        sourceLabel: "Cloudflare AI crawl control",
      },
    ],
  },
];

const QUICK_RULES = [
  "Официальная документация важнее tool-score и блогов, если рекомендации конфликтуют.",
  "Автоматический аудит — источник гипотез, а не готовая истина.",
  "Полевые Core Web Vitals и лабораторный Lighthouse нельзя смешивать без пометки источника.",
  "Backlinks, rankings, Search Console и analytics не оцениваются без выгрузки или доступа.",
  "GEO и llms.txt — дополнительный слой ясности, а не замена техническому SEO.",
] as const;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/knowledge`,
    languages: withHreflang("/knowledge"),
  },
  openGraph: {
    title: `База знаний SEO — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/knowledge`,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `База знаний SEO — ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `База знаний SEO — ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: ["/twitter-image"],
  },
};

function buildKnowledgeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      webPageSchema({
        path: "/knowledge",
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
      }),
      pageBreadcrumb("База знаний", "/knowledge"),
      {
        "@type": "DefinedTermSet",
        "@id": `${SITE_URL}/knowledge#terms`,
        name: "База знаний SEO Seofriendly",
        inLanguage: "ru-RU",
        hasDefinedTerm: KNOWLEDGE_SECTIONS.flatMap((section) =>
          section.terms.map((item) => ({
            "@type": "DefinedTerm",
            "@id": `${SITE_URL}/knowledge#${getTermId(item.term)}`,
            url: `${SITE_URL}/knowledge#${getTermId(item.term)}`,
            name: item.term,
            description: item.meaning,
            termCode: item.term,
            inDefinedTermSet: `${SITE_URL}/knowledge#terms`,
          }))
        ),
      },
    ],
  };
}

export default function KnowledgePage() {
  const structuredData = buildKnowledgeStructuredData();

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="paper-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Breadcrumbs items={[{ label: "База знаний" }]} className="mb-3" />
          <PageHeader
            title="База знаний SEO"
            description="Расшифровка терминов из источников SEO-аудита: что означает аббревиатура, какая норма считается здоровой и чем проверить факт."
          />

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-[0_18px_70px_rgba(27,27,25,0.06)] sm:p-6">
              <p className="eyebrow text-faint">source corpus</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">
                Откуда взяты нормы
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Основа справочника — файл <span className="font-mono text-ink">10-source-corpus.md</span> из
                SEO-скилла. Он задаёт порядок доверия: сначала официальная
                документация поисковиков и платформ, затем сторонние инструменты
                как источники workflow-идей.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {SOURCE_GROUPS.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-line bg-paper px-3 py-1.5 text-[12px] font-medium text-ink-soft"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-line bg-ink p-5 text-paper shadow-[0_18px_70px_rgba(27,27,25,0.12)] sm:p-6">
              <p className="eyebrow text-paper/55">правила чтения</p>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-paper/78">
                {QUICK_RULES.map((rule) => (
                  <li key={rule} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </section>

          <nav
            aria-label="Разделы базы знаний"
            className="mt-10 rounded-2xl border border-line bg-surface/85 p-4"
          >
            <p className="eyebrow text-faint">разделы</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {KNOWLEDGE_SECTIONS.map((section) => (
                <a
                  key={section.title}
                  href={`#${getSectionId(section.title)}`}
                  className="inline-flex min-h-[40px] items-center rounded-full border border-line bg-paper px-3 text-[13px] font-medium text-muted transition hover:border-line-strong hover:text-ink"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </nav>

          <div className="mt-10 space-y-12">
            {KNOWLEDGE_SECTIONS.map((section) => (
              <section
                key={section.title}
                id={getSectionId(section.title)}
                className="scroll-mt-28"
              >
                <div className="max-w-3xl">
                  <p className="eyebrow text-faint">knowledge block</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted">
                    {section.description}
                  </p>
                </div>

                <div className="mt-5 grid gap-3">
                  {section.terms.map((item) => (
                    <article
                      key={`${section.title}-${item.term}`}
                      id={getTermId(item.term)}
                      className="scroll-mt-28 rounded-2xl border border-line bg-surface p-5 shadow-[0_12px_45px_rgba(27,27,25,0.045)] sm:p-6"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-mono text-[16px] font-semibold text-ink">
                            {item.term}
                          </h3>
                          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink-soft">
                            {item.meaning}
                          </p>
                        </div>
                        <a
                          href={item.source}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-[40px] max-w-full items-center gap-1.5 rounded-full border border-line bg-paper px-3 text-[12px] font-medium text-muted transition hover:border-line-strong hover:text-ink sm:max-w-[18rem]"
                          aria-label={`Первоисточник: ${item.sourceLabel}`}
                        >
                          <span className="truncate">{item.sourceLabel}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>

                      <dl className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl bg-paper p-4">
                          <dt className="eyebrow text-faint">норма</dt>
                          <dd className="mt-2 text-[13px] leading-relaxed text-muted">
                            {item.norm}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-paper p-4">
                          <dt className="eyebrow text-faint">как проверить</dt>
                          <dd className="mt-2 text-[13px] leading-relaxed text-muted">
                            {item.check}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-paper p-4">
                          <dt className="eyebrow text-faint">первоисточник</dt>
                          <dd className="mt-2 text-[13px] leading-relaxed text-muted">
                            {item.sourceLabel}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
