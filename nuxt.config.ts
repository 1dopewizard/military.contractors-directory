// https://nuxt.com/docs/api/configuration/nuxt-config
import { createResolver } from "nuxt/kit";
import tailwindcss from "@tailwindcss/vite";

const { resolve } = createResolver(import.meta.url);

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  pages: true,
  ssr: true,
  app: {
    head: {
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
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
    //     description: 'AI-powered career advisor for military veterans transitioning to cleared IT/Intel civilian employment.'
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
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
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
  //     '/advertiser/**',
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
    "/advertiser/**": { ssr: false },
    "/admin/**": { ssr: false },
    "/auth/login": { ssr: false },
  },
  components: [
    {
      path: resolve("./app/components"),
      pathPrefix: false,
      ignore: ["**/index.ts", "**/utils.ts", "**/interface.ts"],
    },
  ],
});
