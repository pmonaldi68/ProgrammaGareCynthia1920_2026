import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs/promises';
import path from 'path';
import {defineConfig} from 'vite';

function stripLegacyJsxDevMetadata(code: string): string {
  return code
    .replace(/,\s*__source:\s*\{[^}]*\},\s*__self:\s*this/g, '')
    .replace(/__source:\s*\{[^}]*\},\s*/g, '')
    .replace(/,\s*__self:\s*(?:this|void 0)/g, '');
}

function modernDependencyJsxPlugin() {
  return {
    name: 'modern-dependency-jsx-plugin',
    transform(code: string, id: string) {
      if (
        id.includes('node_modules') &&
        (id.includes('uncontrollable') || id.includes('react-big-calendar')) &&
        (code.includes('__self') || code.includes('__source'))
      ) {
        return {
          code: stripLegacyJsxDevMetadata(code),
          map: null,
        };
      }
      return null;
    },
  };
}

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
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
      tailwindcss(),
      resolveMapsPlugin(),
      modernDependencyJsxPlugin(),
    ],
    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          {
            name: 'strip-legacy-jsx-dev-metadata',
            setup(build) {
              build.onLoad({ filter: /node_modules\/.*(?:uncontrollable|react-big-calendar).*\.js$/ }, async (args) => {
                const contents = await fs.readFile(args.path, 'utf8');
                if (!contents.includes('__self') && !contents.includes('__source')) {
                  return null;
                }
                return {
                  contents: stripLegacyJsxDevMetadata(contents),
                  loader: 'js',
                };
              });
            },
          },
        ],
      },
    },
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
