/**
 * @file Mock for #imports (Nuxt auto-imports)
 * @description Provides mock implementations of Nuxt auto-imported functions
 */
import { vi } from "vitest";
import {
  ref,
  computed,
  reactive,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";

// Re-export Vue reactivity functions
export {
  ref,
  computed,
  reactive,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  nextTick,
};

// Mock Nuxt composables
export const useRoute = vi.fn(() => ({
  params: {},
  query: {},
  path: "/",
  name: "index",
  fullPath: "/",
}));

export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
}));

export const useRuntimeConfig = vi.fn(() => ({
  public: {
    siteUrl: "http://localhost:3000",
    siteName: "military.contractors",
    directoryUrl: "http://localhost:3001",
  },
}));

export const navigateTo = vi.fn();
export const createError = vi.fn((opts) => {
  const error = new Error(opts.message || opts.statusMessage);
  (error as any).statusCode = opts.statusCode;
  return error;
});

// Mock logger
export const useLogger = vi.fn(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
