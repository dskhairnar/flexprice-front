import path from 'path';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
var meta = JSON.parse(fs.readFileSync('./public/meta.json', 'utf8'));
function parseBrandFromEnv(env) {
    var _a;
    try {
        var raw = JSON.parse((_a = env.VITE_BRAND_CONFIG) !== null && _a !== void 0 ? _a : '{}');
        return {
            name: typeof raw.name === 'string' ? raw.name : 'Flexprice',
            favicon: typeof raw.favicon === 'string' ? raw.favicon : '/comicon.png',
        };
    }
    catch (_b) {
        return { name: 'Flexprice', favicon: '/comicon.png' };
    }
}
function injectBrandIntoHtml(html, env) {
    var _a = parseBrandFromEnv(env), name = _a.name, favicon = _a.favicon;
    var faviconType = favicon.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
    return html
        .replace(/<title>Flexprice<\/title>/, "<title>".concat(name, "</title>"))
        .replace(/<meta name="application-name" content="Flexprice" \/>/, "<meta name=\"application-name\" content=\"".concat(name, "\" />"))
        .replace(/<link id="app-favicon" rel="icon" type="image\/png" href="\/comicon.png" \/>/, "<link id=\"app-favicon\" rel=\"icon\" type=\"".concat(faviconType, "\" href=\"").concat(favicon, "\" />"));
}
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [
            react(),
            {
                name: 'inject-brand-into-html',
                transformIndexHtml: {
                    order: 'pre',
                    handler: function (html) {
                        return injectBrandIntoHtml(html, env);
                    },
                },
            },
        ],
        define: {
            __APP_VERSION__: JSON.stringify(meta.versionId),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            cors: {
                origin: 'http://localhost:3000',
                methods: ['GET', 'POST'],
            },
            host: 'localhost',
        },
    };
});
