// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],
  // ssr: true,
  nitro: {
    // preset: 'cloudflare-pages', // <--- AÑADE ESTO
    prerender: {
      autoSubfolderIndex: false
    },
    devProxy: {
      '/api-remote': {
        target: 'https://r2-manager.paulyeffertperezsanjinez.workers.dev',
        changeOrigin: true,
      }
    }
  },
  runtimeConfig: {
    r2AccountId: '',
    r2AccessKeyId: '',
    r2SecretAccessKey: '',
    r2BucketName: '',
    public:{
      apiBase: process.env.API_BASE || 'https://r2-manager.paulp.dev',
      r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL || 'https://r2.paulp.dev'
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})