#!/bin/bash

echo "========================================"
echo "  イケルカネ ローカルサーバー起動"
echo "========================================"
echo ""
echo "サーバーを起動しています..."
echo "このウィンドウを閉じるとサーバーが停止します"
echo ""
echo "アクセス方法:"
echo "  1. ブラウザで http://localhost:8000 を開く"
echo "  2. iPhoneから http://[このPCのIP]:8000 でアクセス"
echo ""
echo "========================================"
echo ""

# Pythonのバージョンを確認
if command -v python3 &> /dev/null; then
    echo "Python3が見つかりました。サーバーを起動します..."
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Pythonが見つかりました。サーバーを起動します..."
    echo ""
    python -m http.server 8000
else
    echo "エラー: Python が見つかりませんでした。"
    echo "Python 3.6以上をインストールしてください。"
    echo ""
    echo "Macの場合: brew install python3"
    echo "Linuxの場合: sudo apt-get install python3"
    exit 1
fi





