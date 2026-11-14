# ページカウンター

このディレクトリには、ASCII アートでリクエスト数を表示するページと、
カウントを保存する Cloudflare Worker をまとめています。

## ファイル構成

- `index.html` — カウンターページ。
- `config.example.js` — Worker の URL を設定するひな形。`config.js` にコピーして使います。
- `ascii.js`、`glyphs.js` — 8x8 ピクセルフォントを使って文字列を PNG に変換します。
- `worker/` — Durable Object を使ったカウント API と Wrangler の設定。

## 使い方

1. `worker/` をデプロイします（手順は [`worker/README.md`](./worker/README.md)）。
2. `config.example.js` を `config.js` にコピーし、デプロイした Worker の URL（`https://counter.<あなたのサブドメイン>.workers.dev/`）に書き換えます。
3. このディレクトリを静的ホスティング（GitHub Pages など）で公開し、`index.html` を開きます。
