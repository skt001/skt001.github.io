---
title: ドキュメント公開トップ
---

# Raspberry Pi ドキュメント公開

このページは `doc/` フォルダにある手順書を GitHub Pages 向けに公開するためのトップページです。

## 公開ドキュメント

- [Bonsai (llama.cpp) Raspberry Pi 5 最適化手順 v2](bonsai-crosscompile-rpi5.md)
- [Raspberry Pi 監視 完全手順書](pi-stats-manual.md)

## 使い方

1. GitHub リポジトリにこの `docs/` フォルダを追加します。
2. GitHub Pages の公開先を `main` ブランチの `docs/` フォルダに設定します。
3. `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます。

## 補足

- この公開は手順書の静的表示です。
- `vcgencmd` や `rrdtool` の実行環境は GitHub Pages 上では動作しません。
