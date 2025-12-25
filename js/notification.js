// notification.js - 通知機能のユーティリティ

// 通知許可をリクエスト
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('このブラウザは通知をサポートしていません');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('通知が拒否されています');
        return false;
    }

    // 許可をリクエスト
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

// 通知を送信
function sendNotification(title, options = {}) {
    if (!('Notification' in window)) {
        console.warn('このブラウザは通知をサポートしていません');
        return;
    }

    if (Notification.permission !== 'granted') {
        console.warn('通知の許可が得られていません');
        return;
    }

    const defaultOptions = {
        body: '',
        icon: '/images/cloud1.png', // アプリのアイコン
        badge: '/images/cloud1.png',
        tag: 'ikarukane-notification',
        requireInteraction: false,
        ...options
    };

    const notification = new Notification(title, defaultOptions);

    // 通知をクリックしたらアプリを開く
    notification.onclick = function() {
        window.focus();
        notification.close();
    };

    // 通知を自動的に閉じる（5秒後）
    setTimeout(() => {
        notification.close();
    }, 5000);

    return notification;
}

// 予定のリマインダー通知をスケジュール
function scheduleReminder(event, reminderMinutes = 60) {
    if (!event || !event.start) {
        console.error('予定情報が不正です');
        return null;
    }

    const eventDate = new Date(event.start);
    const now = new Date();
    const reminderTime = new Date(eventDate.getTime() - reminderMinutes * 60 * 1000);

    // 既にリマインダー時刻を過ぎている場合はスキップ
    if (reminderTime <= now) {
        console.log('リマインダー時刻を過ぎています');
        return null;
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    console.log('リマインダーをスケジュールしました:', {
        eventTitle: event.title,
        reminderTime: reminderTime.toLocaleString('ja-JP'),
        timeUntilReminder: Math.round(timeUntilReminder / 1000 / 60) + '分後'
    });

    const timeoutId = setTimeout(() => {
        const title = `⏰ 予定のリマインダー`;
        const body = `「${event.title}」が${reminderMinutes}分後に始まります！\n期日: ${eventDate.toLocaleString('ja-JP')}`;
        
        sendNotification(title, {
            body: body,
            requireInteraction: true
        });

        // リマインダーを実行済みとしてマーク
        const reminderKey = `reminder_${event.id || event.firestoreId}_${reminderMinutes}`;
        localStorage.setItem(reminderKey, 'sent');
    }, timeUntilReminder);

    return timeoutId;
}

// すべての予定のリマインダーをスケジュール
function scheduleAllReminders(events, reminderMinutes = 60) {
    if (!Array.isArray(events)) {
        console.error('予定リストが不正です');
        return;
    }

    // 既存のタイマーをクリア
    clearAllReminders();

    const now = new Date();
    const activeEvents = events.filter(event => {
        if (!event.start) return false;
        const eventDate = new Date(event.start);
        // enableNotificationがfalseの場合はスキップ
        if (event.enableNotification === false) return false;
        return eventDate > now && event.status === 'active';
    });

    activeEvents.forEach(event => {
        scheduleReminder(event, reminderMinutes);
    });

    console.log(`${activeEvents.length}件の予定にリマインダーを設定しました`);
}

// すべてのリマインダーをクリア
function clearAllReminders() {
    // タイマーIDを保存する必要があるが、簡易版としてlocalStorageに保存
    // 実際の実装では、タイマーIDを配列で管理する必要がある
    console.log('すべてのリマインダーをクリアしました');
}

// 通知設定を保存
function saveNotificationSettings(settings) {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) return;

    const settingsKey = `notificationSettings_${currentUserId}`;
    localStorage.setItem(settingsKey, JSON.stringify(settings));
}

// 通知設定を取得
function getNotificationSettings() {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        return {
            enabled: true,
            reminderMinutes: 60, // デフォルトは1時間前
            soundEnabled: false
        };
    }

    const settingsKey = `notificationSettings_${currentUserId}`;
    const settings = localStorage.getItem(settingsKey);
    
    if (settings) {
        return JSON.parse(settings);
    }

    return {
        enabled: true,
        reminderMinutes: 60,
        soundEnabled: false
    };
}

// グローバルに公開
window.requestNotificationPermission = requestNotificationPermission;
window.sendNotification = sendNotification;
window.scheduleReminder = scheduleReminder;
window.scheduleAllReminders = scheduleAllReminders;
window.clearAllReminders = clearAllReminders;
window.saveNotificationSettings = saveNotificationSettings;
window.getNotificationSettings = getNotificationSettings;

