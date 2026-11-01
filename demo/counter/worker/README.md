# ASCII Counter Worker

This Cloudflare Worker provides the counter API used by `../index.html`.
Each `GET /` request increments one shared counter and returns the count as
plain text, for example `123`. If incrementing fails, the Worker logs the
exception and returns `ERROR!` as a plain-text success response so the page
can render it with `renderAscii`.

The counter counts requests, not unique people. Reloading the page, automated
requests, and repeated visits all increment it. A single SQLite-backed Durable
Object keeps the count consistent across requests. Its class is declared with
Wrangler's `exports` configuration; this project does not use `migrations`.

## Deploy

Requirements: a Cloudflare account and Node.js with `npx` available.

From this directory, authenticate and deploy:

```sh
npx wrangler login
npx wrangler deploy
```

Wrangler prints the deployed `workers.dev` URL. Use that URL directly, for
example:

```text
https://ascii-visitor-counter.<your-subdomain>.workers.dev/
```

The endpoint permits cross-origin GET requests so the GitHub Pages site can
call it.

## Test

To run locally from this directory:

```sh
npx wrangler dev
```

Then request `http://localhost:8787/`. Each successful request returns only
an integer as plain text, increasing by one. If the counter operation fails,
the response body is `ERROR!`. After deployment, the same check can be made
with:

```sh
curl https://ascii-visitor-counter.<your-subdomain>.workers.dev/
```
