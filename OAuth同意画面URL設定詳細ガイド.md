# OAuth同意画面URL設定詳細ガイド

## 📋 概要

Google OAuth同意画面では、アプリに関する複数のURLを設定する必要があります。これらのURLは、ユーザーがGoogleアカウントでログインする際に表示される情報として使用されます。

## 🔗 設定が必要なURL一覧

### 1. アプリのホームページ（必須）

**説明**: アプリのメインページのURL

**設定例**:
- 開発環境: `http://localhost:5500` または `http://127.0.0.1:5500`
- Firebase Hosting: `https://ikerukane-app.web.app` または `https://ikerukane-app.firebaseapp.com`
- カスタムドメイン: `https://yourdomain.com`

**設定方法**:
1. Google Cloud Console > OAuth同意画面
2. 「アプリのホームページ」フィールドにURLを入力
3. 例: `https://ikerukane-app.web.app`

**注意事項**:
- `http://` と `https://` の違いに注意
- 開発環境では `localhost` や `127.0.0.1` も使用可能
- 本番環境では `https://` を使用することが推奨されます

---

### 2. アプリのプライバシーポリシーリンク（推奨）

**説明**: アプリのプライバシーポリシーページのURL

**必須条件**:
- 本番環境で一般公開する場合は**必須**
- テストモード（開発中）では任意

**設定例**:
- `https://ikerukane-app.web.app/privacy-policy.html`
- `https://yourdomain.com/privacy`

**プライバシーポリシーの内容例**:
```
1. 収集する情報
   - ユーザー名、メールアドレス
   - 位置情報（GPS）
   - 予定情報

2. 情報の使用方法
   - 予定の到着判定
   - アプリの機能提供

3. 情報の共有
   - 管理者による閲覧
   - 第三者への提供なし

4. データの保存
   - Firebase（Google Cloud）に保存
   - 暗号化された状態で保存
```

**プライバシーポリシーページの作成方法**:
1. `privacy-policy.html` ファイルを作成
2. 上記の内容を記載
3. Firebase Hostingにデプロイ、または静的ホスティングにアップロード
4. URLをOAuth同意画面に設定

---

### 3. アプリの利用規約リンク（推奨）

**説明**: アプリの利用規約ページのURL

**必須条件**:
- 本番環境で一般公開する場合は**推奨**（必須ではない場合もある）
- テストモード（開発中）では任意

**設定例**:
- `https://ikerukane-app.web.app/terms-of-service.html`
- `https://yourdomain.com/terms`

**利用規約の内容例**:
```
1. サービスの利用
   - 本アプリは予定管理と遅刻防止を目的としています
   - ユーザーは適切にサービスを利用する責任があります

2. 禁止事項
   - 不正な使用
   - 他ユーザーへの迷惑行為

3. 免責事項
   - 位置情報の精度による誤判定の可能性
   - 通信障害による機能停止の可能性

4. 変更・終了
   - サービス内容の変更可能性
   - 予告なくサービスを終了する可能性
```

**利用規約ページの作成方法**:
1. `terms-of-service.html` ファイルを作成
2. 上記の内容を記載
3. Firebase Hostingにデプロイ、または静的ホスティングにアップロード
4. URLをOAuth同意画面に設定

---

### 4. 承認済みのドメイン（オプション）

**説明**: OAuth認証を許可するドメインのリスト

**設定場所**:
- Firebase Console > Authentication > 設定 > 承認済みドメイン

**設定例**:
- `ikerukane-app.firebaseapp.com`
- `ikerukane-app.web.app`
- `localhost`（開発環境用）
- `127.0.0.1`（開発環境用）
- カスタムドメイン（例: `yourdomain.com`）

**注意事項**:
- Firebase Hostingのドメインは自動で追加されます
- 開発環境では `localhost` と `127.0.0.1` を追加
- カスタムドメインを使用する場合は追加が必要

---

## 📝 実際の設定手順

### ステップ1: プライバシーポリシーページを作成（推奨）

1. プロジェクトルートに `privacy-policy.html` を作成
2. 以下のような内容を記載：

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>プライバシーポリシー - イケルカネ</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container" style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
        <h1>プライバシーポリシー</h1>
        <p>最終更新日: 2025年1月</p>
        
        <h2>1. 収集する情報</h2>
        <p>本アプリは以下の情報を収集します：</p>
        <ul>
            <li>ユーザー名、メールアドレス（Googleアカウント情報）</li>
            <li>位置情報（GPS情報）</li>
            <li>予定情報（タイトル、期日、目的地）</li>
        </ul>
        
        <h2>2. 情報の使用方法</h2>
        <p>収集した情報は以下の目的で使用します：</p>
        <ul>
            <li>予定の目的地への到着判定</li>
            <li>アプリの機能提供</li>
            <li>システムの管理・運営</li>
        </ul>
        
        <h2>3. 情報の共有</h2>
        <p>管理者はシステムの管理・運営のために位置情報を閲覧できる権限を有しています。ただし、個人情報を第三者に提供することはありません。</p>
        
        <h2>4. データの保存</h2>
        <p>データはFirebase（Google Cloud Platform）に暗号化された状態で保存されます。</p>
        
        <h2>5. お問い合わせ</h2>
        <p>プライバシーポリシーに関するお問い合わせは、アプリ内のサポート機能からお願いします。</p>
    </div>
</body>
</html>
```

### ステップ2: 利用規約ページを作成（推奨）

1. プロジェクトルートに `terms-of-service.html` を作成
2. 以下のような内容を記載：

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>利用規約 - イケルカネ</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container" style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
        <h1>利用規約</h1>
        <p>最終更新日: 2025年1月</p>
        
        <h2>1. サービスの利用</h2>
        <p>本アプリ「イケルカネ」は、予定管理と遅刻防止を目的としたサービスです。ユーザーは適切にサービスを利用する責任があります。</p>
        
        <h2>2. 禁止事項</h2>
        <p>以下の行為を禁止します：</p>
        <ul>
            <li>不正な使用</li>
            <li>他ユーザーへの迷惑行為</li>
            <li>システムへの攻撃</li>
        </ul>
        
        <h2>3. 免責事項</h2>
        <p>以下の事項について免責とします：</p>
        <ul>
            <li>位置情報の精度による誤判定の可能性</li>
            <li>通信障害による機能停止の可能性</li>
            <li>データの損失や破損</li>
        </ul>
        
        <h2>4. 変更・終了</h2>
        <p>サービス内容は予告なく変更される可能性があります。また、予告なくサービスを終了する可能性があります。</p>
    </div>
</body>
</html>
```

### ステップ3: Google Cloud ConsoleでURLを設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト「**ikerukane-app**」を選択
3. 「**APIとサービス**」→「**OAuth同意画面**」を選択
4. 以下のURLを設定：

#### アプリのホームページ
```
https://ikerukane-app.web.app
```
または開発環境の場合：
```
http://localhost:5500
```

#### アプリのプライバシーポリシーリンク
```
https://ikerukane-app.web.app/privacy-policy.html
```

#### アプリの利用規約リンク
```
https://ikerukane-app.web.app/terms-of-service.html
```

5. 「**保存して次へ**」をクリック

---

## 🔧 Firebase Hostingにデプロイする場合

### ステップ1: Firebase Hostingを有効化

1. Firebase Console > Hosting
2. 「始める」をクリック
3. 手順に従って設定

### ステップ2: ファイルをデプロイ

```bash
# Firebase CLIをインストール（初回のみ）
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# プロジェクトを初期化
firebase init hosting

# ファイルをデプロイ
firebase deploy --only hosting
```

### ステップ3: URLを確認

デプロイ後、以下のURLでアクセス可能になります：
- `https://ikerukane-app.web.app`
- `https://ikerukane-app.firebaseapp.com`

---

## ⚠️ 重要な注意事項

### 1. テストモード vs 本番モード

- **テストモード**: プライバシーポリシーと利用規約は任意
- **本番モード**: プライバシーポリシーは**必須**、利用規約は推奨

### 2. URLの形式

- `http://` と `https://` の違いに注意
- 本番環境では `https://` を使用することが推奨されます
- 開発環境では `http://localhost` も使用可能

### 3. ドメインの一致

- OAuth同意画面のURLとFirebase Authenticationの承認済みドメインが一致している必要があります
- 不一致の場合、エラーが発生する可能性があります

### 4. 公開前の確認

- プライバシーポリシーと利用規約は、実際のアプリの動作に合わせて内容を更新してください
- 法律的な問題を避けるため、必要に応じて専門家に相談してください

---

## 📞 トラブルシューティング

### エラー: "Invalid redirect URI"

**原因**: OAuth同意画面のURLと承認済みドメインが一致していない

**解決方法**:
1. Firebase Console > Authentication > 設定 > 承認済みドメインを確認
2. OAuth同意画面のURLが承認済みドメインに含まれているか確認
3. 必要に応じて承認済みドメインを追加

### エラー: "Access blocked: This app's request is invalid"

**原因**: プライバシーポリシーや利用規約のURLが正しく設定されていない

**解決方法**:
1. OAuth同意画面でURLが正しく設定されているか確認
2. URLが実際にアクセス可能か確認
3. `https://` を使用しているか確認

---

## 📚 参考リンク

- [Google OAuth同意画面の設定](https://console.cloud.google.com/apis/credentials/consent)
- [Firebase Hosting ドキュメント](https://firebase.google.com/docs/hosting)
- [Google OAuth 2.0 ポリシー](https://developers.google.com/identity/protocols/oauth2/policies)

---

**最終更新日**: 2025年1月

