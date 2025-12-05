import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Ginji — The Go Framework for Modern Web Services",
  description: "Ginji is a high-performance, lightweight Go framework for building modern web services and APIs. Deliver scalable, fast, and maintainable backend solutions with a clean and intuitive developer experience.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'CLI', link: '/cli/' },
      { text: 'API Reference', link: '/api/' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Quick Start', link: '/guide/quick-start' },
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Routing', link: '/guide/routing' },
          { text: 'Context', link: '/guide/context' },
          { text: 'Middleware', link: '/guide/middleware' },
          { text: 'Validation', link: '/guide/validation' },
          { text: 'Error Handling', link: '/guide/error-handling' }
        ]
      },
      {
        text: 'CLI',
        items: [
          { text: 'Overview', link: '/cli/' },
          { text: 'New Project', link: '/cli/new' },
          { text: 'Generate Handler', link: '/cli/generate-handler' },
          { text: 'Generate Middleware', link: '/cli/generate-middleware' },
          { text: 'Generate CRUD', link: '/cli/generate-crud' }
        ]
      },
      {
        text: 'Middleware',
        items: [
          { text: 'Overview', link: '/middleware/' },
          { text: 'Auth', link: '/middleware/auth' },
          { text: 'Body Limit', link: '/middleware/body-limit' },
          { text: 'Health Check', link: '/middleware/health' },
          { text: 'Rate Limiting', link: '/middleware/rate-limit' },
          { text: 'Security', link: '/middleware/security' },
          { text: 'Timeout', link: '/middleware/timeout' }
        ]
      },
      {
        text: 'Real-time',
        items: [
          { text: 'Server-Sent Events', link: '/realtime/sse' },
          { text: 'Streaming', link: '/realtime/streaming' },
          { text: 'WebSocket', link: '/realtime/websocket' }
        ]
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Testing', link: '/advanced/testing' },
          { text: 'Performance', link: '/advanced/performance' },
          { text: 'Best Practices', link: '/advanced/best-practices' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/api/' },
          { text: 'Examples', link: '/examples/' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ginjigo/ginji' }
    ]
  }
})
