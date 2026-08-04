#!/usr/bin/env node
// 公式LINE準備中ページを5言語で生成する
//   dist/line/ (ja), dist/en/line/, dist/zh/line/, dist/ko/line/, dist/th/line/
import { writeFileSync, mkdirSync } from 'node:fs';

const T = {
  ja: {
    htmlLang: 'ja', dir: 'line', home: '/',
    title: '公式LINE 準備中｜利休 RIKYU',
    desc: '利休の公式LINEは準備中です。先行案内は開設後にお知らせします。',
    h1: '公式LINE、ただいま準備中です。',
    sub: '整い次第、このサイトと読みもの「利休ノウナイ」でお知らせします。開業の先行案内も、そちらから。もう少しだけ、<span class="nowrap">お待ちください。</span>',
    btnHome: 'トップページへ', btnBlog: '「利休ノウナイ」を読む',
  },
  en: {
    htmlLang: 'en', dir: 'en/line', home: '/en/',
    title: 'Official LINE — Coming Soon | RIKYU',
    desc: 'Our official LINE is coming soon. Early opening updates will follow there.',
    h1: 'Our official LINE is coming soon.',
    sub: 'We will announce it on this site as soon as it is ready — early opening updates will be sent from there too. Just a little longer.',
    btnHome: 'Back to top', btnBlog: 'Read the journal (Japanese)',
  },
  zh: {
    htmlLang: 'zh', dir: 'zh/line', home: '/zh/',
    title: '官方LINE 即将开通｜利休 RIKYU',
    desc: '利休的官方LINE正在筹备中。开业抢先资讯将从那里发送。',
    h1: '官方LINE，即将开通。',
    sub: '开通后将在本网站公布，开业的抢先资讯也将从那里发送。<span class="nowrap">请再稍等片刻。</span>',
    btnHome: '返回首页', btnBlog: '阅读博客（日语）',
  },
  ko: {
    htmlLang: 'ko', dir: 'ko/line', home: '/ko/',
    title: '공식 LINE 준비 중｜利休 RIKYU',
    desc: '利休의 공식 LINE은 준비 중입니다. 오픈 선행 안내도 그곳에서 보내 드립니다.',
    h1: '공식 LINE, <span class="nowrap">준비 중입니다.</span>',
    sub: '준비되는 대로 이 사이트에서 알려 드리겠습니다. 오픈 선행 안내도 그곳에서 보내 드립니다. 조금만 기다려 주세요.',
    btnHome: '홈으로', btnBlog: '저널 읽기(일본어)',
  },
  th: {
    htmlLang: 'th', dir: 'th/line', home: '/th/',
    title: 'LINE ทางการ กำลังเตรียมเปิด｜利休 RIKYU',
    desc: 'LINE ทางการของ 利休 กำลังเตรียมเปิด ข่าวเปิดร้านก่อนใครจะส่งจากที่นั่น',
    h1: 'LINE ทางการ กำลังเตรียมเปิด',
    sub: 'พร้อมเมื่อไหร่จะแจ้งบนเว็บไซต์นี้ ข่าวเปิดร้านก่อนใครก็จะส่งจากที่นั่น รออีกนิดนะครับ',
    btnHome: 'กลับหน้าแรก', btnBlog: 'อ่านบล็อก (ภาษาญี่ปุ่น)',
  },
};

const LANG_LINKS = [
  ['ja', '/line/', '日本語'], ['en', '/en/line/', 'EN'], ['zh', '/zh/line/', '中文'],
  ['ko', '/ko/line/', '한국어'], ['th', '/th/line/', 'ไทย'],
];

for (const [lang, t] of Object.entries(T)) {
  const langbar = LANG_LINKS.map(([l, p, label]) =>
    `<a href="${p}"${l === lang ? ' class="on"' : ''}>${label}</a>`).join('');
  const html = `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${t.title}</title>
<meta name="description" content="${t.desc}">
<meta property="og:title" content="${t.title}">
<meta property="og:description" content="${t.desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://rikyu-group.com/${t.dir}/">
<meta property="og:image" content="https://rikyu-group.com/ogp.png">
<link rel="canonical" href="https://rikyu-group.com/${t.dir}/">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23141210'/%3E%3Ccircle cx='32' cy='32' r='24' fill='none' stroke='%23b08d57' stroke-width='2' stroke-dasharray='132 19' stroke-linecap='round' transform='rotate(-80 32 32)'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-size='24' font-family='serif' fill='%23f3eee3'%3E利%3C/text%3E%3C/svg%3E">
<style>
:root{--sumi:#141210;--paper:#f3eee3;--kin:#b08d57;--kin-bright:#cfa96e;--shu:#a03e2d;--shu-deep:#8a3020;--wash:#efe9dc;--wash-soft:#cfc7b6;--wash-mute:#a89f8d;
--serif:"Hiragino Mincho ProN","Yu Mincho",serif;--sans:"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;--line-d:rgba(176,141,87,.28)}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--sumi);color:var(--wash);font-family:var(--serif);min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px;position:relative;overflow:hidden}
.ring{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(88vmin,560px);height:min(88vmin,560px);border-radius:50%;border:1px solid rgba(176,141,87,.3);pointer-events:none}
.brand{position:relative;font-size:26px;letter-spacing:.35em;text-indent:.35em;font-weight:500}
.brand small{display:block;margin-top:8px;font-family:var(--sans);font-size:9px;letter-spacing:.3em;color:var(--kin-bright)}
h1{position:relative;margin-top:44px;font-size:clamp(22px,5vw,30px);letter-spacing:.2em;font-weight:500;line-height:2}
.sub{position:relative;margin-top:18px;font-size:14px;letter-spacing:.08em;color:var(--wash-soft);line-height:2.3;max-width:480px}
.nowrap{display:inline-block}
.row{position:relative;margin-top:40px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:12px 32px;font-size:13.5px;letter-spacing:.2em;text-decoration:none;color:var(--wash);border:1px solid transparent}
.btn.shu{background:var(--shu);color:#f6efe4}
.btn.shu:hover{background:var(--shu-deep)}
.btn.ghost{border-color:rgba(176,141,87,.55)}
.btn.ghost:hover{border-color:var(--kin-bright);color:var(--kin-bright)}
.langbar{position:relative;margin-top:34px;font-family:var(--sans);font-size:11.5px;letter-spacing:.08em}
.langbar a{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;color:var(--wash-mute);text-decoration:none;padding:12px 8px}
.langbar a:hover,.langbar a.on{color:var(--kin-bright)}
</style>
</head>
<body>
<div class="ring" aria-hidden="true"></div>
<div class="brand">利休<small>RIKYU · CHIANG MAI</small></div>
<h1>${t.h1}</h1>
<p class="sub">${t.sub}</p>
<div class="row">
  <a class="btn shu" href="${t.home}">${t.btnHome}</a>
  <a class="btn ghost" href="/blog/">${t.btnBlog}</a>
</div>
<nav class="langbar">${langbar}</nav>
</body>
</html>`;
  mkdirSync(`dist/${t.dir}`, { recursive: true });
  writeFileSync(`dist/${t.dir}/index.html`, html);
  console.log(`✓ dist/${t.dir}/index.html`);
}
