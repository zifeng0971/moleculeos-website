// Packs the /studio agent prototype into one self-contained HTML file that opens by double-click (file://).
// React, Mol*, the styles and the 2FJG structure are all inlined; the page makes no network requests.
// Usage: node scripts/build-studio-share.mjs   → preview-package/MOS-Agent-原型.html
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'preview-package', 'MOS-Agent-原型.html');

const entry = `
import { createRoot } from 'react-dom/client';
import { AgentApp } from './components/studio/agent-app';
import cif from './public/demo/2fjg.cif';
// The viewer fetches /demo/2fjg.cif; serve it from the bundle so the file works offline and from file://.
const realFetch = window.fetch.bind(window);
window.fetch = (input, init) => String(typeof input === 'string' ? input : input.url).endsWith('/demo/2fjg.cif')
  ? Promise.resolve(new Response(cif, { headers: { 'content-type': 'text/plain' } }))
  : realFetch(input, init);
createRoot(document.getElementById('root')).render(<AgentApp />);
`;

const result = await build({
  stdin: { contents: entry, resolveDir: root, loader: 'tsx', sourcefile: 'share-entry.tsx' },
  bundle: true, write: false, minify: true, format: 'iife', platform: 'browser', target: 'es2020',
  jsx: 'automatic', loader: { '.cif': 'text' }, outdir: 'out', logLevel: 'error',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const js = result.outputFiles.find(f => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
const css = result.outputFiles.find(f => f.path.endsWith('.css'))?.text ?? '';

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MOS Agent · 交互原型</title>
<style>html,body{margin:0;background:#111113;color:#ececf1}#root{min-height:100vh}${css}</style>
</head>
<body>
<div id="root"></div>
<noscript>请在浏览器中启用 JavaScript 后打开。</noscript>
<script>${js}</script>
</body>
</html>
`;
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, html);
console.log(`${path.relative(root, out)}  ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB`);
