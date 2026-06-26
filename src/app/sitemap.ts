import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          "ru-RU": `${SITE_URL}/`,
        },
      },
    },
    {
      url: `${SITE_URL}/audit`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          "ru-RU": `${SITE_URL}/audit`,
        },
      },
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: {
          "ru-RU": `${SITE_URL}/about`,
        },
      },
    },
    {
      url: `${SITE_URL}/contacts`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
      alternates: {
        languages: {
          "ru-RU": `${SITE_URL}/contacts`,
        },
      },
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: {
        languages: {
          "ru-RU": `${SITE_URL}/privacy`,
        },
      },
    },
  ];
}
