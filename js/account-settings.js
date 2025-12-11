// アカウント設定機能
// ユーザー名変更機能を提供

// 設定モーダルを表示
function showAccountSettings() {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        alert('ログインが必要です');
        return;
    }

    // 現在のユーザー情報を取得
    const userAccount = JSON.parse(localStorage.getItem('userAccount') || '{}');
    const currentUsername = userAccount.username || '未設定';

    // モーダルHTMLを作成
    const modalHTML = `
        <div id="accountSettingsModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                position: relative;
            ">
                <button id="closeSettingsModal" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                ">×</button>
                
                <h2 style="margin-top: 0; color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
                    ⚙️ アカウント設定
                </h2>
                
                <div style="margin-top: 20px;">
                    <label style="display: block; font-weight: bold; color: #333; margin-bottom: 8px;">
                        ユーザー名
                    </label>
                    <input type="text" id="usernameInput" value="${currentUsername}" style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        font-size: 16px;
                        box-sizing: border-box;
                    ">
                </div>
                
                <div style="margin-top: 20px; color: #666; font-size: 14px;">
                    <div><strong>メールアドレス:</strong> ${userAccount.email || '未設定'}</div>
                    <div style="margin-top: 5px;"><strong>ユーザーID:</strong> ${currentUserId}</div>
                </div>
                
                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                    <button id="openPaymentSettingsBtn" style="
                        width: 100%;
                        background: linear-gradient(45deg, #FF9800, #F57C00);
                        color: white;
                        padding: 14px 20px;
                        border: none;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-bottom: 10px;
                        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(255, 152, 0, 0.4)';" 
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 152, 0, 0.3)';">
                        💳 支払方法設定
                    </button>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                    <button id="saveUsernameBtn" style="
                        background: linear-gradient(45deg, #4CAF50, #45a049);
                        color: white;
                        padding: 12px 30px;
                        border: none;
                        border-radius: 25px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-right: 10px;
                    ">保存</button>
                    <button id="cancelSettingsBtn" style="
                        background: #ccc;
                        color: white;
                        padding: 12px 30px;
                        border: none;
                        border-radius: 25px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                    ">キャンセル</button>
                </div>
            </div>
        </div>
    `;

    // モーダルを追加
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // イベントリスナーを追加
    document.getElementById('closeSettingsModal').addEventListener('click', closeAccountSettings);
    document.getElementById('cancelSettingsBtn').addEventListener('click', closeAccountSettings);
    document.getElementById('saveUsernameBtn').addEventListener('click', saveUsername);
    document.getElementById('openPaymentSettingsBtn').addEventListener('click', () => {
        closeAccountSettings();
        window.location.href = 'payment-settings.html';
    });

    // モーダル外をクリックで閉じる
    document.getElementById('accountSettingsModal').addEventListener('click', function(e) {
        if (e.target.id === 'accountSettingsModal') {
            closeAccountSettings();
        }
    });
}

// 設定モーダルを閉じる
function closeAccountSettings() {
    const modal = document.getElementById('accountSettingsModal');
    if (modal) {
        modal.remove();
    }
}

// ユーザー名を保存
async function saveUsername() {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        alert('ログインが必要です');
        return;
    }

    const usernameInput = document.getElementById('usernameInput');
    const newUsername = usernameInput.value.trim();

    if (!newUsername) {
        alert('ユーザー名を入力してください');
        return;
    }

    if (newUsername.length > 50) {
        alert('ユーザー名は50文字以内で入力してください');
        return;
    }

    // 保存ボタンを無効化
    const saveBtn = document.getElementById('saveUsernameBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    try {
        // Firestoreを更新
        if (db && typeof firebase !== 'undefined' && firebase.firestore) {
            const updateData = {
                username: newUsername
            };
            
            if (firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp) {
                updateData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            
            await db.collection('users').doc(currentUserId).update(updateData);
            console.log('Firestoreのユーザー名を更新しました');
        } else {
            console.warn('Firestoreが利用できないため、ローカルのみ更新します');
        }

        // localStorageを更新
        const userAccount = JSON.parse(localStorage.getItem('userAccount') || '{}');
        userAccount.username = newUsername;
        localStorage.setItem('userAccount', JSON.stringify(userAccount));

        // userAccounts配列も更新
        const userAccounts = JSON.parse(localStorage.getItem('userAccounts') || '[]');
        const accountIndex = userAccounts.findIndex(acc => acc.id === currentUserId || acc.id.toString() === currentUserId);
        if (accountIndex !== -1) {
            userAccounts[accountIndex].username = newUsername;
            localStorage.setItem('userAccounts', JSON.stringify(userAccounts));
        }

        alert('ユーザー名を変更しました');
        closeAccountSettings();

        // ページをリロードして反映
        window.location.reload();
    } catch (error) {
        console.error('ユーザー名の更新エラー:', error);
        alert('ユーザー名の変更に失敗しました: ' + error.message);
        saveBtn.disabled = false;
        saveBtn.textContent = '保存';
    }
}

// グローバルスコープに公開
window.showAccountSettings = showAccountSettings;
window.closeAccountSettings = closeAccountSettings;
window.saveUsername = saveUsername;

