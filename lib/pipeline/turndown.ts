/**
 * @file HTML-to-Markdown Conversion Utility
 * @description Converts HTML content to clean Markdown using Turndown with custom filters
 * optimized for military career websites (COOL, airforce.com, spaceforce.com, etc.)
 *
 * Features:
 * - Removes unwanted elements (nav, header, footer, scripts, styles, ads)
 * - Preserves tables for credential/certification listings
 * - Handles definition lists (common in government sites)
 * - Extracts main content from full HTML pages
 * - Cleans HTML snippets from API responses
 *
 * Usage:
 * ```typescript
 * import { htmlToMarkdown, cleanHtmlSnippet, createMilitarySiteTurndown } from '@/lib/pipeline/turndown'
 *
 * // Convert full HTML page
 * const markdown = htmlToMarkdown(fullHtml)
 *
 * // Clean HTML snippet from API response
 * const text = cleanHtmlSnippet('<p>MOS <strong>11B</strong> description...</p>')
 *
 * // Create custom instance for specific site
 * const turndown = createMilitarySiteTurndown({ preserveTables: true })
 * const md = turndown.turndown(html)
 * ```
 */

import * as TurndownService from 'turndown'

// ============================================
// Types
// ============================================

/**
 * Options for creating a Turndown instance
 */
export interface TurndownOptions {
  /** Preserve table formatting as Markdown tables (default: true) */
  preserveTables?: boolean
  /** Preserve definition lists as formatted text (default: true) */
  preserveDefinitionLists?: boolean
  /** Remove image elements (default: true for scraping) */
  removeImages?: boolean
  /** Remove link href attributes but keep text (default: false) */
  stripLinks?: boolean
  /** Custom elements to remove (added to default list) */
  removeElements?: string[]
  /** Heading style: 'atx' (#) or 'setext' (underline) */
  headingStyle?: 'atx' | 'setext'
  /** Code block style: 'fenced' (```) or 'indented' */
  codeBlockStyle?: 'fenced' | 'indented'
  /** Bullet list marker: '-', '*', or '+' */
  bulletListMarker?: '-' | '*' | '+'
}

/**
 * Preset configurations for specific military sites
 */
export type SitePreset = 'cool' | 'airforce' | 'spaceforce' | 'goarmy' | 'navy' | 'generic'

// ============================================
// Constants
// ============================================

/**
 * HTML tag names to remove (standard HTMLElementTagNameMap tags)
 */
const DEFAULT_REMOVE_TAGS: TurndownService.TagName[] = [
  // Scripts and styles
  'script',
  'style',
  'noscript',
  // Navigation
  'nav',
  'header',
  'footer',
  // Sidebars and asides
  'aside',
  // Media (often broken in markdown)
  'iframe',
  'video',
  'audio',
  'embed',
  'object',
  // Forms
  'form',
  'input',
  'button',
  'select',
  'textarea',
  // Comments and hidden content
  'template',
]

/**
 * Additional tags to remove that aren't in HTMLElementTagNameMap
 * (e.g., SVG elements)
 */
const ADDITIONAL_REMOVE_TAGS = ['svg']

/**
 * Class/attribute patterns to filter out (handled via custom rules)
 */
const NOISE_PATTERNS = [
  // Ads and tracking
  /^ad-|ad$/i,
  /advertisement/i,
  /tracking/i,
  /analytics/i,
  // Cookie banners
  /cookie/i,
  // Social media widgets
  /social/i,
  /share-button/i,
  // Print-only content
  /print-only/i,
  // Screen reader only (usually duplicative)
  /sr-only/i,
  /visually-hidden/i,
]

/**
 * Elements that indicate main content area
 * (used for content extraction heuristics)
 */
const MAIN_CONTENT_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '#main-content',
  '#content',
  '.main-content',
  '.content',
  '.article-body',
  '.entry-content',
]

// ============================================
// Core Turndown Factory
// ============================================

/**
 * Create a configured Turndown instance for military/government sites
 */
export function createMilitarySiteTurndown(options: TurndownOptions = {}): TurndownService {
  const {
    preserveTables = true,
    preserveDefinitionLists = true,
    removeImages = true,
    stripLinks = false,
    removeElements = [],
    headingStyle = 'atx',
    codeBlockStyle = 'fenced',
    bulletListMarker = '-',
  } = options

  // Create Turndown instance with base options
  const turndown = new TurndownService({
    headingStyle,
    codeBlockStyle,
    bulletListMarker,
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
  })

  // Remove default unwanted HTML tags
  turndown.remove(DEFAULT_REMOVE_TAGS)

  // Remove additional tags (like SVG) via filter function
  turndown.addRule('removeAdditionalTags', {
    filter: (node) => {
      const tagName = node.tagName?.toLowerCase()
      return ADDITIONAL_REMOVE_TAGS.includes(tagName)
    },
    replacement: () => '',
  })

  // Add rule to filter out noise elements by class/id patterns
  turndown.addRule('noiseElements', {
    filter: (node) => {
      const el = node as HTMLElement
      const className = el.className || ''
      const id = el.id || ''
      const ariaHidden = el.getAttribute('aria-hidden')

      // Check aria-hidden
      if (ariaHidden === 'true') return true

      // Check class and id against noise patterns
      const combined = `${className} ${id}`
      return NOISE_PATTERNS.some((pattern) => pattern.test(combined))
    },
    replacement: () => '',
  })

  // Remove any additional custom elements (must be valid tag names)
  if (removeElements.length > 0) {
    // Filter to only valid HTML tag names (skip CSS selectors)
    const validTags = removeElements.filter(
      (el): el is keyof HTMLElementTagNameMap =>
        !el.includes('[') && !el.includes('.') && !el.includes('#')
    )
    if (validTags.length > 0) {
      turndown.remove(validTags)
    }
  }

  // Remove images if requested (default for scraping)
  if (removeImages) {
    turndown.remove(['img', 'picture', 'figure'])
  }

  // Strip links if requested (keep text, remove href)
  if (stripLinks) {
    turndown.addRule('stripLinks', {
      filter: 'a',
      replacement: (content) => content,
    })
  }

  // Add table support if preserving tables
  if (preserveTables) {
    addTableRules(turndown)
  }

  // Add definition list support if preserving
  if (preserveDefinitionLists) {
    addDefinitionListRules(turndown)
  }

  // Add custom rules for common military site patterns
  addMilitarySiteRules(turndown)

  return turndown
}

/**
 * Add Markdown table conversion rules
 * Converts HTML tables to GFM-style Markdown tables
 */
function addTableRules(turndown: TurndownService): void {
  // Table cell
  turndown.addRule('tableCell', {
    filter: ['th', 'td'],
    replacement: (content, node) => {
      const el = node as HTMLTableCellElement
      const trimmed = content.trim().replace(/\n/g, ' ')
      return ` ${trimmed} |`
    },
  })

  // Table row
  turndown.addRule('tableRow', {
    filter: 'tr',
    replacement: (content, node) => {
      const el = node as HTMLTableRowElement
      const cells = content.trim()
      if (!cells) return ''

      // Check if this is a header row
      const isHeader = el.parentElement?.tagName.toLowerCase() === 'thead'
      let row = `|${cells}\n`

      // Add separator after header row
      if (isHeader) {
        const cellCount = el.cells.length
        const separator = '|' + ' --- |'.repeat(cellCount) + '\n'
        row += separator
      }

      return row
    },
  })

  // Table head - just pass through content
  turndown.addRule('tableHead', {
    filter: 'thead',
    replacement: (content) => content,
  })

  // Table body - just pass through content
  turndown.addRule('tableBody', {
    filter: 'tbody',
    replacement: (content) => content,
  })

  // Full table
  turndown.addRule('table', {
    filter: 'table',
    replacement: (content, node) => {
      const el = node as HTMLTableElement

      // If no thead, create separator after first row
      if (!el.querySelector('thead') && content.trim()) {
        const rows = content.trim().split('\n').filter(Boolean)
        if (rows.length > 0) {
          const firstRow = rows[0] ?? ''
          const cellCount = (firstRow.match(/\|/g) || []).length - 1
          if (cellCount > 0) {
            const separator = '|' + ' --- |'.repeat(cellCount)
            rows.splice(1, 0, separator)
            return '\n\n' + rows.join('\n') + '\n\n'
          }
        }
      }

      return '\n\n' + content.trim() + '\n\n'
    },
  })
}

/**
 * Add definition list conversion rules
 * Converts <dl>/<dt>/<dd> to formatted text
 */
function addDefinitionListRules(turndown: TurndownService): void {
  // Definition term
  turndown.addRule('definitionTerm', {
    filter: 'dt',
    replacement: (content) => {
      return `**${content.trim()}**\n`
    },
  })

  // Definition description
  turndown.addRule('definitionDescription', {
    filter: 'dd',
    replacement: (content) => {
      // Indent the description
      const trimmed = content.trim()
      return `: ${trimmed}\n\n`
    },
  })

  // Definition list container
  turndown.addRule('definitionList', {
    filter: 'dl',
    replacement: (content) => {
      return '\n\n' + content.trim() + '\n\n'
    },
  })
}

/**
 * Add rules specific to military career websites
 */
function addMilitarySiteRules(turndown: TurndownService): void {
  // Handle breadcrumbs (common in gov sites)
  turndown.addRule('breadcrumbs', {
    filter: (node) => {
      const el = node as HTMLElement
      return (
        el.classList?.contains('breadcrumb') ||
        el.classList?.contains('breadcrumbs') ||
        el.getAttribute('aria-label')?.toLowerCase().includes('breadcrumb') ||
        false
      )
    },
    replacement: () => '', // Remove breadcrumbs
  })

  // Handle "back to top" links
  turndown.addRule('backToTop', {
    filter: (node) => {
      const el = node as HTMLElement
      const text = el.textContent?.toLowerCase() || ''
      const href = el.getAttribute('href') || ''
      return (
        (el.tagName.toLowerCase() === 'a' && (href === '#top' || href === '#')) ||
        text.includes('back to top')
      )
    },
    replacement: () => '',
  })

  // Handle accordion/collapsible content (expand for scraping)
  turndown.addRule('accordion', {
    filter: (node) => {
      const el = node as HTMLElement
      return (
        el.classList?.contains('accordion') ||
        el.classList?.contains('collapsible') ||
        el.getAttribute('role') === 'tabpanel' ||
        false
      )
    },
    replacement: (content) => content, // Just include the content
  })

  // Handle "Read more" truncation
  turndown.addRule('readMore', {
    filter: (node) => {
      const el = node as HTMLElement
      const text = el.textContent?.toLowerCase() || ''
      return (
        el.tagName.toLowerCase() === 'a' &&
        (text.includes('read more') ||
          text.includes('learn more') ||
          text.includes('view more') ||
          text.includes('show more'))
      )
    },
    replacement: () => '',
  })

  // Preserve highlighted/important content
  turndown.addRule('highlight', {
    filter: (node) => {
      const el = node as HTMLElement
      return (
        el.tagName.toLowerCase() === 'mark' ||
        el.classList?.contains('highlight') ||
        el.classList?.contains('important') ||
        false
      )
    },
    replacement: (content) => `**${content.trim()}**`,
  })

  // Handle callout boxes (common in gov sites)
  turndown.addRule('callout', {
    filter: (node) => {
      const el = node as HTMLElement
      return (
        el.classList?.contains('callout') ||
        el.classList?.contains('alert') ||
        el.classList?.contains('notice') ||
        el.classList?.contains('info-box') ||
        el.getAttribute('role') === 'alert' ||
        false
      )
    },
    replacement: (content) => {
      const trimmed = content.trim()
      if (!trimmed) return ''
      // Format as blockquote
      return (
        '\n\n> ' +
        trimmed
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .join('\n> ') +
        '\n\n'
      )
    },
  })
}

// ============================================
// Main Conversion Functions
// ============================================

/**
 * Convert full HTML document to Markdown
 *
 * This function:
 * 1. Extracts main content area if identifiable
 * 2. Removes noise elements
 * 3. Converts remaining HTML to Markdown
 * 4. Cleans up whitespace
 */
export function htmlToMarkdown(html: string, options?: TurndownOptions): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  const turndown = createMilitarySiteTurndown(options)

  // Convert
  let markdown = turndown.turndown(html)

  // Clean up whitespace
  markdown = cleanMarkdownWhitespace(markdown)

  return markdown
}

/**
 * Clean HTML snippet from API response (remove tags, normalize whitespace)
 *
 * This is a lighter-weight function for cleaning small HTML snippets
 * that appear in API responses (like descriptions with <p>, <strong>, etc.)
 */
export function cleanHtmlSnippet(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // For simple snippets, just strip tags and normalize whitespace
  let text = html
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

/**
 * Convert HTML to Markdown, attempting to extract main content first
 *
 * This is useful for full page scraping where you want to focus on
 * the main article/content area and ignore chrome.
 */
export function extractAndConvertContent(html: string, options?: TurndownOptions): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // Try to find main content area using common selectors
  // This is a simple heuristic - in a browser context you'd use DOM APIs
  let contentHtml = html

  // Simple regex-based content extraction (works server-side without DOM)
  // Look for common content containers
  const mainPatterns = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*id=["']?(?:main-content|content|main)["']?[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*(?:main-content|content|article-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ]

  for (const pattern of mainPatterns) {
    const match = html.match(pattern)
    if (match && match[1] && match[1].length > 200) {
      // Must have substantial content
      contentHtml = match[1]
      break
    }
  }

  return htmlToMarkdown(contentHtml, options)
}

// ============================================
// Utility Functions
// ============================================

/**
 * Clean up Markdown whitespace
 */
function cleanMarkdownWhitespace(markdown: string): string {
  return (
    markdown
      // Remove excessive blank lines (more than 2)
      .replace(/\n{4,}/g, '\n\n\n')
      // Remove trailing whitespace from lines
      .replace(/[ \t]+$/gm, '')
      // Ensure single newline at end
      .trim() + '\n'
  )
}

/**
 * Get a preset Turndown configuration for a specific military site
 */
export function getPresetOptions(preset: SitePreset): TurndownOptions {
  const presets: Record<SitePreset, TurndownOptions> = {
    cool: {
      // COOL sites have lots of credential tables
      preserveTables: true,
      preserveDefinitionLists: true,
      removeImages: true,
      stripLinks: false,
    },
    airforce: {
      // Air Force site is clean, JSON-based
      preserveTables: true,
      preserveDefinitionLists: true,
      removeImages: true,
      stripLinks: false,
    },
    spaceforce: {
      // Space Force Next.js site
      preserveTables: true,
      preserveDefinitionLists: true,
      removeImages: true,
      stripLinks: false,
      removeElements: ['[class*="carousel"]', '[class*="slider"]'],
    },
    goarmy: {
      // GoArmy.com has lots of marketing content
      preserveTables: true,
      preserveDefinitionLists: true,
      removeImages: true,
      stripLinks: false,
      removeElements: ['[class*="hero"]', '[class*="cta"]', '[class*="testimonial"]'],
    },
    navy: {
      // Navy COOL similar to other COOL sites
      preserveTables: true,
      preserveDefinitionLists: true,
      removeImages: true,
      stripLinks: false,
    },
    generic: {
      // Generic military/gov site
      preserveTables: true,
      preserveDefinitionLists: true,
      removeImages: true,
      stripLinks: false,
    },
  }

  return presets[preset] || presets.generic
}

/**
 * Create a Turndown instance with preset options for a specific site
 */
export function createPresetTurndown(preset: SitePreset): TurndownService {
  return createMilitarySiteTurndown(getPresetOptions(preset))
}

// ============================================
// Exports
// ============================================

// Default export for simple usage
export default htmlToMarkdown
