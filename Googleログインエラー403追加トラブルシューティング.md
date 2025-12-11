# Googleログインエラー403: disallowed_useragent 追加トラブルシューティング

## 🔴 状況

- ✅ Firebase Consoleで承認済みドメインは既に追加済み
- ❌ それでもエラー403: disallowed_useragentが発生

## 🔍 追加で確認すべき項目

### 1. アプリ内ブラウザ（WebView）からのアクセスを確認

**最も可能性が高い原因**: アプリ内ブラウザ（WebView）からのアクセス

#### 確認方法

以下の環境からアクセスしていませんか？
- ❌ LINEアプリ内ブラウザ
- ❌ Twitterアプリ内ブラウザ
- ❌ Facebookアプリ内ブラウザ
- ❌ Instagramアプリ内ブラウザ
- ❌ その他のアプリ内ブラウザ

#### 解決方法

**通常のブラウザで開く**:
1. URLをコピー
2. SafariまたはChromeで直接開く
3. または「ブラウザで開く」を選択

### 2. OAuth同意画面の設定を確認

#### ステップ1: Google Cloud Consoleで確認

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト「**ikerukane-app**」を選択
3. 「**APIとサービス**」→「**OAuth同意画面**」を選択

#### ステップ2: 以下を確認

**アプリのホームページ**:
- `https://uriuri4321-eng.github.io` が設定されているか
- または `https://ikerukane-app.web.app` が設定されているか

**テストユーザー**（テストモードの場合）:
- `suikanoasaduke@gmail.com` が追加されているか
- `uriuri4321@gmail.com` が追加されているか

**スコープ**:
- `openid` が追加されているか
- `email` が追加されているか
- `profile` が追加されているか

### 3. リダイレクトURIの確認

#### ステップ1: Google Cloud Consoleで確認

1. Google Cloud Console > 「**APIとサービス**」→「**認証情報**」
2. OAuth 2.0 クライアント IDをクリック
3. 「**承認済みのリダイレクト URI**」を確認

#### ステップ2: 以下のURIが含まれているか確認

```
https://ikerukane-app.firebaseapp.com/__/auth/handler
https://ikerukane-app.web.app/__/auth/handler
```

**注意**: Firebaseが自動的に管理するため、通常は手動で追加する必要はありません。もし含まれていない場合は、Firebase Consoleで確認してください。

### 4. Firebase Authenticationの設定を再確認

#### ステップ1: Firebase Consoleで確認

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト「**ikerukane-app**」を選択
3. 「**Authentication**」→「**Sign-in method**」を選択

#### ステップ2: Google Sign-Inの設定を確認

- ✅ **有効**になっているか
- ✅ **プロジェクトのサポートメール**が設定されているか
- ✅ **OAuth同意画面のURL**が正しく設定されているか

### 5. ブラウザのキャッシュとCookieをクリア

#### Safariの場合

1. 設定 > Safari
2. 「履歴とWebサイトデータを消去」をタップ
3. 「消去」を確認

#### Chromeの場合

1. 設定 > プライバシーとセキュリティ
2. 「閲覧履歴データの削除」をクリック
3. 「Cookieとサイトデータ」を選択
4. 「データを削除」をクリック

### 6. シークレット/プライベートモードで試す

キャッシュやCookieの影響を排除するため：

1. シークレット/プライベートモードでブラウザを開く
2. `https://uriuri4321-eng.github.io` にアクセス
3. Googleログインを試す

### 7. 別のブラウザで試す

1. SafariとChromeの両方で試す
2. どちらでも同じエラーが発生するか確認

### 8. ユーザーエージェントの確認

#### 確認方法

1. ブラウザの開発者ツールを開く（F12または右クリック > 検証）
2. 「Console」タブを開く
3. 以下を実行：

```javascript
console.log(navigator.userAgent);
```

#### 確認すべき点

- `WebView` という文字列が含まれていないか
- `Line`、`Twitter`、`Facebook` などの文字列が含まれていないか

もし含まれている場合、アプリ内ブラウザからのアクセスです。

### 9. OAuth同意画面の公開状態を確認

#### テストモードの場合

- テストユーザーが追加されている必要があります
- テストユーザー以外はログインできません

#### 本番モードの場合

- Googleの審査が必要です
- 審査が完了していない場合、一般ユーザーはログインできません

### 10. Firebase HostingのURLで試す

GitHub Pagesではなく、Firebase HostingのURLで試してみてください：

```
https://ikerukane-app.web.app
```

または

```
https://ikerukane-app.firebaseapp.com
```

これで動作する場合、GitHub Pagesの設定に問題がある可能性があります。

---

## 🔧 段階的な診断手順

### ステップ1: ブラウザの確認

1. **通常のブラウザ（Safari、Chrome）で開いているか確認**
   - アプリ内ブラウザ（WebView）ではないか確認
   - URLをコピーしてブラウザに貼り付けて試す

### ステップ2: キャッシュのクリア

1. **ブラウザのキャッシュとCookieをクリア**
2. **シークレット/プライベートモードで試す**

### ステップ3: OAuth同意画面の確認

1. **Google Cloud ConsoleでOAuth同意画面を確認**
2. **テストユーザーが追加されているか確認**
3. **アプリのホームページURLが正しく設定されているか確認**

### ステップ4: Firebase Hostingで試す

1. **Firebase HostingのURLで試す**
2. **GitHub PagesとFirebase Hostingで動作が異なるか確認**

---

## 📝 確認チェックリスト

以下の項目を順番に確認してください：

- [ ] 通常のブラウザ（Safari、Chrome）で開いている
- [ ] アプリ内ブラウザ（WebView）ではない
- [ ] ブラウザのキャッシュとCookieをクリアした
- [ ] シークレット/プライベートモードで試した
- [ ] 別のブラウザ（SafariとChrome）で試した
- [ ] OAuth同意画面でテストユーザーが追加されている
- [ ] OAuth同意画面でアプリのホームページURLが正しく設定されている
- [ ] Firebase HostingのURL（`https://ikerukane-app.web.app`）で試した
- [ ] Firebase Consoleで承認済みドメインに`uriuri4321-eng.github.io`が追加されている（既に確認済み）

---

## 🐛 よくある原因と解決策

### 原因1: アプリ内ブラウザ（WebView）からのアクセス

**症状**: `disallowed_useragent`エラー

**解決策**: 
- 通常のブラウザ（Safari、Chrome）で開く
- URLをコピーしてブラウザに貼り付ける

### 原因2: テストユーザーが追加されていない

**症状**: テストモードでログインできない

**解決策**:
- Google Cloud Console > OAuth同意画面 > テストユーザーに追加

### 原因3: OAuth同意画面のURLが正しく設定されていない

**症状**: リダイレクトエラー

**解決策**:
- Google Cloud Console > OAuth同意画面 > アプリのホームページを更新

### 原因4: ブラウザのキャッシュやCookieの問題

**症状**: 設定を変更しても反映されない

**解決策**:
- ブラウザのキャッシュとCookieをクリア
- シークレット/プライベートモードで試す

---

## 📞 さらなるサポート

上記の手順を試しても解決しない場合：

1. **エラーメッセージの全文を確認**
   - ブラウザの開発者ツール（F12）> Consoleタブでエラーを確認
   - エラーメッセージのスクリーンショットを保存

2. **Firebase サポートに問い合わせ**
   - [Firebase サポート](https://firebase.google.com/support)

3. **Google Cloud サポートに問い合わせ**
   - [Google Cloud サポート](https://cloud.google.com/support)

---

**最終更新日**: 2025年1月

