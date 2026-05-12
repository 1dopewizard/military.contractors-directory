/**
 * Manual Schema.org JSON-LD injection composables
 * Replacement for nuxt-schema-org until h3 v2 compatibility is fixed
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

import type { Ref } from "vue";

/**
 * Generic JSON-LD injection via useHead()
 * Automatically wraps data with @context
 */
export function useJsonLd(
  schema: Record<string, any> | (() => Record<string, any>),
) {
  const schemaData = computed(() => {
    const data = typeof schema === "function" ? schema() : schema;
    return {
      "@context": "https://schema.org",
      ...data,
    };
  });

  useHead({
    script: [
      {
        type: "application/ld+json",
        innerHTML: computed(() => JSON.stringify(schemaData.value)),
      },
    ],
  });
}

/**
 * Multiple schemas injection (for pages needing multiple schema types)
 */
export function useJsonLdMultiple(
  schemas: Array<Record<string, any> | (() => Record<string, any>)>,
) {
  schemas.forEach((schema) => useJsonLd(schema));
}

/**
 * WebSite schema with SearchAction for homepage
 * Enables Google's search box feature
 */
export function useWebSiteSchema(options?: {
  name?: string;
  description?: string;
  url?: string;
}) {
  const config = useRuntimeConfig();

  useJsonLd({
    "@type": "WebSite",
    name: options?.name || "military.contractors",
    description:
      options?.description ||
      "Open intelligence on U.S. defense contractors, public awards, agencies, categories, and spending trends.",
    url:
      options?.url || config.public.siteUrl || "https://military.contractors",
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${options?.url || config.public.siteUrl || "https://military.contractors"}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}

/**
 * WebPage schema for general pages
 */
export function useWebPageSchema(options: {
  name: string;
  description: string;
  type?: string;
}) {
  useJsonLd({
    "@type": options.type || "WebPage",
    name: options.name,
    description: options.description,
  });
}

/**
 * Organization schema for company pages
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/organization
 */
export function useOrganizationSchema(org: Ref<any>) {
  useJsonLd(() => {
    if (!org.value) return { "@type": "Organization" };

    const o = org.value;

    return {
      "@type": "Organization",
      name: o.name || "",
      description: o.summary || o.description || "",
      url: o.websiteUrl || undefined,
      logo: o.logoUrl || undefined,
    };
  });
}

/**
 * CollectionPage schema for listing pages
 */
export function useCollectionPageSchema(options: {
  name: string;
  description: string;
}) {
  useJsonLd({
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
  });
}

/**
 * Article schema for insights/blog pages
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/article
 */
export function useArticleSchema(options: {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
  url?: string;
}) {
  const config = useRuntimeConfig();
  const baseUrl = config.public.siteUrl || "https://military.contractors";
  const route = useRoute();

  useJsonLd({
    "@type": "Article",
    headline: options.headline,
    description: options.description,
    datePublished: options.datePublished,
    dateModified: options.dateModified || options.datePublished,
    author: {
      "@type": "Organization",
      name: options.author || "military.contractors",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "military.contractors",
      url: baseUrl,
    },
    image: options.image
      ? options.image.startsWith("http")
        ? options.image
        : `${baseUrl}${options.image}`
      : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": options.url || `${baseUrl}${route.path}`,
    },
  });
}

/**
 * BreadcrumbList schema for navigation
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */
export function useBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  const config = useRuntimeConfig();
  const baseUrl = config.public.siteUrl || "https://military.contractors";

  useJsonLd({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  });
}
