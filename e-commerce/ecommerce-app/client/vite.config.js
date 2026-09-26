import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The API only accepts browser requests from CLIENT_URL (http://localhost:5173 by default),
// so both the dev server and the production preview use that port - and fail loudly
// instead of silently switching to another one.
const APP_PORT = 5173;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: APP_PORT,
    strictPort: true,
  },
  preview: {
    port: APP_PORT,
    strictPort: true,
  },
});
