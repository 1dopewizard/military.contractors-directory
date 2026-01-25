/**
 * @file Vitest global test setup for contractors app
 * @description Configures mocks for Nuxt auto-imports and Vue Test Utils
 */
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock Nuxt auto-imports
vi.mock('#imports', () => ({
  ref: vi.fn((v) => ({ value: v })),
  computed: vi.fn((fn) => ({ value: fn() })),
  reactive: vi.fn((v) => v),
  watch: vi.fn(),
  watchEffect: vi.fn(),
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  onBeforeMount: vi.fn(),
  onBeforeUnmount: vi.fn(),
  nextTick: vi.fn((fn) => Promise.resolve().then(fn)),
  useRoute: vi.fn(() => ({ params: {}, query: {}, path: '/' })),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
  useRuntimeConfig: vi.fn(() => ({ public: {} })),
  useLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
  navigateTo: vi.fn(),
  createError: vi.fn((opts) => new Error(opts.message || opts.statusMessage)),
}))

// Configure Vue Test Utils global stubs
config.global.stubs = {
  NuxtLink: {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
  ClientOnly: {
    template: '<slot />',
  },
  Icon: {
    template: '<span class="icon" :data-icon="name"></span>',
    props: ['name'],
  },
  Teleport: {
    template: '<div><slot /></div>',
  },
}

// Configure global mocks
config.global.mocks = {
  $t: (key: string) => key,
  $route: { params: {}, query: {} },
  $router: { push: vi.fn(), replace: vi.fn() },
}
