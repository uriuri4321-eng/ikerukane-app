document.addEventListener('DOMContentLoaded', function() {
    const eventForm = document.getElementById('eventForm');
    const titleInput = document.getElementById('eventTitleInput');
    const deadlineInput = document.getElementById('eventDeadlineInput');
    const saveBtn = document.getElementById('saveEventBtn');
    const cancelBtn = document.getElementById('cancelEventBtn');
    const reserveBtn = document.getElementById('reserveBtn');
    const eventsContainer = document.getElementById('eventsContainer');

    // 予定データの読み込み
    let savedEvents = JSON.parse(localStorage.getItem('events') || '[]');
    let completedEvents = JSON.parse(localStorage.getItem('completedEvents') || '[]');

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

        // localStorageに保存
        localStorage.setItem('events', JSON.stringify(savedEvents));
        localStorage.setItem('completedEvents', JSON.stringify(completedEvents));
    }

    // 初期処理：期日が過ぎた予定を移動
    moveExpiredEvents();

    // 初期表示
    displayEvents();

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
            status: 'active' // 予定の状態: active, completed, failed
        };

        savedEvents.push(newEvent);
        localStorage.setItem('events', JSON.stringify(savedEvents));

        // 最新の予定情報を保存（map.htmlで使用）
        localStorage.setItem('eventTitle', title);
        localStorage.setItem('eventDeadline', deadline);

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
                        <button class="btn btn-primary btn-small" onclick="selectEvent('${event.id}')">選択</button>
                        <button class="btn btn-danger btn-small" onclick="deleteEvent('${event.id}')">削除</button>
                    </div>
                </div>
            `;
        });

        eventsContainer.innerHTML = html;
    }


    // 予定選択（map.htmlに遷移）
    window.selectEvent = function(eventId) {
        const event = savedEvents.find(e => e.id == eventId);
        if (event) {
            localStorage.setItem('eventTitle', event.title);
            localStorage.setItem('eventDeadline', event.start);
            alert(`予定「${event.title}」を選択しました。\n次に目的地を設定してください。`);
            window.location.href = 'map.html';
        }
    };

    // 予定削除
    window.deleteEvent = function(eventId) {
        if (confirm('この予定を削除しますか？')) {
            savedEvents = savedEvents.filter(e => e.id != eventId);
            localStorage.setItem('events', JSON.stringify(savedEvents));
            displayEvents(); // 一覧を更新
        }
    };

});