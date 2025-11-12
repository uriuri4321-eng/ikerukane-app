document.addEventListener('DOMContentLoaded', function() {
    const eventForm = document.getElementById('eventForm');
    const titleInput = document.getElementById('eventTitleInput');
    const deadlineInput = document.getElementById('eventDeadlineInput');
    const saveBtn = document.getElementById('saveEventBtn');
    const cancelBtn = document.getElementById('cancelEventBtn');
    const reserveBtn = document.getElementById('reserveBtn');
    const eventsContainer = document.getElementById('eventsContainer');

    // 現在のユーザーIDを取得
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        alert('ログインが必要です');
        window.location.href = 'index.html';
        return;
    }

    // ユーザーごとの予定データのキー
    const eventsKey = `events_${currentUserId}`;
    const completedEventsKey = `completedEvents_${currentUserId}`;

    // 予定データの読み込み（ユーザーごと）
    let savedEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
    let completedEvents = JSON.parse(localStorage.getItem(completedEventsKey) || '[]');
    
    // 既存の共有されている予定履歴をリセット（全ユーザーで共有されていた履歴を削除）
    if (localStorage.getItem('eventLocationHistory')) {
        console.log('共有されている予定履歴をリセットします');
        localStorage.removeItem('eventLocationHistory');
    }
    
    // 全てのユーザーの予定履歴をリセット
    function resetAllEventHistory() {
        console.log('全てのユーザーの予定履歴をリセットします');
        // localStorageの全てのキーを取得
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('eventLocationHistory_')) {
                localStorage.removeItem(key);
                console.log(`削除: ${key}`);
            }
        });
    }
    
    // ページ読み込み時に一度だけ実行
    resetAllEventHistory();

    // 期日が過ぎた予定を自動的に終了した予定リストに移動
    function moveExpiredEvents() {
        const now = new Date();
        const expiredEvents = [];
        const activeEvents = [];

        savedEvents.forEach(event => {
            const eventDate = new Date(event.start);
            if (eventDate <= now) {
                // 期日が過ぎた予定を終了した予定リストに移動
                event.completedAt = now.toISOString();
                // 成功/失敗の判定（デフォルトは失敗として扱う）
                event.status = event.status === 'completed' ? 'completed' : 'failed';
                expiredEvents.push(event);
            } else {
                // まだ期日が来ていない予定は現在のリストに残す
                activeEvents.push(event);
            }
        });

        // データを更新
        savedEvents = activeEvents;
        completedEvents = [...completedEvents, ...expiredEvents];

        // localStorageに保存（ユーザーごと）
        localStorage.setItem(eventsKey, JSON.stringify(savedEvents));
        localStorage.setItem(completedEventsKey, JSON.stringify(completedEvents));
    }

    // 初期処理：期日が過ぎた予定を移動
    moveExpiredEvents();

    // 初期表示
    displayEvents();
    
    // 予定履歴を表示
    displayEventHistory();

    // 予約設定ボタンのクリックイベント
    reserveBtn.addEventListener('click', function() {
        eventForm.style.display = 'block';
        titleInput.value = '';
        deadlineInput.value = '';
        titleInput.focus();
    });

    // 保存ボタンのクリックイベント
    saveBtn.addEventListener('click', function() {
        const title = titleInput.value.trim();
        const deadline = deadlineInput.value;
        const saveToHistory = document.getElementById('saveToHistory').checked;

        if (!title || !deadline) {
            alert('タイトルと期日を入力してください。');
            return;
        }

        // 過去の日時チェック
        const now = new Date();
        const deadlineDate = new Date(deadline);
        
        if (deadlineDate <= now) {
            alert('未来の日時を設定してください。');
            return;
        }

        const newEvent = {
            id: Date.now(), // 一意のIDを生成
            title: title,
            start: deadline,
            end: deadline,
            allDay: false,
            createdAt: new Date().toISOString(),
            status: 'active', // 予定の状態: active, completed, failed
            lat: null, // 位置情報（後で設定）
            lng: null, // 位置情報（後で設定）
            money: null // 課金額（後で設定）
        };

        savedEvents.push(newEvent);
        localStorage.setItem(eventsKey, JSON.stringify(savedEvents));

        // 最新の予定情報を保存（map.htmlで使用）
        localStorage.setItem('eventTitle', title);
        localStorage.setItem('eventDeadline', deadline);
        localStorage.setItem('saveToHistory', saveToHistory ? 'true' : 'false');

        eventForm.style.display = 'none';
        displayEvents(); // 一覧を更新
        
        alert(`予定「${title}」を設定しました。\n次に目的地を設定してください。`);
        window.location.href = 'map.html';
    });

    // キャンセルボタンのクリックイベント
    cancelBtn.addEventListener('click', function() {
        eventForm.style.display = 'none';
    });

    // 現在の予定一覧の表示
    function displayEvents() {
        if (savedEvents.length === 0) {
            eventsContainer.innerHTML = '<div class="no-events">まだ予定がありません。<br>「予定設定」ボタンから予定を追加してください。</div>';
            return;
        }

        // 期日が近い順にソート
        const sortedEvents = savedEvents.sort((a, b) => {
            return new Date(a.start) - new Date(b.start);
        });

        let html = '';
        sortedEvents.forEach(event => {
            const eventDate = new Date(event.start);
            
            // 日付フォーマット
            const dateStr = eventDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            html += `
                <div class="event-item">
                    <div class="event-info">
                        <div class="event-title">${event.title}</div>
                        <div class="event-date">${dateStr}</div>
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-primary btn-small" onclick="selectEvent('${event.id}')">確認</button>
                        <button class="btn btn-danger btn-small" onclick="deleteEvent('${event.id}')">削除</button>
                    </div>
                </div>
            `;
        });

        eventsContainer.innerHTML = html;
    }


    // 予定確認（check.htmlに遷移）
    window.selectEvent = function(eventId) {
        // 最新の予定データを読み込み（ユーザーごと）
        const currentUserId = localStorage.getItem('currentUserId');
        const eventsKey = `events_${currentUserId}`;
        const currentEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
        const event = currentEvents.find(e => e.id == eventId);
        if (event) {
            // 予定情報をlocalStorageに保存
            localStorage.setItem('eventTitle', event.title);
            localStorage.setItem('eventDeadline', event.start);
            
            // 位置情報と課金額が設定されているか確認
            if (event.lat && event.lng && event.money !== null) {
                // 位置情報と課金額が設定されている場合は、check.htmlに直接遷移
                localStorage.setItem('Lat', event.lat);
                localStorage.setItem('Lng', event.lng);
                localStorage.setItem('money', event.money);
                localStorage.setItem('date', event.start);
                
                window.location.href = 'check.html';
            } else {
                // 位置情報が設定されていない場合は、map.htmlで設定を促す
                alert(`予定「${event.title}」の目的地が設定されていません。\n目的地を設定してください。`);
                window.location.href = 'map.html';
            }
        }
    };

    // 予定削除
    window.deleteEvent = function(eventId) {
        if (confirm('この予定を削除しますか？')) {
            savedEvents = savedEvents.filter(e => e.id != eventId);
            localStorage.setItem(eventsKey, JSON.stringify(savedEvents));
            displayEvents(); // 一覧を更新
        }
    };
    
    // 予定履歴の表示
    function displayEventHistory() {
        const historyContainer = document.getElementById('eventHistoryContainer');
        if (!historyContainer) return;
        
        // 現在のユーザーIDを取得
        const currentUserId = localStorage.getItem('currentUserId');
        if (!currentUserId) {
            historyContainer.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">ログインが必要です</div>';
            return;
        }
        
        // ユーザーごとの予定履歴を取得（位置情報を含む）
        // チェックボックスにチェックを入れた予定のみが履歴に保存される
        const historyKey = `eventLocationHistory_${currentUserId}`;
        let eventHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        if (eventHistory.length === 0) {
            historyContainer.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">履歴がありません</div>';
            return;
        }
        
        // 最後に使用された日時でソート（新しい順）
        eventHistory.sort((a, b) => {
            const dateA = new Date(a.lastUsed);
            const dateB = new Date(b.lastUsed);
            return dateB - dateA;
        });
        
        // 最新10件のみ表示
        const recentHistory = eventHistory.slice(0, 10);
        
        let html = '';
        recentHistory.forEach((item, index) => {
            const hasLocation = item.lat && item.lng;
            const locationInfo = hasLocation ? '📍 位置情報あり' : '📍 位置情報なし';
            const escapedTitle = item.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            html += `
                <div class="event-item" style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid ${hasLocation ? '#4CAF50' : '#ccc'}; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="flex: 1; cursor: pointer;" onclick="useHistory('${escapedTitle}', ${item.lat || 'null'}, ${item.lng || 'null'})">
                        <div class="event-title" style="font-weight: bold; color: #333;">${item.title}</div>
                        <div style="font-size: 12px; color: ${hasLocation ? '#4CAF50' : '#666'}; margin-top: 5px;">${locationInfo}</div>
                    </div>
                    <button onclick="deleteHistoryItem('${escapedTitle}'); event.stopPropagation();" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-left: 10px;">削除</button>
                </div>
            `;
        });
        
        historyContainer.innerHTML = html;
    }
    
    // 履歴から予定を再利用
    window.useHistory = function(title, lat, lng) {
        titleInput.value = title;
        // 履歴から再利用する場合は、デフォルトで履歴に保存するチェックを外す
        const saveToHistoryCheckbox = document.getElementById('saveToHistory');
        if (saveToHistoryCheckbox) {
            saveToHistoryCheckbox.checked = false;
        }
        eventForm.style.display = 'block';
        titleInput.focus();
        deadlineInput.focus();
        
        // 位置情報がある場合は保存しておく（map.htmlで使用）
        if (lat && lng) {
            localStorage.setItem('savedHistoryLat', lat);
            localStorage.setItem('savedHistoryLng', lng);
            localStorage.setItem('savedHistoryTitle', title);
        } else {
            localStorage.removeItem('savedHistoryLat');
            localStorage.removeItem('savedHistoryLng');
            localStorage.removeItem('savedHistoryTitle');
        }
    };
    
    // 予定履歴から項目を削除
    window.deleteHistoryItem = function(title) {
        if (!confirm(`「${title}」を履歴から削除しますか？`)) {
            return;
        }
        
        const currentUserId = localStorage.getItem('currentUserId');
        if (!currentUserId) {
            alert('ログインが必要です');
            return;
        }
        
        const historyKey = `eventLocationHistory_${currentUserId}`;
        let eventHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        // 該当する履歴を削除
        eventHistory = eventHistory.filter(item => item.title !== title);
        
        // localStorageに保存
        localStorage.setItem(historyKey, JSON.stringify(eventHistory));
        
        // 履歴を再表示
        displayEventHistory();
    };

});