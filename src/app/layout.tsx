import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AppBar } from "@/components/AppBar";
import { Footer } from "@/components/Footer";
import { ConsentBanner } from "@/components/ConsentBanner";
import { SITE_URL, withHreflang } from "@/lib/site";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const SITE_NAME = "Seofriendly";
const SITE_DESCRIPTION =
  "Seofriendly — бесплатный SEO-аудит сайта нейросетью: sitemap.xml, robots.txt, canonical, мета-теги, скорость и адаптивность.";

// Twitter handle — заполни здесь при появлении аккаунта. Сейчас явно
// пусто, чтобы поля не рендерились как @undefined.
const TWITTER_SITE: string | undefined = undefined;
const TWITTER_CREATOR: string | undefined = undefined;

// Yandex.Metrika и consent-баннер живут в @/components/ConsentBanner —
// он сам читает NEXT_PUBLIC_YANDEX_METRIKA_ID и грузит счётчик только
// после явного согласия пользователя.

const SITE_NAVIGATION = [
  { name: "Главная", url: `${SITE_URL}/` },
  { name: "Аудит", url: `${SITE_URL}/audit` },
  { name: "Услуги", url: `${SITE_URL}/services` },
  { name: "База знаний", url: `${SITE_URL}/knowledge` },
  { name: "Контакты", url: `${SITE_URL}/contacts` },
] as const;

function buildNavigationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/#site-navigation`,
    name: "Основные разделы Seofriendly",
    itemListElement: SITE_NAVIGATION.map((item, index) => ({
      "@type": "SiteNavigationElement",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "бесплатный SEO-аудит",
    "SEO-аудит сайта",
    "нейросеть SEO",
    "Seofriendly",
    "seofrendly",
    "проверка сайта",
    "sitemap.xml",
    "robots.txt",
    "canonical",
    "Core Web Vitals",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: `${SITE_URL}/`,
    languages: withHreflang("/"),
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — бесплатный SEO-аудит сайта нейросетью`,
    description: SITE_DESCRIPTION,
    images: ["/twitter-image"],
    ...(TWITTER_SITE ? { site: TWITTER_SITE } : {}),
    ...(TWITTER_CREATOR ? { creator: TWITTER_CREATOR } : {}),
  },
  // Icons and PWA manifest are wired through file conventions in `src/app/`
  // (`favicon.ico`, `icon.png`, `icon16.png`, `apple-icon.png`, `icon192.png`,
  // `icon512.png`, `manifest.webmanifest`). Next.js auto-emits the right
  // `<link>` tags from those files, so we don't repeat them here.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
  other: {
    "geo.region": "RU",
    "theme-color": "#1b1b19",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1b19",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const navigationStructuredData = buildNavigationStructuredData();

  return (
    <html
      lang="ru"
      className={`${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="bg-paper text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(navigationStructuredData),
          }}
        />
        <AppBar />
        {children}
        <Footer />
        <ConsentBanner />
      </body>
    </html>
  );
}
