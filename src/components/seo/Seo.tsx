import { useEffect, useRef } from "react";

export const SITE_NAME = "HTAShop";
export const SITE_URL = "https://htashop.com";

/** Marker used to identify tags managed by this component so they can be cleaned up. */
const MARKER = "data-seo";

export interface SeoJsonLd {
  "@context"?: string;
  "@type"?: string;
  [key: string]: unknown;
}

interface SeoProps {
  /** Page title — rendered as "{title} | HTAShop" unless fullTitle is set. */
  title: string;
  /** Overrides the default "{title} | HTAShop" suffix. */
  fullTitle?: string;
  description?: string;
  keywords?: string[];
  /** Canonical path (e.g. "/products/abc") — prefixed with the site origin. */
  canonical?: string;
  /** og:image / twitter:image — CDN key or full URL. */
  image?: string;
  /** Open Graph type: website, product, article, etc. */
  type?: string;
  /** Robots directive override (defaults to "index, follow"). */
  robots?: string;
  /** Adds "noindex, nofollow" (overrides robots). */
  noindex?: boolean;
  /** JSON-LD structured data — single object or array. */
  jsonLd?: SeoJsonLd | SeoJsonLd[];
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute(MARKER, "1");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute(MARKER, "1");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data: SeoJsonLd | SeoJsonLd[]) {
  document.querySelectorAll(`script[${MARKER}="jsonld"]`).forEach((el) => el.remove());
  const blocks = Array.isArray(data) ? data : [data];
  for (const block of blocks) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(MARKER, "jsonld");
    script.textContent = JSON.stringify(block);
    document.head.appendChild(script);
  }
}

/**
 * Enterprise SEO head manager.
 *
 * Sets the document title, meta description/keywords/robots, canonical link,
 * Open Graph tags, Twitter Card tags, and JSON-LD structured data. All values
 * are dynamic per page. Every tag it creates is marked and removed on unmount
 * so metadata never leaks between routes.
 */
export function Seo({
  title,
  fullTitle,
  description,
  keywords,
  canonical,
  image,
  type = "website",
  robots,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const prevTitle = useRef<string | null>(null);

  useEffect(() => {
    const resolvedTitle = fullTitle ?? `${title} | ${SITE_NAME}`;
    prevTitle.current = document.title;
    document.title = resolvedTitle;

    const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
    const resolvedCanonical = canonical
      ? `${origin}${canonical.startsWith("/") ? canonical : `/${canonical}`}`
      : window.location.href;
    const resolvedImage = !image
      ? undefined
      : image.startsWith("http")
        ? image
        : `https://cdn.htashop.com/${image.replace(/^\//, "")}`;

    if (description) upsertMeta("name", "description", description);
    if (keywords?.length) upsertMeta("name", "keywords", keywords.join(", "));

    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : robots ?? "index, follow");

    upsertLink("canonical", resolvedCanonical);

    // Open Graph
    upsertMeta("property", "og:title", resolvedTitle);
    if (description) upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", window.location.href);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "en_US");
    if (resolvedImage) upsertMeta("property", "og:image", resolvedImage);

    // Twitter Card
    upsertMeta("name", "twitter:card", resolvedImage ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", resolvedTitle);
    if (description) upsertMeta("name", "twitter:description", description);
    if (resolvedImage) upsertMeta("name", "twitter:image", resolvedImage);

    if (jsonLd) setJsonLd(jsonLd);

    return () => {
      if (prevTitle.current != null) document.title = prevTitle.current;
      document.querySelectorAll(`[${MARKER}]`).forEach((el) => el.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, fullTitle, description, canonical, image, type, robots, noindex, jsonLd]);

  return null;
}

/** Builds an absolute site URL from a path (for JSON-LD / canonical values). */
export function siteUrl(path = ""): string {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
  return `${origin}${path}`;
}
