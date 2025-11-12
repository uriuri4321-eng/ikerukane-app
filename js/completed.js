document.addEventListener('DOMContentLoaded', function() {
    const completedEventsContainer = document.getElementById('completedEventsContainer');
    const yearTabsContainer = document.getElementById('yearTabsContainer');
    const monthTabsContainer = document.getElementById('monthTabsContainer');

    // 現在のユーザーIDを取得
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        alert('ログインが必要です');
        window.location.href = 'index.html';
        return;
    }

    // ユーザーごとの予定データのキー
    const completedEventsKey = `completedEvents_${currentUserId}`;

    // 終了した予定データの読み込み（ユーザーごと）
    let completedEvents = JSON.parse(localStorage.getItem(completedEventsKey) || '[]');
    
    // 選択中の年月
    let selectedYear = null;
    let selectedMonth = null;

    // 初期表示
    updateStats();
    generateYearMonthTabs();
    
    // 年月ごとのタブを生成
    function generateYearMonthTabs() {
        if (completedEvents.length === 0) {
            completedEventsContainer.innerHTML = '<div class="no-events">終了した予定はありません。</div>';
            return;
        }

        // 年月ごとに予定を分類
        const eventsByYearMonth = {};
        completedEvents.forEach(event => {
            const completedDate = new Date(event.completedAt);
            const year = completedDate.getFullYear();
            const month = completedDate.getMonth() + 1;
            const key = `${year}-${month}`;
            
            if (!eventsByYearMonth[key]) {
                eventsByYearMonth[key] = [];
            }
            eventsByYearMonth[key].push(event);
        });

        // 年タブを生成
        const years = Object.keys(eventsByYearMonth)
            .map(key => parseInt(key.split('-')[0]))
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort((a, b) => b - a); // 新しい年から順に

        let yearTabsHtml = '';
        years.forEach(year => {
            const isActive = selectedYear === null && year === years[0] || selectedYear === year;
            yearTabsHtml += `<button class="year-tab ${isActive ? 'active' : ''}" onclick="selectYear(${year})">${year}年</button>`;
        });
        yearTabsContainer.innerHTML = yearTabsHtml;

        // 選択中の年（最初の年をデフォルト）
        if (selectedYear === null && years.length > 0) {
            selectedYear = years[0];
        }

        // 月タブを生成
        if (selectedYear !== null) {
            const monthsForYear = Object.keys(eventsByYearMonth)
                .filter(key => parseInt(key.split('-')[0]) === selectedYear)
                .map(key => parseInt(key.split('-')[1]))
                .sort((a, b) => b - a); // 新しい月から順に

            let monthTabsHtml = '';
            monthsForYear.forEach(month => {
                const isActive = selectedMonth === null && month === monthsForYear[0] || selectedMonth === month;
                monthTabsHtml += `<button class="month-tab ${isActive ? 'active' : ''}" onclick="selectMonth(${month})">${month}月</button>`;
                if (selectedMonth === null && month === monthsForYear[0]) {
                    selectedMonth = month;
                }
            });
            monthTabsContainer.innerHTML = monthTabsHtml;

            // 選択中の月（最初の月をデフォルト）
            if (selectedMonth === null && monthsForYear.length > 0) {
                selectedMonth = monthsForYear[0];
            }
        }

        // 選択中の年月の予定を表示
        if (selectedYear !== null && selectedMonth !== null) {
            displayEventsForYearMonth(selectedYear, selectedMonth, eventsByYearMonth);
        }
    }

    // 年を選択
    window.selectYear = function(year) {
        selectedYear = year;
        selectedMonth = null;
        // 月タブをクリア
        monthTabsContainer.innerHTML = '';
        completedEventsContainer.innerHTML = '';
        generateYearMonthTabs();
    };

    // 月を選択
    window.selectMonth = function(month) {
        selectedMonth = month;
        generateYearMonthTabs();
    };

    // 指定された年月の予定を表示
    function displayEventsForYearMonth(year, month, eventsByYearMonth) {
        const key = `${year}-${month}`;
        const events = eventsByYearMonth[key] || [];

        if (events.length === 0) {
            completedEventsContainer.innerHTML = `<div class="no-events">${year}年${month}月の終了した予定はありません。</div>`;
            return;
        }

        // 終了日時が新しい順にソート
        const sortedEvents = events.sort((a, b) => {
            return new Date(b.completedAt) - new Date(a.completedAt);
        });

        let html = '';
        sortedEvents.forEach(event => {
            const eventDate = new Date(event.start);
            const completedDate = new Date(event.completedAt);
            
            // 日付フォーマット
            const eventDateStr = eventDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const completedDateStr = completedDate.toLocaleDateString('ja-JP', {
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
                        <div class="event-date">期日: ${eventDateStr}</div>
                        <div class="completed-date">終了: ${completedDateStr}</div>
                    </div>
                </div>
            `;
        });

        completedEventsContainer.innerHTML = html;
    }

    // 統計情報の更新
    function updateStats() {
        // 成功した予定数
        const successfulEvents = completedEvents.filter(event => event.status === 'completed');
        
        // 失敗した予定数
        const failedEvents = completedEvents.filter(event => event.status === 'failed');
        
        // 累計失敗課金額（失敗した予定の課金額を合計）
        const totalFailedAmount = failedEvents.reduce((total, event) => {
            return total + (event.penaltyAmount || 0);
        }, 0);

        // 累計課金阻止額（成功した予定の阻止額を合計）
        const totalPreventedAmount = successfulEvents.reduce((total, event) => {
            return total + (event.preventedAmount || 0);
        }, 0);
        
        totalCompletedElm.textContent = completedEvents.length;
        
        // 成功した予定数と課金阻止額を一緒に表示
        const successfulCountElm = document.getElementById('successfulCount');
        const preventedAmountElm = document.getElementById('preventedAmount');
        if (successfulCountElm) {
            successfulCountElm.textContent = successfulEvents.length;
        }
        if (preventedAmountElm) {
            preventedAmountElm.textContent = `¥${totalPreventedAmount.toLocaleString()}`;
        }
        
        // 失敗した予定数と累計失敗課金額を一緒に表示
        const failedCountElm = document.getElementById('failedCount');
        const failedAmountElm = document.getElementById('failedAmount');
        if (failedCountElm) {
            failedCountElm.textContent = failedEvents.length;
        }
        if (failedAmountElm) {
            failedAmountElm.textContent = `¥${totalFailedAmount.toLocaleString()}`;
        }
    }
    
    // 終了した予定リストをリセット
    window.resetCompletedEvents = function() {
        if (confirm('終了した予定リストを全て削除しますか？\nこの操作は取り消せません。')) {
            // ユーザーごとの予定データをリセット
            localStorage.removeItem(completedEventsKey);
            completedEvents = [];
            // ページをリロードして反映
            location.reload();
        }
    };

});
