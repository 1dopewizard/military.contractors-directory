import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/composables/**/*.{js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/plugins/**/*.{js,ts}',
    './app/**/*.{vue,js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        brand: '#171A21'
      }
    }
  }
} satisfies Config


