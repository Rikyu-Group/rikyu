#!/usr/bin/env node
/**
 * gen-faq.mjs — よくある問い（FAQ）ページを dist/faq/ に生成する
 * 内容はサイト本体・concept.md の確定情報のみ。推測で埋めない。
 * 使い方: node gen-faq.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 'https://rikyu-group.com';

const QA = [
  ['会員でなくても利用できますか？',
   'できます。ドロップインは一回500THB、どなたでも利用できます（要予約）。気に入ったら回数券（五回2,000THB・十回3,600THB）へ。月額会員（3,500THB・使い放題）もご用意しています。'],
  ['予約は必要ですか？',
   'はい、ご利用は予約制です。ご予約・お問い合わせは公式LINEからどうぞ。'],
  ['何がありますか？',
   'フィンランド式サウナ（4〜6名・二段）、アイスバス、ととのい・マッサージの間、コーヒーやスムージーと軽食のラウンジ、ビリヤードや将棋・ボードゲーム、畳のVIP和室、電源とWi-Fiの仕事場。延床約180㎡・5区画です。'],
  ['営業時間は決まっていますか？',
   '開業時に確定します。時間で区切らず、静の「休」と動の「利」が同時にある設計です。'],
  ['お酒は飲めますか？',
   'サウナとラウンジはノンアルコールです。整いも語らいも、澄んだ頭で。お酒は夜のVIP和室（予約制）でのみ、<span class="nowrap">お楽しみいただけます。</span>'],
  ['場所はどこですか？',
   'タイ・チェンマイ、ナイトバザールの三階を予定しています（最終調整中）。表通りに看板は出していません。「雑踏の上にある」ことが、この場所の価値だと考えています。'],
  ['オンラインコミュニティでは何をしますか？',
   '会員が参加できるオンラインの場です。朝ラン・合トレ・リトリート・食事会・仕事の縁結びなどの催しを、ここから<span class="nowrap">生み出していきます。</span>'],
  ['開業はいつですか？',
   '2027年上旬を予定しています。準備の様子は読みもの「利休ノウナイ」で発信しています。'],
];

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
h1,h2{line-break:strict;overflow-wrap:anywhere}
.nowrap{display:inline-block}
header.site{position:relative;z-index:1;background:var(--sumi);color:var(--wash);padding:10px 24px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;border-bottom:1px solid var(--line-d)}
header.site .logo{font-size:17px;letter-spacing:.3em;font-weight:500;text-decoration:none;line-height:1.3;padding:6px 0}
header.site .logo small{display:block;font-family:var(--sans);font-size:9px;letter-spacing:.3em;color:var(--kin-bright);font-weight:400}
header.site .sub{margin-left:auto;display:flex;gap:2px}
header.site .sub a{display:inline-block;font-family:var(--sans);font-size:12px;letter-spacing:.14em;color:var(--wash-soft);text-decoration:none;padding:14px 10px}
header.site .sub a:hover{color:var(--kin-bright)}
.h-cta{display:inline-flex;align-items:center;min-height:44px;padding:8px 20px;background:var(--shu);color:#f6efe4;font-family:var(--serif);font-size:12.5px;letter-spacing:.18em;text-decoration:none}
.h-cta:hover{background:var(--shu-deep)}
@media(max-width:560px){header.site{gap:10px;padding:10px 14px}header.site .sub{display:none}.h-cta{padding:8px 26px;font-size:11.5px}}
main{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:72px 24px 96px}
.meta{font-family:var(--sans);font-size:11.5px;letter-spacing:.16em;color:var(--kin-paper)}
h1{margin-top:14px;font-size:clamp(24px,4.6vw,32px);font-weight:600;letter-spacing:.1em;line-height:1.8}
.lead{margin-top:20px;color:var(--ink-soft);font-size:14.5px}
.qa{border-bottom:1px solid var(--line-p);padding:36px 0}
.qa:first-of-type{margin-top:28px;border-top:1px solid var(--line-p)}
.qa h2{display:flex;gap:14px;align-items:baseline;font-size:16.5px;font-weight:600;letter-spacing:.06em;line-height:2}
.qa h2 .m{flex:none;font-size:12px;color:var(--kin-paper);letter-spacing:.2em;border:1px solid rgba(125,97,52,.4);padding:2px 8px;transform:translateY(-2px)}
.qa p{margin-top:14px;padding-left:44px;font-size:14px;color:var(--ink-soft);line-height:2.2}
@media(max-width:480px){.qa p{padding-left:0}}
.note{margin-top:32px;font-family:var(--sans);font-size:11px;letter-spacing:.1em;color:var(--ink-soft)}
.cta{margin-top:72px;padding:48px 32px;background:var(--sumi);color:var(--wash);text-align:center;position:relative}
.cta::before,.cta::after{content:"";position:absolute;width:14px;height:14px}
.cta::before{top:-1px;left:-1px;border-top:2px solid var(--kin);border-left:2px solid var(--kin)}
.cta::after{bottom:-1px;right:-1px;border-bottom:2px solid var(--kin);border-right:2px solid var(--kin)}
.cta .t{font-size:16px;letter-spacing:.26em}
.cta .row{margin-top:24px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.cta a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 30px;font-size:13px;letter-spacing:.2em;text-decoration:none;border:1px solid transparent}
.cta a.main{background:var(--shu);color:#f6efe4}
.cta a.main:hover{background:var(--shu-deep)}
.cta a.ghost{border-color:var(--line-d);color:var(--wash)}
.cta a.ghost:hover{border-color:var(--kin-bright);color:var(--kin-bright)}
footer{position:relative;z-index:1;background:var(--sumi-3);color:var(--wash-mute);text-align:center;padding:36px 24px;font-family:var(--sans);font-size:10.5px;letter-spacing:.2em}
footer a{display:inline-block;color:var(--wash);text-decoration:none;padding:14px 10px}
footer a:hover{color:var(--kin-bright)}
`;
const ICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23141210'/%3E%3Ccircle cx='32' cy='32' r='24' fill='none' stroke='%23b08d57' stroke-width='2' stroke-dasharray='132 19' stroke-linecap='round' transform='rotate(-80 32 32)'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-size='24' font-family='serif' fill='%23f3eee3'%3E利%3C/text%3E%3C/svg%3E`;

const jsonld = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: QA.map(([q, a]) => ({
    '@type': 'Question', name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const qaHtml = QA.map(([q, a]) => `  <div class="qa">
    <h2><span class="m">問</span>${q}</h2>
    <p>${a}</p>
  </div>`).join('\n');

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>よくある問い｜利休 RIKYU — チェンマイ・ジャパニーズ ウェルネスラウンジ</title>
<meta name="description" content="チェンマイ・ナイトバザール3Fの会員制ウェルネスラウンジ「利休」への、よくある問いと答え。料金・予約・場所・創業会員について。">
<meta property="og:title" content="よくある問い｜利休 RIKYU">
<meta property="og:description" content="料金・予約・場所・会員について、よくある問いと答え。">
<meta property="og:type" content="website">
<meta property="og:url" content="${BASE}/faq/">
<meta property="og:image" content="${BASE}/ogp.png">
<meta property="og:locale" content="ja_JP">
<link rel="canonical" href="${BASE}/faq/">
<link rel="icon" href="${ICON}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}</style>
</head>
<body>
<header class="site">
  <a class="logo" href="/">利休<small>RIKYU · CHIANG MAI</small></a>
  <nav class="sub"><a href="/blog/">読みもの</a><a href="/faq/">よくある問い</a></nav>
  <a class="h-cta" href="/line/">先行案内</a>
</header>
<main>
  <div class="meta">FAQ</div>
  <h1>よくある問い</h1>
  <p class="lead">はじめての方から、よくいただく問いをまとめました。ここにない問いは、開業までに読みもの「利休ノウナイ」でもお答えしていきます。</p>
${qaHtml}
  <div class="note">※ 料金・内容・営業時間は開業時に確定します。</div>
  <div class="cta">
    <div class="t">整う。遊ぶ。つながる。</div>
    <div class="row"><a class="main" href="/line/">先行案内を受け取る</a><a class="ghost" href="/blog/">「利休ノウナイ」を読む</a></div>
  </div>
</main>
<footer>
  <a href="/">利休 RIKYU</a> — © 2026 RIKYU, Chiang Mai
</footer>
</body>
</html>
`;

mkdirSync(resolve(process.cwd(), 'dist/faq'), { recursive: true });
writeFileSync(resolve(process.cwd(), 'dist/faq/index.html'), html);
console.log('✓ dist/faq/index.html');
