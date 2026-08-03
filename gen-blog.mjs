#!/usr/bin/env node
/**
 * gen-blog.mjs — blog-src/ の元記事（一次情報）を v2 デザインで dist/blog/ に移植する
 *
 * 使い方: node gen-blog.mjs
 * 方針: 記事本文は一切書き換えない。差し替えるのは器（CSS・ヘッダー・フッター・CTA・ドメイン）だけ。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const BASE = 'https://rikyu-group.com';
const SLUGS = ['why-rikyu', 'tropical-sauna-science', 'real-place-ai-era'];

const pick = (s, re) => { const m = s.match(re); return m ? m[1].trim() : ''; };

/* ---------- v2 の器 ---------- */
const CSS = `
:root{
  --sumi:#141210;--sumi-3:#0f0d0b;--paper:#f3eee3;
  --kin:#b08d57;--kin-bright:#cfa96e;--kin-paper:#7d6134;--rikyu:#5c6653;
  --shu:#a03e2d;--shu-deep:#8a3020;
  --ink:#26221d;--ink-soft:#5f584c;--wash:#efe9dc;--wash-mute:#a89f8d;
  --serif:"Noto Serif JP","Hiragino Mincho ProN","Yu Mincho","YuMincho",serif;
  --sans:"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif;
  --line-d:rgba(176,141,87,.28);--line-p:rgba(38,34,29,.16);
  --grain:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:var(--serif);font-size:15.5px;line-height:2.2;-webkit-font-smoothing:antialiased;position:relative}
body::before{content:"";position:fixed;inset:0;background:var(--grain);pointer-events:none;z-index:0}
a{color:inherit}
h1,h2,h3,.lead{line-break:strict;overflow-wrap:anywhere}
.nowrap{display:inline-block}
header.site{position:relative;z-index:1;background:var(--sumi);color:var(--wash);padding:10px 24px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;border-bottom:1px solid var(--line-d)}
header.site .logo{font-size:17px;letter-spacing:.3em;font-weight:500;text-decoration:none;line-height:1.3;padding:6px 0}
header.site .logo small{display:block;font-family:var(--sans);font-size:9px;letter-spacing:.3em;color:var(--kin-bright);font-weight:400}
header.site .sub{margin-left:auto;display:flex;gap:2px}
header.site .sub a{display:inline-block;font-family:var(--sans);font-size:12px;letter-spacing:.14em;color:var(--wash-soft);text-decoration:none;padding:14px 10px}
header.site .sub a:hover{color:var(--kin-bright)}
.h-cta{display:inline-flex;align-items:center;min-height:44px;padding:8px 20px;background:var(--shu);color:#f6efe4;font-family:var(--serif);font-size:12.5px;letter-spacing:.18em;text-decoration:none}
.h-cta:hover{background:var(--shu-deep)}
@media(max-width:560px){header.site{gap:10px;padding:10px 14px}header.site .sub{display:none}.h-cta{padding:8px 20px;font-size:11.5px}}
main{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:72px 24px 96px}
.meta{font-family:var(--sans);font-size:11.5px;letter-spacing:.16em;color:var(--kin-paper)}
h1{margin-top:18px;font-size:clamp(24px,4.6vw,32px);font-weight:600;letter-spacing:.06em;line-height:1.8}
.lead{margin-top:26px;color:var(--ink-soft);font-size:15px}
article h2{margin:64px 0 22px;font-size:19px;font-weight:600;letter-spacing:.08em;padding-left:16px;border-left:3px solid var(--kin)}
article p{margin-top:1.6em}
@media(max-width:430px){article h2{font-size:17px;letter-spacing:.03em}}
article em{font-style:normal;background:linear-gradient(transparent 72%,rgba(176,141,87,.35) 72%)}
blockquote{margin:2.2em 0;padding:20px 26px;background:rgba(92,102,83,.08);border-left:2px solid var(--rikyu);font-size:14.5px;color:var(--ink-soft)}
.cta{margin-top:84px;padding:48px 32px;background:var(--sumi);color:var(--wash);text-align:center;position:relative}
.cta::before,.cta::after{content:"";position:absolute;width:14px;height:14px}
.cta::before{top:-1px;left:-1px;border-top:2px solid var(--kin);border-left:2px solid var(--kin)}
.cta::after{bottom:-1px;right:-1px;border-bottom:2px solid var(--kin);border-right:2px solid var(--kin)}
.cta .t{font-size:16px;letter-spacing:.26em}
.cta .s{margin-top:12px;font-family:var(--sans);font-size:11.5px;letter-spacing:.14em;color:var(--wash-mute)}
.cta .row{margin-top:26px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.cta a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 30px;font-size:13px;letter-spacing:.2em;text-decoration:none;border:1px solid transparent}
.cta a.main{background:var(--shu);color:#f6efe4}
.cta a.main:hover{background:var(--shu-deep)}
.cta a.ghost{border-color:var(--line-d);color:var(--wash)}
.cta a.ghost:hover{border-color:var(--kin-bright);color:var(--kin-bright)}
footer{position:relative;z-index:1;background:var(--sumi-3);color:var(--wash-mute);text-align:center;padding:36px 24px;font-family:var(--sans);font-size:10.5px;letter-spacing:.2em}
footer a{display:inline-block;color:var(--wash);text-decoration:none;padding:14px 10px}
footer a:hover{color:var(--kin-bright)}
/* 記事一覧 */
.idx-head{margin-bottom:56px}
.idx-head h1{margin-top:14px}
.idx-head p{margin-top:18px;color:var(--ink-soft);font-size:14px}
.cards{display:grid;gap:2px;background:var(--line-p);border:1px solid var(--line-p)}
.card{display:block;background:var(--paper);padding:34px 30px;text-decoration:none;transition:background .3s ease}
.card:hover{background:#ece5d4}
.card .c-meta{font-family:var(--sans);font-size:11px;letter-spacing:.16em;color:var(--kin-paper)}
.card h2{margin-top:12px;font-size:18px;font-weight:600;letter-spacing:.04em;line-height:1.9}
@media(max-width:430px){.card h2{font-size:16.5px}}
.card p{margin-top:12px;font-size:13px;color:var(--ink-soft);line-height:2}
.card .more{display:inline-block;margin-top:16px;font-family:var(--sans);font-size:11px;letter-spacing:.24em;color:var(--kin-paper)}
`;
const ICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23141210'/%3E%3Ccircle cx='32' cy='32' r='24' fill='none' stroke='%23b08d57' stroke-width='2' stroke-dasharray='132 19' stroke-linecap='round' transform='rotate(-80 32 32)'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-size='24' font-family='serif' fill='%23f3eee3'%3E利%3C/text%3E%3C/svg%3E`;

const header = `<header class="site">
  <a class="logo" href="/">利休<small>RIKYU · CHIANG MAI</small></a>
  <nav class="sub"><a href="/blog/">読みもの</a><a href="/faq/">よくある問い</a></nav>
  <a class="h-cta" href="https://line.me/R/ti/p/@rikyu" target="_blank" rel="noopener">一報を受け取る</a>
</header>`;
const cta = `<div class="cta">
    <div class="t">整う。遊ぶ。つながる。</div>
    <div class="s">チェンマイ・ナイトバザール3F ジャパニーズ ウェルネスラウンジ「利休」— <span class="nowrap">2026年開業準備中</span></div>
    <div class="row"><a class="main" href="https://line.me/R/ti/p/@rikyu" target="_blank" rel="noopener">開業の一報を、LINEで受け取る</a><a class="ghost" href="/">トップページへ</a></div>
  </div>`;
const footer = `<footer>
  <a href="/blog/">利休ノウナイ</a> — © 2026 RIKYU, Chiang Mai
</footer>`;

const shell = ({ title, desc, ogTitle, ogDesc, path, jsonld, bodyMain, ogType }) => `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDesc}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${BASE}${path}">
<meta property="og:image" content="${BASE}/ogp.png">
<meta property="og:locale" content="ja_JP">
<link rel="canonical" href="${BASE}${path}">
<link rel="icon" href="${ICON}">
${jsonld}<style>${CSS}</style>
</head>
<body>
${header}
<main>
${bodyMain}
</main>
${footer}
</body>
</html>
`;

const NOWRAP = [
  '科学的に成立するのか', '当然の疑問', '何が起きているのか',
  'コミュニティがエンジン', '安くなっていく', '茶人であった男の話',
  '開ければよかったのだ。', 'しないための数字だ。', '三層になっているからだ。', 'むしろそちら側にある。', '説明されることが多い。', '秋の高原の空気に近い。',
];
const nowrapFix = (html) => NOWRAP.reduce((h, w) => h.split(w).join(`<span class="nowrap">${w}</span>`), html);

/* ---------- 記事 ---------- */
mkdirSync(resolve(root, 'dist/blog'), { recursive: true });
const cards = [];
for (const slug of SLUGS) {
  const src = readFileSync(resolve(root, `blog-src/${slug}.html`), 'utf8');
  const title = pick(src, /<title>([\s\S]*?)<\/title>/).replace(/利休の脳内/g, '利休ノウナイ');
  const desc = pick(src, /<meta name="description" content="([^"]*)"/);
  const ogTitle = pick(src, /<meta property="og:title" content="([^"]*)"/);
  const ogDesc = pick(src, /<meta property="og:description" content="([^"]*)"/);
  let jsonld = pick(src, /(<script type="application\/ld\+json">[\s\S]*?<\/script>)/);
  jsonld = jsonld ? jsonld.replace(/https:\/\/rikyu-site(-orcin)?\.vercel\.app/g, 'https://rikyu-group.com').replace(/\.html"/g, '"') + '\n' : '';
  const meta = pick(src, /<div class="meta">([\s\S]*?)<\/div>/);
  const h1 = pick(src, /<h1>([\s\S]*?)<\/h1>/);
  const lead = pick(src, /<p class="lead">([\s\S]*?)<\/p>/);
  const article = pick(src, /(<article>[\s\S]*?<\/article>)/);
  if (!title || !article) { console.error(`✗ ${slug}: 抽出に失敗`); process.exit(1); }

  const bodyMain = nowrapFix(`  <div class="meta">${meta}</div>
  <h1>${h1}</h1>
  <p class="lead">${lead}</p>

  ${article}

  ${cta}`);
  writeFileSync(resolve(root, `dist/blog/${slug}.html`),
    shell({ title, desc, ogTitle, ogDesc, path: `/blog/${slug}`, jsonld, bodyMain, ogType: 'article' }));
  console.log(`✓ dist/blog/${slug}.html`);
  cards.push({ slug, meta, h1, desc });
}

/* ---------- 一覧 ---------- */
const cardsHtml = cards.map(c => `    <a class="card" href="/blog/${c.slug}">
      <div class="c-meta">${c.meta}</div>
      <h2>${c.h1}</h2>
      <p>${c.desc}</p>
      <span class="more">読む →</span>
    </a>`).join('\n');

const idxMain = nowrapFix(`  <div class="idx-head">
    <div class="meta">JOURNAL</div>
    <h1>利休ノウナイ</h1>
    <p>チェンマイ発。ウェルネスと、コミュニティと、百年つづく商いについて、創業者が考えていることを書きます。</p>
  </div>
  <div class="cards">
${cardsHtml}
  </div>

  ${cta}`);

writeFileSync(resolve(root, 'dist/blog/index.html'), shell({
  title: '利休ノウナイ｜チェンマイ発・ウェルネス×コミュニティを考える公式ブログ',
  desc: 'チェンマイの会員制ウェルネスラウンジ「利休」創業者のブログ。屋号の由来、熱帯サウナの科学、AI時代にリアルな場所へ投資する理由。',
  ogTitle: '利休ノウナイ｜RIKYU FOUNDER\'S BLOG',
  ogDesc: 'チェンマイの会員制ウェルネスラウンジ「利休」創業者のブログ。',
  path: '/blog/', jsonld: '', bodyMain: idxMain, ogType: 'website',
}));
console.log('✓ dist/blog/index.html');
