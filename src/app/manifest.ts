import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Seofriendly — бесплатный SEO-аудит нейросетью",
    short_name: "Seofriendly",
    description:
      "Бесплатный SEO-аудит сайта нейросетью. Браузерная проверка sitemap, robots, canonical, мета-тегов, скорости и адаптивности.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f5f1",
    theme_color: "#1b1b19",
    lang: "ru-RU",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
