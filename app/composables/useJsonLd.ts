/**
 * Manual Schema.org JSON-LD injection composables
 * Replacement for nuxt-schema-org until h3 v2 compatibility is fixed
 * 
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

import type { Ref } from 'vue'

/**
 * Generic JSON-LD injection via useHead()
 * Automatically wraps data with @context
 */
export function useJsonLd(schema: Record<string, any> | (() => Record<string, any>)) {
  const schemaData = computed(() => {
    const data = typeof schema === 'function' ? schema() : schema
    return {
      '@context': 'https://schema.org',
      ...data
    }
  })

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: computed(() => JSON.stringify(schemaData.value))
      }
    ]
  })
}

/**
 * Multiple schemas injection (for pages needing multiple schema types)
 */
export function useJsonLdMultiple(schemas: Array<Record<string, any> | (() => Record<string, any>)>) {
  schemas.forEach(schema => useJsonLd(schema))
}

/**
 * WebSite schema with SearchAction for homepage
 * Enables Google's search box feature
 */
export function useWebSiteSchema(options?: {
  name?: string
  description?: string
  url?: string
}) {
  const config = useRuntimeConfig()
  
  useJsonLd({
    '@type': 'WebSite',
    name: options?.name || 'military.contractors',
    description: options?.description || 'OCONUS contractor jobs for cleared veterans. Find overseas defense contractor positions matched to your military specialty.',
    url: options?.url || config.public.siteUrl || 'https://military.contractors',
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${options?.url || config.public.siteUrl || 'https://military.contractors'}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  })
}

/**
 * WebPage schema for general pages
 */
export function useWebPageSchema(options: {
  name: string
  description: string
  type?: string
}) {
  useJsonLd({
    '@type': options.type || 'WebPage',
    name: options.name,
    description: options.description
  })
}

/**
 * JobPosting schema for job detail pages
 * Critical for Google Jobs integration
 * 
 * @see https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
export function useJobPostingSchema(job: Ref<any>) {
  useJsonLd(() => {
    if (!job.value) return { '@type': 'JobPosting' }
    
    const j = job.value
    
    return {
      '@type': 'JobPosting',
      title: j.title || '',
      description: j.summary || j.responsibilities?.join(' ') || j.description || '',
      datePosted: j.postedAt || new Date().toISOString(),
      validThrough: j.posting?.validThrough || undefined,
      
      hiringOrganization: {
        '@type': 'Organization',
        name: j.company || '',
        sameAs: j.sourceUrl !== '#' ? j.sourceUrl : undefined
      },
      
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: j.location?.city || undefined,
          addressRegion: j.location?.state || j.location?.region || undefined,
          addressCountry: j.location?.country || 'US'
        }
      },
      
      employmentType: (() => {
        const type = j.contract?.type
        if (type === 'FULL_TIME') return 'FULL_TIME'
        if (type === 'CONTRACT') return 'CONTRACTOR'
        if (type === 'PART_TIME') return 'PART_TIME'
        return 'FULL_TIME'
      })(),
      
      baseSalary: j.compensation?.min ? {
        '@type': 'MonetaryAmount',
        currency: j.compensation?.currency || 'USD',
        value: {
          '@type': 'QuantitativeValue',
          minValue: j.compensation.min,
          maxValue: j.compensation.max || j.compensation.min,
          unitText: 'YEAR'
        }
      } : undefined,
      
      qualifications: j.qualifications?.required?.join(', ') || undefined,
      skills: j.toolsTech?.join(', ') || undefined,
      
      // Custom field for clearance (not standard but useful for filtering)
      securityClearanceRequirement: j.clearance?.level || undefined
    }
  })
}

/**
 * Organization schema for company pages
 * 
 * @see https://developers.google.com/search/docs/appearance/structured-data/organization
 */
export function useOrganizationSchema(org: Ref<any>) {
  useJsonLd(() => {
    if (!org.value) return { '@type': 'Organization' }
    
    const o = org.value
    
    return {
      '@type': 'Organization',
      name: o.name || '',
      description: o.summary || o.description || '',
      url: o.websiteUrl || undefined,
      logo: o.logoUrl || undefined
    }
  })
}

/**
 * CollectionPage schema for listing pages
 */
export function useCollectionPageSchema(options: {
  name: string
  description: string
}) {
  useJsonLd({
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description
  })
}

/**
 * BreadcrumbList schema for navigation
 * 
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */
export function useBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'https://military.contractors'
  
  useJsonLd({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
    }))
  })
}

