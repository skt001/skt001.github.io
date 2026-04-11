---
title: Bonsai (llama.cpp) Raspberry Pi 5 最適化手順 v2
---

# Bonsai (llama.cpp) Raspberry Pi 5 最適化手順 v2

## 概要

WSLからRaspberry Pi 5向けにクロスコンパイルし、
性能・安定性・実運用を考慮した構成にする。

---

## 対象

- ホスト: WSL (Ubuntu 24 x86_64)
- ターゲット: Raspberry Pi 5 (Cortex-A76 / aarch64)
- ベース: llama.cpp (Bonsai対応fork)

---

## 1. ツールチェーン

```bash
sudo apt update
sudo apt install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu cmake ninja-build
```

---

## 2. ソース取得

Bonsai対応 fork を使う場合は、対象リポジトリとブランチ／コミットを明示してください。
ここでは例として `PrismML-Eng/llama.cpp` を使用します。

```bash
git clone https://github.com/PrismML-Eng/llama.cpp
cd llama.cpp
```

---

## 3. ツールチェーン定義（Pi5最適化）

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

ポイント：
- dotprod有効化で推論高速化
- FP16 + NEON最適化

---

## 4. ビルド

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

- `-DGGML_NATIVE=OFF` : クロスコンパイル環境ではホストネイティブCPU命令を利用せず、ターゲット用ビルドを行う
- `-DGGML_OPENMP=ON` : Pi5の複数コアで並列処理を有効にする
- `-DGGML_CPU_AARCH64=ON` : ARM64向け最適化を有効化する

---

## 5. 転送

```bash
scp build-rpi5/bin/llama-cli pi@<IP>:~/
scp model.gguf pi@<IP>:~/
```

---

## 6. 実行（推奨設定）

```bash
./llama-cli \
  -m model.gguf \
  -cnv \
  --threads $(nproc) \
  --ctx-size 2048
```

- `-cnv` は CUDA/metal 無効化や量子化せずに CPU 実行するためのオプションで、Pi5上のローカル実行向け設定です。
- `--threads $(nproc)` は実機の物理コア数に合わせてください。熱や安定性を見ながら調整します。

---

## 7. サーバ運用

```bash
./llama-server \
  -m model.gguf \
  --host 0.0.0.0 \
  --port 8080 \
  --threads $(nproc)
```

---
