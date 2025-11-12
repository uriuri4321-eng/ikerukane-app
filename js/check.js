// check.js
let targetLat = Number(localStorage.getItem("Lat"));
let targetLng = Number(localStorage.getItem("Lng"));
let money = Number(localStorage.getItem("money"));
let targetDateStr = localStorage.getItem("date");
let eventTitle = localStorage.getItem("eventTitle");

// デバッグ情報をコンソールに出力
console.log("check.js 読み込み時のデータ:", {
    targetLat: targetLat,
    targetLng: targetLng,
    money: money,
    targetDateStr: targetDateStr,
    eventTitle: eventTitle
});

const TimeElm = document.querySelector(".Time");
const MoneyElm = document.querySelector(".Money");
const LocationElm = document.querySelector(".CurrentLocation");
MoneyElm.textContent = money + "円";

let targetDate = null;
let TimeInterval = null;

// 日付情報の検証と設定
if(!targetDateStr) {
    console.error("日付情報が見つかりません");
    alert("日付情報が見つかりません。マップで予定を設定してください。");
    // カレンダーページに戻る
    setTimeout(() => {
        window.location.href = 'calendar.html';
    }, 2000);
} else {
    // 日付文字列の正規化
    let normalizedDateStr = targetDateStr;
    
    // datetime-local形式の場合、秒を補完
    if (normalizedDateStr.length === 16) {
        normalizedDateStr += ":00";
    }
    
    targetDate = new Date(normalizedDateStr);
    
    if(isNaN(targetDate.getTime())) {
        console.error("不正な日付形式:", targetDateStr);
        alert("保存された日付が不正です: " + targetDateStr);
        targetDate = null;
    } else {
        console.log("設定された期日:", targetDate.toLocaleString('ja-JP'));
    }
}

let map, targetMarker, targetCircle, currentMarker;
window.currentLocationCircle = null; // 現在位置の円をグローバルに保持
const R = Math.PI / 180;

function init() {
    console.log("check.js: 初期化開始");
    
    // まず地図を初期化（位置情報取得前に）
    initializeMap();
    
    // 位置情報取得を試行
    getCurrentPositionForCheck();
}

// 地図の初期化（位置情報なしでも表示）
function initializeMap() {
    try {
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 17,
            center: {lat: targetLat, lng: targetLng},
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        // 目的地マーカー（赤）
        targetMarker = new google.maps.Marker({
            map: map,
            position: {lat: targetLat, lng: targetLng},
            title: '目的地',
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                scaledSize: new google.maps.Size(32, 32)
            }
        });

        // 目的地の範囲（100m）
        targetCircle = new google.maps.Circle({
            map: map,
            center: {lat: targetLat, lng: targetLng},
            radius: 100,
            fillColor: "#FF0000",
            fillOpacity: 0.2,
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2
        });

        console.log("check.js: 地図の初期化が完了しました");
        
    } catch (error) {
        console.error("check.js: 地図の初期化に失敗しました:", error);
        alert("地図の表示に失敗しました。ページを再読み込みしてください。");
    }
}

// 現在位置取得（改善版）
function getCurrentPositionForCheck() {
    if (!navigator.geolocation) {
        console.warn("check.js: このブラウザはGeolocation APIに対応していません");
        showLocationError("このブラウザは位置情報に対応していません。");
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 20000, // 20秒に延長
        maximumAge: 30000 // 30秒間キャッシュを使用
    };

    console.log("check.js: 位置情報取得を開始します...");

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            console.log("check.js: 現在位置を取得しました", {
                lat: currentLat,
                lng: currentLng,
                accuracy: accuracy + "m"
            });

            // 現在位置を表示
            updateCurrentLocation(currentLat, currentLng);

            // 現在位置マーカーを追加（人のアイコン）
            if (map) {
                // 人のアイコンをSVGで作成（シンプルな形）
                const personIconSVG = {
                    // 人のシルエット（頭と体）
                    path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
                    fillColor: '#4285F4', // Google Blue
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2,
                    scale: 1.2,
                    anchor: new google.maps.Point(12, 24),
                    rotation: 0
                };
                
                currentMarker = new google.maps.Marker({
                    map: map,
                    position: {lat: currentLat, lng: currentLng},
                    title: '現在位置',
                    icon: personIconSVG,
                    zIndex: 1000, // 他のマーカーより上に表示
                    animation: google.maps.Animation.DROP // アニメーション効果
                });
                
                // 現在位置の周りに円を表示（より目立つように）
                if (!window.currentLocationCircle) {
                    window.currentLocationCircle = new google.maps.Circle({
                        map: map,
                        center: {lat: currentLat, lng: currentLng},
                        radius: 50, // 50メートル
                        fillColor: '#4285F4',
                        fillOpacity: 0.2,
                        strokeColor: '#4285F4',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        zIndex: 999
                    });
                }

                // 地図の中心を現在位置と目的地の中間にする
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(new google.maps.LatLng(currentLat, currentLng));
                bounds.extend(new google.maps.LatLng(targetLat, targetLng));
                map.fitBounds(bounds);
            }

            // カウントダウン開始
            startCountdown();
            
            // 距離チェック開始
            startDistanceCheck();

            console.log("check.js: すべての初期化が完了しました");

        },
        function(error) {
            console.error("check.js: 位置情報の取得に失敗しました:", error);
            handleLocationErrorForCheck(error);
            
            // 位置情報がなくてもカウントダウンは開始
            startCountdown();
        },
        options
    );
}

// カウントダウン開始
function startCountdown() {
    if (targetDate) {
        updateTime();
        TimeInterval = setInterval(updateTime, 1000);
        console.log("check.js: カウントダウンを開始しました");
    } else {
        console.warn("check.js: 目標日時が設定されていません");
    }
}

// 距離チェック開始
function startDistanceCheck() {
    setInterval(checkDistance, 5000);
    console.log("check.js: 距離チェックを開始しました");
}

// 位置情報エラーハンドリング
function handleLocationErrorForCheck(error) {
    let errorMessage = "位置情報を取得できませんでした。";
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
            errorMessage = "位置情報を取得できませんでした。\n手動で位置情報を更新してください。";
            break;
    }
    showLocationError(errorMessage);
}

// エラーメッセージ表示
function showLocationError(message) {
    console.error("check.js:", message);
    // エラー時はアラートを表示せず、コンソールに記録するだけ
}

function updateTime() {
    if(!targetDate) {
        TimeElm.textContent = "時間情報なし";
        return;
    }

    const now = new Date();
    let diff = targetDate.getTime() - now.getTime();

    if(diff <= 0) {
        clearInterval(TimeInterval);
        TimeElm.textContent = "時間切れ！！";
        TimeElm.style.color = "#FF0000";
        TimeElm.style.fontWeight = "bold";
        
        // 課金アラート（一度だけ表示）
        if(!window.charged) {
            window.charged = true;
            alert(`⏰ 時間切れ！！\n${money}円が課金されました`);
            // 予定の失敗を記録
            recordEventResult('failed', money);
        }
        return;
    }

    const day = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hour = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const min = Math.floor(diff / (1000 * 60)) % 60;
    const sec = Math.floor(diff / 1000) % 60;

    // 残り時間の表示
    let timeString = "";
    if(day > 0) timeString += `${day}日 `;
    if(hour > 0 || day > 0) timeString += `${String(hour).padStart(2,'0')}時間 `;
    timeString += `${String(min).padStart(2,'0')}分 ${String(sec).padStart(2,'0')}秒`;

    TimeElm.textContent = timeString;
    TimeElm.style.color = "#333";
    TimeElm.style.fontWeight = "normal";
}

// 現在地を表示する関数
function updateCurrentLocation(lat, lng) {
    if (!LocationElm) return;
    
    // まず緯度経度を表示
    LocationElm.textContent = `緯度: ${lat.toFixed(6)}\n経度: ${lng.toFixed(6)}`;
    
    // 逆ジオコーディングで住所を取得（Google Maps Geocoding API）
    if (map && window.google) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: lat, lng: lng } }, function(results, status) {
            if (status === 'OK' && results[0]) {
                // 住所を取得できた場合
                const address = results[0].formatted_address;
                LocationElm.textContent = address;
            } else {
                // 住所が取得できない場合は緯度経度のまま
                LocationElm.textContent = `緯度: ${lat.toFixed(6)}\n経度: ${lng.toFixed(6)}`;
            }
        });
    }
}

function checkDistance() {
    if(!map || !targetMarker) return;

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const nowLat = position.coords.latitude;
            const nowLng = position.coords.longitude;

            // Haversine 法で距離を計算（km単位）
            const distance = 6371 * Math.acos(
                Math.cos(targetLat*R) * Math.cos(nowLat*R) * Math.cos(nowLng*R - targetLng*R) +
                Math.sin(targetLat*R) * Math.sin(nowLat*R)
            );

            // 現在位置マーカーを更新
            if(currentMarker) {
                currentMarker.setPosition({lat: nowLat, lng: nowLng});
            }
            
            // 現在位置の円も更新
            if(window.currentLocationCircle) {
                window.currentLocationCircle.setCenter({lat: nowLat, lng: nowLng});
            }
            
            // 現在地表示を更新
            updateCurrentLocation(nowLat, nowLng);

            // 100m以内に到達した場合
            if(distance < 0.1) { // 0.1km = 100m
                clearInterval(TimeInterval);
                TimeElm.textContent = "クリア！！";
                TimeElm.style.color = "#00AA00";
                TimeElm.style.fontWeight = "bold";
                
                // クリアアラート（一度だけ表示）
                if(!window.cleared) {
                    window.cleared = true;
                    alert(`🎉 クリア！！\n目的地に到着しました！\n課金は免れました`);
                    // 予定の成功を記録（設定されていた課金額を阻止額として保存）
                    recordEventResult('completed', 0, money);
                }
            }
        },
        function(error) {
            console.warn("距離チェック用の位置情報取得に失敗:", error.message);
            // 距離チェックの失敗は致命的ではないので、エラーは表示しない
        },
        {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 30000
        }
    );
}

// 予定の結果を記録する関数
function recordEventResult(status, penaltyAmount, preventedAmount) {
    // 現在のユーザーIDを取得
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        console.warn('ユーザーIDが取得できません。予定の結果を記録できません。');
        return;
    }
    
    // ユーザーごとの予定データのキー
    const eventsKey = `events_${currentUserId}`;
    const completedEventsKey = `completedEvents_${currentUserId}`;
    
    // 現在の予定情報を取得
    const eventTitle = localStorage.getItem('eventTitle');
    const eventDeadline = localStorage.getItem('eventDeadline');
    
    if (eventTitle && eventDeadline) {
        // 現在の予定を検索して更新（ユーザーごと）
        let savedEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
        let completedEvents = JSON.parse(localStorage.getItem(completedEventsKey) || '[]');
        
        // 現在の予定を検索
        const currentEventIndex = savedEvents.findIndex(event => 
            event.title === eventTitle && event.start === eventDeadline
        );
        
        if (currentEventIndex !== -1) {
            // 予定を終了した予定リストに移動
            const event = savedEvents[currentEventIndex];
            event.status = status;
            event.completedAt = new Date().toISOString();
            event.penaltyAmount = penaltyAmount;
            // 成功した場合、阻止された課金額を保存
            if (status === 'completed' && preventedAmount) {
                event.preventedAmount = preventedAmount;
            }
            
            // 現在の予定から削除
            savedEvents.splice(currentEventIndex, 1);
            
            // 終了した予定リストに追加
            completedEvents.push(event);
            
            // localStorageに保存（ユーザーごと）
            localStorage.setItem(eventsKey, JSON.stringify(savedEvents));
            localStorage.setItem(completedEventsKey, JSON.stringify(completedEvents));
            
            // Firestoreに課金情報を保存（失敗時のみ）
            if (status === 'failed' && penaltyAmount > 0 && db) {
                const penaltyData = {
                    userId: currentUserId,
                    amount: penaltyAmount,
                    eventTitle: eventTitle,
                    eventDeadline: eventDeadline,
                    completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'failed'
                };
                
                db.collection('penalties').add(penaltyData)
                    .then((docRef) => {
                        console.log('Firestoreに課金情報を保存しました:', docRef.id);
                    })
                    .catch((error) => {
                        console.error('Firestoreへの課金情報保存エラー:', error);
                    });
            }
        }
    }
}

