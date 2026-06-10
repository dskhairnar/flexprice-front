import path from 'path';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

const meta = JSON.parse(fs.readFileSync('./public/meta.json', 'utf8'));

interface BrandHtmlConfig {
	name: string;
	favicon: string;
}

function parseBrandFromEnv(env: Record<string, string>): BrandHtmlConfig {
	try {
		const raw = JSON.parse(env.VITE_BRAND_CONFIG ?? '{}') as Record<string, unknown>;
		return {
			name: typeof raw.name === 'string' ? raw.name : 'Flexprice',
			favicon: typeof raw.favicon === 'string' ? raw.favicon : '/comicon.png',
		};
	} catch {
		return { name: 'Flexprice', favicon: '/comicon.png' };
	}
}

function injectBrandIntoHtml(html: string, env: Record<string, string>): string {
	const { name, favicon } = parseBrandFromEnv(env);
	const faviconType = favicon.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

	return html
		.replace(/<title>Flexprice<\/title>/, `<title>${name}</title>`)
		.replace(/<meta name="application-name" content="Flexprice" \/>/, `<meta name="application-name" content="${name}" />`)
		.replace(
			/<link id="app-favicon" rel="icon" type="image\/png" href="\/comicon.png" \/>/,
			`<link id="app-favicon" rel="icon" type="${faviconType}" href="${favicon}" />`,
		);
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			react(),
			{
				name: 'inject-brand-into-html',
				transformIndexHtml: {
					order: 'pre',
					handler(html) {
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
