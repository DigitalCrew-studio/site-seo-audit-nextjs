import type { MetadataRoute } from "next";

const SITE_URL = "https://seofrendly.ru";

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
  ];
}
