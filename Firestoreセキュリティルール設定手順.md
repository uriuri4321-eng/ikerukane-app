# Firestoreセキュリティルール設定手順

## ⚠️ 重要: 4日後にFirestoreへのアクセスが拒否されます

現在、Firestoreデータベースがテストモード（全公開状態）になっており、4日後に自動的にアクセスが拒否される予定です。この手順に従って、適切なセキュリティルールを設定してください。

## 📋 設定手順

### 1. Firebase Consoleにアクセス

1. ブラウザで [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト「**ikerukane-app**」を選択

### 2. Firestore Databaseに移動

1. 左側のメニューから「**Firestore Database**」をクリック
2. 上部のタブから「**ルール**」タブをクリック

### 3. セキュリティルールを設定

1. ルールエディタに以下のルールをコピー＆ペーストしてください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ヘルパー関数: 認証済みユーザーかチェック
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // ヘルパー関数: リクエストユーザーIDと一致するかチェック
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // ヘルパー関数: 管理者かチェック（uriuri4321@gmail.com）
    function isAdmin() {
      return isAuthenticated() && 
             request.auth.token.email == 'uriuri4321@gmail.com';
    }
    
    // usersコレクション: ユーザー情報
    match /users/{userId} {
      // 読み取り: 自分のデータのみ、または管理者
      allow read: if isOwner(userId) || isAdmin();
      
      // 作成: 認証済みユーザーが自分のIDで作成
      allow create: if isAuthenticated() && 
                        request.auth.uid == userId &&
                        request.resource.data.id == userId;
      
      // 更新: 自分のデータのみ、または管理者
      allow update: if isOwner(userId) || isAdmin();
      
      // 削除: 自分のデータのみ、または管理者
      allow delete: if isOwner(userId) || isAdmin();
      
      // paymentMethodsサブコレクション（将来の拡張用）
      match /paymentMethods/{paymentMethodId} {
        allow read, write: if isOwner(userId) || isAdmin();
      }
    }
    
    // eventsコレクション: 予定情報
    match /events/{eventId} {
      // 読み取り: 自分の予定のみ、または管理者
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      
      // 作成: 認証済みユーザーが自分のuserIdで作成
      allow create: if isAuthenticated() && 
                        request.resource.data.userId == request.auth.uid;
      
      // 更新: 自分の予定のみ、または管理者
      allow update: if isAuthenticated() && 
                        (resource.data.userId == request.auth.uid || isAdmin());
      
      // 削除: 自分の予定のみ、または管理者
      allow delete: if isAuthenticated() && 
                       (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // penaltiesコレクション: 課金情報
    match /penalties/{penaltyId} {
      // 読み取り: 自分の課金情報のみ、または管理者
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      
      // 作成: 認証済みユーザーが自分のuserIdで作成
      allow create: if isAuthenticated() && 
                        request.resource.data.userId == request.auth.uid;
      
      // 更新: 管理者のみ（通常はユーザーは更新不可）
      allow update: if isAdmin();
      
      // 削除: 管理者のみ
      allow delete: if isAdmin();
    }
    
    // その他のコレクションはデフォルトで拒否
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. ルールを公開

1. ルールをコピー＆ペーストしたら、「**公開**」ボタンをクリック
2. 確認ダイアログが表示されたら「**公開**」をクリック
3. ルールが反映されるまで数秒〜数分かかる場合があります

### 5. ルールの検証（推奨）

1. ルールエディタの上部にある「**ルールを検証**」ボタンをクリック
2. エラーがないか確認してください
3. エラーがある場合は、エラーメッセージを確認して修正してください

## 🔒 セキュリティルールの説明

### 基本原則

1. **認証必須**: すべての操作にはFirebase Authenticationによる認証が必要です
2. **ユーザー分離**: 各ユーザーは自分のデータのみアクセス可能です
3. **管理者権限**: `uriuri4321@gmail.com` は全データにアクセス可能です

### 各コレクションのルール

#### `users` コレクション
- **読み取り**: 自分のデータのみ、または管理者
- **作成**: 認証済みユーザーが自分のIDで作成
- **更新**: 自分のデータのみ、または管理者
- **削除**: 自分のデータのみ、または管理者

#### `events` コレクション
- **読み取り**: 自分の予定のみ、または管理者
- **作成**: 認証済みユーザーが自分のuserIdで作成
- **更新**: 自分の予定のみ、または管理者
- **削除**: 自分の予定のみ、または管理者

#### `penalties` コレクション
- **読み取り**: 自分の課金情報のみ、または管理者
- **作成**: 認証済みユーザーが自分のuserIdで作成
- **更新**: 管理者のみ（ユーザーは更新不可）
- **削除**: 管理者のみ

## ⚠️ 注意事項

1. **ルールの反映時間**: ルールを変更してから反映されるまで、最大24時間かかる場合があります
2. **テスト**: ルールを設定した後、実際にアプリで動作確認を行ってください
3. **バックアップ**: 現在のルールをコピーして保存しておくことを推奨します

## 🐛 トラブルシューティング

### エラー: "Missing or insufficient permissions"

- ルールが正しく設定されているか確認してください
- ユーザーが正しく認証されているか確認してください
- ルールの反映を待ってから再試行してください（最大24時間）

### エラー: "Permission denied"

- ユーザーが自分のデータにアクセスしようとしているか確認してください
- 管理者メールアドレスが正しく設定されているか確認してください

## 📞 サポート

問題が解決しない場合は、Firebase Consoleの「サポート」セクションから問い合わせてください。

---

**最終更新日**: 2025年1月
**重要度**: 🔴 緊急（4日以内に設定必須）

