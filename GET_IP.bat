@echo off
chcp 65001 >nul 2>&1
setlocal ENABLEDELAYEDEXPANSION
echo ========================================
echo   PCのIPアドレス確認
echo ========================================
echo.

REM まず PowerShell でIPv4を取得（最も確実）
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } ^| Select-Object -ExpandProperty IPAddress"`) do (
    set ip=%%i
)

if defined ip (
    echo このPCのIPアドレス:
    echo   !ip!
    echo.
    echo iPhoneからアクセスする際のURL:
    echo   http://!ip!:5502
    echo   （Live Server のデフォルト例。実際のポートに置き換えてください）
    echo.
) else (
    REM PowerShellが使えない/失敗時は ipconfig をフォールバックで解析
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" /c:"IPv4 Address" /c:"IPv4 アドレス"') do (
        set ip=%%a
        set ip=!ip: =!
    )
    if defined ip (
        echo このPCのIPアドレス:
        echo   !ip!
        echo.
        echo iPhoneからアクセスする際のURL:
        echo   http://!ip!:5502
        echo   （Live Server のデフォルト例。実際のポートに置き換えてください）
        echo.
    ) else (
        echo IPアドレスを取得できませんでした。
        echo 以下のいずれかをお試しください:
        echo  1) PowerShellで次を実行: Get-NetIPAddress -AddressFamily IPv4
        echo  2) コマンド: ipconfig
    )
)

echo ========================================
echo.
echo 上記のURLをiPhoneのSafariに入力してください
echo.
pause
endlocal
