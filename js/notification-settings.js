// notification-settings.js - 通知設定ページの機能

let currentUserId = null;

// 初期化
document.addEventListener('DOMContentLoaded', async function() {
    // ログインチェック
    currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        alert('ログインが必要です');
        window.location.href = 'index.html';
        return;
    }

    // 既存の通知設定を読み込む
    loadNotificationSettings();
    
    // イベントリスナーを設定
    setupEventListeners();
});

/**
 * 通知設定を読み込む
 */
function loadNotificationSettings() {
    const settings = typeof getNotificationSettings === 'function' ? getNotificationSettings() : {
        enabled: true,
        reminderMinutes: 60,
        followUpNotificationEnabled: true
    };

    // UIに反映
    const notificationEnabled = document.getElementById('notificationEnabled');
    const reminderHours = document.getElementById('reminderHours');
    const followUpNotificationEnabled = document.getElementById('followUpNotificationEnabled');

    if (notificationEnabled) {
        notificationEnabled.classList.toggle('active', settings.enabled);
    }

    if (reminderHours) {
        // 分を時間に変換（60分 = 1時間）
        reminderHours.value = (settings.reminderMinutes || 60) / 60;
    }

    if (followUpNotificationEnabled) {
        followUpNotificationEnabled.classList.toggle('active', settings.followUpNotificationEnabled !== false);
    }
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners() {
    // 通知有効/無効のトグル
    const notificationEnabled = document.getElementById('notificationEnabled');
    if (notificationEnabled) {
        notificationEnabled.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    }

    // 追い通知有効/無効のトグル
    const followUpNotificationEnabled = document.getElementById('followUpNotificationEnabled');
    if (followUpNotificationEnabled) {
        followUpNotificationEnabled.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    }

    // 保存ボタン
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', saveSettings);
    }

    // 数値入力の検証
    const reminderHours = document.getElementById('reminderHours');
    if (reminderHours) {
        reminderHours.addEventListener('input', function() {
            let value = parseFloat(this.value);
            if (isNaN(value) || value < 0.5) {
                this.value = 0.5;
            } else if (value > 24) {
                this.value = 24;
            }
        });
    }
}

/**
 * 設定を保存
 */
async function saveSettings() {
    const notificationEnabled = document.getElementById('notificationEnabled');
    const reminderHours = document.getElementById('reminderHours');
    const followUpNotificationEnabled = document.getElementById('followUpNotificationEnabled');

    const enabled = notificationEnabled ? notificationEnabled.classList.contains('active') : true;
    const hours = reminderHours ? parseFloat(reminderHours.value) : 1;
    const reminderMinutes = hours * 60; // 時間を分に変換
    const followUpEnabled = followUpNotificationEnabled ? followUpNotificationEnabled.classList.contains('active') : true;

    const settings = {
        enabled: enabled,
        reminderMinutes: reminderMinutes,
        followUpNotificationEnabled: followUpEnabled
    };

    // 通知設定を保存
    if (typeof saveNotificationSettings === 'function') {
        saveNotificationSettings(settings);
    }

    // 通知許可をリクエスト（ONにした場合）
    if (enabled && typeof requestNotificationPermission === 'function') {
        await requestNotificationPermission();
    }

    // Firestoreにも保存（オプション）
    if (db && currentUserId) {
        try {
            await db.collection('users').doc(currentUserId).update({
                notificationSettings: settings,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Firestoreへの通知設定保存エラー:', error);
        }
    }

    alert('通知設定を保存しました');
    
    // カレンダーページに戻る
    window.location.href = 'calendar.html';
}

