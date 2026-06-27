// Фабрики JSON-LD для внутренних страниц. Главная страница собирает свой
// @graph вручную (src/app/page.tsx) — там много уникальных блоков
// (WebSite, Organization, WebApplication, FAQPage). Здесь — типовые
// обёртки для остальных страниц: WebPage + BreadcrumbList, плюс
// узкоспециализированные типы (AboutPage, ContactPage, PrivacyPage),
// которые Google понимает лучше generic WebPage.
//
// Все схемы ссылаются на Organization через @id SITE_URL/#organization,
// чтобы поисковик связал сущности в один граф.

import { SITE_URL } from "@/lib/site";

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

type BreadcrumbItem = {
  name: string;
  href: string;
};

// BreadcrumbList: «Главная → <имя страницы>».
export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.href.startsWith("/") ? item.href : `/${item.href}`}`,
    })),
  };
}

const HOME_CRUMB: BreadcrumbItem = { name: "Главная", href: "/" };

export function pageBreadcrumb(currentName: string, currentHref: string) {
  return breadcrumbSchema([HOME_CRUMB, { name: currentName, href: currentHref }]);
}

// WebPage общего назначения. Используется там, где нет узкого типа.
export function webPageSchema(params: {
  path: string;
  name: string;
  description: string;
  pageType?:
    | "WebPage"
    | "AboutPage"
    | "ContactPage"
    | "PrivacyPolicy"
    | "WebApplication";
  dateModified?: string;
}) {
  const url = `${SITE_URL}${params.path.startsWith("/") ? params.path : `/${params.path}`}`;
  return {
    "@context": "https://schema.org",
    "@type": params.pageType ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: params.name,
    description: params.description,
    inLanguage: "ru-RU",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    dateModified: params.dateModified ?? new Date().toISOString(),
  };
}
