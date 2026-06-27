import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  /** Текст ссылки. */
  label: string;
  /** Куда ведёт. */
  href?: string;
}

export interface BreadcrumbsProps {
  /** Последний элемент — текущая страница (без ссылки, aria-current). */
  items: BreadcrumbItem[];
  /** Доп. класс на корневой <nav>. */
  className?: string;
}

/**
 * Визуальные хлебные крошки. Семантика <nav aria-label> + <ol> +
 * aria-current="page" на последнем элементе. JSON-LD BreadcrumbList
 * добавляется отдельно через src/lib/structuredData.pageBreadcrumb —
 * этот компонент только рисует.
 *
 * По умолчанию первым пунктом идёт «Главная» с иконкой домика. Чтобы
 * не дублировать, просто передавайте items без дома.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Хлебные крошки" className={className}>
      <ol className="flex min-h-[32px] flex-wrap items-center gap-x-1 gap-y-1 text-[13px] text-muted">
        <li>
          <Link
            href="/"
            className="inline-flex min-h-[28px] items-center gap-1.5 rounded-md px-1.5 py-0.5 transition hover:bg-paper hover:text-ink"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Главная</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.href ?? item.label}-${index}`}
              className="flex min-h-[28px] items-center gap-1"
            >
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-faint"
                aria-hidden="true"
              />
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={
                    isLast
                      ? "rounded-md px-1.5 py-0.5 font-medium text-ink"
                      : "px-1.5 py-0.5"
                  }
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="rounded-md px-1.5 py-0.5 transition hover:bg-paper hover:text-ink"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
