import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

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
