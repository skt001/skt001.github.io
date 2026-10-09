---
title: GPi Case 2 CM5 Patch Overview
---

# GPi Case 2 CM5 Patch Overview

> **WIP:** CM5 support is experimental. No guarantees.

Source repository: [skt001/GPiCase2-CM5-Patch](https://github.com/skt001/GPiCase2-CM5-Patch)

Patches and utilities for RetroFlag GPi Case 2 with Raspberry Pi CM5 support.

## Repository structure

| Folder | Purpose |
|---|---|
| `cm5_boot_configs/` | CM5 boot/display config templates (LCD and HDMI, English/Japanese comments) |
| `cm5_safe_shutdown/` | Safe shutdown Python script, systemd service, and installer |
| `simple-dmg/` | EmulationStation theme with install helper and optional font support |
| `stereo_downsample_fix/` | ALSA profile switch for stereo-downsample-to-mono fix |

## Quick start

1. **Display mode (LCD or HDMI)** — see [Boot Config Guide (EN)](https://github.com/skt001/GPiCase2-CM5-Patch/blob/main/cm5_boot_configs/README.md)
2. **SafeShutdown** — see [SafeShutdown Guide (EN)](https://github.com/skt001/GPiCase2-CM5-Patch/blob/main/cm5_safe_shutdown/README.md)
3. **Theme (optional)** — see [Theme Setup](https://github.com/skt001/GPiCase2-CM5-Patch/blob/main/simple-dmg/README.md)
4. **Audio fix (optional)** — see [Audio Fix Guide](https://github.com/skt001/GPiCase2-CM5-Patch/blob/main/stereo_downsample_fix/README.md)

## Suggested setup flow

1. Prepare an SD card and apply one display config from `cm5_boot_configs/`
2. Boot the CM5 and verify LCD or HDMI output
3. Install SafeShutdown from `cm5_safe_shutdown/`
4. Reboot and test physical power-button shutdown

## Notes

- The carrier board must be physically and electrically compatible with CM5.
- Comments may mention CM4 compatibility, but the target is CM5.
- For troubleshooting, use each folder's README in the source repository.
