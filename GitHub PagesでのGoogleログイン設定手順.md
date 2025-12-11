# GitHub PagesでのGoogleログイン設定手順

## 🔴 エラー内容

```
エラー 403: disallowed_useragent
context_uri=https://uriuri4321-eng.github.io
```

このエラーは、GitHub Pagesからアプリにアクセスしている場合に発生する可能性があります。

## 📋 解決手順

### 1. Firebase Consoleで承認済みドメインを追加

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト「**ikerukane-app**」を選択
3. 左側メニューから「**Authentication**」を選択
4. 上部の「**設定**」タブをクリック
5. 「**承認済みドメイン**」セクションを確認

### 2. GitHub Pagesのドメインを追加

「承認済みドメイン」セクションで以下を追加：

#### パターンA: ユーザー名.github.io形式の場合

```
uriuri4321-eng.github.io
```

#### パターンB: カスタムドメインを使用している場合

```
yourdomain.com
www.yourdomain.com
```

**追加手順**:
1. 「**ドメインを追加**」ボタンをクリック
2. ドメイン名を入力（例: `uriuri4321-eng.github.io`）
3. 「**追加**」をクリック

### 3. Google Cloud ConsoleでOAuth同意画面のURLを更新

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト「**ikerukane-app**」を選択
3. 「**APIとサービス**」→「**OAuth同意画面**」を選択
4. 「**アプリのホームページ**」を更新：

```
https://uriuri4321-eng.github.io
```

または、Firebase Hostingを使用している場合：

```
https://ikerukane-app.web.app
```

### 4. 承認済みのリダイレクトURIを確認（必要に応じて）

1. Google Cloud Console > 「**APIとサービス**」→「**認証情報**」
2. OAuth 2.0 クライアント IDをクリック
3. 「**承認済みのリダイレクト URI**」を確認

以下のURIが含まれていることを確認：

```
https://ikerukane-app.firebaseapp.com/__/auth/handler
https://ikerukane-app.web.app/__/auth/handler
```

**注意**: Firebaseが自動的に管理するため、通常は手動で追加する必要はありません。

---

## 🔍 エラーの詳細分析

### エラーメッセージの解釈

```
context_uri=https://uriuri4321-eng.github.io
```

この`context_uri`は、ユーザーがアプリにアクセスした元のURLを示しています。

### 考えられる原因

1. **承認済みドメインにGitHub Pagesのドメインが追加されていない**
   - 解決策: Firebase Consoleで`uriuri4321-eng.github.io`を追加

2. **アプリ内ブラウザ（WebView）からのアクセス**
   - 解決策: 通常のブラウザ（Safari、Chrome）で開く

3. **OAuth同意画面のURLが正しく設定されていない**
   - 解決策: Google Cloud ConsoleでOAuth同意画面のURLを更新

---

## ⚠️ 重要な注意事項

### 1. 複数のドメインを使用する場合

アプリを複数の場所でホスティングする場合、すべてのドメインを承認済みドメインに追加する必要があります：

- `ikerukane-app.firebaseapp.com`（Firebase Hosting）
- `ikerukane-app.web.app`（Firebase Hosting）
- `uriuri4321-eng.github.io`（GitHub Pages）
- `localhost`（開発環境）
- `127.0.0.1`（開発環境）

### 2. アプリ内ブラウザ（WebView）の問題

GitHub Pagesからアプリにアクセスする場合でも、アプリ内ブラウザ（LINE、Twitter、Facebook内のブラウザ）からはGoogleログインが使用できません。

**解決策**:
- 通常のブラウザ（Safari、Chrome）で開く
- URLをコピーしてブラウザに貼り付ける

### 3. HTTPSの使用

GitHub Pagesは自動的にHTTPSを提供しますが、OAuth認証にはHTTPSが必要です。`http://`ではなく`https://`を使用してください。

---

## 🔧 実際の設定例

### Firebase Consoleでの設定

**承認済みドメイン**:
```
✅ ikerukane-app.firebaseapp.com（自動追加）
✅ ikerukane-app.web.app（自動追加）
✅ uriuri4321-eng.github.io（手動追加）
✅ localhost（開発環境用、手動追加）
✅ 127.0.0.1（開発環境用、手動追加）
```

### Google Cloud Consoleでの設定

**OAuth同意画面 > アプリのホームページ**:
```
https://uriuri4321-eng.github.io
```

または、Firebase Hostingを使用する場合：

```
https://ikerukane-app.web.app
```

---

## 📝 設定手順のまとめ

### ステップ1: Firebase Consoleでドメインを追加

1. Firebase Console > Authentication > 設定
2. 承認済みドメイン > ドメインを追加
3. `uriuri4321-eng.github.io`を追加

### ステップ2: Google Cloud ConsoleでURLを更新

1. Google Cloud Console > APIとサービス > OAuth同意画面
2. アプリのホームページを`https://uriuri4321-eng.github.io`に更新
3. 保存

### ステップ3: 動作確認

1. 通常のブラウザ（Safari、Chrome）で`https://uriuri4321-eng.github.io`にアクセス
2. Googleログインボタンをクリック
3. 正常にログインできることを確認

---

## 🐛 トラブルシューティング

### エラーが続く場合

1. **ブラウザのキャッシュをクリア**
   - Safari: 設定 > Safari > 履歴とWebサイトデータを消去
   - Chrome: 設定 > プライバシーとセキュリティ > 閲覧履歴データの削除

2. **シークレット/プライベートモードで試す**
   - キャッシュやCookieの影響を排除

3. **別のブラウザで試す**
   - SafariとChromeで動作を確認

4. **承認済みドメインを再確認**
   - Firebase Consoleで正しく追加されているか確認
   - ドメイン名に誤字がないか確認（例: `github.io`ではなく`github.io`）

5. **OAuth同意画面の設定を再確認**
   - アプリのホームページURLが正しく設定されているか確認
   - テストユーザーが追加されているか確認

### エラーメッセージの詳細

- **403: disallowed_useragent**: アプリ内ブラウザ（WebView）からのアクセスがブロックされている
- **403: access_denied**: OAuth同意画面の設定が不完全
- **400: redirect_uri_mismatch**: 承認済みドメインが設定されていない

---

## 📚 参考リンク

- [Firebase Authentication ドキュメント](https://firebase.google.com/docs/auth)
- [GitHub Pages ドキュメント](https://docs.github.com/ja/pages)
- [Google OAuth 2.0 ドキュメント](https://developers.google.com/identity/protocols/oauth2)

---

## ✅ チェックリスト

設定が完了したら、以下を確認してください：

- [ ] Firebase Consoleで`uriuri4321-eng.github.io`が承認済みドメインに追加されている
- [ ] Google Cloud ConsoleでOAuth同意画面のURLが正しく設定されている
- [ ] 通常のブラウザ（Safari、Chrome）でアクセスしている
- [ ] `https://`を使用している（`http://`ではない）
- [ ] ブラウザのキャッシュをクリアした

---

**最終更新日**: 2025年1月
**重要度**: 🔴 緊急（Googleログインが使用できない）

