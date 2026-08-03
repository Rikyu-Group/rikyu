#!/usr/bin/env node
/**
 * build.mjs — 整合チェック → 1枚HTMLに固める
 *
 * 使い方: node build.mjs
 *
 * src/ の分割ファイルを dist/index.html に固める。
 * ただし整合チェックに1件でも落ちたら、出力しない。
 * 「検査を通らないと成果物ができない」という順序を、道具の側で強制する。
 * うっかりを構造的に潰す、いちばん確実な方法。
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const has = (p) => existsSync(resolve(root, p));

const problems = [];
const warn = [];

/* ---------- 素材の読み込み ---------- */

if (!has('src/index.html')) {
  console.error('src/index.html がありません。');
  process.exit(2);
}

let html = read('src/index.html');
const tokens = has('src/tokens.css') ? read('src/tokens.css') : '';
const style = has('src/style.css') ? read('src/style.css') : '';
const script = has('src/app.js') ? read('src/app.js') : '';

/* ---------- 差し込み ---------- */
// テンプレート側に /*__TOKENS__*/ /*__STYLE__*/ /*__SCRIPT__*/ の目印を置いておく。
// 目印が無い場合は </head> / </body> の直前に差し込む。

const inject = (src, marker, content, fallbackTag, wrap) => {
  if (!content.trim()) return src;
  if (src.includes(marker)) return src.replace(marker, () => content);
  return src.replace(fallbackTag, () => `${wrap(content)}\n${fallbackTag}`);
};

html = inject(html, '/*__TOKENS__*/', tokens, '</head>', (c) => `<style>${c}</style>`);
html = inject(html, '/*__STYLE__*/', style, '</head>', (c) => `<style>${c}</style>`);
html = inject(html, '/*__SCRIPT__*/', script, '</body>', (c) => `<script>${c}</script>`);

/* ---------- 整合チェック ---------- */

const pick = (re) => {
  const m = html.match(re);
  return m ? m[1].trim() : '';
};

// 1. メタ情報
const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
if (!title) problems.push('title が空、または存在しません');
const desc = pick(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
if (!desc) problems.push('meta description がありません');
const ogTitle = pick(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i);
const ogImage = pick(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i);
if (!ogTitle || !ogImage) problems.push('OGP（og:title / og:image）が不足しています');
if (!/<meta\s+name=["']viewport["']/i.test(html)) problems.push('viewport メタタグがありません');
if (!/<html[^>]+lang=/i.test(html)) warn.push('<html lang> が未指定です');

// 2. 未完成のリンク
const hrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"']*)["']/gi)].map((m) => m[1]);
const deadCta = hrefs.filter((h) => h === '#' || /^(TODO|todo|xxx|XXX)$/.test(h) || h === '');
if (deadCta.length) {
  problems.push(`href が "#" や TODO のままのリンクが ${deadCta.length} 件あります`);
}

// 3. alt のない img
const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
const noAlt = imgs.filter((t) => !/\balt=/i.test(t));
if (noAlt.length) {
  problems.push(`alt属性のない <img> が ${noAlt.length} 件あります`);
  noAlt.slice(0, 5).forEach((t) => problems.push(`    ${t.slice(0, 90)}`));
}

// 4. 未置換のプレースホルダ
const ph = [...html.matchAll(/\{\{\s*[\w.\-]+\s*\}\}/g)].map((m) => m[0]);
if (ph.length) problems.push(`未置換のプレースホルダが残っています: ${[...new Set(ph)].join(', ')}`);

// 5. ダミーテキスト（慣れた人ほど残す）
const DUMMY = [
  'Lorem ipsum', 'lorem ipsum',
  'テキストが入ります', 'ダミーテキスト', 'サンプルテキスト',
  'ここに文章', '〇〇株式会社', '◯◯株式会社', '○○株式会社',
  '000-0000-0000', '03-0000-0000', 'example@example.com',
  'sample@sample.com', 'TODO', 'FIXME',
];
const foundDummy = DUMMY.filter((d) => html.includes(d));
if (foundDummy.length) {
  problems.push(`ダミーテキストが残っています: ${foundDummy.join(' / ')}`);
}

// 6. 自己完結の担保
const ext = [
  ...[...html.matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]),
  ...[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]),
  ...[...html.matchAll(/<link\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*rel=["']stylesheet["']/gi)].map((m) => m[1]),
];
if (ext.length) {
  warn.push(`外部ドメインのCSS/JSを参照しています（表示が遅れます）:`);
  [...new Set(ext)].forEach((u) => warn.push(`    ${u}`));
}

// 7. 連絡先のリンク化
const bodyOnly = html.replace(/<head[\s\S]*?<\/head>/i, '');
const textOnly = bodyOnly.replace(/<[^>]+>/g, ' ');
const telLike = [...new Set(textOnly.match(/0\d{1,4}-\d{1,4}-\d{3,4}/g) || [])];
const unlinkedTel = telLike.filter((t) => !html.includes(`tel:${t.replace(/-/g, '')}`) && !html.includes(`tel:${t}`));
if (unlinkedTel.length) {
  warn.push(`tel: リンクになっていない電話番号: ${unlinkedTel.join(', ')}`);
}

/* ---------- 判定 ---------- */

if (warn.length) {
  console.log('△ 警告:');
  warn.forEach((w) => console.log(`  ${w}`));
  console.log('');
}

if (problems.length) {
  console.error('✗ ビルド中止 — 整合チェックに落ちました:');
  problems.forEach((p) => console.error(`  ${p.startsWith('    ') ? p : '- ' + p}`));
  console.error('\n直してから再実行してください。壊れたものは出力しません。');
  process.exit(1);
}

/* ---------- 出力 ---------- */

mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist/index.html'), html);

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`✓ dist/index.html を出力しました（${kb}KB）`);
console.log(`  title: ${title}`);
console.log('\n次: node audit.mjs dist/index.html で機械検収を回してください。');
