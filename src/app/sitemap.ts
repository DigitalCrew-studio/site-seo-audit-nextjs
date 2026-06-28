import type { MetadataRoute } from "next";
import { KNOWLEDGE_ARTICLES } from "@/lib/knowledgeArticles";
import { SITE_URL, withHreflang } from "@/lib/site";

const LAST_MODIFIED = new Date(
  process.env.NEXT_PUBLIC_SITE_LASTMOD ?? "2026-06-27T00:00:00.000Z"
);

export default function sitemap(): MetadataRoute.Sitemap {
  const knowledgeArticleRoutes: MetadataRoute.Sitemap = KNOWLEDGE_ARTICLES.map(
    (article) => {
      const path = `/knowledge/${article.slug}`;
      return {
        url: `${SITE_URL}${path}`,
        lastModified: LAST_MODIFIED,
        changeFrequency: "monthly",
        priority: 0.65,
        alternates: {
          languages: withHreflang(path),
        },
      };
    }
  );

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: withHreflang("/"),
      },
    },
    {
      url: `${SITE_URL}/audit`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: withHreflang("/audit"),
      },
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: withHreflang("/services"),
      },
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: withHreflang("/about"),
      },
    },
    {
      url: `${SITE_URL}/knowledge`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: {
        languages: withHreflang("/knowledge"),
      },
    },
    ...knowledgeArticleRoutes,
    {
      url: `${SITE_URL}/knowledge/seo-terms`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.55,
      alternates: {
        languages: withHreflang("/knowledge/seo-terms"),
      },
    },
    {
      url: `${SITE_URL}/contacts`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.5,
      alternates: {
        languages: withHreflang("/contacts"),
      },
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: {
        languages: withHreflang("/privacy"),
      },
    },
  ];
}
