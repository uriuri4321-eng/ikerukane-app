@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   イケルカネ ローカルサーバー起動
echo ========================================
echo.
echo サーバーを起動しています...
echo このウィンドウを閉じるとサーバーが停止します
echo.
echo アクセス方法:
echo   1. ブラウザで http://localhost:8000 を開く
echo   2. iPhoneから http://[このPCのIP]:8000 でアクセス
echo.
echo ========================================
echo.

REM Pythonのバージョンを確認
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Pythonが見つかりました。サーバーを起動します...
    echo.
    python -m http.server 8000
    goto :end
)

python3 --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Python3が見つかりました。サーバーを起動します...
    echo.
    python3 -m http.server 8000
    goto :end
)

REM Node.jsを確認
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Node.jsが見つかりました。
    echo http-serverをインストールしています...
    call npm install -g http-server >nul 2>&1
    echo サーバーを起動します...
    echo.
    http-server -p 8000
    goto :end
)

REM PHPを確認
php --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo PHPが見つかりました。サーバーを起動します...
    echo.
    php -S localhost:8000
    goto :end
)

REM すべて見つからない場合
echo.
echo ========================================
echo   エラー: サーバーソフトが見つかりませんでした
echo ========================================
echo.
echo 【最も簡単な解決方法】VS CodeのLive Server拡張機能を使う
echo.
echo   1. VS Codeを開く
echo   2. 拡張機能で「Live Server」を検索してインストール
echo   3. index.htmlを右クリック → 「Open with Live Server」を選択
echo   4. GET_IP.batでIPアドレスを確認してiPhoneからアクセス
echo.
echo ========================================
echo.
echo 【他の方法】
echo.
echo [方法1] Pythonをインストール
echo   ダウンロード: https://www.python.org/downloads/
echo   インストール時に「Add Python to PATH」に必ずチェック！
echo   インストール後、PCを再起動してからこのファイルを再実行
echo.
echo [方法2] Node.jsをインストール
echo   ダウンロード: https://nodejs.org/
echo   インストール後、PCを再起動してからこのファイルを再実行
echo.
echo ========================================
echo.
echo 詳細な説明は「iPhone起動方法（詳細）.md」を参照してください
echo.
pause

:end

