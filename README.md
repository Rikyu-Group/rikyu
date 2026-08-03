# 利休 RIKYU — 公式サイト

チェンマイ・ナイトバザール3Fの会員制ウェルネスラウンジ「利休」の公式サイト。
https://rikyu-group.com

## 構成

- `src/` — 日本語版の正本（index.html / tokens.css / style.css / app.js）
- `dist/` — 公開物一式（トップ×5言語・ブログ・FAQ・sitemap・OGP画像）。Vercelはこのフォルダを配信する（vercel.json）
- `blog-src/` — ブログ記事の原稿（一次情報）

## ビルド（Node.jsのみ・依存は検収用Playwrightだけ）

```
node build.mjs      # src/ → dist/index.html（整合チェック付き）
node i18n.mjs       # 日本語版から EN/中/韓/タイ語ページを生成
node gen-blog.mjs   # ブログ「利休ノウナイ」を生成
node gen-faq.mjs    # FAQページを生成
node gen-sitemap.mjs
node audit.mjs dist/index.html   # 機械検収（要: npm i -D playwright）
```

日本語版を直したら上から順に流せば全ページに反映される。

## 品質基準

全ページ機械検収（横スクロール・改行落ち・コントラストAA・タップ領域）FAIL 0 を維持すること。
