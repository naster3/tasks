#!/usr/bin/env bash
set -euo pipefail

VENV=".venv"

if [ ! -d "$VENV" ]; then
  python3 -m venv "$VENV"
fi

source "$VENV/bin/activate"

pip install -r requirements.txt
pip install pyinstaller

pyinstaller --onefile --name backend app.py

TARGET_DIR="../src-tauri/binaries"
mkdir -p "$TARGET_DIR"
ARCH=$(uname -m)
OS=$(uname -s)

if [ "$OS" = "Darwin" ]; then
  if [ "$ARCH" = "arm64" ]; then
    TARGET_TRIPLE="aarch64-apple-darwin"
  else
    TARGET_TRIPLE="x86_64-apple-darwin"
  fi
else
  if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    TARGET_TRIPLE="aarch64-unknown-linux-gnu"
  else
    TARGET_TRIPLE="x86_64-unknown-linux-gnu"
  fi
fi

cp "dist/backend" "$TARGET_DIR/backend-$TARGET_TRIPLE"

echo "Sidecar generado en $TARGET_DIR/backend-$TARGET_TRIPLE"
