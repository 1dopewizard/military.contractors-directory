// https://nuxt.com/docs/api/configuration/nuxt-config
import { createResolver } from "nuxt/kit";
import tailwindcss from "@tailwindcss/vite";

const { resolve } = createResolver(import.meta.url);
const publicSiteUrl =
  process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";
const isLocalSiteUrl = /(^http:\/\/localhost\b|^http:\/\/127\.0\.0\.1\b)/.test(
  publicSiteUrl,
);
const enablePlausible =
  process.env.NODE_ENV === "production" && !isLocalSiteUrl;
const enableLinkPrefetch =
  process.env.NODE_ENV === "production" && !isLocalSiteUrl;

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  experimental: {
    defaults: {
      nuxtLink: {
        prefetch: enableLinkPrefetch,
      },
    },
  },
  pages: true,
  ssr: true,
  app: {
    head: {
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      meta: [
        { property: "og:image", content: "/og-image.svg" },
        { property: "og:site_name", content: "military.contractors" },
      ],
      script: enablePlausible
        ? [
            {
              src: "https://plausible.io/js/script.js",
              "data-domain": "military.contractors",
              defer: true,
            },
          ]
        : [],
    },
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "page", mode: "out-in" },
  },
  modules: [
    "@vueuse/nuxt",
    "@nuxt/icon",
    // @nuxtjs/sitemap removed due to h3 v2 compatibility issues with nuxt-site-config
    // TODO: Re-add when nuxt-site-config is updated for h3 v2
    // '@nuxtjs/sitemap',
    // nuxt-schema-org removed due to h3 v2 compatibility issues with nuxt-site-config
    // TODO: Re-add when nuxt-site-config is updated for h3 v2
    // ['nuxt-schema-org', {
    //   identity: {
    //     type: 'Organization',
    //     name: 'military.contractors',
    //     url: process.env.NUXT_PUBLIC_SITE_URL || 'https://military.contractors',
    //     logo: '/logos/logo.svg',
    //     description: 'Public, source-backed defense contractor intelligence.'
    //   }
    // }],
    [
      "@nuxtjs/color-mode",
      {
        classSuffix: "",
        preference: "dark",
        fallback: "dark",
        hid: "nuxt-color-mode-script",
        globalName: "__NUXT_COLOR_MODE__",
        componentName: "ColorScheme",
        classPrefix: "",
        storageKey: "nuxt-color-mode",
        dataValue: "theme",
      },
    ],
  ],
  css: [resolve("./app/assets/css/tailwind.css")],
  runtimeConfig: {
    openaiApiKey: "",
    assistantId: "",
    resendApiKey: process.env.RESEND_API_KEY || "",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    stripeClaimedPriceId: process.env.STRIPE_CLAIMED_PRICE_ID || "",
    stripePremiumPriceId: process.env.STRIPE_PREMIUM_PRICE_ID || "",
    betterAuthSecret: process.env.BETTER_AUTH_SECRET || "",
    public: {
      siteUrl: publicSiteUrl,
      siteName: "military.contractors",
      directoryUrl:
        process.env.NUXT_PUBLIC_DIRECTORY_URL || "http://localhost:3001",
    },
  },
  // Sitemap config disabled - re-enable when nuxt-site-config is updated for h3 v2
  // sitemap: {
  //   siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://military.contractors',
  //   sources: [
  //     '/api/__sitemap__/urls'
  //   ],
  //   exclude: [
  //     '/admin/**',
  //     '/auth/**',
  //   ]
  // },
  nitro: {
    alias: {
      "@/lib": resolve("./lib"),
    },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: false,
    },
    css: {
      devSourcemap: true,
    },
  },
  alias: {
    "@": resolve("."),
    "@/app": resolve("./app"),
    "@/lib": resolve("./lib"),
  },
  routeRules: {
    "/admin/**": { ssr: false },
    "/auth/login": { ssr: false },
    "/companies/**": { isr: 3600 },
    "/agencies/**": { isr: 3600 },
    "/categories/**": { isr: 3600 },
    "/topics/**": { isr: 3600 },
    "/rankings/**": { isr: 3600 },
  },
  components: [
    {
      path: resolve("./app/components"),
      pathPrefix: false,
      ignore: ["**/index.ts", "**/utils.ts", "**/interface.ts"],
    },
  ],
});
