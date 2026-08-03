#!/usr/bin/env node
// sitemap.xml と robots.txt を dist/ に生成する
import { writeFileSync } from 'node:fs';
const BASE = 'https://rikyu-group.com';
const today = new Date().toISOString().slice(0, 10);
const LANGS = ['', 'en/', 'zh/', 'ko/', 'th/'];
const PAGES = [...LANGS, 'blog/', 'blog/why-rikyu', 'blog/tropical-sauna-science', 'blog/real-place-ai-era', 'faq/'];
const alt = LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l ? l.replace('/', '') : 'ja'}" href="${BASE}/${l}"/>`).join('\n');
const urls = PAGES.map(p => {
  const isTop = LANGS.includes(p);
  return `  <url>\n    <loc>${BASE}/${p}</loc>\n    <lastmod>${today}</lastmod>\n${isTop ? alt + '\n' : ''}  </url>`;
}).join('\n');
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
console.log('✓ dist/sitemap.xml, dist/robots.txt');
