document.addEventListener('DOMContentLoaded', function() {
    const eventForm = document.getElementById('eventForm');
    const titleInput = document.getElementById('eventTitleInput');
    const deadlineInput = document.getElementById('eventDeadlineInput');
    const saveBtn = document.getElementById('saveEventBtn');
    const cancelBtn = document.getElementById('cancelEventBtn');
    const reserveBtn = document.getElementById('reserveBtn');
    const eventsContainer = document.getElementById('eventsContainer');

    if (eventsContainer) {
        eventsContainer.innerHTML = '<div class="no-events">予定を読み込み中です...</div>';
    }

    // 現在のユーザーIDを取得
    const currentUserId = localStorage.getItem('currentUserId');
    console.log('calendar.js - 現在のユーザーID:', currentUserId);
    
    if (!currentUserId) {
        alert('ログインが必要です');
        window.location.href = 'index.html';
        return;
    }

    // ユーザーごとの予定データのキー
    const eventsKey = `events_${currentUserId}`;
    const completedEventsKey = `completedEvents_${currentUserId}`;
    
    console.log('calendar.js - 使用するキー:', {
        eventsKey: eventsKey,
        completedEventsKey: completedEventsKey
    });

    // 予定データの読み込み（ユーザーごと）
    let savedEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
    let completedEvents = JSON.parse(localStorage.getItem(completedEventsKey) || '[]');
    
    console.log('calendar.js - 読み込んだ予定データ:', {
        savedEventsCount: savedEvents.length,
        completedEventsCount: completedEvents.length,
        savedEvents: savedEvents,
        completedEvents: completedEvents
    });
    
    // 全てのlocalStorageキーを確認（デバッグ用）
    const allKeys = Object.keys(localStorage);
    const eventKeys = allKeys.filter(key => key.startsWith('events_') || key.startsWith('completedEvents_'));
    console.log('calendar.js - localStorage内の予定関連キー:', eventKeys);
    
    // 旧仕様で共有履歴を使っていたキーが残っていれば一度だけリセット
    if (localStorage.getItem('eventLocationHistory')) {
        console.log('旧形式の予定履歴データを削除します（ユーザー単位の履歴に移行済み）');
        localStorage.removeItem('eventLocationHistory');
    }
    
    const dataReadyPromise = initializeCalendarData();

    async function initializeCalendarData() {
        console.log('initializeCalendarData開始');
        await syncEventsFromFirestore();
        console.log('syncEventsFromFirestore完了');
        moveExpiredEvents();
        displayEvents();
        displayEventHistory();
    }

    async function syncEventsFromFirestore() {
        console.log('syncEventsFromFirestore開始', { db: !!db, currentUserId });
        if (!db || !currentUserId) {
            console.warn('Firestoreが利用できないため、ローカルデータを使用します。');
            savedEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
            completedEvents = JSON.parse(localStorage.getItem(completedEventsKey) || '[]');
            console.log('localStorageから読み込んだ予定:', {
                savedEvents: savedEvents.length,
                completedEvents: completedEvents.length,
                sampleEvent: savedEvents.length > 0 ? savedEvents[0] : null
            });
            return;
        }

        const localActiveCache = JSON.parse(localStorage.getItem(eventsKey) || '[]');
        const localCompletedCache = JSON.parse(localStorage.getItem(completedEventsKey) || '[]');
        console.log('localStorageキャッシュ:', {
            active: localActiveCache.length,
            completed: localCompletedCache.length
        });

        try {
            const activeSnapshot = await db.collection('events')
                .where('userId', '==', currentUserId)
                .where('status', '==', 'active')
                .get();

            const completedSnapshot = await db.collection('events')
                .where('userId', '==', currentUserId)
                .where('status', '==', 'completed')
                .get();

            const failedSnapshot = await db.collection('events')
                .where('userId', '==', currentUserId)
                .where('status', '==', 'failed')
                .get();

            savedEvents = activeSnapshot.docs.map(normalizeEventDoc);
            completedEvents = [
                ...completedSnapshot.docs.map(normalizeEventDoc),
                ...failedSnapshot.docs.map(normalizeEventDoc)
            ].sort((a, b) => {
                const dateA = new Date(a.completedAt || a.end || a.start);
                const dateB = new Date(b.completedAt || b.end || b.start);
                return dateB - dateA;
            });
            
            // デバッグ: 取得した予定データを確認
            console.log('Firestoreから取得した予定データ:', {
                activeCount: savedEvents.length,
                completedCount: completedEvents.length,
                sampleEvent: savedEvents.length > 0 ? savedEvents[0] : null
            });
            
            if (savedEvents.length > 0) {
                savedEvents.forEach((event, index) => {
                    console.log(`予定 ${index + 1}:`, {
                        title: event.title,
                        lat: event.lat,
                        lng: event.lng,
                        money: event.money,
                        firestoreId: event.firestoreId
                    });
                });
            }

            savedEvents = await migrateMissingEventsToFirestore(localActiveCache, savedEvents, 'active');
            completedEvents = await migrateMissingEventsToFirestore(localCompletedCache, completedEvents, 'completed');

            localStorage.setItem(eventsKey, JSON.stringify(savedEvents));
            localStorage.setItem(completedEventsKey, JSON.stringify(completedEvents));
        } catch (error) {
            console.error('Firestoreからの予定取得に失敗しました:', error);
            savedEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
            completedEvents = JSON.parse(localStorage.getItem(completedEventsKey) || '[]');
        }
    }

    function normalizeEventDoc(doc) {
        const data = doc.data();
        const normalized = {
            ...data,
            id: data.id || doc.id,
            firestoreId: doc.id
        };

        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            normalized.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            normalized.updatedAt = data.updatedAt.toDate().toISOString();
        }
        if (data.completedAt && typeof data.completedAt.toDate === 'function') {
            normalized.completedAt = data.completedAt.toDate().toISOString();
        }

        return normalized;
    }

    function getEventDocId(event) {
        if (!event) return null;
        if (event.firestoreId) return event.firestoreId;
        if (typeof event.id === 'string' && event.id.trim() !== '') return event.id;
        return null;
    }

    function getServerTimestamp() {
        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
            return firebase.firestore.FieldValue.serverTimestamp();
        }
        return null;
    }

    function updateEventDocument(event, data, options = {}) {
        if (!db || !currentUserId || !event) return;

        const docId = getEventDocId(event);
        const updatePayload = { ...data };
        const serverTimestamp = getServerTimestamp();
        if (serverTimestamp) {
            updatePayload.updatedAt = serverTimestamp;
            if (options.includeCompletedAt && !updatePayload.completedAt) {
                updatePayload.completedAt = serverTimestamp;
            }
        }

        if (docId) {
            db.collection('events').doc(docId).update(updatePayload)
                .catch((error) => {
                    console.error('Firestoreの予定更新エラー:', error);
                });
            return;
        }

        // フォールバック：タイトルと開始日時で検索
        db.collection('events')
            .where('userId', '==', currentUserId)
            .where('title', '==', event.title)
            .where('start', '==', event.start)
            .where('status', '==', 'active')
            .limit(1)
            .get()
            .then((snapshot) => {
                if (!snapshot.empty) {
                    snapshot.docs[0].ref.update(updatePayload)
                        .catch((error) => {
                            console.error('Firestoreの予定更新エラー:', error);
                        });
                }
            })
            .catch((error) => {
                console.error('Firestoreからの予定検索エラー:', error);
            });
    }

    function deleteEventDocument(event) {
        if (!db || !currentUserId || !event) return;

        const docId = getEventDocId(event);
        if (docId) {
            db.collection('events').doc(docId).delete()
                .catch((error) => {
                    console.error('Firestoreからの予定削除エラー:', error);
                });
            return;
        }

        // フォールバック：タイトルと開始日時で検索
        db.collection('events')
            .where('userId', '==', currentUserId)
            .where('title', '==', event.title)
            .where('start', '==', event.start)
            .where('status', '==', 'active')
            .limit(1)
            .get()
            .then((snapshot) => {
                snapshot.forEach((doc) => {
                    doc.ref.delete().catch((error) => {
                        console.error('Firestoreからの予定削除エラー:', error);
                    });
                });
            })
            .catch((error) => {
                console.error('Firestoreからの予定検索エラー:', error);
            });
    }

    async function migrateMissingEventsToFirestore(localCache, firestoreEvents, defaultStatus) {
        if (!Array.isArray(localCache) || localCache.length === 0) {
            return firestoreEvents;
        }

        if (!Array.isArray(firestoreEvents)) {
            firestoreEvents = [];
        }

        let updatedEvents = [...firestoreEvents];
        let hasChanges = false;

        for (const localEvent of localCache) {
            if (!localEvent) continue;

            const baseStatus = localEvent.status || defaultStatus || 'active';
            const alreadyExists = updatedEvents.find(event =>
                event.title === localEvent.title &&
                event.start === localEvent.start &&
                (event.status || baseStatus) === baseStatus
            );

            if (alreadyExists) {
                continue;
            }

            if (localEvent.firestoreId) {
                updatedEvents.push(localEvent);
                hasChanges = true;
                continue;
            }

            if (!db || !currentUserId) {
                updatedEvents.push(localEvent);
                hasChanges = true;
                continue;
            }

            try {
                const docRef = db.collection('events').doc();
                const payload = {
                    ...localEvent,
                    id: docRef.id,
                    firestoreId: docRef.id,
                    userId: currentUserId,
                    status: baseStatus
                };

                if (!localEvent.createdAt && firebase && firebase.firestore && firebase.firestore.FieldValue) {
                    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                }
                if (firebase && firebase.firestore && firebase.firestore.FieldValue) {
                    payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                    if (baseStatus !== 'active' && !localEvent.completedAt) {
                        payload.completedAt = firebase.firestore.FieldValue.serverTimestamp();
                    }
                }

                await docRef.set(payload);
                updatedEvents.push({
                    ...localEvent,
                    id: docRef.id,
                    firestoreId: docRef.id,
                    status: baseStatus,
                    userId: currentUserId
                });
                hasChanges = true;
            } catch (error) {
                console.error('Firestoreへの予定移行エラー:', error);
            }
        }

        return hasChanges ? updatedEvents : firestoreEvents;
    }

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
                
                // Firestoreにも更新を反映
                updateEventDocument(event, { status: event.status }, { includeCompletedAt: true });
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
    saveBtn.addEventListener('click', async function() {
        await dataReadyPromise;

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
            id: Date.now().toString(),
            firestoreId: null,
            userId: currentUserId,
            title: title,
            start: deadline,
            end: deadline,
            allDay: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            lat: null,
            lng: null,
            money: null
        };

        if (db && currentUserId) {
            try {
                const docRef = db.collection('events').doc();
                const firestorePayload = {
                    ...newEvent,
                    id: docRef.id,
                    firestoreId: docRef.id,
                    userId: currentUserId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await docRef.set(firestorePayload);
                newEvent.id = docRef.id;
                newEvent.firestoreId = docRef.id;
            } catch (error) {
                console.error('Firestoreへの予定保存エラー:', error);
            }
        }

        savedEvents.push(newEvent);
        localStorage.setItem(eventsKey, JSON.stringify(savedEvents));

        // 最新の予定情報を保存（map.htmlで使用）
        localStorage.setItem('eventTitle', title);
        localStorage.setItem('eventDeadline', deadline);
        localStorage.setItem('saveToHistory', saveToHistory ? 'true' : 'false');
        localStorage.setItem('selectedEventId', newEvent.firestoreId || newEvent.id);

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
    window.selectEvent = async function(eventId) {
        await dataReadyPromise;

        let event = savedEvents.find(e => e.id == eventId || e.firestoreId === eventId);
        console.log('savedEventsから検索:', {
            eventId: eventId,
            found: !!event,
            savedEventsCount: savedEvents.length,
            savedEvents: savedEvents.map(e => ({ id: e.id, firestoreId: e.firestoreId, title: e.title }))
        });
        
        if (!event) {
            const fallbackEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
            console.log('fallbackEventsから検索:', {
                fallbackEventsCount: fallbackEvents.length,
                fallbackEvents: fallbackEvents.map(e => ({ id: e.id, firestoreId: e.firestoreId, title: e.title }))
            });
            event = fallbackEvents.find(e => e.id == eventId || e.firestoreId === eventId);
            if (event) {
                console.log('fallbackEventsから見つかりました:', event);
            }
        }

        // Firestoreから直接取得を試行（最新データを取得）
        if (db && currentUserId && event) {
            const docId = getEventDocId(event);
            console.log('selectEvent - イベント情報:', {
                eventId: eventId,
                foundEvent: event,
                docId: docId,
                currentLat: event.lat,
                currentLng: event.lng,
                currentMoney: event.money
            });
            
            if (docId) {
                try {
                    const doc = await db.collection('events').doc(docId).get();
                    if (doc.exists) {
                        const firestoreData = doc.data();
                        console.log('Firestoreから取得したデータ:', firestoreData);
                        
                        // Firestoreのデータで位置情報と課金額を更新
                        if (firestoreData.lat !== undefined && firestoreData.lat !== null) {
                            event.lat = firestoreData.lat;
                            console.log('latを更新:', firestoreData.lat);
                        }
                        if (firestoreData.lng !== undefined && firestoreData.lng !== null) {
                            event.lng = firestoreData.lng;
                            console.log('lngを更新:', firestoreData.lng);
                        }
                        if (firestoreData.money !== undefined && firestoreData.money !== null) {
                            event.money = firestoreData.money;
                            console.log('moneyを更新:', firestoreData.money);
                        }
                        
                        console.log('更新後のイベント情報:', {
                            lat: event.lat,
                            lng: event.lng,
                            money: event.money
                        });
                    } else {
                        console.warn('Firestoreにドキュメントが存在しません:', docId);
                    }
                } catch (error) {
                    console.error('Firestoreからの予定取得エラー:', error);
                }
            } else {
                console.warn('docIdが取得できませんでした');
            }
        }

        if (event) {
            console.log('選択された予定の全データ:', event);
            
            // 予定情報をlocalStorageに保存
            localStorage.setItem('eventTitle', event.title);
            localStorage.setItem('eventDeadline', event.start);
            localStorage.setItem('selectedEventId', getEventDocId(event) || '');
            
            // 位置情報と課金額が設定されているか確認
            // lat, lngが存在し、moneyがnullでもundefinedでもない（0は有効）
            const hasLocation = event.lat != null && event.lng != null;
            const hasMoney = event.money != null && event.money !== undefined;
            
            console.log('位置情報と課金額の確認:', {
                hasLocation: hasLocation,
                lat: event.lat,
                lng: event.lng,
                hasMoney: hasMoney,
                money: event.money
            });
            
            if (hasLocation && hasMoney) {
                // 位置情報と課金額が設定されている場合は、check.htmlに直接遷移
                localStorage.setItem('Lat', event.lat);
                localStorage.setItem('Lng', event.lng);
                localStorage.setItem('money', event.money);
                localStorage.setItem('date', event.start);
                
                console.log('予定情報をcheck.htmlに渡します:', {
                    title: event.title,
                    lat: event.lat,
                    lng: event.lng,
                    money: event.money,
                    date: event.start
                });
                
                window.location.href = 'check.html';
            } else {
                // 位置情報が設定されていない場合は、map.htmlで設定を促す
                console.log('目的地が設定されていません:', {
                    lat: event.lat,
                    lng: event.lng,
                    money: event.money,
                    hasLocation: hasLocation,
                    hasMoney: hasMoney
                });
                alert(`予定「${event.title}」の目的地が設定されていません。\n目的地を設定してください。`);
                window.location.href = 'map.html';
            }
        } else {
            console.error('予定が見つかりませんでした。eventId:', eventId);
            alert('予定が見つかりませんでした。');
        }
    };

    // 予定削除
    window.deleteEvent = async function(eventId) {
        await dataReadyPromise;

        if (confirm('この予定を削除しますか？')) {
            const eventToDelete = savedEvents.find(e => e.id == eventId);
            savedEvents = savedEvents.filter(e => e.id != eventId);
            localStorage.setItem(eventsKey, JSON.stringify(savedEvents));
            
            // Firestoreからも削除
            if (eventToDelete) {
                deleteEventDocument(eventToDelete);
                const selectedId = localStorage.getItem('selectedEventId');
                if (selectedId && selectedId === (getEventDocId(eventToDelete) || '')) {
                    localStorage.removeItem('selectedEventId');
                }
            }
            
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