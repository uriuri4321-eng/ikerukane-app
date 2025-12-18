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
let distanceCheckInterval = null; // 距離チェックのインターバルID
let watchPositionId = null; // watchPositionのID
let positionRetryCount = 0; // 位置情報取得のリトライ回数
const MAX_POSITION_RETRIES = 5; // 最大リトライ回数

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

// 現在位置取得（改善版：リトライ機能付き）
function getCurrentPositionForCheck() {
    if (!navigator.geolocation) {
        console.warn("check.js: このブラウザはGeolocation APIに対応していません");
        showLocationError("このブラウザは位置情報に対応していません。");
        // 位置情報がなくてもカウントダウンは開始
        startCountdown();
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 30000, // 30秒に延長
        maximumAge: 10000 // 10秒間キャッシュを使用（より新しい位置情報を取得）
    };

    console.log("check.js: 位置情報取得を開始します... (リトライ回数: " + positionRetryCount + ")");

    navigator.geolocation.getCurrentPosition(
        function(position) {
            // リトライカウントをリセット
            positionRetryCount = 0;
            
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
                
                if (!currentMarker) {
                currentMarker = new google.maps.Marker({
                    map: map,
                    position: {lat: currentLat, lng: currentLng},
                    title: '現在位置',
                        icon: personIconSVG,
                        zIndex: 1000, // 他のマーカーより上に表示
                        animation: google.maps.Animation.DROP // アニメーション効果
                    });
                } else {
                    currentMarker.setPosition({lat: currentLat, lng: currentLng});
                }
                
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
                } else {
                    window.currentLocationCircle.setCenter({lat: currentLat, lng: currentLng});
                }

                // 地図の中心を現在位置と目的地の中間にする
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(new google.maps.LatLng(currentLat, currentLng));
                bounds.extend(new google.maps.LatLng(targetLat, targetLng));
                map.fitBounds(bounds);
            }

            // カウントダウン開始（まだ開始していない場合）
            if (!TimeInterval) {
            startCountdown();
            }
            
            // 距離チェック開始（まだ開始していない場合）
            if (!distanceCheckInterval) {
            startDistanceCheck();
            }
            
            // watchPositionを開始して継続的に位置情報を監視
            startWatchingPosition();

            console.log("check.js: すべての初期化が完了しました");

        },
        function(error) {
            console.error("check.js: 位置情報の取得に失敗しました:", error);
            
            // リトライ回数が上限に達していない場合はリトライ
            if (positionRetryCount < MAX_POSITION_RETRIES) {
                positionRetryCount++;
                console.log("check.js: 位置情報取得をリトライします (" + positionRetryCount + "/" + MAX_POSITION_RETRIES + ")");
                
                // リトライ前に少し待機（指数バックオフ）
                const retryDelay = Math.min(1000 * Math.pow(2, positionRetryCount - 1), 10000);
                setTimeout(() => {
                    getCurrentPositionForCheck();
                }, retryDelay);
            } else {
                // リトライ回数が上限に達した場合
                console.error("check.js: 位置情報の取得に失敗しました（最大リトライ回数に達しました）");
                handleLocationErrorForCheck(error);
            
            // 位置情報がなくてもカウントダウンは開始
                if (!TimeInterval) {
            startCountdown();
                }
            }
        },
        options
    );
}

// watchPositionを使用して継続的に位置情報を監視
function startWatchingPosition() {
    if (!navigator.geolocation) {
        return;
    }
    
    // 既に監視中の場合は停止
    if (watchPositionId !== null) {
        navigator.geolocation.clearWatch(watchPositionId);
    }
    
    const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000 // 5秒間キャッシュを使用
    };
    
            watchPositionId = navigator.geolocation.watchPosition(
        function(position) {
            // クリア済みまたは時間切れ済みの場合は処理を完全に停止
            if (window.cleared || window.charged) {
                // watchPositionを停止
                if (watchPositionId !== null) {
                    navigator.geolocation.clearWatch(watchPositionId);
                    watchPositionId = null;
                    console.log("check.js: クリア/時間切れのため位置情報の監視を停止しました");
                }
                return;
            }
            
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            // 再度チェック（非同期処理中に状態が変わった可能性があるため）
            if (window.cleared || window.charged) {
                if (watchPositionId !== null) {
                    navigator.geolocation.clearWatch(watchPositionId);
                    watchPositionId = null;
                }
                return;
            }
            
            console.log("check.js: 位置情報を更新しました", {
                lat: currentLat,
                lng: currentLng,
                accuracy: accuracy + "m"
            });
            
            // 現在位置を表示
            updateCurrentLocation(currentLat, currentLng);
            
            // 現在位置マーカーを更新
            if (currentMarker && !window.cleared && !window.charged) {
                currentMarker.setPosition({lat: currentLat, lng: currentLng});
            }
            
            // 現在位置の円も更新
            if (window.currentLocationCircle && !window.cleared && !window.charged) {
                window.currentLocationCircle.setCenter({lat: currentLat, lng: currentLng});
            }
            
            // 距離を計算してチェック（設定した日付・時刻に達した場合のみ）
            // ただし、リアルタイムでの位置表示は継続
            if (!window.cleared && !window.charged && !window.arrivalChecked) {
                const now = new Date();
                const targetTime = targetDate ? targetDate.getTime() : 0;
                const currentTime = now.getTime();
                
                // 設定した日付・時刻に達した場合のみ判定を実行
                if (targetTime > 0 && currentTime >= targetTime) {
                    calculateAndCheckDistance(currentLat, currentLng);
                }
            }
        },
        function(error) {
            // エラーが発生しても監視を継続（一時的なエラーの可能性があるため）
            console.warn("check.js: 位置情報の監視中にエラーが発生しました:", error.message);
            
            // パーミッションエラーの場合は監視を停止
            if (error.code === error.PERMISSION_DENIED) {
                console.error("check.js: 位置情報の使用が許可されていません。監視を停止します。");
                if (watchPositionId !== null) {
                    navigator.geolocation.clearWatch(watchPositionId);
                    watchPositionId = null;
                }
            }
        },
        options
    );
    
    console.log("check.js: 位置情報の監視を開始しました");
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
    distanceCheckInterval = setInterval(checkDistance, 5000);
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

    // 設定した日付・時刻に達した場合、到着判定を実行
    if (diff <= 0 && !window.arrivalChecked && !window.cleared && !window.charged) {
        // 現在位置を取得して判定
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const nowLat = position.coords.latitude;
                    const nowLng = position.coords.longitude;
                    // 最後に取得した位置情報を保存
                    window.lastKnownLat = nowLat;
                    window.lastKnownLng = nowLng;
                    calculateAndCheckDistance(nowLat, nowLng);
                },
                function(error) {
                    console.warn("到着判定時の位置情報取得に失敗:", error.message);
                    // 位置情報が取得できない場合でも判定を実行（最後に取得した位置情報を使用）
                    if (window.lastKnownLat && window.lastKnownLng) {
                        calculateAndCheckDistance(window.lastKnownLat, window.lastKnownLng);
                    } else {
                        // 位置情報が取得できない場合は時間切れとして処理
                        if(!window.charged) {
                            window.charged = true;
                            window.arrivalChecked = true;
                            
                            // カウントダウンを停止
                            if(TimeInterval) {
                                clearInterval(TimeInterval);
                                TimeInterval = null;
                            }
                            
                            // 距離チェックを停止
                            if(distanceCheckInterval) {
                                clearInterval(distanceCheckInterval);
                                distanceCheckInterval = null;
                            }
                            
                            TimeElm.textContent = "時間切れ！！";
                            TimeElm.style.color = "#FF0000";
                            TimeElm.style.fontWeight = "bold";
                            
                            alert(`⏰ 時間切れ\n期日までに目的地に到着できませんでした。\n${money}円が課金されます。`);
                            recordEventResult('failed', money, 0);
                        }
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0 // 最新の位置情報を使用
                }
            );
        }
        return;
    }
    
    // 既に判定済みの場合は表示のみ更新
    if (window.arrivalChecked || window.cleared || window.charged) {
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
    // クリア済みまたは時間切れ済みの場合は更新しない
    if (window.cleared || window.charged) {
        return;
    }
    
    if (!LocationElm) return;
    
    // まず緯度経度を表示
    LocationElm.textContent = `緯度: ${lat.toFixed(6)}\n経度: ${lng.toFixed(6)}`;
    
    // 逆ジオコーディングで住所を取得（Google Maps Geocoding API）
    if (map && window.google && !window.cleared && !window.charged) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: lat, lng: lng } }, function(results, status) {
            // コールバック内でも再度チェック
            if (window.cleared || window.charged) {
                return;
            }
            
            if (status === 'OK' && results[0]) {
                // 住所を取得できた場合
                const address = results[0].formatted_address;
                if (LocationElm && !window.cleared && !window.charged) {
                    LocationElm.textContent = address;
                }
            } else {
                // 住所が取得できない場合は緯度経度のまま
                if (LocationElm && !window.cleared && !window.charged) {
                    LocationElm.textContent = `緯度: ${lat.toFixed(6)}\n経度: ${lng.toFixed(6)}`;
                }
            }
        });
    }
}

function checkDistance() {
    // クリア済みの場合は処理を停止
    if(window.cleared) {
        return;
    }
    
    // 時間切れ済みの場合も処理を停止
    if(window.charged) {
        return;
    }
    
    if(!map || !targetMarker) return;

    // watchPositionが動作している場合は、その位置情報を使用
    // そうでない場合のみgetCurrentPositionを使用
    if (watchPositionId === null) {
    navigator.geolocation.getCurrentPosition(
        function(position) {
                // クリア済みまたは時間切れ済みの場合は処理を停止
                if(window.cleared || window.charged) {
                    return;
                }
                
            const nowLat = position.coords.latitude;
            const nowLng = position.coords.longitude;

                calculateAndCheckDistance(nowLat, nowLng);
            },
            function(error) {
                // クリア済みまたは時間切れ済みの場合は処理を停止
                if(window.cleared || window.charged) {
                    return;
                }
                console.warn("距離チェック用の位置情報取得に失敗:", error.message);
                // 距離チェックの失敗は致命的ではないので、エラーは表示しない
            },
            {
                enableHighAccuracy: false,
                timeout: 10000, // タイムアウトを延長
                maximumAge: 10000 // 10秒間キャッシュを使用
            }
        );
    }
    // watchPositionが動作している場合は、位置情報は自動的に更新されるため
    // ここでは距離計算のみ行う（位置情報はwatchPositionのコールバックで更新される）
}

// 距離を計算してチェックする関数
function calculateAndCheckDistance(nowLat, nowLng) {
    // クリア済みまたは時間切れ済みの場合は処理を停止
    if(window.cleared || window.charged) {
        return;
    }

    // 設定した日付・時刻に達していない場合は判定をスキップ
    if (!targetDate) {
        return;
    }
    
    const now = new Date();
    const targetTime = targetDate.getTime();
    const currentTime = now.getTime();
    
    // 設定した日付・時刻に達していない場合は判定をスキップ
    if (currentTime < targetTime) {
        return;
    }
    
    // 設定した日付・時刻を過ぎた場合のみ判定を実行
    // ただし、判定は一度だけ実行する（既に判定済みの場合はスキップ）
    if (window.arrivalChecked) {
        return;
    }

    // Haversine 法で距離を計算（km単位）
    const distance = 6371 * Math.acos(
        Math.cos(targetLat*R) * Math.cos(nowLat*R) * Math.cos(nowLng*R - targetLng*R) +
        Math.sin(targetLat*R) * Math.sin(nowLat*R)
    );

    // 判定済みフラグを設定（一度だけ判定を実行）
    window.arrivalChecked = true;

    // 100m以内に到達していた場合
    if(distance < 0.1) { // 0.1km = 100m
        // まずクリアフラグを設定（位置情報の更新を即座に停止）
        if(!window.cleared) {
            window.cleared = true;
            
            // watchPositionを即座に停止（位置情報の更新を防ぐ）
            if(watchPositionId !== null) {
                navigator.geolocation.clearWatch(watchPositionId);
                watchPositionId = null;
                console.log("check.js: クリアのため位置情報の監視を停止しました");
            }
            
            // カウントダウンを停止
            if(TimeInterval) {
                clearInterval(TimeInterval);
                TimeInterval = null;
            }
            
            // 距離チェックを停止
            if(distanceCheckInterval) {
                clearInterval(distanceCheckInterval);
                distanceCheckInterval = null;
            }
            
            TimeElm.textContent = "クリア！！";
            TimeElm.style.color = "#00AA00";
            TimeElm.style.fontWeight = "bold";
            
            // クリアアラート（一度だけ表示）
            alert(`🎉 クリア！！\n目的地に到着しました！\n課金は免れました`);
            // 予定の成功を記録（設定されていた課金額を阻止額として保存）
            recordEventResult('completed', 0, money);
        }
    } else {
        // 100m以内に到達していなかった場合（時間切れ）
        if(!window.charged) {
            window.charged = true;
            
            // watchPositionを停止
            if(watchPositionId !== null) {
                navigator.geolocation.clearWatch(watchPositionId);
                watchPositionId = null;
                console.log("check.js: 時間切れのため位置情報の監視を停止しました");
            }
            
            // カウントダウンを停止
            if(TimeInterval) {
                clearInterval(TimeInterval);
                TimeInterval = null;
            }
            
            // 距離チェックを停止
            if(distanceCheckInterval) {
                clearInterval(distanceCheckInterval);
                distanceCheckInterval = null;
            }
            
            TimeElm.textContent = "時間切れ！！";
            TimeElm.style.color = "#FF0000";
            TimeElm.style.fontWeight = "bold";
            
            // 時間切れアラート
            alert(`⏰ 時間切れ\n期日までに目的地に到着できませんでした。\n${money}円が課金されます。`);
            // 予定の失敗を記録
            recordEventResult('failed', money, 0);
        }
    }
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
            const firestoreDocId = (event && (event.firestoreId || (typeof event.id === 'string' ? event.id : null))) || localStorage.getItem('selectedEventId');
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
            
            // Firestoreに予定の状態を更新
            if (db && currentUserId) {
                const updateData = {
                    status: status,
                    penaltyAmount: penaltyAmount
                };

                if (status === 'completed' && preventedAmount) {
                    updateData.preventedAmount = preventedAmount;
                }

                if (firebase && firebase.firestore && firebase.firestore.FieldValue) {
                    updateData.completedAt = firebase.firestore.FieldValue.serverTimestamp();
                    updateData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                } else {
                    updateData.completedAt = new Date().toISOString();
                    updateData.updatedAt = new Date().toISOString();
                }

                const applyUpdate = (docRef, docIdLabel) => {
                    return docRef.update(updateData)
                        .then(() => {
                            console.log('Firestoreの予定を更新しました:', docIdLabel);
                        });
                };

                const fallbackUpdate = () => {
                    db.collection('events')
                        .where('userId', '==', currentUserId)
                        .where('title', '==', eventTitle)
                        .where('start', '==', eventDeadline)
                        .where('status', '==', 'active')
                        .limit(1)
                        .get()
                        .then((querySnapshot) => {
                            if (!querySnapshot.empty) {
                                const doc = querySnapshot.docs[0];
                                applyUpdate(doc.ref, doc.id).catch((error) => {
                                    console.error('Firestoreの予定更新エラー:', error);
                                });
                            } else {
                                const eventData = {
                                    userId: currentUserId,
                                    title: eventTitle,
                                    start: eventDeadline,
                                    end: eventDeadline,
                                    status: status,
                                    penaltyAmount: penaltyAmount,
                                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                    completedAt: firebase.firestore.FieldValue.serverTimestamp()
                                };
                                if (status === 'completed' && preventedAmount) {
                                    eventData.preventedAmount = preventedAmount;
                                }
                                
                                db.collection('events').add(eventData)
                                    .then((docRef) => {
                                        console.log('Firestoreに予定を保存しました:', docRef.id);
                                    })
                                    .catch((error) => {
                                        console.error('Firestoreへの予定保存エラー:', error);
                                    });
                            }
                        })
                        .catch((error) => {
                            console.error('Firestoreからの予定検索エラー:', error);
                        });
                };

                if (firestoreDocId) {
                    applyUpdate(db.collection('events').doc(firestoreDocId), firestoreDocId)
                        .catch((error) => {
                            console.error('Firestoreの予定更新エラー:', error);
                            fallbackUpdate();
                        });
                } else {
                    fallbackUpdate();
                }
            }
            
            // Firestoreに課金情報を保存（失敗時のみ）
            if (status === 'failed' && penaltyAmount > 0 && db) {
                const penaltyData = {
                    userId: currentUserId,
                    amount: penaltyAmount,
                    eventTitle: eventTitle,
                    eventDeadline: eventDeadline,
                    eventId: firestoreDocId || null,
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
            
            // 定期予定の場合、次週の予定を作成
            if (event && event.isRecurring) {
                createNextWeekRecurringEvent(event, currentUserId, eventDeadline);
            }

            // 選択中のイベントIDをクリア
            localStorage.removeItem('selectedEventId');
        }
    }
}

// 定期予定の次週の予定を作成する関数
function createNextWeekRecurringEvent(event, currentUserId, eventDeadlineStr) {
    if (!event || !currentUserId) {
        console.warn('定期予定の次週予定作成に必要な情報が不足しています');
        return;
    }
    
    // 現在の予定の日時を取得（ローカル時間を保持）
    // eventDeadlineStrがdatetime-local形式（YYYY-MM-DDTHH:mm）の場合とISO形式の場合がある
    let currentDeadline;
    if (eventDeadlineStr) {
        currentDeadline = new Date(eventDeadlineStr);
    } else if (event.start) {
        currentDeadline = new Date(event.start);
    } else if (event.end) {
        currentDeadline = new Date(event.end);
    } else {
        console.warn('予定の日時を取得できません');
        return;
    }
    
    // 次週の日時を計算（同じ曜日・同じ時刻）
    const nextWeekDeadline = new Date(currentDeadline);
    nextWeekDeadline.setDate(nextWeekDeadline.getDate() + 7);
    
    // datetime-local形式に変換（ローカル時間を保持）
    const year = nextWeekDeadline.getFullYear();
    const month = String(nextWeekDeadline.getMonth() + 1).padStart(2, '0');
    const day = String(nextWeekDeadline.getDate()).padStart(2, '0');
    const hours = String(nextWeekDeadline.getHours()).padStart(2, '0');
    const minutes = String(nextWeekDeadline.getMinutes()).padStart(2, '0');
    const nextWeekDeadlineStr = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // 既に同じ予定が存在するかチェック
    const eventsKey = `events_${currentUserId}`;
    let savedEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
    
    const existingEvent = savedEvents.find(e => 
        e.title === event.title && 
        e.isRecurring &&
        Math.abs(new Date(e.start).getTime() - nextWeekDeadline.getTime()) < 60000 // 1分以内の誤差を許容
    );
    
    if (!existingEvent) {
        // 新しい予定を作成
        const newEvent = {
            id: Date.now().toString() + '_recurring_' + Math.random().toString(36).substr(2, 9),
            firestoreId: null,
            userId: currentUserId,
            title: event.title,
            start: nextWeekDeadlineStr, // datetime-local形式を保持
            end: nextWeekDeadlineStr,
            allDay: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            lat: event.lat,
            lng: event.lng,
            money: event.money,
            isRecurring: true
        };
        
        savedEvents.push(newEvent);
        localStorage.setItem(eventsKey, JSON.stringify(savedEvents));
        
        // Firestoreに保存
        if (typeof db !== 'undefined' && db && currentUserId) {
            const docRef = db.collection('events').doc();
            const firestorePayload = {
                ...newEvent,
                id: docRef.id,
                firestoreId: docRef.id,
                userId: currentUserId,
                // FirestoreにはISO形式で保存
                start: nextWeekDeadline.toISOString(),
                end: nextWeekDeadline.toISOString(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            docRef.set(firestorePayload).catch(error => {
                console.error('次週の予定のFirestore保存エラー:', error);
            });
        }
        
        console.log('定期予定から次週の予定を作成しました:', {
            title: newEvent.title,
            deadline: nextWeekDeadlineStr,
            originalDeadline: currentDeadline.toLocaleString('ja-JP'),
            originalTime: currentDeadline.getHours() + ':' + String(currentDeadline.getMinutes()).padStart(2, '0'),
            nextWeekTime: nextWeekDeadline.getHours() + ':' + String(nextWeekDeadline.getMinutes()).padStart(2, '0')
        });
    } else {
        console.log('次週の予定は既に存在します:', existingEvent);
    }
}

