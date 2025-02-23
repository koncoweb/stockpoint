import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "srcbook-error-reporter",

      // ref: https://vite.dev/guide/api-plugin.html#transformindexhtml
      transformIndexHtml(html) {
        if (process.env.NODE_ENV !== "development" && process.env.SHOW_WATERMARK !== "false") {
          return [
            {
              tag: "style",
              attrs: { type: "text/css" },
              injectTo: "head",
              children: `
                .srcbook-watermark {
                  position: fixed;
                  bottom: 16px;
                  right: 16px;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                  display: flex;
                  align-items: center;
                  padding: 8px 12px;
                  z-index: 9999;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  font-size: 14px;
                  font-weight: bold;
                  color: #000;
                  gap: 8px;
                  border: 1px solid #e6e6e6;
                  background: linear-gradient(to bottom, #FFFFFF, #F9F9F9);
                  cursor: pointer;
                  transition: all 0.2s ease-in-out;
                }
                .srcbook-watermark:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .srcbook-watermark:active {
                  transform: translateY(0);
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .srcbook-watermark img {
                  width: 16px;
                  height: 16px;
                }
              `,
            },
            {
              tag: "script",
              attrs: { type: "module" },
              injectTo: "body",
              children: `
                const watermark = document.createElement('a');
                watermark.href = 'https://www.srcbook.com?a_id=' + encodeURIComponent('01953363-a7c3-751c-9ec3-a2db8dfc9b6e');
                watermark.target = '_blank';
                watermark.className = 'srcbook-watermark';
                watermark.innerHTML = \`
                  <img src="https://assets.srcbook.com/favicon.svg" alt="Srcbook Logo" />
                  Made in Srcbook
                \`;
                document.body.appendChild(watermark);
              `,
            },
          ];
        }

        return [
          {
            tag: "script",
            attrs: { type: "module" },
            injectTo: "head",
            children: `
            // Report any logs, errors, etc to the parent srcbook app context to include in
            // the bottom panel.
            for (const method of ['log', 'debug', 'info', 'error', 'warn']) {
              const originalFn = console[method];
              console[method] = function(...args) {
                window.parent.postMessage({ type: 'console', method, args: args.map(a => \`\${a}\`) }, '*');
                return originalFn(...args);
              };
            }

            // Report any thrown errors / promise rejections so they show up in the logs
            window.addEventListener('error', (e) => {
              if (window.parent) {
                window.parent.postMessage({ type: 'error', stack: e.error.stack }, '*');
              }
            });
            window.addEventListener('unhandledrejection', (e) => {
              if (window.parent) {
                window.parent.postMessage({ type: 'unhandledrejection', reason: e.reason }, '*');
              }
            });

            // Report URL change event from iframe
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;

            const notifyParent = () => {
              window.parent.postMessage({ type: 'iframe_url_changed', url: window.location.href }, '*');
            };

            history.pushState = function (...args) {
              originalPushState.apply(this, args);
              notifyParent();
            };

            history.replaceState = function (...args) {
              originalReplaceState.apply(this, args);
              notifyParent();
            };

            window.addEventListener('popstate', notifyParent);
            window.addEventListener('hashchange', notifyParent);
          `,
          },
        ];
      },

      transform(src: string, id: string) {
        if (id === "/app/src/main.tsx") {
          return `
            ${src}
            if (process.env.NODE_ENV === 'development') {
              // Report any vite-hmr errors up to the parent srcbook app context
              // Full event list: https://vite.dev/guide/api-hmr.html
              if (import.meta.hot) {
                import.meta.hot.on('vite:error', (data) => {
                  if (window.parent) {
                    window.parent.postMessage({ type: 'vite:hmr:error', data }, '*');
                  }
                });
                import.meta.hot.on('vite:beforeUpdate', (data) => {
                  if (window.parent) {
                    window.parent.postMessage({ type: 'vite:hmr:beforeUpdate', data }, '*');
                  }
                });
                import.meta.hot.on('vite:afterUpdate', (data) => {
                  if (window.parent) {
                    window.parent.postMessage({ type: 'vite:hmr:afterUpdate', data }, '*');
                  }
                });
              }
            }
          `;
        }
      },
    },
  ],
  server: {
    allowedHosts: true,
  },
});
