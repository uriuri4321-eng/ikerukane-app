// Firebase設定ファイル
// このファイルはFirebaseプロジェクト作成後に設定値を入力してください

// Firebase設定（後で設定値を入力）
const firebaseConfig = {
    apiKey: "AIzaSyBJ41MNy2cUqbxHoWt1WhsVfOMExON7SoE",
    authDomain: "ikerukane-app.firebaseapp.com",
    projectId: "ikerukane-app",
    storageBucket: "ikerukane-app.firebasestorage.app",
    messagingSenderId: "912037385917",
    appId: "1:912037385917:web:fbf1ef586529c40ed509d4",
    measurementId: "G-295513K72Q"
  };

// Firebase初期化
let app;
let auth;
let db;

// Firebaseが利用可能かチェック
if (typeof firebase !== 'undefined') {
    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        console.log('Firebase初期化成功');
    } catch (error) {
        console.error('Firebase初期化エラー:', error);
    }
} else {
    console.warn('Firebase SDKが読み込まれていません');
}


