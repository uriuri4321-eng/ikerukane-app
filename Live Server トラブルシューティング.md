# Live Server トラブルシューティングガイド

## よくある問題と解決方法

### 問題1: iPhoneから接続できない（「このサイトにアクセスできません」）

#### 確認事項
1. **PCとiPhoneが同じWi-Fiに接続されているか**
   - PCとiPhoneの両方でWi-Fi接続を確認

2. **Live Serverが起動しているか**
   - VS Codeの右下にポート番号（例：5502）が表示されているか確認
   - 表示されていない場合、もう一度「Open with Live Server」を実行

3. **PCのIPアドレスが正しいか**
   - `GET_IP.bat`を実行してIPアドレスを確認
   - iPhoneのSafariで `http://[IPアドレス]:5502` にアクセス
     - 例：`http://192.168.1.100:5502`

#### 解決方法

**ステップ1: Live Serverの設定を確認**
1. VS Codeで設定を開く（Ctrl + ,）
2. 検索バーに「live server」と入力
3. 「Live Server > Settings: Host」を確認
   - `127.0.0.1` になっている場合は `0.0.0.0` に変更
   - これで外部からアクセス可能になります

**ステップ2: settings.jsonを直接編集**
`.vscode/settings.json` ファイルに以下を追加：
```json
{
    "liveServer.settings.port": 5502,
    "liveServer.settings.host": "0.0.0.0",
    "liveServer.settings.root": "/"
}
```

**ステップ3: ファイアウォールの設定**
1. Windowsキー → 「ファイアウォール」と検索
2. 「Windows Defender ファイアウォール」を開く
3. 「詳細設定」をクリック
4. 「受信の規則」→「新しい規則」
5. 「ポート」を選択 → 次へ
6. TCP → 特定のローカルポート → `5502` → 次へ
7. 「接続を許可する」→ 次へ
8. すべてにチェック → 次へ
9. 名前：`Live Server 5502` → 完了

**ステップ4: Live Serverを再起動**
1. VS Codeの右下のポート番号をクリック → 「Go Live」を停止
2. 再度 `index.html` を右クリック → 「Open with Live Server」

---

### 問題2: ページは表示されるが、地図や機能が動かない

#### 原因
- 位置情報の許可が必要
- JavaScriptのエラー

#### 解決方法
1. **位置情報を許可**
   - iPhoneのSafariで位置情報の許可を求められたら「許可」
   - 設定 → Safari → 位置情報サービス → Safari で確認

2. **ブラウザのコンソールでエラーを確認**
   - Mac: Safari → 開発 → エラーコンソール
   - Windows: iPhoneとMacをUSB接続してSafariの開発メニューを使用
   - または、PCのブラウザでデベロッパーツールを開いて確認

---

### 問題3: 「localhost」では動くが、IPアドレスでは動かない

#### 解決方法
**Live Serverの設定を変更**（上記のステップ1・2を参照）

---

### 問題4: ファイルが読み込まれない（404エラー）

#### 原因
- ファイルパスの問題
- サーバーのルートディレクトリの問題

#### 解決方法
1. VS Codeでプロジェクトフォルダ全体を開く（単一ファイルではなく）
2. `index.html` がルートディレクトリにあることを確認
3. Live Serverを再起動

---

## 簡単な動作確認手順

### 1. PC側の確認
```
1. GET_IP.batを実行してIPアドレスを確認
2. PCのブラウザで http://localhost:5502 を開く
3. ページが表示されることを確認
```

### 2. iPhone側の確認
```
1. PCとiPhoneが同じWi-Fiに接続されているか確認
2. iPhoneのSafariで http://[PCのIPアドレス]:5502 を開く
3. ページが表示されることを確認
```

---

## それでも解決しない場合

### 代替方法1: Pythonで起動
```powershell
python -m http.server 5502
```

### 代替方法2: Node.jsで起動
```powershell
npx http-server -p 5502
```

### 代替方法3: ポート番号を変更
`.vscode/settings.json`でポート番号を変更：
```json
{
    "liveServer.settings.port": 8080,
    "liveServer.settings.host": "0.0.0.0"
}
```





