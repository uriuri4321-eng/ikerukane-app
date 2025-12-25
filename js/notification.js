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

    // 個別の通知時間が設定されている場合はそれを使用、なければデフォルト値を使用
    const eventNotificationMinutes = event.notificationMinutes || reminderMinutes;
    
    const eventDate = new Date(event.start);
    const now = new Date();
    const reminderTime = new Date(eventDate.getTime() - eventNotificationMinutes * 60 * 1000);

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
        const hours = Math.floor(eventNotificationMinutes / 60);
        const minutes = eventNotificationMinutes % 60;
        const timeStr = hours > 0 ? `${hours}時間${minutes > 0 ? minutes + '分' : ''}` : `${eventNotificationMinutes}分`;
        const body = `「${event.title}」が${timeStr}後に始まります！\n期日: ${eventDate.toLocaleString('ja-JP')}`;
        
        sendNotification(title, {
            body: body,
            requireInteraction: true
        });

        // リマインダーを実行済みとしてマーク
        const reminderKey = `reminder_${event.id || event.firestoreId}_${eventNotificationMinutes}`;
        localStorage.setItem(reminderKey, 'sent');
    }, timeUntilReminder);

    return timeoutId;
}

// 追い通知をスケジュール（予定の10分前に目的地に到着していない場合）
function scheduleFollowUpNotification(event) {
    if (!event || !event.start) {
        console.error('予定情報が不正です');
        return null;
    }

    // 追い通知設定を確認
    const settings = getNotificationSettings();
    if (!settings.followUpNotificationEnabled) {
        console.log('追い通知が無効です');
        return null;
    }

    const eventDate = new Date(event.start);
    const now = new Date();
    const followUpTime = new Date(eventDate.getTime() - 10 * 60 * 1000); // 10分前

    // 既に10分前を過ぎている場合はスキップ
    if (followUpTime <= now) {
        console.log('追い通知時刻を過ぎています');
        return null;
    }

    const timeUntilFollowUp = followUpTime.getTime() - now.getTime();

    console.log('追い通知をスケジュールしました:', {
        eventTitle: event.title,
        followUpTime: followUpTime.toLocaleString('ja-JP'),
        timeUntilFollowUp: Math.round(timeUntilFollowUp / 1000 / 60) + '分後'
    });

    const timeoutId = setTimeout(async () => {
        // 現在位置を取得して、目的地に到着しているかチェック
        if (navigator.geolocation && event.lat && event.lng) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const currentLat = position.coords.latitude;
                    const currentLng = position.coords.longitude;
                    
                    // ハーバーサイン公式で距離を計算
                    const R = 6371000; // 地球の半径（メートル）
                    const dLat = (currentLat - event.lat) * Math.PI / 180;
                    const dLng = (currentLng - event.lng) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                              Math.cos(event.lat * Math.PI / 180) * Math.cos(currentLat * Math.PI / 180) *
                              Math.sin(dLng / 2) * Math.sin(dLng / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distance = R * c; // メートル

                    // 100m以内に到着していない場合、追い通知を送る
                    if (distance > 100) {
                        const title = `⚠️ 予定まで10分前です`;
                        const body = `「${event.title}」まであと10分です。\nまだ目的地に到着していません。急いでください！`;
                        
                        sendNotification(title, {
                            body: body,
                            requireInteraction: true
                        });

                        // 追い通知を実行済みとしてマーク
                        const followUpKey = `followUp_${event.id || event.firestoreId}`;
                        localStorage.setItem(followUpKey, 'sent');
                    } else {
                        console.log('既に目的地に到着しているため、追い通知をスキップします');
                    }
                },
                function(error) {
                    // 位置情報取得に失敗した場合でも追い通知を送る
                    const title = `⚠️ 予定まで10分前です`;
                    const body = `「${event.title}」まであと10分です。\n目的地に到着しているか確認してください。`;
                    
                    sendNotification(title, {
                        body: body,
                        requireInteraction: true
                    });

                    const followUpKey = `followUp_${event.id || event.firestoreId}`;
                    localStorage.setItem(followUpKey, 'sent');
                },
                { timeout: 5000 }
            );
        } else {
            // 位置情報が取得できない場合でも追い通知を送る
            const title = `⚠️ 予定まで10分前です`;
            const body = `「${event.title}」まであと10分です。\n目的地に到着しているか確認してください。`;
            
            sendNotification(title, {
                body: body,
                requireInteraction: true
            });

            const followUpKey = `followUp_${event.id || event.firestoreId}`;
            localStorage.setItem(followUpKey, 'sent');
        }
    }, timeUntilFollowUp);

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
        // 追い通知もスケジュール（設定が有効な場合）
        const settings = getNotificationSettings();
        if (settings.followUpNotificationEnabled !== false) {
            scheduleFollowUpNotification(event);
        }
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
            followUpNotificationEnabled: true // 追い通知はデフォルトでON
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
        followUpNotificationEnabled: true
    };
}

// グローバルに公開
window.requestNotificationPermission = requestNotificationPermission;
window.sendNotification = sendNotification;
window.scheduleReminder = scheduleReminder;
window.scheduleFollowUpNotification = scheduleFollowUpNotification;
window.scheduleAllReminders = scheduleAllReminders;
window.clearAllReminders = clearAllReminders;
window.saveNotificationSettings = saveNotificationSettings;
window.getNotificationSettings = getNotificationSettings;

