---
title: GPi Case 2 CM5 パッチ概要
---

# GPi Case 2 CM5 パッチ概要

> **WIP:** CM5対応は実験的です。動作保証はありません。

ソースリポジトリ: [skt001/GPiCase2-CM5-Patch](https://github.com/skt001/GPiCase2-CM5-Patch)

RetroFlag GPi Case 2 向けの Raspberry Pi CM5 対応パッチとユーティリティです。

## リポジトリ構成

| フォルダ | 用途 |
|---|---|
| `cm5_boot_configs/` | CM5の起動/表示設定テンプレート（LCD/HDMI、英日コメント対応） |
| `cm5_safe_shutdown/` | SafeShutdown Pythonスクリプト、systemdサービス、インストーラ |
| `simple-dmg/` | EmulationStationテーマとインストールヘルパー、フォント準備サポート |
| `stereo_downsample_fix/` | ステレオダウンサンプルからモノへの修正用 ALSA プロファイル切り替え |

## クイックスタート

1. **表示モード（LCD または HDMI）** — [Boot Config Guide (JA)](https://github.com/skt001/GPiCase2-CM5-Patch/blob/main/cm5_boot_configs/README_ja.md)
2. **SafeShutdown** — [SafeShutdown Guide (JA)](https://github.com/skt001/GPiCase2-CM5-Patch/blob/main/cm5_safe_shutdown/README_ja.md)
3. **テーマ（任意）** — [Theme Setup](https://github.com/skt001/GPiCase2-CM5-Patch/blob/main/simple-dmg/README.md)
4. **オーディオ修正（任意）** — [Audio Fix Guide](https://github.com/skt001/GPiCase2-CM5-Patch/blob/main/stereo_downsample_fix/README.md)

## 推奨セットアップ手順

1. SDカードを準備し、`cm5_boot_configs/` から用途に合う設定を適用
2. CM5を起動し、LCDまたはHDMI出力を確認
3. `cm5_safe_shutdown/` でSafeShutdownを導入
4. 再起動後、物理電源ボタンで安全にシャットダウンできるか確認

## 注意事項

- キャリアボードがCM5と物理的・電気的に互換であることが前提です。
- コメント内にCM4互換の記述を残していますが、対象はCM5です。
- 詳細なトラブルシューティングはソースリポジトリ各フォルダのREADMEを参照してください。
