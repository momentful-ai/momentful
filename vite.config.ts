import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { analyzer } from 'vite-bundle-analyzer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const clerkKey = env.VITE_CLERK_PUBLISHABLE_KEY || '';
  
  return {
    define: {
      // Make Clerk key available globally via import.meta.env
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkKey),
    },
    plugins: [
      react(),
      // Plugin to handle /app route in dev server
      {
        name: 'app-route',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            // Redirect /app to /app.html in development
            if (req.url === '/app' || req.url === '/app/') {
              req.url = '/app.html';
            }
            next();
          });
        },
      },
      // Add bundle analyzer in build mode
      (mode === 'production' || mode === 'analyze') && analyzer({
        analyzerMode: 'static',
        fileName: 'bundle-analysis.html',
        openAnalyzer: false,
        defaultSizes: 'gzip',
      }),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          app: resolve(__dirname, 'app.html'),
        },
        output: {
          manualChunks: (id) => {
            // Separate Clerk authentication library
            if (id.includes('@clerk')) {
              return 'clerk';
            }
            // Separate Supabase database client
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Separate React Query data fetching library
            if (id.includes('@tanstack/react-query') || id.includes('@tanstack/react-query-persist-client')) {
              return 'react-query';
            }
            // Separate utility libraries
            if (id.includes('jszip') || id.includes('zod') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils';
            }
            // Separate UI component libraries
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            // Separate React and React DOM
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
