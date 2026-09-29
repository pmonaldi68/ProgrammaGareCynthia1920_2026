import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function resolveMapsPlugin() {
  return {
    name: 'resolve-maps-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/resolve-maps', async (req: any, res: any) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Missing url parameter' }));
          }

          let currentUrl = targetUrl;
          for (let i = 0; i < 5; i++) {
            const resp = await fetch(currentUrl, {
              method: 'GET',
              redirect: 'manual',
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            });
            const location = resp.headers.get('location');
            if (location) {
              currentUrl = location;
            } else {
              break;
            }
          }

          let coords: [number, number] | null = null;
          const atMatch = currentUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (atMatch) {
            coords = [parseFloat(atMatch[1]), parseFloat(atMatch[2])];
          } else {
            const searchMatch = currentUrl.match(/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/);
            if (searchMatch) {
              coords = [parseFloat(searchMatch[1]), parseFloat(searchMatch[2])];
            } else {
              const dataMatch = currentUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
              if (dataMatch) {
                coords = [parseFloat(dataMatch[1]), parseFloat(dataMatch[2])];
              }
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ destinationUrl: currentUrl, coords }));
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), resolveMapsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
