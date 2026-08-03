#!/usr/bin/env node
/**
 * audit.mjs — LPの機械検収
 *
 * 使い方:
 *   node audit.mjs dist/index.html
 *   node audit.mjs https://example.com --out audit
 *
 * 「美しさ」は判定しない。崩れ・読めなさ・遅さ・欠落だけを機械で判定する。
 * 1件でもFAILがあれば終了コード1で落ちる（CIやループに組み込むため）。
 *
 * 依存: playwright（なければ npx playwright install chromium）
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/* Playwright が無い環境で、英語のスタックトレースを出さない。
   買い手が最初に踏む段差なので、日本語で次の一手だけを伝える。 */
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(`
検収に使う Playwright が見つかりませんでした。

次の2行をコピーして、ターミナルに貼って実行してください:

  npm i -D playwright
  npx playwright install chromium

（1〜2分かかります。1回入れれば、次からは不要です）
`);
  process.exit(2);
}

const WIDTHS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

// 閾値の根拠は references/quality-gates.md
const T = {
  contrastBody: 4.5,      // WCAG AA 通常テキスト
  contrastLarge: 3.0,     // WCAG AA 大きいテキスト（24px以上 or 18.66px以上のbold）
  tapTarget: 44,          // px。iOS/Android共通の推奨最小
  imageOversizeRatio: 2,  // 実寸が表示寸の何倍で警告するか
  totalBytesWarn: 2_000_000,
  lcpWarnMs: 2500,
};

const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith('--'));
const outDir = (() => {
  const i = argv.indexOf('--out');
  return i >= 0 && argv[i + 1] ? argv[i + 1] : 'audit';
})();

if (!target) {
  console.error('使い方: node audit.mjs <dist/index.html | URL> [--out audit]');
  process.exit(2);
}

const url = /^https?:\/\//.test(target)
  ? target
  : pathToFileURL(resolve(target)).href;

if (!/^https?:\/\//.test(target) && !existsSync(resolve(target))) {
  console.error(`ファイルが見つかりません: ${target}`);
  process.exit(2);
}

mkdirSync(outDir, { recursive: true });

const results = [];
const add = (level, check, message, detail) =>
  results.push({ level, check, message, detail });

/* ------------------------------------------------------------------ */
/* ページ内で走る検査群                                                 */
/* ------------------------------------------------------------------ */

const IN_PAGE = `(() => {
  const out = {};

  /* --- 色ユーティリティ --- */
  const parseColor = (s) => {
    if (!s) return null;
    const m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map((v) => parseFloat(v.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const over = (fg, bg) => {
    // 半透明の前景を背景に合成する
    const a = fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  };
  // 祖先をたどって実効背景色を求める
  const effectiveBg = (el) => {
    let acc = null;
    let node = el;
    while (node && node !== document.documentElement.parentNode) {
      const st = getComputedStyle(node);
      const c = parseColor(st.backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? over(acc, c) : c;
        if (acc.a >= 1 || c.a >= 1) return acc.a >= 1 ? acc : over(acc, { r: 255, g: 255, b: 255, a: 1 });
      }
      // 背景画像があると色だけでは判定できない。判定不能として返す
      if (st.backgroundImage && st.backgroundImage !== 'none') return null;
      node = node.parentElement;
    }
    return acc || { r: 255, g: 255, b: 255, a: 1 };
  };

  const isVisible = (el) => {
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const label = (el) => {
    const t = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
      (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') +
      (t ? ' 「' + t + '」' : '');
  };

  /* --- 1. 横スクロール --- */
  out.horizontalScroll = {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  };

  /* --- 2. コントラスト比 --- */
  const contrast = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let n;
  while ((n = walker.nextNode())) {
    const text = n.nodeValue.trim();
    if (!text) continue;
    const el = n.parentElement;
    if (!el || seen.has(el) || !isVisible(el)) continue;
    seen.add(el);
    const st = getComputedStyle(el);
    const fg = parseColor(st.color);
    const bg = effectiveBg(el);
    if (!fg || !bg) continue; // 背景画像上は機械判定しない（目視へ回す）
    const size = parseFloat(st.fontSize);
    const weight = parseInt(st.fontWeight, 10) || 400;
    const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
    const r = ratio(fg.a < 1 ? over(fg, bg) : fg, bg);
    const need = isLarge ? ${T.contrastLarge} : ${T.contrastBody};
    if (r < need) {
      contrast.push({ el: label(el), ratio: Math.round(r * 100) / 100, need, size: Math.round(size), text: text.slice(0, 30) });
    }
  }
  out.contrast = contrast.slice(0, 30);

  /* --- 3. タップ領域 --- */
  const small = [];
  document.querySelectorAll('a, button, input, select, textarea, [role=button]').forEach((el) => {
    if (!isVisible(el)) return;
    const r = el.getBoundingClientRect();
    // インラインリンク（文章中のリンク）は対象外。行内に収まる高さのものは除く
    const inlineInText = el.tagName === 'A' && r.height < 30 && el.closest('p, li');
    if (inlineInText) return;
    if (r.width < ${T.tapTarget} || r.height < ${T.tapTarget}) {
      small.push({ el: label(el), w: Math.round(r.width), h: Math.round(r.height) });
    }
  });
  out.tapTargets = small.slice(0, 30);

  /* --- 4. ファーストビュー内のCTA --- */
  // CTAの検出。文言の regex だけに頼ると必ず取りこぼす。
  // （診断LPの「はじめる」、紹介LPの「中身を見てみる」を続けて拾えず、
  //  正常に動いているページを誤ってFAILにした事故が2回。以後は3系統のORで判定する）
  const ctaRe = /(問い合わせ|お問合せ|申し込|申込|予約|購入|登録|資料|相談|無料|ダウンロード|カートに|はじめる|始める|スタート|診断|チェック|試す|体験|見積|来店|受け取る|送信|参加|見てみる|見る|詳しく|くわしく|こちら|contact|apply|book|buy|start|signup|sign-up|get|learn more)/i;
  const ctaClassRe = /(^|[\s_-])(btn|button|cta|action|apply|contact|conversion)([\s_-]|$)/i;

  const looksLikeCta = (el) => {
    // 1) クラス名・idの慣習で判定する
    const cls = (typeof el.className === 'string' ? el.className : '') + ' ' + (el.id || '');
    if (ctaClassRe.test(cls)) return true;
    // 2) 文言・遷移先で判定する
    if (ctaRe.test((el.textContent || '') + ' ' + (el.getAttribute('href') || ''))) return true;
    // 3) 見た目で判定する（塗りのある十分な大きさの塊は、文言が何であれボタン）
    const st = getComputedStyle(el);
    const bg = parseColor(st.backgroundColor);
    const r = el.getBoundingClientRect();
    if (bg && bg.a > 0.5 && r.height >= 40 && r.width >= 96) return true;
    return false;
  };

  const ctas = [...document.querySelectorAll('a, button, [role=button], input[type=submit]')]
    .filter((el) => isVisible(el) && looksLikeCta(el));
  out.ctaInFirstView = ctas.some((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.top < window.innerHeight;
  });
  out.ctaCount = ctas.length;

  /* --- 5. はみ出し要素 --- */
  const overflow = [];
  const vw = document.documentElement.clientWidth;
  document.querySelectorAll('body *').forEach((el) => {
    if (!isVisible(el)) return;
    const st = getComputedStyle(el);
    if (st.position === 'fixed') return;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    if (r.right > vw + 1 || r.left < -1) {
      // 親がはみ出していれば子は報告しない（原因の元だけ出す）
      const p = el.parentElement;
      if (p) {
        const pr = p.getBoundingClientRect();
        if (pr.right > vw + 1 || pr.left < -1) return;
      }
      overflow.push({ el: label(el), left: Math.round(r.left), right: Math.round(r.right), vw });
    }
  });
  out.overflow = overflow.slice(0, 20);

  /* --- 5.5 改行落ち（日本語特有） --- */
  // 折り返しの結果、最終行に1〜2文字だけ残る現象。
  // 「〜しています。」の「す。」だけが次行に落ちる、など。
  // 英語圏の検収には存在しない、日本語LPの品質を最も分かりやすく下げる崩れ。
  const orphans = [];
  document.querySelectorAll('h1,h2,h3,h4,h5,p,li,dd,dt,figcaption,button,a,td,th').forEach((el) => {
    // 直下にブロック要素を持つものは、テキストの塊として測れないので除外
    const hasBlockChild = [...el.children].some((c) => {
      const d = getComputedStyle(c).display;
      return d !== 'inline' && d !== 'contents';
    });
    if (hasBlockChild || !isVisible(el)) return;
    const text = (el.textContent || '').trim();
    if (text.length < 8) return; // 短文は折り返さない

    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
    if (!rects.length) return;

    // 同じ行（top が近いもの）をまとめて1行とみなす
    const rows = new Map();
    for (const r of rects) {
      const key = Math.round(r.top / 2) * 2;
      rows.set(key, (rows.get(key) || 0) + r.width);
    }
    const widths = [...rows.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);
    if (widths.length < 2) return; // 1行なら折り返していない

    const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    const lastChars = widths[widths.length - 1] / fs;
    if (lastChars <= 2.2) {
      orphans.push({
        el: label(el),
        chars: Math.max(1, Math.round(lastChars)),
        tail: text.slice(-6),
        lines: widths.length,
      });
    }
  });
  out.orphanLines = orphans.slice(0, 25);

  /* --- 6. 画像 --- */
  const images = [];
  document.querySelectorAll('img').forEach((img) => {
    const r = img.getBoundingClientRect();
    images.push({
      src: (img.currentSrc || img.src || '').split('/').pop().slice(0, 60),
      natural: [img.naturalWidth, img.naturalHeight],
      displayed: [Math.round(r.width), Math.round(r.height)],
      hasAlt: img.hasAttribute('alt'),
      hasDims: img.hasAttribute('width') && img.hasAttribute('height'),
      visible: isVisible(img),
    });
  });
  out.images = images;

  /* --- 7. メタ情報 --- */
  const meta = (sel, attr = 'content') => {
    const el = document.querySelector(sel);
    return el ? (el.getAttribute(attr) || '').trim() : '';
  };
  out.meta = {
    title: (document.title || '').trim(),
    description: meta('meta[name="description"]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogImage: meta('meta[property="og:image"]'),
    favicon: !!document.querySelector('link[rel~="icon"]'),
    lang: document.documentElement.getAttribute('lang') || '',
    viewport: meta('meta[name="viewport"]'),
    h1Count: document.querySelectorAll('h1').length,
  };

  /* --- 8. 電話番号・メールのリンク化 --- */
  const bodyText = document.body.innerText || '';
  const telRe = /0\\d{1,4}[-(]?\\d{1,4}[-)]?\\d{3,4}/g;
  const mailRe = /[\\w.+-]+@[\\w-]+\\.[\\w.-]+/g;
  const linked = new Set();
  document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]').forEach((a) => {
    linked.add((a.textContent || '').replace(/[^0-9a-zA-Z@.]/g, ''));
    linked.add((a.getAttribute('href') || '').replace(/^(tel:|mailto:)/, '').replace(/[^0-9a-zA-Z@.]/g, ''));
  });
  const unlinked = [];
  for (const re of [telRe, mailRe]) {
    for (const m of bodyText.match(re) || []) {
      const key = m.replace(/[^0-9a-zA-Z@.]/g, '');
      if (!linked.has(key) && !unlinked.includes(m)) unlinked.push(m);
    }
  }
  out.unlinkedContacts = unlinked.slice(0, 10);

  /* --- 10. 外部依存（自己完結の担保） --- */
  out.externalRefs = [
    ...[...document.querySelectorAll('script[src]')].map((e) => e.src),
    ...[...document.querySelectorAll('link[rel=stylesheet]')].map((e) => e.href),
  ].filter((u) => /^https?:\\/\\//.test(u));

  return out;
})()`;

/* ------------------------------------------------------------------ */

const browser = await chromium.launch();
let totalBytes = 0;
let lcpMs = null;

for (const vp of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.name === 'mobile',
    hasTouch: vp.name === 'mobile',
  });
  const page = await ctx.newPage();

  if (vp.name === 'mobile') {
    page.on('response', async (res) => {
      try {
        const len = (await res.allHeaders())['content-length'];
        if (len) totalBytes += parseInt(len, 10);
      } catch { /* 取れないレスポンスは無視 */ }
    });
  }

  await page.goto(url, { waitUntil: 'networkidle' }).catch(async () => {
    await page.goto(url, { waitUntil: 'load' });
  });
  await page.waitForTimeout(400); // 遅延読み込み・フォント適用待ち

  if (vp.name === 'mobile') {
    lcpMs = await page.evaluate(() => new Promise((res) => {
      let v = null;
      try {
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) v = e.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch { /* 未対応環境 */ }
      setTimeout(() => res(v), 600);
    }));
  }

  const r = await page.evaluate(IN_PAGE);
  const at = `[${vp.name} ${vp.width}px]`;

  /* 1. 横スクロール */
  if (r.horizontalScroll.scrollWidth > r.horizontalScroll.clientWidth + 1) {
    add('FAIL', '横スクロール', `${at} ページが横に ${r.horizontalScroll.scrollWidth - r.horizontalScroll.clientWidth}px はみ出しています`,
      r.overflow.map((o) => `  ${o.el} (right=${o.right} > ${o.vw})`));
  }

  /* 5. はみ出し（横スクロールに至っていなくても報告） */
  if (r.overflow.length && r.horizontalScroll.scrollWidth <= r.horizontalScroll.clientWidth + 1) {
    add('WARN', 'はみ出し', `${at} 画面外にはみ出した要素が ${r.overflow.length} 件あります`,
      r.overflow.map((o) => `  ${o.el}`));
  }

  /* 5.5 改行落ち（日本語特有） */
  if (r.orphanLines.length) {
    add('WARN', '改行落ち', `${at} 最終行に1〜2文字だけ落ちている箇所が ${r.orphanLines.length} 件`,
      r.orphanLines.map((o) => `  「…${o.tail}」の末尾${o.chars}文字が${o.lines}行目に落下 — ${o.el}`));
  }

  /* 2. コントラスト */
  if (r.contrast.length) {
    add('FAIL', 'コントラスト比', `${at} WCAG AA を満たさない文字が ${r.contrast.length} 箇所`,
      r.contrast.map((c) => `  ${c.ratio}:1 (要 ${c.need}:1) ${c.size}px ${c.el}`));
  }

  /* 3. タップ領域 */
  if (vp.name === 'mobile' && r.tapTargets.length) {
    add('FAIL', 'タップ領域', `${at} ${T.tapTarget}px 未満の操作要素が ${r.tapTargets.length} 件`,
      r.tapTargets.map((t) => `  ${t.w}×${t.h}px ${t.el}`));
  }

  /* 4. FV内CTA */
  if (vp.name === 'mobile') {
    if (r.ctaCount === 0) {
      add('FAIL', 'CTA', 'CTAらしき要素が1つも見つかりません');
    } else if (!r.ctaInFirstView) {
      add('FAIL', 'CTA', `${at} ファーストビュー内にCTAがありません（スクロールしないと行動できない）`);
    }
  }

  /* 9. スクリーンショット */
  const shot = `${outDir}/${vp.name}-${vp.width}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  add('INFO', 'スクリーンショット', `${at} ${shot}`);

  /* デスクトップ幅で、幅に依存しない検査をまとめて実施 */
  if (vp.name === 'desktop') {
    /* 6. 画像 */
    const noAlt = r.images.filter((i) => !i.hasAlt);
    if (noAlt.length) {
      add('FAIL', '画像alt', `alt属性のない画像が ${noAlt.length} 件`, noAlt.map((i) => `  ${i.src}`));
    }
    const noDims = r.images.filter((i) => !i.hasDims && i.visible);
    if (noDims.length) {
      add('WARN', '画像サイズ属性', `width/height未指定の画像が ${noDims.length} 件（表示中にレイアウトがずれます）`,
        noDims.map((i) => `  ${i.src}`));
    }
    const oversize = r.images.filter(
      (i) => i.visible && i.displayed[0] > 0 && i.natural[0] > i.displayed[0] * T.imageOversizeRatio,
    );
    if (oversize.length) {
      add('WARN', '画像の過大サイズ', `表示寸法の${T.imageOversizeRatio}倍を超える画像が ${oversize.length} 件`,
        oversize.map((i) => `  ${i.src}: 実寸${i.natural[0]}px → 表示${i.displayed[0]}px`));
    }

    /* 7. メタ */
    const m = r.meta;
    if (!m.title) add('FAIL', 'メタ情報', 'title が空です');
    else if (m.title.length > 60) add('WARN', 'メタ情報', `title が長すぎます（${m.title.length}字。検索結果で切れます）`);
    if (!m.description) add('FAIL', 'メタ情報', 'meta description がありません');
    else if (m.description.length > 140) add('WARN', 'メタ情報', `meta description が長すぎます（${m.description.length}字）`);
    if (!m.ogTitle || !m.ogImage) add('FAIL', 'メタ情報', 'OGP（og:title / og:image）が不足。SNSでシェアされた時に何も出ません');
    if (!m.favicon) add('WARN', 'メタ情報', 'favicon がありません');
    if (!m.lang) add('WARN', 'メタ情報', '<html lang> が未指定です');
    if (!m.viewport) add('FAIL', 'メタ情報', 'viewport メタタグがありません（スマホで極小表示になります）');
    if (m.h1Count === 0) add('FAIL', '見出し構造', 'h1 がありません');
    if (m.h1Count > 1) add('WARN', '見出し構造', `h1 が ${m.h1Count} 個あります（1つに絞る）`);

    /* 8. 連絡先 */
    if (r.unlinkedContacts.length) {
      add('FAIL', '連絡先リンク', `tel:/mailto: になっていない連絡先が ${r.unlinkedContacts.length} 件（スマホでタップできません）`,
        r.unlinkedContacts.map((c) => `  ${c}`));
    }

    /* 10. 外部依存 */
    if (r.externalRefs.length) {
      add('WARN', '自己完結', `外部ドメインのCSS/JSを ${r.externalRefs.length} 件参照しています`,
        r.externalRefs.map((u) => `  ${u}`));
    }
  }

  await ctx.close();
}

await browser.close();

/* 10. 重量・LCP */
if (totalBytes > T.totalBytesWarn) {
  add('WARN', '総転送量', `${(totalBytes / 1024 / 1024).toFixed(2)}MB（目安 ${T.totalBytesWarn / 1024 / 1024}MB以下）`);
} else if (totalBytes > 0) {
  add('INFO', '総転送量', `${(totalBytes / 1024).toFixed(0)}KB`);
}
if (lcpMs != null) {
  const lv = lcpMs > T.lcpWarnMs ? 'WARN' : 'INFO';
  add(lv, 'LCP', `${Math.round(lcpMs)}ms（目安 ${T.lcpWarnMs}ms以下）`);
}

/* ------------------------------------------------------------------ */
/* 出力                                                                 */
/* ------------------------------------------------------------------ */

const fails = results.filter((r) => r.level === 'FAIL');
const warns = results.filter((r) => r.level === 'WARN');
const icon = { FAIL: '✗', WARN: '△', INFO: '·' };

const lines = [`検収対象: ${target}`, ''];
for (const r of results) {
  lines.push(`${icon[r.level]} [${r.check}] ${r.message}`);
  if (r.detail) lines.push(...(Array.isArray(r.detail) ? r.detail : [r.detail]));
}
lines.push('', `FAIL ${fails.length} / WARN ${warns.length}`);

const report = lines.join('\n');
console.log(report);
writeFileSync(`${outDir}/report.txt`, report + '\n');
writeFileSync(`${outDir}/report.json`, JSON.stringify({ target, results }, null, 2));

console.log(`\nレポート: ${outDir}/report.txt`);
console.log('スクリーンショットを必ず人間の目で確認してください。機械は「崩れていないこと」しか保証しません。');

process.exit(fails.length ? 1 : 0);
