# イケルカネ - iPhone対応ガイド

## iPhoneでアプリを動かす方法

### 方法1: ローカルサーバーを使用（推奨）

#### ステップ1: 同一Wi-Fiネットワークに接続
- PCとiPhoneを同じWi-Fiネットワークに接続してください

#### ステップ2: PCのIPアドレスを確認

**Windowsの場合:**
```powershell
ipconfig
```
「IPv4 アドレス」を確認（例: 192.168.1.100）

**Macの場合:**
```bash
ifconfig | grep "inet "
```
ローカルIPアドレスを確認

#### ステップ3: ローカルサーバーを起動

**Python 3を使う場合:**
プロジェクトフォルダで以下を実行：
```bash
# Python 3
python -m http.server 8000

# または
python3 -m http.server 8000
```

**Node.jsを使う場合:**
```bash
# http-serverをインストール（初回のみ）
npm install -g http-server

# サーバーを起動
http-server -p 8000
```

**VS Codeを使う場合:**
- 「Live Server」拡張機能をインストール
- `index.html`を右クリック → 「Open with Live Server」

#### ステップ4: iPhoneからアクセス
1. iPhoneのSafariを開く
2. アドレスバーに以下のURLを入力：
   ```
   http://[PCのIPアドレス]:8000
   ```
   例: `http://192.168.1.100:8000`
3. `index.html`が表示されます

### 方法2: クラウドホスティングを使用

#### GitHub Pages（無料）

1. GitHubにリポジトリを作成
2. ファイルをアップロード
3. リポジトリの設定 → Pages → ソースを「main」に設定
4. `https://[ユーザー名].github.io/[リポジトリ名]`でアクセス可能

#### Netlify（無料）

1. [Netlify](https://www.netlify.com/)にアカウント作成
2. プロジェクトフォルダをドラッグ&ドロップ
3. 自動的にURLが発行される

#### Vercel（無料）

1. [Vercel](https://vercel.com/)にアカウント作成
2. GitHubリポジトリと連携、またはフォルダをアップロード

### 方法3: USB接続でローカル開発（Macのみ）

1. iPhoneをMacにUSB接続
2. iPhoneで「このコンピュータを信頼」をタップ
3. MacのSafari → 開発 → [iPhone名] → ローカルファイルを開く

### 重要な注意事項

#### 位置情報の許可
- iPhoneで初回アクセス時、位置情報の使用許可を求められます
- 「許可」を選択してください
- 設定 → Safari → 位置情報サービス で確認できます

#### HTTPS要件
- **Google Maps APIはHTTPSが必要です**（本番環境）
- ローカル開発では`http://localhost`でも動作します
- クラウドホスティングサービスを使用すると自動的にHTTPSになります

#### 位置情報のテスト
- iPhoneの実機でのテストが必須です
- iOS Simulatorでは位置情報の取得が制限される場合があります

### トラブルシューティング

#### サーバーに接続できない場合
- PCのファイアウォール設定を確認
- PCとiPhoneが同じWi-Fiに接続されているか確認
- IPアドレスが正しいか確認

#### 地図が表示されない場合
- Google Maps APIキーの設定を確認
- インターネット接続を確認
- ブラウザのコンソールでエラーを確認（Safari → 開発 → エラーコンソール）

#### 位置情報が取得できない場合
- iPhoneの設定 → プライバシーとセキュリティ → 位置情報サービス → Safari で許可を確認
- ブラウザをリロード

## 開発用の簡単な起動スクリプト

### Windows用（start-server.bat）
```batch
@echo off
echo イケルカネ サーバーを起動しています...
echo.
echo このウィンドウを閉じないでください
echo.
python -m http.server 8000
pause
```

### Mac/Linux用（start-server.sh）
```bash
#!/bin/bash
echo "イケルカネ サーバーを起動しています..."
echo ""
echo "このウィンドウを閉じないでください"
echo ""
python3 -m http.server 8000
```

スクリプトを実行後、ブラウザで `http://localhost:8000` にアクセスできます。





