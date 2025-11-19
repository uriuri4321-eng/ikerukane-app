var marker = null;
var circle = null;
var lat = 43.077894501493994; // デフォルト（取得失敗時）
var lng = 141.53722572035184;

function init() {
    // まず地図を仮の中心で作成
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 17,
        center: {lat: lat, lng: lng}
    });
    
    // グローバルスコープに公開
    window.map = map;

    marker = new google.maps.Marker({
        map: map,
        position: {lat: lat, lng: lng},
        draggable: true,
        title: '目的地をクリックして設定'
    });
    
    // グローバルスコープに公開
    window.marker = marker;

    circle = new google.maps.Circle({
        map: map,
        center: {lat: lat, lng: lng},
        radius: 100,
        fillColor: "#FF0000",
        fillOpacity: 0.2,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2
    });
    
    // グローバルスコープに公開
    window.circle = circle;

    map.addListener('click', function(e) {
        clickMap(e.latLng, map);
    });

    // 履歴から位置情報を読み込む（予定タイトルが一致する場合）
    const hasHistory = loadHistoryLocation(map);

    // 履歴がない場合のみ現在地を取得
    if (!hasHistory) {
        getCurrentLocation(map);
    }
}

// 現在地取得関数（改善版）
function getCurrentLocation(map) {
    if (!navigator.geolocation) {
        console.warn("このブラウザはGeolocation APIに対応していません。");
        showLocationError("このブラウザは位置情報に対応していません。");
        return;
    }

    // 位置情報取得のオプション
    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // 1分間キャッシュを使用
    };

    console.log("位置情報取得を開始します...");

    navigator.geolocation.getCurrentPosition(
        function(position) {
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            console.log("現在位置を取得しました:", {
                lat: lat,
                lng: lng,
                accuracy: accuracy + "m"
            });

            const userLatLng = {lat: lat, lng: lng};
            map.setCenter(userLatLng);

            // マーカー更新
            marker.setMap(null);
            marker = new google.maps.Marker({
                map: map,
                position: userLatLng,
                draggable: true,
                title: '目的地をクリックして設定'
            });

            circle.setMap(null);
            circle = new google.maps.Circle({
                map: map,
                center: userLatLng,
                radius: 100,
                fillColor: "#FF0000",
                fillOpacity: 0.2,
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 2
            });

            // 成功メッセージを表示
            showLocationSuccess(accuracy);
        },
        function(error) {
            console.error("位置情報の取得に失敗しました:", error);
            handleLocationError(error);
        },
        options
    );
}

// 位置情報エラーハンドリング
function handleLocationError(error) {
    let errorMessage = "";
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = "位置情報の使用が許可されていません。\nブラウザの設定で位置情報を許可してください。";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "現在位置を取得できません。\nネットワーク接続を確認してください。";
            break;
        case error.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました。\nもう一度お試しください。";
            break;
        default:
            errorMessage = "位置情報を取得できませんでした。\n地図上をクリックして目的地を設定してください。";
            break;
    }
    showLocationError(errorMessage);
}

// 位置情報取得成功メッセージ
function showLocationSuccess(accuracy) {
    const message = `現在位置を取得しました（精度: ${Math.round(accuracy)}m）\n地図上をクリックして目的地を設定してください。`;
    console.log(message);
    // 成功時はアラートを出さず、コンソールに記録するだけ
}

// 位置情報エラーメッセージ
function showLocationError(message) {
    console.error(message);
    // エラー時のみアラートを表示
    setTimeout(() => {
        alert(message);
    }, 1000); // 少し遅らせて表示
}

// マップクリックでピン移動
function clickMap(geo, map) {
    lat = geo.lat();
    lng = geo.lng();

    marker.setMap(null);
    marker = new google.maps.Marker({ map: map, position: geo, draggable: true });

    circle.setMap(null);
    circle = new google.maps.Circle({ map: map, center: geo, radius: 100 });
}

// 予定情報表示関数
function displayEventInfo() {
    const eventTitle = localStorage.getItem('eventTitle');
    const eventDeadline = localStorage.getItem('eventDeadline');
    
    const titleElement = document.getElementById('eventTitle');
    const dateElement = document.getElementById('eventDate');
    
    if (!eventTitle || !eventDeadline) {
        titleElement.textContent = '予定情報が見つかりません';
        dateElement.textContent = 'カレンダーページで予定を設定してください';
        return;
    }
    
    // 予定タイトルを表示
    titleElement.textContent = eventTitle;
    
    // 期日をフォーマットして表示
    const deadlineDate = new Date(eventDeadline);
    const formattedDate = deadlineDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    dateElement.textContent = formattedDate;
    
    console.log('予定情報を表示しました:', {
        title: eventTitle,
        deadline: formattedDate
    });
}

// ヘルプツールチップの制御
function setupHelpTooltip() {
    const helpTab = document.getElementById('helpTab');
    const helpTooltip = document.getElementById('helpTooltip');
    
    if (!helpTab || !helpTooltip) return;
    
    helpTab.addEventListener('mouseenter', function() {
        helpTooltip.classList.add('show');
    });
    
    helpTab.addEventListener('mouseleave', function() {
        helpTooltip.classList.remove('show');
    });
    
    // クリックでも表示/非表示を切り替え
    helpTab.addEventListener('click', function() {
        helpTooltip.classList.toggle('show');
    });
}

window.addEventListener("load", () => {
    // ヘルプツールチップのセットアップ
    setupHelpTooltip();
    
    // calendar.htmlから予定情報を取得
    const eventTitle = localStorage.getItem('eventTitle');
    const eventDeadline = localStorage.getItem('eventDeadline');
    
    // 予定情報がない場合は警告
    if (!eventTitle || !eventDeadline) {
        alert('予定情報が見つかりません。カレンダーページで予定を設定してください。');
        window.location.href = 'calendar.html';
        return;
    }
    
    // 予定の期日は「選択中の予定」欄で表示済み（設定時間フィールドは削除）

    const sendbutton = document.querySelector(".send-button");
    if (!sendbutton) {
        console.error("決定ボタンが見つかりません");
        return;
    }
    sendbutton.onclick = function() {
        const setmoney = Number(document.querySelector(".setmoney").value);
        const now = new Date();
        const setdateObj = new Date(eventDeadline);

        if(setmoney < 100) {
            alert("最低金額を下回っています。100円以上で設定し直してください。");
            return;
        }

        if(now >= setdateObj) {
            alert("過去の日付/時間が設定されています。カレンダーページで設定し直してください。");
            return;
        }

        // 保存（予定情報も含める）
        localStorage.setItem("Lat", lat);
        localStorage.setItem("Lng", lng);
        localStorage.setItem("money", setmoney);
        localStorage.setItem("date", eventDeadline); // 予定の期日を使用
        localStorage.setItem("eventTitle", eventTitle); // 予定タイトルも保存
        
        // 対応する予定データに位置情報と課金額を保存（ユーザーごと）
        const currentUserId = localStorage.getItem('currentUserId');
        if (currentUserId) {
            const eventsKey = `events_${currentUserId}`;
            let savedEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
            const eventIndex = savedEvents.findIndex(e => 
                e.title === eventTitle && e.start === eventDeadline
            );
            if (eventIndex !== -1) {
                savedEvents[eventIndex].lat = lat;
                savedEvents[eventIndex].lng = lng;
                savedEvents[eventIndex].money = setmoney;
                localStorage.setItem(eventsKey, JSON.stringify(savedEvents));
                
                // Firestoreにも更新を反映
                if (db) {
                    db.collection('events')
                        .where('userId', '==', currentUserId)
                        .where('title', '==', eventTitle)
                        .where('start', '==', eventDeadline)
                        .where('status', '==', 'active')
                        .get()
                        .then((querySnapshot) => {
                            if (!querySnapshot.empty) {
                                const doc = querySnapshot.docs[0];
                                doc.ref.update({
                                    lat: lat,
                                    lng: lng,
                                    money: setmoney
                                }).then(() => {
                                    console.log('Firestoreの予定を更新しました:', doc.id);
                                }).catch((error) => {
                                    console.error('Firestoreの予定更新エラー:', error);
                                });
                            }
                        })
                        .catch((error) => {
                            console.error('Firestoreからの予定検索エラー:', error);
                        });
                }
            }
        }
        
        // 履歴に保存するチェックが入っている場合のみ、予定履歴に位置情報も保存
        const saveToHistory = localStorage.getItem('saveToHistory') === 'true';
        if (saveToHistory) {
            saveEventLocationHistory(eventTitle, lat, lng);
        }
        
        // チェック状態をクリア
        localStorage.removeItem('saveToHistory');

        console.log("保存されたデータ:", {
            lat: lat,
            lng: lng,
            money: setmoney,
            date: eventDeadline,
            eventTitle: eventTitle
        });

        // check.html へ遷移
        window.location.href = "check.html";
    }
});

// 予定履歴から位置情報を読み込む関数
function loadHistoryLocation(map) {
    const savedTitle = localStorage.getItem('savedHistoryTitle');
    const savedLat = localStorage.getItem('savedHistoryLat');
    const savedLng = localStorage.getItem('savedHistoryLng');
    const currentTitle = localStorage.getItem('eventTitle');
    
    // 保存されたタイトルと現在のタイトルが一致し、位置情報がある場合
    if (savedTitle && savedTitle === currentTitle && savedLat && savedLng) {
        const historyLat = parseFloat(savedLat);
        const historyLng = parseFloat(savedLng);
        
        if (!isNaN(historyLat) && !isNaN(historyLng)) {
            // 位置情報を設定
            lat = historyLat;
            lng = historyLng;
            
            // マーカーとサークルを更新
            if (marker) {
                marker.setPosition({lat: lat, lng: lng});
            }
            if (circle) {
                circle.setCenter({lat: lat, lng: lng});
            }
            
            // 地図の中心を移動
            map.setCenter({lat: lat, lng: lng});
            map.setZoom(17);
            
            // グローバル変数を更新
            window.lat = lat;
            window.lng = lng;
            
            console.log('履歴から位置情報を読み込みました:', { lat, lng });
            
            // 使用後はクリア
            localStorage.removeItem('savedHistoryLat');
            localStorage.removeItem('savedHistoryLng');
            localStorage.removeItem('savedHistoryTitle');
            
            return true; // 履歴があったことを返す
        }
    }
    
    return false; // 履歴がなかったことを返す
}

// 予定履歴に位置情報を保存する関数
function saveEventLocationHistory(eventTitle, lat, lng) {
    if (!eventTitle || !lat || !lng) return;
    
    // 現在のユーザーIDを取得
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        console.warn('ユーザーIDが取得できません。予定履歴を保存できません。');
        return;
    }
    
    // ユーザーごとの予定履歴を取得
    const historyKey = `eventLocationHistory_${currentUserId}`;
    let eventHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // 既存の履歴を検索
    const existingIndex = eventHistory.findIndex(item => item.title === eventTitle);
    
    if (existingIndex !== -1) {
        // 既存の履歴を更新
        eventHistory[existingIndex].lat = lat;
        eventHistory[existingIndex].lng = lng;
        eventHistory[existingIndex].lastUsed = new Date().toISOString();
    } else {
        // 新しい履歴を追加
        eventHistory.push({
            title: eventTitle,
            lat: lat,
            lng: lng,
            lastUsed: new Date().toISOString()
        });
    }
    
    // 最新10件のみ保持（新しい順）
    eventHistory.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
    eventHistory = eventHistory.slice(0, 10);
    
    // ユーザーごとのlocalStorageに保存
    localStorage.setItem(historyKey, JSON.stringify(eventHistory));
}

