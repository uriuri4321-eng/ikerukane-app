# iPhoneでアプリを起動する方法（詳細ガイド）

## 最も簡単な方法：VS CodeのLive Server拡張機能

### ステップ1: VS Codeをインストール（まだの場合）
1. https://code.visualstudio.com/ からダウンロード
2. インストール

### ステップ2: Live Server拡張機能をインストール
1. VS Codeを開く
2. 左側の拡張機能アイコン（□が4つあるアイコン）をクリック
3. 検索バーに「**Live Server**」と入力
4. 「Live Server」（by Ritwick Dey）を選択して「**インストール**」をクリック

### ステップ3: サーバーを起動
1. VS Codeでプロジェクトフォルダを開く（フォルダをドラッグ&ドロップ）
2. `index.html`を右クリック
3. **「Open with Live Server」**を選択
4. ブラウザが自動で開きます（例：http://127.0.0.1:5500）

### ステップ4: iPhoneからアクセス
1. **GET_IP.bat**をダブルクリックしてPCのIPアドレスを確認
2. VS Codeの右下に表示されているポート番号を確認（通常は5500）
3. iPhoneのSafariで `http://[PCのIPアドレス]:[ポート番号]` にアクセス
   - 例：`http://192.168.1.100:5500`

---

## 方法2：Pythonをインストールする

### ステップ1: Pythonをダウンロード
1. https://www.python.org/downloads/ を開く
2. **「Download Python 3.xx.x」**ボタンをクリックしてダウンロード

### ステップ2: Pythonをインストール
1. ダウンロードしたインストーラーを実行
2. **⚠️ 重要：「Add Python to PATH」にチェックを入れる** ⚠️
3. 「Install Now」をクリック
4. インストール完了後、**PCを再起動**

### ステップ3: サーバーを起動
1. プロジェクトフォルダを開く
2. **start-server.bat**をダブルクリック
3. ブラウザで http://localhost:8000 を開く

### ステップ4: iPhoneからアクセス
1. **GET_IP.bat**をダブルクリックしてPCのIPアドレスを確認
2. iPhoneのSafariで `http://[PCのIPアドレス]:8000` にアクセス

---

## 方法3：Node.jsをインストールする

### ステップ1: Node.jsをダウンロード
1. https://nodejs.org/ を開く
2. **「LTS」**版をダウンロード（推奨）

### ステップ2: Node.jsをインストール
1. ダウンロードしたインストーラーを実行
2. すべてデフォルト設定で「Next」をクリック
3. インストール完了後、**PCを再起動**

### ステップ3: サーバーを起動
PowerShellまたはコマンドプロンプトで以下を実行：

```powershell
cd "C:\Users\hiu\Desktop\イケルカネcursor"
npx http-server -p 8000
```

### ステップ4: iPhoneからアクセス
1. **GET_IP.bat**をダブルクリックしてPCのIPアドレスを確認
2. iPhoneのSafariで `http://[PCのIPアドレス]:8000` にアクセス

---

## トラブルシューティング

### PCのIPアドレスがわからない
1. **GET_IP.bat**をダブルクリック
2. 表示されたIPアドレスを使用

### iPhoneから接続できない
- PCとiPhoneが**同じWi-Fi**に接続されているか確認
- PCのファイアウォール設定を確認：
  1. Windowsキー + R → `firewall.cpl` と入力
  2. 「詳細設定」
  3. 「受信の規則」→「新しい規則」
  4. 「ポート」を選択 → TCP → 8000（または5500）
  5. 「接続を許可する」を選択
  6. 「完了」

### 地図が表示されない
- iPhoneで位置情報の使用を許可してください
- Safariの設定で位置情報サービスが有効になっているか確認

---

## 各方法の比較

| 方法 | 難易度 | 推奨度 |
|------|--------|--------|
| VS Code Live Server | ⭐ 簡単 | ⭐⭐⭐⭐⭐ |
| Python | ⭐⭐ 普通 | ⭐⭐⭐⭐ |
| Node.js | ⭐⭐ 普通 | ⭐⭐⭐ |

**最もおすすめは「VS Code Live Server」です！**





