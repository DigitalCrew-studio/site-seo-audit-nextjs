export type KnowledgeSource = {
  label: string;
  href: string;
};

export type KnowledgeSection = {
  id: string;
  title: string;
  lead?: string;
  paragraphs?: string[];
  bullets?: string[];
  sources?: KnowledgeSource[];
};

export type KnowledgeFaq = {
  question: string;
  answer: string;
};

export type KnowledgeArticle = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  intro: string;
  readingTime: string;
  keywords: string[];
  sections: KnowledgeSection[];
  faq: KnowledgeFaq[];
  sources: KnowledgeSource[];
};

const googleSeoStarter: KnowledgeSource = {
  label: "Google Search Central: SEO Starter Guide",
  href: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
};

const googleCrawling: KnowledgeSource = {
  label: "Google Search Central: Crawling and indexing",
  href: "https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers",
};

const googleTitleLinks: KnowledgeSource = {
  label: "Google Search Central: title links",
  href: "https://developers.google.com/search/docs/appearance/title-link",
};

const googleSnippets: KnowledgeSource = {
  label: "Google Search Central: snippets",
  href: "https://developers.google.com/search/docs/appearance/snippet",
};

const googleRobots: KnowledgeSource = {
  label: "Google Search Central: robots.txt",
  href: "https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt",
};

const googleSitemap: KnowledgeSource = {
  label: "Google Search Central: sitemaps",
  href: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap",
};

const googleCanonical: KnowledgeSource = {
  label: "Google Search Central: canonical URLs",
  href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
};

const googleStructuredData: KnowledgeSource = {
  label: "Google Search Central: structured data",
  href: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
};

const webVitals: KnowledgeSource = {
  label: "web.dev: Core Web Vitals",
  href: "https://web.dev/vitals/",
};

const yandexWebmaster: KnowledgeSource = {
  label: "Яндекс Вебмастер: помощь владельцам сайтов",
  href: "https://yandex.ru/support/webmaster/",
};

const yandexIndexing: KnowledgeSource = {
  label: "Яндекс Вебмастер: индексирование сайта",
  href: "https://yandex.ru/support/webmaster/indexing-options/",
};

const schemaOrg: KnowledgeSource = {
  label: "Schema.org",
  href: "https://schema.org/",
};

const mdnStatus: KnowledgeSource = {
  label: "MDN: HTTP response status codes",
  href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status",
};

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    slug: "what-is-seo",
    title: "Что такое SEO простыми словами и зачем оно нужно сайту",
    shortTitle: "Что такое SEO",
    description:
      "SEO простыми словами: как поисковые системы находят, понимают и показывают сайт, чем SEO отличается от рекламы и что важно настроить в первую очередь.",
    intro:
      "SEO — это работа над сайтом, которая помогает поисковым системам найти страницы, понять их смысл и показать пользователям по подходящим запросам.",
    readingTime: "7 минут",
    keywords: ["что такое SEO", "что такое сео", "зачем нужно SEO", "SEO простыми словами"],
    sections: [
      {
        id: "short-answer",
        title: "Короткий ответ",
        paragraphs: [
          "SEO расшифровывается как Search Engine Optimization — оптимизация сайта для поисковых систем. На практике это не один трюк, а совокупность технических, контентных и продуктовых улучшений: сайт должен открываться без ошибок, быть понятным пользователю, содержать полезный текст и не мешать поисковому роботу обходить важные страницы.",
          "Хорошее SEO не обещает конкретную позицию в выдаче. Оно снижает технические препятствия, делает страницы понятнее и помогает поисковой системе корректно сопоставить страницу с запросом пользователя.",
        ],
        sources: [googleSeoStarter],
      },
      {
        id: "how-search-works",
        title: "Как поисковик работает с сайтом",
        paragraphs: [
          "Упрощённо процесс состоит из трёх этапов: поисковик находит URL, обходит страницу и решает, стоит ли показывать её в результатах. На каждом этапе возможны ошибки: страница может быть закрыта в robots.txt, отдавать 404, иметь noindex, конфликтующий canonical или слишком мало понятного контента.",
          "Поэтому SEO-аудит начинается не с подбора ключевых слов, а с проверки доступности и смысла страницы: какой URL видит робот, какой HTML получает, какие ссылки ведут на страницу и что написано в title, description, H1 и основном тексте.",
        ],
        sources: [googleCrawling, yandexIndexing],
      },
      {
        id: "seo-vs-ads",
        title: "Чем SEO отличается от рекламы",
        paragraphs: [
          "Реклама покупает показы или клики. SEO работает с органической выдачей: поисковая система сама решает, какие страницы лучше отвечают на запрос. Поэтому SEO обычно медленнее рекламы, но помогает строить долгосрочный канал трафика и доверие к сайту.",
          "SEO не заменяет рекламу и не гарантирует быстрый результат. Его задача — сделать сайт технически здоровым, понятным и полезным, чтобы поисковик мог уверенно показывать его там, где это релевантно.",
        ],
      },
      {
        id: "first-steps",
        title: "Что проверить в первую очередь",
        lead: "Минимальный стартовый набор SEO-проверок подходит почти для любого сайта.",
        bullets: [
          "Главная и важные страницы возвращают HTTP 200, а не 404, 500 или длинные цепочки редиректов.",
          "Важные страницы не закрыты в robots.txt, meta robots или X-Robots-Tag.",
          "У каждой страницы есть уникальный title, понятный H1 и описание, соответствующее содержанию.",
          "В sitemap.xml попадают только канонические индексируемые URL.",
          "Внутренние ссылки сделаны обычными ссылками с href, а не только JavaScript-кнопками.",
          "Страница нормально читается на мобильном экране и не скрывает основной контент.",
        ],
        sources: [googleTitleLinks, googleSnippets, googleSitemap],
      },
    ],
    faq: [
      {
        question: "SEO — это только ключевые слова?",
        answer:
          "Нет. Ключевые слова помогают понять спрос, но SEO также включает техническую доступность, структуру сайта, внутренние ссылки, скорость, мобильную версию, сниппеты и доверие к источнику.",
      },
      {
        question: "Можно ли сделать SEO один раз?",
        answer:
          "Базовую техническую настройку можно сделать один раз, но сайт меняется: появляются новые страницы, редиректы, ошибки, конкуренты и требования поисковых систем. Поэтому SEO нужно периодически проверять.",
      },
    ],
    sources: [googleSeoStarter, googleCrawling, yandexWebmaster],
  },
  {
    slug: "seo-friendly-website",
    title: "SEO-friendly сайт: что это и как сделать его понятным",
    shortTitle: "SEO-friendly сайт",
    description:
      "Что такое SEO-friendly сайт: видимый HTML-контент, понятная структура, корректные URL, мета-теги, sitemap.xml, robots.txt, скорость и мобильная версия.",
    intro:
      "SEO-friendly сайт — это сайт, который удобно читать человеку и легко понимать поисковой системе: контент доступен, структура ясная, технические сигналы не конфликтуют.",
    readingTime: "8 минут",
    keywords: ["seo friendly что это", "сео френдли сайт", "seo-friendly сайт", "как сделать сайт seo friendly"],
    sections: [
      {
        id: "definition",
        title: "Что значит SEO-friendly",
        paragraphs: [
          "SEO-friendly не означает, что сайт “набит ключами”. Наоборот: такой сайт объясняет тему страницы естественным языком, быстро открывается, не ломается на мобильных устройствах и отдаёт поисковику тот же основной контент, который видит пользователь.",
          "Если важный текст находится только на картинке, появляется после сложного JavaScript-сценария или скрыт от робота техническими правилами, сайт может выглядеть красиво для пользователя, но быть плохо понятным для поиска.",
        ],
        sources: [googleSeoStarter, googleCrawling],
      },
      {
        id: "content-html",
        title: "Контент должен быть видимым и полезным",
        paragraphs: [
          "Поисковой системе нужен текстовый смысл страницы: заголовок, основной текст, понятные подписи, ссылки и структурная иерархия. Это не значит, что страницу нужно перегружать SEO-текстом. Достаточно честно объяснить, что это за страница, кому она полезна и какое действие можно сделать дальше.",
          "Важные сущности — название бренда, домен, услуга, регион, продукт — лучше упоминать в обычном видимом тексте. Скрытый текст через display:none или font-size:0 может быть проигнорирован или воспринят как попытка манипуляции.",
        ],
        sources: [googleSeoStarter],
      },
      {
        id: "technical-signals",
        title: "Технические признаки SEO-friendly сайта",
        bullets: [
          "Стабильные URL без случайных дублей и лишних параметров.",
          "Корректный canonical на основную версию страницы.",
          "Title и description соответствуют видимому содержанию.",
          "Навигация и важные внутренние переходы доступны через обычные ссылки.",
          "robots.txt не блокирует важные разделы сайта.",
          "sitemap.xml содержит только важные канонические URL со статусом 200.",
          "Страница адаптирована под мобильные устройства и не создаёт горизонтальный скролл.",
        ],
        sources: [googleCanonical, googleRobots, googleSitemap],
      },
      {
        id: "snippet",
        title: "SEO-friendly сниппет",
        paragraphs: [
          "Сниппет в поиске не всегда совпадает с meta description: Google и Яндекс могут выбрать фрагмент текста со страницы, если считают его более подходящим запросу. Поэтому первый экран и основные блоки страницы должны быть написаны так, чтобы из них можно было собрать понятное описание.",
          "Title должен быть конкретным, а description — честно описывать страницу. Если запросное слово есть только в URL или keywords, поисковик может показать, что слово не найдено в содержании документа.",
        ],
        sources: [googleTitleLinks, googleSnippets],
      },
    ],
    faq: [
      {
        question: "SEO-friendly и mobile-friendly — это одно и то же?",
        answer:
          "Нет. Mobile-friendly означает, что сайт удобно использовать на мобильных устройствах. SEO-friendly шире: он включает мобильность, доступность для обхода, понятный контент, корректные мета-теги, canonical, sitemap и внутренние ссылки.",
      },
      {
        question: "Нужно ли писать много SEO-текста?",
        answer:
          "Нет. Лучше писать достаточно, чтобы ответить на вопрос пользователя и объяснить страницу поисковику. Вода и повторение ключей ухудшают качество страницы.",
      },
    ],
    sources: [googleSeoStarter, googleTitleLinks, googleSnippets, googleCanonical],
  },
  {
    slug: "how-to-set-up-seo",
    title: "Как настроить SEO на сайте: пошаговая инструкция",
    shortTitle: "Как настроить SEO",
    description:
      "Пошаговая инструкция по настройке SEO на сайте: индексация, title, description, H1, sitemap.xml, robots.txt, canonical, микроразметка, скорость и аналитика.",
    intro:
      "SEO-настройка начинается с технической базы: поисковик должен открыть страницу, понять её тему, найти важные ссылки и не получить конфликтующих сигналов.",
    readingTime: "10 минут",
    keywords: ["как настроить SEO", "как настроить SEO на сайте", "что нужно для SEO сайта", "SEO настройка сайта"],
    sections: [
      {
        id: "before-start",
        title: "Перед началом: выберите важные страницы",
        paragraphs: [
          "Не все страницы сайта одинаково важны для SEO. Начните с главной, страниц услуг, категорий, товаров, статей и контактов. Для каждой страницы нужно понять её задачу: какой вопрос пользователя она закрывает и какой запрос может приводить туда из поиска.",
          "После этого проще проверить title, description, H1, текст, ссылки и технические сигналы не абстрактно, а относительно конкретной цели страницы.",
        ],
      },
      {
        id: "indexing",
        title: "Шаг 1. Проверьте доступность и индексацию",
        bullets: [
          "Откройте страницу и проверьте, что она отдаёт HTTP 200.",
          "Убедитесь, что нет случайного noindex в meta robots или X-Robots-Tag.",
          "Проверьте robots.txt: важные страницы не должны быть закрыты Disallow.",
          "Добавьте сайт в Яндекс.Вебмастер и Google Search Console, если есть доступ к домену.",
        ],
        sources: [mdnStatus, googleRobots, yandexWebmaster],
      },
      {
        id: "title-description",
        title: "Шаг 2. Настройте title и description",
        paragraphs: [
          "Title — один из главных источников заголовка результата в поиске. Он должен коротко объяснять страницу: что это, для кого и чем отличается. Один и тот же title на десятках страниц мешает поисковику понять различия между ними.",
          "Meta description не гарантирует сниппет, но помогает поисковику и пользователю понять содержание страницы. Описание должно соответствовать видимому контенту, иначе поисковик может заменить его другим фрагментом.",
        ],
        sources: [googleTitleLinks, googleSnippets],
      },
      {
        id: "headings-content",
        title: "Шаг 3. Проверьте H1, подзаголовки и текст",
        paragraphs: [
          "H1 — главный видимый заголовок страницы. Он должен быть понятным без контекста меню и логотипа. H2 и H3 помогают структурировать текст: что такое услуга, кому подходит, что входит, сколько стоит, какие есть ограничения.",
          "Если пользователь ищет “как настроить SEO на сайте”, страница должна прямо отвечать на этот вопрос, а не только перечислять услуги. Такой подход полезен и для людей, и для поисковых систем.",
        ],
        sources: [googleSeoStarter],
      },
      {
        id: "sitemap-robots-canonical",
        title: "Шаг 4. Настройте sitemap.xml, robots.txt и canonical",
        bullets: [
          "В sitemap.xml добавляйте только канонические URL, которые должны индексироваться.",
          "В robots.txt не закрывайте CSS, JS и важные публичные страницы, если нет осознанной причины.",
          "Canonical должен указывать на основную версию этой же логической страницы, а не на случайный URL.",
          "Не смешивайте в индексе версии с www/без www, http/https и URL со слешем/без слеша без единой политики.",
        ],
        sources: [googleSitemap, googleRobots, googleCanonical],
      },
      {
        id: "structured-data-speed",
        title: "Шаг 5. Добавьте микроразметку и проверьте скорость",
        paragraphs: [
          "Structured data помогает явно описать сущности: организацию, хлебные крошки, статью, продукт, услугу или FAQ. Разметка должна соответствовать видимому контенту страницы — нельзя добавлять фейковые рейтинги, отзывы или цены только ради rich results.",
          "Скорость и стабильность интерфейса проверяют через Core Web Vitals: LCP, INP и CLS. Эти метрики важны не только для поиска, но и для конверсии: если страница медленно открывается или прыгает при загрузке, пользователи чаще уходят.",
        ],
        sources: [googleStructuredData, schemaOrg, webVitals],
      },
    ],
    faq: [
      {
        question: "Можно ли настроить SEO без программиста?",
        answer:
          "Часть работ можно сделать в CMS: title, description, H1, тексты, alt, внутренние ссылки. Но robots.txt, sitemap, canonical, скорость, schema и редиректы часто требуют доступа к коду, серверу или настройкам CMS.",
      },
      {
        question: "Что важнее: контент или техническое SEO?",
        answer:
          "Нужны оба слоя. Хороший контент на закрытой от индексации странице не получит трафик, а технически идеальная страница без полезного ответа не будет сильным результатом для пользователя.",
      },
    ],
    sources: [googleSeoStarter, googleTitleLinks, googleSnippets, googleSitemap, googleRobots, googleCanonical],
  },
  {
    slug: "technical-seo-checklist",
    title: "Техническое SEO: чеклист проверки сайта",
    shortTitle: "Технический чеклист",
    description:
      "Техническое SEO: чеклист проверки сайта на HTTP-статусы, редиректы, robots.txt, sitemap.xml, canonical, noindex, мета-теги, микроразметку и Core Web Vitals.",
    intro:
      "Техническое SEO проверяет, может ли поисковик без препятствий открыть сайт, найти важные страницы, понять основную версию URL и не получить противоречивые сигналы.",
    readingTime: "9 минут",
    keywords: ["техническое SEO", "SEO чеклист", "SEO аудит сайта", "техническая SEO оптимизация"],
    sections: [
      {
        id: "availability",
        title: "1. Доступность страниц и HTTP-статусы",
        paragraphs: [
          "Важные страницы должны отдавать 200 OK. Редиректы допустимы, но цепочки из нескольких 301/302 замедляют обход и усложняют диагностику. 404, 410 и 5xx на важных URL — сигнал к исправлению.",
        ],
        bullets: [
          "Проверьте главную, категории, услуги, товары и статьи.",
          "Уберите лишние цепочки редиректов.",
          "Исправьте внутренние ссылки на 404 и старые URL.",
        ],
        sources: [mdnStatus],
      },
      {
        id: "robots-noindex",
        title: "2. robots.txt, noindex и X-Robots-Tag",
        paragraphs: [
          "robots.txt управляет обходом, но не является защитой приватных данных. noindex управляет индексацией страницы. Ошибка в любом из этих мест может убрать важную страницу из поиска.",
        ],
        bullets: [
          "Проверьте /robots.txt и директивы Disallow.",
          "Проверьте meta robots в HTML.",
          "Проверьте X-Robots-Tag в HTTP-заголовках, особенно для PDF и файлов.",
        ],
        sources: [googleRobots],
      },
      {
        id: "canonical-sitemap",
        title: "3. canonical и sitemap.xml",
        paragraphs: [
          "Canonical помогает поисковику выбрать основную версию среди дублей. Sitemap помогает обнаружить важные URL. Эти сигналы должны совпадать: если sitemap ведёт на одну страницу, а canonical указывает на другую, диагностика усложняется.",
        ],
        bullets: [
          "В sitemap должны быть только 200 indexable URL.",
          "Canonical должен вести на финальный URL без редиректа.",
          "Не добавляйте в sitemap страницы с noindex, 404, редиректами и параметрами фильтров без необходимости.",
        ],
        sources: [googleCanonical, googleSitemap],
      },
      {
        id: "metadata-structure",
        title: "4. Метаданные и структура контента",
        bullets: [
          "У каждой важной страницы должен быть уникальный title.",
          "Description должен соответствовать видимому тексту страницы.",
          "H1 должен быть один основной и ясно раскрывать тему страницы.",
          "Изображения с важным смыслом должны иметь полезный alt.",
          "Важные ссылки должны быть обычными a href.",
        ],
        sources: [googleTitleLinks, googleSnippets, googleSeoStarter],
      },
      {
        id: "performance-mobile",
        title: "5. Скорость, мобильная версия и рендеринг",
        paragraphs: [
          "Технически доступная страница всё равно может плохо работать, если основной контент появляется слишком поздно, макет прыгает или мобильная версия скрывает важные блоки. Поэтому SEO-аудит должен проверять не только raw HTML, но и отрендеренную страницу.",
        ],
        sources: [webVitals],
      },
    ],
    faq: [
      {
        question: "Как часто делать технический SEO-аудит?",
        answer:
          "После крупных релизов, миграций, смены CMS, изменения структуры URL и периодически раз в несколько месяцев. Для активно обновляемых сайтов проверки стоит автоматизировать.",
      },
      {
        question: "Lighthouse 100 гарантирует хорошее SEO?",
        answer:
          "Нет. Lighthouse помогает найти часть технических проблем, но не заменяет проверку индексации, логики canonical, sitemap, robots, качества контента, ссылок и данных вебмастеров.",
      },
    ],
    sources: [mdnStatus, googleRobots, googleSitemap, googleCanonical, webVitals],
  },
  {
    slug: "yandex-seo",
    title: "SEO для Яндекса: индексация, сниппеты и частые проблемы",
    shortTitle: "SEO для Яндекса",
    description:
      "SEO для Яндекса: как подготовить сайт к индексации, почему Яндекс может переписать сниппет, что проверять в Яндекс.Вебмастере и почему появляется “Не найдено”.",
    intro:
      "Для Яндекса важны те же базовые вещи: доступность страниц, понятный текст, корректные технические сигналы, полезность результата и отсутствие противоречий между URL, метаданными и содержанием.",
    readingTime: "8 минут",
    keywords: ["SEO для Яндекса", "как попасть в Яндекс", "Яндекс не видит сайт", "Яндекс не найдено слово"],
    sections: [
      {
        id: "indexing-yandex",
        title: "Как подготовить сайт к индексации в Яндексе",
        paragraphs: [
          "Первый шаг — добавить сайт в Яндекс.Вебмастер и проверить права на домен. Там можно отправить sitemap, увидеть ошибки обхода, проверить robots.txt, диагностировать проблемы с индексацией и посмотреть, какие страницы уже известны поиску.",
          "Если страницы нет в поиске, нужно проверить не только наличие URL, но и технические запреты: robots.txt, noindex, canonical на другую страницу, редиректы, ошибки сервера и отсутствие внутренних ссылок.",
        ],
        sources: [yandexWebmaster, yandexIndexing],
      },
      {
        id: "snippet-yandex",
        title: "Почему Яндекс меняет сниппет",
        paragraphs: [
          "Поисковик может не взять meta description целиком. Он выбирает фрагмент, который считает полезным для конкретного запроса. Поэтому сниппет часто собирается из видимого текста страницы, заголовков, карточек и других фрагментов HTML.",
          "Если первый экран сайта слишком общий, а конкретные слова находятся только в URL, keywords или скрытых местах, Яндекс может показать не тот фрагмент, который ожидает владелец сайта.",
        ],
      },
      {
        id: "not-found-word",
        title: "Почему появляется “Не найдено” по слову из запроса",
        paragraphs: [
          "Сообщение “Не найдено” означает, что Яндекс не видит точного слова из запроса в основном содержимом найденного документа. Домен в URL может показываться рядом с результатом, но это не всегда считается достаточным совпадением с текстом страницы.",
          "Практический вывод простой: если бренд, домен или alias важны для поиска, их нужно упомянуть в обычном видимом HTML-тексте, а не только в canonical, URL или meta keywords. Лучше сделать это естественно: в описании сервиса, футере, странице “О сервисе” или FAQ.",
        ],
      },
      {
        id: "yandex-checklist",
        title: "Чеклист для Яндекса",
        bullets: [
          "Сайт добавлен в Яндекс.Вебмастер и права подтверждены.",
          "robots.txt доступен и не блокирует важные страницы.",
          "sitemap.xml отправлен и содержит актуальные канонические URL.",
          "Важные слова бренда, услуги и домена есть в видимом тексте страницы.",
          "Title и description соответствуют содержанию страницы.",
          "Микроразметка валидна и не противоречит видимому контенту.",
          "На сайте есть понятные страницы о сервисе, контакты и политика конфиденциальности.",
        ],
        sources: [yandexWebmaster],
      },
    ],
    faq: [
      {
        question: "Нужно ли отдельно оптимизировать сайт под Яндекс?",
        answer:
          "Базовые требования похожи на Google: доступность, понятный контент, техническая корректность и отсутствие манипуляций. Для RU-проектов дополнительно важно регулярно смотреть Яндекс.Вебмастер и учитывать, как Яндекс формирует сниппеты.",
      },
      {
        question: "Помогает ли meta keywords в Яндексе?",
        answer:
          "Не стоит рассчитывать на meta keywords как на основной сигнал. Гораздо важнее видимый текст страницы, title, description, структура, внутренние ссылки и техническая доступность.",
      },
    ],
    sources: [yandexWebmaster, yandexIndexing, googleTitleLinks, googleSnippets],
  },
];

export function getKnowledgeArticle(slug: string) {
  return KNOWLEDGE_ARTICLES.find((article) => article.slug === slug);
}
