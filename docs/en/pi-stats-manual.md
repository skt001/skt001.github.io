---
title: Raspberry Pi Monitoring Complete Manual
---

# Raspberry Pi Monitoring Complete Manual

## Goal

Build the following from a clean state in one consistent setup:

- Maximum data collection via `vcgencmd` (all numeric values as RRD data sources)
- Time-series storage with `rrdtool`
- Periodic execution with `systemd`
- Graph generation (by category and period)
- Web display with `lighttpd`

---

## 0. Full reset

Run only if an existing setup is present. Not needed on a clean environment.

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

## 1. Packages

```bash
DEBIAN_FRONTEND=noninteractive sudo apt-get update
DEBIAN_FRONTEND=noninteractive sudo apt-get install -y --no-install-recommends rrdtool lighttpd
```

---

## 2. Directories

```bash
sudo mkdir -p /var/lib/pi-stats
sudo mkdir -p /var/cache/pi-stats
sudo mkdir -p /var/www/html/pi-stats

sudo chown root:root /var/lib/pi-stats /var/cache/pi-stats /var/www/html/pi-stats
sudo chmod 755 /var/cache/pi-stats /var/www/html/pi-stats
```

---

## 3. Create RRD

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

**DS list (26)**

| Group | DS names | Unit |
|----------|------|------|
| Temperature | temp | °C |
| Voltage | volt_core / volt_sdram_c / volt_sdram_i / volt_sdram_p | V |
| Clock (main) | clk_arm / clk_core / clk_h264 / clk_isp / clk_v3d | Hz |
| Clock (peripheral) | clk_uart / clk_pwm / clk_emmc / clk_pixel / clk_vec / clk_hdmi | Hz |
| Throttle (current) | th_now_uv / th_now_freq / th_now_th / th_now_temp | bit |
| Throttle (past) | th_past_uv / th_past_freq / th_past_th / th_past_temp | bit |
| Memory | mem_arm / mem_gpu | MB |

**Throttle bit definitions**

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

## 4. Collection script

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
# Extract numeric portion only; vcgencmd get_mem output format may change.

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

## 5. Verification (required)

```bash
sudo /usr/local/bin/collect-pi-stats.sh
sleep 60
sudo /usr/local/bin/collect-pi-stats.sh

sudo rrdtool fetch /var/lib/pi-stats/pi_stats.rrd AVERAGE -s now-180
```

Every DS should show numeric values. Rows that are only `nan` can be ignored.

---

## 6. systemd (collection)

```bash
sudo tee /etc/systemd/system/pi-stats.service << 'EOF'
[Unit]
Description=Pi Stats Collector

[Service]
Type=oneshot
ExecStart=/usr/local/bin/collect-pi-stats.sh
EOF

sudo tee /etc/systemd/system/pi-stats.timer << 'EOF'
[Unit]
Description=Pi Stats Collector Timer

[Timer]
OnBootSec=1min
OnUnitActiveSec=60s

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now pi-stats.timer
```

---

## 7. Graph generation script

```bash
sudo tee /usr/local/bin/generate-graphs.sh << 'EOF'
#!/bin/bash
RRD=/var/lib/pi-stats/pi_stats.rrd
OUT=/var/cache/pi-stats

PERIODS=("1h" "24h" "7d" "30d")
PERIOD_SECONDS=(3600 86400 604800 2592000)

for i in "${!PERIODS[@]}"; do
  P=${PERIODS[$i]}
  S=${PERIOD_SECONDS[$i]}

  # Temperature
  rrdtool graph ${OUT}/temp_${P}.png \
    --start -${S} --title "Temperature ${P}" \
    --vertical-label "°C" --width 600 --height 200 \
    DEF:t=${RRD}:temp:AVERAGE \
    LINE2:t#FF4444:"temp" \
    GPRINT:t:LAST:"Last\: %4.1lf°C" \
    GPRINT:t:MAX:"Max\: %4.1lf°C" > /dev/null

  # Voltage
  rrdtool graph ${OUT}/volt_${P}.png \
    --start -${S} --title "Voltage ${P}" \
    --vertical-label "V" --width 600 --height 200 \
    DEF:vc=${RRD}:volt_core:AVERAGE \
    DEF:vsc=${RRD}:volt_sdram_c:AVERAGE \
    DEF:vsi=${RRD}:volt_sdram_i:AVERAGE \
    DEF:vsp=${RRD}:volt_sdram_p:AVERAGE \
    LINE2:vc#FF4444:"core    " \
    LINE2:vsc#4444FF:"sdram_c " \
    LINE2:vsi#44AA44:"sdram_i " \
    LINE2:vsp#FF8800:"sdram_p " > /dev/null

  # Clock (main)
  rrdtool graph ${OUT}/clk_main_${P}.png \
    --start -${S} --title "Clock Main ${P}" \
    --vertical-label "Hz" --width 600 --height 200 \
    DEF:ca=${RRD}:clk_arm:AVERAGE \
    DEF:cc=${RRD}:clk_core:AVERAGE \
    DEF:ch=${RRD}:clk_h264:AVERAGE \
    DEF:ci=${RRD}:clk_isp:AVERAGE \
    DEF:cv=${RRD}:clk_v3d:AVERAGE \
    LINE2:ca#FF4444:"arm  " \
    LINE2:cc#4444FF:"core " \
    LINE2:ch#44AA44:"h264 " \
    LINE2:ci#FF8800:"isp  " \
    LINE2:cv#AA44AA:"v3d  " > /dev/null

  # Clock (peripheral)
  rrdtool graph ${OUT}/clk_peri_${P}.png \
    --start -${S} --title "Clock Peripheral ${P}" \
    --vertical-label "Hz" --width 600 --height 200 \
    DEF:cu=${RRD}:clk_uart:AVERAGE \
    DEF:cp=${RRD}:clk_pwm:AVERAGE \
    DEF:ce=${RRD}:clk_emmc:AVERAGE \
    DEF:cpix=${RRD}:clk_pixel:AVERAGE \
    DEF:cvec=${RRD}:clk_vec:AVERAGE \
    DEF:chd=${RRD}:clk_hdmi:AVERAGE \
    LINE2:cu#FF4444:"uart  " \
    LINE2:cp#4444FF:"pwm   " \
    LINE2:ce#44AA44:"emmc  " \
    LINE2:cpix#FF8800:"pixel " \
    LINE2:cvec#AA44AA:"vec   " \
    LINE2:chd#44AAAA:"hdmi  " > /dev/null

  # Throttle (current)
  rrdtool graph ${OUT}/th_now_${P}.png \
    --start -${S} --title "Throttle Now ${P}" \
    --vertical-label "flag" --width 600 --height 200 \
    --upper-limit 1.2 --rigid \
    DEF:uv=${RRD}:th_now_uv:AVERAGE \
    DEF:fr=${RRD}:th_now_freq:AVERAGE \
    DEF:th=${RRD}:th_now_th:AVERAGE \
    DEF:tp=${RRD}:th_now_temp:AVERAGE \
    LINE2:uv#FF4444:"under-volt " \
    LINE2:fr#4444FF:"freq-cap   " \
    LINE2:th#FF8800:"throttled  " \
    LINE2:tp#AA44AA:"soft-temp  " > /dev/null

  # Throttle (past)
  rrdtool graph ${OUT}/th_past_${P}.png \
    --start -${S} --title "Throttle Past ${P}" \
    --vertical-label "flag" --width 600 --height 200 \
    --upper-limit 1.2 --rigid \
    DEF:uv=${RRD}:th_past_uv:AVERAGE \
    DEF:fr=${RRD}:th_past_freq:AVERAGE \
    DEF:th=${RRD}:th_past_th:AVERAGE \
    DEF:tp=${RRD}:th_past_temp:AVERAGE \
    LINE2:uv#FF4444:"under-volt " \
    LINE2:fr#4444FF:"freq-cap   " \
    LINE2:th#FF8800:"throttled  " \
    LINE2:tp#AA44AA:"soft-temp  " > /dev/null

  # Memory
  rrdtool graph ${OUT}/mem_${P}.png \
    --start -${S} --title "Memory ${P}" \
    --vertical-label "MB" --width 600 --height 200 \
    DEF:ma=${RRD}:mem_arm:AVERAGE \
    DEF:mg=${RRD}:mem_gpu:AVERAGE \
    LINE2:ma#4444FF:"ARM " \
    LINE2:mg#44AA44:"GPU " > /dev/null

done
EOF

sudo chmod +x /usr/local/bin/generate-graphs.sh
```

---

## 8. systemd (graphs)

```bash
sudo tee /etc/systemd/system/pi-stats-graph.service << 'EOF'
[Unit]
Description=Pi Stats Graph Generator

[Service]
Type=oneshot
ExecStart=/usr/local/bin/generate-graphs.sh
EOF

sudo tee /etc/systemd/system/pi-stats-graph.timer << 'EOF'
[Unit]
Description=Pi Stats Graph Generator Timer

[Timer]
OnBootSec=2min
OnUnitActiveSec=60s

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now pi-stats-graph.timer
```

---

## 9. Non-graph info script

```bash
sudo tee /usr/local/bin/info-pi-stats.sh << 'EOF'
#!/bin/bash
OUT=/var/cache/pi-stats/info.txt
{
  echo "=== firmware ==="
  vcgencmd version
  echo ""
  echo "=== config (int) ==="
  vcgencmd get_config int
  echo ""
  echo "=== config (str) ==="
  vcgencmd get_config str
  echo ""
  echo "=== camera ==="
  vcgencmd get_camera
  echo ""
  echo "=== codec ==="
  for c in H264 MPG2 WVC1 MPG4 MJPG WMV9 VP8; do
    vcgencmd codec_enabled $c
  done
  echo ""
  echo "=== display ==="
  vcgencmd display_power
} > "$OUT"
EOF

sudo chmod +x /usr/local/bin/info-pi-stats.sh
```

First run:

```bash
sudo /usr/local/bin/info-pi-stats.sh
```

(This data changes infrequently, so a timer is optional. Manual or boot-time runs are enough.)

---

## 10. Web publishing

### Symlink

```bash
sudo ln -s /var/cache/pi-stats /var/www/html/pi-stats/cache
```

lighttpd follows symlinks by default, so no extra config is required.
If symlink following is disabled in your lighttpd config, set `server.follow_symlink = "enable"`.

### index.html

```bash
sudo tee /var/www/html/pi-stats/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="60">
<title>Pi Stats</title>
<style>
  body { font-family: monospace; background: #111; color: #eee; margin: 0; padding: 16px; }
  h2 { color: #aaa; border-bottom: 1px solid #333; padding-bottom: 4px; }
  .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
  .tab { padding: 6px 16px; background: #222; color: #aaa; cursor: pointer; border: 1px solid #444; }
  .tab.active { background: #444; color: #fff; }
  .period { display: none; }
  .period.active { display: block; }
  .graphs { display: flex; flex-wrap: wrap; gap: 12px; }
  img { border: 1px solid #333; display: block; }
  pre { background: #1a1a1a; padding: 12px; overflow-x: auto; font-size: 12px; color: #8f8; border: 1px solid #333; }
</style>
</head>
<body>
<h1>Pi Stats</h1>

<div class="tabs">
  <div class="tab active" onclick="show('1h',this)">1h</div>
  <div class="tab" onclick="show('24h',this)">24h</div>
  <div class="tab" onclick="show('7d',this)">7d</div>
  <div class="tab" onclick="show('30d',this)">30d</div>
</div>

<div id="d_1h" class="period active">
  <h2>Temperature</h2><div class="graphs"><img src="cache/temp_1h.png"></div>
  <h2>Voltage</h2><div class="graphs"><img src="cache/volt_1h.png"></div>
  <h2>Clock (Main)</h2><div class="graphs"><img src="cache/clk_main_1h.png"></div>
  <h2>Clock (Peripheral)</h2><div class="graphs"><img src="cache/clk_peri_1h.png"></div>
  <h2>Throttle (Now)</h2><div class="graphs"><img src="cache/th_now_1h.png"></div>
  <h2>Throttle (Past)</h2><div class="graphs"><img src="cache/th_past_1h.png"></div>
  <h2>Memory</h2><div class="graphs"><img src="cache/mem_1h.png"></div>
</div>

<div id="d_24h" class="period">
  <h2>Temperature</h2><div class="graphs"><img src="cache/temp_24h.png"></div>
  <h2>Voltage</h2><div class="graphs"><img src="cache/volt_24h.png"></div>
  <h2>Clock (Main)</h2><div class="graphs"><img src="cache/clk_main_24h.png"></div>
  <h2>Clock (Peripheral)</h2><div class="graphs"><img src="cache/clk_peri_24h.png"></div>
  <h2>Throttle (Now)</h2><div class="graphs"><img src="cache/th_now_24h.png"></div>
  <h2>Throttle (Past)</h2><div class="graphs"><img src="cache/th_past_24h.png"></div>
  <h2>Memory</h2><div class="graphs"><img src="cache/mem_24h.png"></div>
</div>

<div id="d_7d" class="period">
  <h2>Temperature</h2><div class="graphs"><img src="cache/temp_7d.png"></div>
  <h2>Voltage</h2><div class="graphs"><img src="cache/volt_7d.png"></div>
  <h2>Clock (Main)</h2><div class="graphs"><img src="cache/clk_main_7d.png"></div>
  <h2>Clock (Peripheral)</h2><div class="graphs"><img src="cache/clk_peri_7d.png"></div>
  <h2>Throttle (Now)</h2><div class="graphs"><img src="cache/th_now_7d.png"></div>
  <h2>Throttle (Past)</h2><div class="graphs"><img src="cache/th_past_7d.png"></div>
  <h2>Memory</h2><div class="graphs"><img src="cache/mem_7d.png"></div>
</div>

<div id="d_30d" class="period">
  <h2>Temperature</h2><div class="graphs"><img src="cache/temp_30d.png"></div>
  <h2>Voltage</h2><div class="graphs"><img src="cache/volt_30d.png"></div>
  <h2>Clock (Main)</h2><div class="graphs"><img src="cache/clk_main_30d.png"></div>
  <h2>Clock (Peripheral)</h2><div class="graphs"><img src="cache/clk_peri_30d.png"></div>
  <h2>Throttle (Now)</h2><div class="graphs"><img src="cache/th_now_30d.png"></div>
  <h2>Throttle (Past)</h2><div class="graphs"><img src="cache/th_past_30d.png"></div>
  <h2>Memory</h2><div class="graphs"><img src="cache/mem_30d.png"></div>
</div>

<h2>System Info</h2>
<pre id="info">Loading...</pre>

<script>
function show(p, el) {
  document.querySelectorAll('.period').forEach(d => d.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('d_' + p).classList.add('active');
  el.classList.add('active');
}

function loadInfo() {
  fetch('cache/info.txt?t=' + Date.now())
    .then(r => r.text())
    .then(t => document.getElementById('info').textContent = t)
    .catch(() => {});
}
loadInfo();
setInterval(loadInfo, 60000);
</script>
</body>
</html>
HTMLEOF
```

---

## 11. Final checks

```bash
# Generate graphs immediately
sudo /usr/local/bin/generate-graphs.sh
ls /var/cache/pi-stats/*.png | wc -l   # → 28

# Generate info
sudo /usr/local/bin/info-pi-stats.sh
cat /var/cache/pi-stats/info.txt

# RRD check
sudo rrdtool fetch /var/lib/pi-stats/pi_stats.rrd AVERAGE -s now-300

# Timer check
systemctl status pi-stats.timer
systemctl status pi-stats-graph.timer

# lighttpd
sudo systemctl enable --now lighttpd
systemctl status lighttpd
```

---

## Done

```
http://<IP>/pi-stats/
```

**Completion checklist**

- [ ] All 26 RRD DSes have numeric values (no nan)
- [ ] 28 PNGs generated (7 groups × 4 periods)
- [ ] info.txt generated and displayed
- [ ] All periods visible via tab switching
- [ ] Auto-reload every 60 seconds
