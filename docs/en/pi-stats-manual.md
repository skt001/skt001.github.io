---
title: Raspberry Pi Monitoring Complete Manual
---

# Raspberry Pi 監視 完全手順書

## 目的

クリーン状態から以下を一貫構築する：
- `vcgencmd` による最大限取得（全数値DS化）
- `rrdtool` による時系列保存
- `systemd` による定期実行
- グラフ生成（カテゴリ別・期間別）
- `lighttpd` によるWeb表示

---

## 0. 完全初期化

既存構成がある場合に実行。クリーン環境では不要。

```bash
sudo systemctl stop \
  pi-stats.timer pi-stats.service \
  pi-stats-graph.timer pi-stats-graph.service \
  pi-stats-info.timer pi-stats-info.service 2>/dev/null

sudo systemctl disable \
  pi-stats.timer pi-stats.service \
  pi-stats-graph.timer pi-stats-graph.service \
  pi-stats-info.timer pi-stats-info.service 2>/dev/null

sudo rm -f /etc/systemd/system/pi-stats*.service
sudo rm -f /etc/systemd/system/pi-stats*.timer

sudo rm -rf /var/lib/pi-stats
sudo rm -rf /var/cache/pi-stats
sudo rm -rf /var/www/html/pi-stats

sudo rm -f /usr/local/bin/collect-pi-stats.sh
sudo rm -f /usr/local/bin/generate-graphs.sh
sudo rm -f /usr/local/bin/info-pi-stats.sh

sudo systemctl daemon-reload
```

---

## 1. パッケージ

```bash
DEBIAN_FRONTEND=noninteractive sudo apt-get update
DEBIAN_FRONTEND=noninteractive sudo apt-get install -y --no-install-recommends rrdtool lighttpd
```

---

## 2. ディレクトリ

```bash
sudo mkdir -p /var/lib/pi-stats
sudo mkdir -p /var/cache/pi-stats
sudo mkdir -p /var/www/html/pi-stats

sudo chown root:root /var/lib/pi-stats /var/cache/pi-stats /var/www/html/pi-stats
sudo chmod 755 /var/cache/pi-stats /var/www/html/pi-stats
```

---

## 3. RRD作成

```bash
sudo rrdtool create /var/lib/pi-stats/pi_stats.rrd \
  --step 60 \
  DS:temp:GAUGE:120:0:100 \
  DS:volt_core:GAUGE:120:0:2 \
  DS:volt_sdram_c:GAUGE:120:0:2 \
  DS:volt_sdram_i:GAUGE:120:0:2 \
  DS:volt_sdram_p:GAUGE:120:0:2 \
  DS:clk_arm:GAUGE:120:0:4000000000 \
  DS:clk_core:GAUGE:120:0:4000000000 \
  DS:clk_h264:GAUGE:120:0:4000000000 \
  DS:clk_isp:GAUGE:120:0:4000000000 \
  DS:clk_v3d:GAUGE:120:0:4000000000 \
  DS:clk_uart:GAUGE:120:0:4000000000 \
  DS:clk_pwm:GAUGE:120:0:4000000000 \
  DS:clk_emmc:GAUGE:120:0:4000000000 \
  DS:clk_pixel:GAUGE:120:0:4000000000 \
  DS:clk_vec:GAUGE:120:0:4000000000 \
  DS:clk_hdmi:GAUGE:120:0:4000000000 \
  DS:th_now_uv:GAUGE:120:0:1 \
  DS:th_now_freq:GAUGE:120:0:1 \
  DS:th_now_th:GAUGE:120:0:1 \
  DS:th_now_temp:GAUGE:120:0:1 \
  DS:th_past_uv:GAUGE:120:0:1 \
  DS:th_past_freq:GAUGE:120:0:1 \
  DS:th_past_th:GAUGE:120:0:1 \
  DS:th_past_temp:GAUGE:120:0:1 \
  DS:mem_arm:GAUGE:120:0:8192 \
  DS:mem_gpu:GAUGE:120:0:8192 \
  RRA:AVERAGE:0.5:1:1440 \
  RRA:AVERAGE:0.5:60:720
```

**DS一覧（26）**

| グループ | DS名 | 単位 |
|----------|------|------|
| 温度 | temp | ℃ |
| 電圧 | volt_core / volt_sdram_c / volt_sdram_i / volt_sdram_p | V |
| クロック（主要） | clk_arm / clk_core / clk_h264 / clk_isp / clk_v3d | Hz |
| クロック（周辺） | clk_uart / clk_pwm / clk_emmc / clk_pixel / clk_vec / clk_hdmi | Hz |
| スロットリング現在 | th_now_uv / th_now_freq / th_now_th / th_now_temp | bit |
| スロットリング過去 | th_past_uv / th_past_freq / th_past_th / th_past_temp | bit |
| メモリ | mem_arm / mem_gpu | MB |

**throttleビット定義**

| bit | mask | DS |
|-----|------|----|
| 0 | 0x00001 | th_now_uv |
| 1 | 0x00002 | th_now_freq |
| 2 | 0x00004 | th_now_th |
| 3 | 0x00008 | th_now_temp |
| 16 | 0x10000 | th_past_uv |
| 17 | 0x20000 | th_past_freq |
| 18 | 0x40000 | th_past_th |
| 19 | 0x80000 | th_past_temp |

---

## 4. 収集スクリプト

```bash
sudo tee /usr/local/bin/collect-pi-stats.sh << 'EOF'
#!/bin/bash
get_v() { vcgencmd measure_volts "$1" | sed -E 's/[^0-9.]//g'; }
get_c() { vcgencmd measure_clock "$1" | cut -d= -f2; }

TEMP=$(vcgencmd measure_temp | sed -E 's/[^0-9.]//g')

VC=$(get_v core)
VSC=$(get_v sdram_c)
VSI=$(get_v sdram_i)
VSP=$(get_v sdram_p)

CA=$(get_c arm)
CC=$(get_c core)
CH=$(get_c h264)
CI=$(get_c isp)
CV=$(get_c v3d)
CU=$(get_c uart)
CP=$(get_c pwm)
CE=$(get_c emmc)
CPIX=$(get_c pixel)
CVEC=$(get_c vec)
CHD=$(get_c hdmi)

TH=$(vcgencmd get_throttled | cut -d= -f2)
TH=$((TH))
TH_NOW_UV=$(( (TH & 0x00001) != 0 ))
TH_NOW_FREQ=$(( (TH & 0x00002) != 0 ))
TH_NOW_TH=$(( (TH & 0x00004) != 0 ))
TH_NOW_TEMP=$(( (TH & 0x00008) != 0 ))
TH_PAST_UV=$(( (TH & 0x10000) != 0 ))
TH_PAST_FREQ=$(( (TH & 0x20000) != 0 ))
TH_PAST_TH=$(( (TH & 0x40000) != 0 ))
TH_PAST_TEMP=$(( (TH & 0x80000) != 0 ))

MEM_ARM=$(vcgencmd get_mem arm | grep -o '[0-9]*')
MEM_GPU=$(vcgencmd get_mem gpu | grep -o '[0-9]*')
# `vcgencmd get_mem` の出力形式が変わる可能性があるため、数値部のみを抽出します。

rrdtool update /var/lib/pi-stats/pi_stats.rrd \
  N:${TEMP}:${VC}:${VSC}:${VSI}:${VSP} \
  :${CA}:${CC}:${CH}:${CI}:${CV}:${CU}:${CP}:${CE}:${CPIX}:${CVEC}:${CHD} \
  :${TH_NOW_UV}:${TH_NOW_FREQ}:${TH_NOW_TH}:${TH_NOW_TEMP} \
  :${TH_PAST_UV}:${TH_PAST_FREQ}:${TH_PAST_TH}:${TH_PAST_TEMP} \
  :${MEM_ARM}:${MEM_GPU}
EOF

sudo chmod +x /usr/local/bin/collect-pi-stats.sh
```

---

## 5. 動作確認（必須）

```bash
sudo /usr/local/bin/collect-pi-stats.sh
sleep 60
sudo /usr/local/bin/collect-pi-stats.sh

sudo rrdtool fetch /var/lib/pi-stats/pi_stats.rrd AVERAGE -s now-180
```

全DSに数値が出ること。`nan` のみの行は無視してよい。
