# ASCII カウンター Worker

この Cloudflare Worker は `../index.html` が使うカウンター API です。
`GET /` を受け取るたびに共有カウンターを 1 増やし、カウントを `123` のような
プレーンテキストで返します。カウントの更新に失敗した場合は、Worker が例外をログに
記録し、ページが `renderAscii` で表示できるように、プレーンテキストの成功応答として
`ERROR!` を返します。

カウントするのは訪問者数ではなくリクエスト数です。ページの再読み込み、自動化された
リクエスト、繰り返しの訪問もすべて加算されます。SQLite ベースの Durable Object が 1 つで
カウントを保持するため、リクエスト間で整合性が保たれます。クラスは Wrangler の
`exports` 設定で宣言しており、このプロジェクトでは `migrations` を使いません。

## デプロイ

必要なもの: Cloudflare アカウントと、`npx` が使える Node.js。

このディレクトリで、ログインしてデプロイします。

```sh
npx wrangler login
npx wrangler deploy
```

Wrangler が表示するデプロイ先の `workers.dev` URL をそのまま使います。例:

```text
https://counter.<あなたのサブドメイン>.workers.dev/
```

GitHub Pages のサイトから呼び出せるよう、このエンドポイントは別オリジンからの GET
リクエストを許可しています。

## 動作確認

このディレクトリでローカル実行します。

```sh
npx wrangler dev
```

`http://localhost:8787/` にリクエストすると、成功時は整数だけがプレーンテキストで返り、
リクエストのたびに 1 ずつ増えます。カウンターの処理に失敗した場合の応答本文は `ERROR!` です。
デプロイ後は、次のコマンドで同じ確認ができます。

```sh
curl https://counter.<あなたのサブドメイン>.workers.dev/
```
