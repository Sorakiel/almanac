import { loadLocale } from '@/i18n'

// Russian is a lazy chunk in the app; tests translate synchronously, so load it
// once up front the way main.tsx does before the first render.
await loadLocale('ru')
