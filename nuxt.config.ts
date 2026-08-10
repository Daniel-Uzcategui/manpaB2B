// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-08-10',

  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@pinia/nuxt'
  ],

  supabase: {
    redirect: false, // Custom authentication middleware handled in app/middleware/auth.global.ts
    url: process.env.SUPABASE_URL || 'https://voyatlhmdfbkpisdyqzy.supabase.co',
    key: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'MANPA B2B | Industrial Purity - Portal de Distribuidores',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Plataforma oficial B2B de Manufacturas de Papel (MANPA). Venta directa al mayor de productos papeleros e industriales.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap' }
      ]
    }
  },

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://voyatlhmdfbkpisdyqzy.supabase.co',
      supabaseKey: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
    }
  }
})
