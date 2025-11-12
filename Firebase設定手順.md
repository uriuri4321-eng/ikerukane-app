# Firebase設定手順

## 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例：`ikerukane-app`）
4. Google Analyticsの設定（任意）を選択
5. 「プロジェクトを作成」をクリック

## 2. Authentication（認証）の有効化

1. Firebase Consoleの左側メニューから「Authentication」を選択
   - メニューが見つからない場合：
     - 画面左上の「≡」（ハンバーガーメニュー）をクリック
     - または、左側のサイドバーを確認
2. 「始める」または「Get started」ボタンをクリック
3. 上部のタブから「Sign-in method」（サインイン方法）を選択

### 2-1. Googleアカウントログインを有効化（推奨）

1. 「Google」をクリック
2. 「有効にする」をONに切り替え
3. 「プロジェクトのサポートメール」を選択（自動で設定されている場合が多い）
4. 「保存」をクリック

### 2-2. メール/パスワードログインを有効化（オプション）

1. 「メール/パスワード」をクリック
2. 「有効にする」をONに切り替え
3. 「保存」をクリック

**注意**: もし「Authentication」がメニューに表示されない場合：
- プロジェクトが正しく作成されているか確認
- ブラウザを再読み込みしてみてください
- 別のブラウザで試してみてください

## 3. Firestore Databaseの作成

1. Firebase Consoleで「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. セキュリティルールを選択
   - **テストモード**を選択（開発用）
   - 本番環境では適切なセキュリティルールを設定してください
4. ロケーションを選択（例：`asia-northeast1` - 東京）
5. 「有効にする」をクリック

## 4. Webアプリの登録

1. Firebase Consoleで「プロジェクトの設定」（⚙️アイコン）をクリック
2. 「全般」タブで下にスクロール
3. 「アプリを追加」→「Web」（</>アイコン）を選択
4. アプリのニックネームを入力（例：`イケルカネ`）
5. 「このアプリのFirebase Hostingも設定します」はチェック不要
6. 「アプリを登録」をクリック

## 5. 設定値の取得

登録後、以下の設定値が表示されます：

```javascript
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

## 6. 設定ファイルの更新

`js/firebase-config.js`ファイルを開き、上記の設定値を入力してください：

```javascript
const firebaseConfig = {
    apiKey: "ここにAPIキーを入力",
    authDomain: "ここにauthDomainを入力",
    projectId: "ここにprojectIdを入力",
    storageBucket: "ここにstorageBucketを入力",
    messagingSenderId: "ここにmessagingSenderIdを入力",
    appId: "ここにappIdを入力"
};
```

**重要**: `YOUR_API_KEY`、`YOUR_PROJECT_ID`などのプレースホルダーを実際の値に置き換えてください。

## 6-1. 設定値の例

実際の設定値は以下のような形式になります：

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBGIYP3GFzqnzQR7skCyMXMu5mljijKTp0",
    authDomain: "ikerukane-app.firebaseapp.com",
    projectId: "ikerukane-app",
    storageBucket: "ikerukane-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};
```

## 7. Firestoreセキュリティルール（本番環境用）

本番環境では、以下のセキュリティルールを設定してください：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のデータのみ読み書き可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 管理者は全ユーザーのデータを読み取り可能
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## 8. 動作確認

1. `register.html`でアカウントを登録
2. `admin-dashboard.html`で全アカウントを確認
3. 異なるデバイスで登録したアカウントも表示されることを確認

## 注意事項

- **無料プラン（Spark）**で十分な機能が使えます
- データ量やリクエスト数に制限がありますが、テスト用途では問題ありません
- 本番環境では適切なセキュリティルールを設定してください

