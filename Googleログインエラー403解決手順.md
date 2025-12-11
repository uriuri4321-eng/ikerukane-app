# Googleログインエラー403: disallowed_useragent 解決手順

## 🔴 エラー内容

```
アクセスをブロック: ikerukane-app.firebaseapp.com のリクエストは Google のポリシーに準拠していません
エラー 403: disallowed_useragent
```

このエラーは、Googleの「安全なブラウザの使用」に関するポリシーに準拠していない場合に発生します。

## 📋 解決手順

### 1. Google Cloud ConsoleでOAuth同意画面を設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト「**ikerukane-app**」を選択（または作成）
3. 左側のメニューから「**APIとサービス**」→「**OAuth同意画面**」を選択

### 2. OAuth同意画面の基本情報を設定

1. **ユーザータイプ**を選択
   - **外部**を選択（一般ユーザーが使用する場合）
   - **内部**はGoogle Workspace組織内でのみ使用可能

2. **アプリ情報**を入力
   - **アプリ名**: `イケルカネ` または `Ikerukane`
   - **ユーザーサポートメール**: あなたのメールアドレス（例：`uriuri4321@gmail.com`）
   - **アプリのロゴ**: 任意（`qrikerukane.png`をアップロード可能）
   - **アプリのホームページ**: `https://ikerukane-app.firebaseapp.com` または実際のURL
   - **アプリのプライバシーポリシーリンク**: 任意（後で設定可能）
   - **アプリの利用規約リンク**: 任意（後で設定可能）
   - **承認済みのドメイン**: 空欄でOK（後で設定）

3. **スコープ**を設定
   - 「スコープを追加または削除」をクリック
   - 以下のスコープを追加：
     - `openid`
     - `email`
     - `profile`
   - 「更新」をクリック

4. **テストユーザー**を追加（開発中の場合）
   - 「テストユーザー」セクションに移動
   - 「ユーザーを追加」をクリック
   - テスト用のGoogleアカウントのメールアドレスを追加
   - 例：`suikanoasaduke@gmail.com`、`uriuri4321@gmail.com`

5. **保存して次へ**をクリック

### 3. 承認済みドメインを設定

1. Firebase Consoleに戻る
   - [Firebase Console](https://console.firebase.google.com/) にアクセス
   - プロジェクト「**ikerukane-app**」を選択

2. Authentication > 設定を開く
   - 左側メニューから「**Authentication**」を選択
   - 上部の「**設定**」タブをクリック

3. 承認済みドメインを追加
   - 「**承認済みドメイン**」セクションを確認
   - 以下のドメインが自動で追加されていることを確認：
     - `ikerukane-app.firebaseapp.com`
     - `ikerukane-app.web.app`
   - 追加が必要な場合：
     - 「ドメインを追加」をクリック
     - ドメインを入力（例：`localhost`、`127.0.0.1`、実際のドメイン）

### 4. Firebase Authenticationの設定を確認

1. Firebase Console > Authentication > Sign-in method
2. 「**Google**」をクリック
3. 以下を確認：
   - **有効**になっているか
   - **プロジェクトのサポートメール**が設定されているか
   - **OAuth同意画面のURL**が正しく設定されているか

### 5. アプリ内ブラウザ（WebView）からのアクセスを回避

このエラーは、アプリ内ブラウザ（WebView）からGoogleログインを試みた場合に発生することがあります。

#### 解決策A: 通常のブラウザで開く

ユーザーに以下の案内を表示：

```
Googleログインを使用するには、通常のブラウザ（Safari、Chrome）で
このアプリを開いてください。

アプリ内ブラウザ（LINE、Twitter、Facebook内のブラウザ）からは
Googleログインが使用できません。
```

#### 解決策B: リダイレクト方式を使用

コードでリダイレクト方式を使用するように変更（既に実装済みの可能性があります）。

### 6. 動作確認

1. **通常のブラウザ**（Safari、Chrome）でアプリを開く
2. Googleログインボタンをクリック
3. 正常にログインできることを確認

## ⚠️ 重要な注意事項

### アプリ内ブラウザ（WebView）について

以下の環境からはGoogleログインが**使用できません**：
- LINEアプリ内ブラウザ
- Twitterアプリ内ブラウザ
- Facebookアプリ内ブラウザ
- Instagramアプリ内ブラウザ
- その他のアプリ内ブラウザ（WebView）

**解決策**: ユーザーに「ブラウザで開く」を案内するか、通常のブラウザで直接アクセスしてもらう。

### OAuth同意画面の公開

- **テストモード**: テストユーザーのみログイン可能（最大100人）
- **本番モード**: すべてのユーザーがログイン可能（Googleの審査が必要）

**開発中はテストモードで十分です。**

## 🔍 トラブルシューティング

### エラーが続く場合

1. **ブラウザのキャッシュをクリア**
   - Safari: 設定 > Safari > 履歴とWebサイトデータを消去
   - Chrome: 設定 > プライバシーとセキュリティ > 閲覧履歴データの削除

2. **シークレット/プライベートモードで試す**
   - キャッシュやCookieの影響を排除

3. **別のブラウザで試す**
   - SafariとChromeで動作を確認

4. **OAuth同意画面の設定を再確認**
   - スコープが正しく設定されているか
   - テストユーザーが追加されているか

5. **Firebase Consoleの設定を再確認**
   - Google Sign-Inが有効になっているか
   - 承認済みドメインが正しく設定されているか

### エラーメッセージの詳細

- **403: disallowed_useragent**: アプリ内ブラウザ（WebView）からのアクセスがブロックされている
- **403: access_denied**: OAuth同意画面の設定が不完全
- **400: redirect_uri_mismatch**: 承認済みドメインが設定されていない

## 📞 サポート

問題が解決しない場合：

1. [Firebase サポート](https://firebase.google.com/support) に問い合わせ
2. [Google Cloud サポート](https://cloud.google.com/support) に問い合わせ
3. エラーメッセージのスクリーンショットを添付して問い合わせ

---

**最終更新日**: 2025年1月
**重要度**: 🔴 緊急（Googleログインが使用できない）

