---
title: Bonsai (llama.cpp) Raspberry Pi 5 Optimization Guide v2
---

# Bonsai (llama.cpp) Raspberry Pi 5 Optimization Guide v2

## Overview

Cross-compile for Raspberry Pi 5 from WSL, with a configuration focused on performance, stability, and real-world operation.

---

## Targets

- Host: WSL (Ubuntu 24 x86_64)
- Target: Raspberry Pi 5 (Cortex-A76 / aarch64)
- Base: llama.cpp (Bonsai-capable fork)

---

## 1. Toolchain

```bash
sudo apt update
sudo apt install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu cmake ninja-build
```

---

## 2. Obtain source

When using a Bonsai-capable fork, specify the target repository and branch/commit explicitly.
This guide uses `PrismML-Eng/llama.cpp` as an example.

```bash
git clone https://github.com/PrismML-Eng/llama.cpp
cd llama.cpp
```

---

## 3. Toolchain definition (Pi 5 optimized)

```bash
cat > aarch64-rpi5.cmake << 'EOF'
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)

set(CMAKE_C_COMPILER aarch64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)

set(CMAKE_C_FLAGS   "-O3 -mcpu=cortex-a76 -march=armv8.2-a+dotprod+fp16")
set(CMAKE_CXX_FLAGS "-O3 -mcpu=cortex-a76 -march=armv8.2-a+dotprod+fp16")

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
EOF
```

Key points:

- Enable dotprod for faster inference
- FP16 + NEON optimizations

---

## 4. Build

```bash
cmake -B build-rpi5 \
  -DCMAKE_TOOLCHAIN_FILE=aarch64-rpi5.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DGGML_NATIVE=OFF \
  -DGGML_OPENMP=ON \
  -DGGML_CPU_AARCH64=ON \
  -DBUILD_SHARED_LIBS=OFF \
  -G Ninja

cmake --build build-rpi5 -j$(nproc)
```

- `-DGGML_NATIVE=OFF`: In a cross-compile environment, do not use host-native CPU instructions; build for the target
- `-DGGML_OPENMP=ON`: Enable parallel processing across Pi 5 cores
- `-DGGML_CPU_AARCH64=ON`: Enable ARM64-oriented optimizations

---

## 5. Transfer

```bash
scp build-rpi5/bin/llama-cli pi@<IP>:~/
scp model.gguf pi@<IP>:~/
```

---

## 6. Run (recommended settings)

```bash
./llama-cli \
  -m model.gguf \
  -cnv \
  --threads $(nproc) \
  --ctx-size 2048
```

- `-cnv` is intended for local CPU execution on the Pi 5 (not CUDA/Metal, not a quantization workflow flag in this context)
- Set `--threads $(nproc)` to the device's physical core count; adjust based on thermals and stability

---

## 7. Server operation

```bash
./llama-server \
  -m model.gguf \
  --host 0.0.0.0 \
  --port 8080 \
  --threads $(nproc)
```
