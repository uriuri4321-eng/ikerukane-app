// 支払方法設定機能

let currentUserId = null;
let paymentMethods = {
    creditCard: null,
    paypay: null
};

// 初期化
document.addEventListener('DOMContentLoaded', async function() {
    // ログインチェック
    currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        alert('ログインが必要です');
        window.location.href = 'index.html';
        return;
    }

    // 既存の支払方法情報を読み込む
    await loadPaymentMethods();
    
    // フォームの入力制限を設定
    setupFormValidation();
});

/**
 * 支払方法情報を読み込む
 */
async function loadPaymentMethods() {
    try {
        if (db && typeof firebase !== 'undefined' && firebase.firestore) {
            const userDoc = await db.collection('users').doc(currentUserId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.paymentMethods) {
                    paymentMethods = userData.paymentMethods;
                    updatePaymentMethodDisplay();
                }
            }
        }

        // localStorageからも読み込む（フォールバック）
        const localPaymentMethods = localStorage.getItem('paymentMethods');
        if (localPaymentMethods) {
            const parsed = JSON.parse(localPaymentMethods);
            if (parsed) {
                paymentMethods = { ...paymentMethods, ...parsed };
                updatePaymentMethodDisplay();
            }
        }
    } catch (error) {
        console.error('支払方法情報の読み込みエラー:', error);
    }
}

/**
 * 支払方法の表示を更新
 */
function updatePaymentMethodDisplay() {
    // クレジットカード
    if (paymentMethods.creditCard) {
        document.getElementById('creditCardStatus').textContent = '設定済み';
        document.getElementById('creditCardStatus').className = 'payment-method-status set';
        // カード番号の下4桁を表示
        const last4 = paymentMethods.creditCard.cardNumber.slice(-4);
        document.getElementById('creditCardCard').querySelector('.payment-method-title').innerHTML = 
            '<span class="payment-method-icon">💳</span><span>クレジットカード (****' + last4 + ')</span>';
    } else {
        document.getElementById('creditCardStatus').textContent = '未設定';
        document.getElementById('creditCardStatus').className = 'payment-method-status not-set';
    }

    // PayPay
    if (paymentMethods.paypay) {
        document.getElementById('paypayStatus').textContent = '設定済み';
        document.getElementById('paypayStatus').className = 'payment-method-status set';
        // アカウント情報をマスクして表示
        const account = paymentMethods.paypay.account || '';
        const masked = account.length > 4 ? '****' + account.slice(-4) : '****';
        document.getElementById('paypayCard').querySelector('.payment-method-title').innerHTML = 
            '<span class="payment-method-icon">📱</span><span>PayPay (' + masked + ')</span>';
    } else {
        document.getElementById('paypayStatus').textContent = '未設定';
        document.getElementById('paypayStatus').className = 'payment-method-status not-set';
    }
}

/**
 * 支払方法フォームの表示/非表示を切り替え
 */
function togglePaymentForm(method) {
    const form = document.getElementById(method + 'Form');
    const toggleBtn = document.getElementById(method + 'ToggleBtn');
    const card = document.getElementById(method + 'Card');

    if (form.classList.contains('active')) {
        form.classList.remove('active');
        toggleBtn.textContent = '設定を開く';
        card.classList.remove('active');
    } else {
        // 他のフォームを閉じる
        document.querySelectorAll('.payment-form').forEach(f => {
            f.classList.remove('active');
        });
        document.querySelectorAll('.payment-method-card').forEach(c => {
            c.classList.remove('active');
        });
        document.querySelectorAll('[id$="ToggleBtn"]').forEach(btn => {
            btn.textContent = '設定を開く';
        });

        form.classList.add('active');
        toggleBtn.textContent = '設定を閉じる';
        card.classList.add('active');

        // PayPayの場合はQRコードを生成
        if (method === 'paypay') {
            generatePayPayQRCode();
        }
    }
}

/**
 * フォームの入力制限を設定
 */
function setupFormValidation() {
    // カード番号のフォーマット
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            if (value.length > 16) {
                value = value.slice(0, 16);
            }
            // 4桁ごとにスペースを挿入
            value = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = value;
        });
    }

    // 有効期限のフォーマット
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }

    // CVVの数字のみ
    const cardCvvInput = document.getElementById('cardCvv');
    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // カード名義人の大文字変換
    const cardNameInput = document.getElementById('cardName');
    if (cardNameInput) {
        cardNameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

/**
 * クレジットカード情報を保存
 */
async function saveCreditCard() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvv = document.getElementById('cardCvv').value;
    const cardName = document.getElementById('cardName').value.trim();

    // バリデーション
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
        alert('有効なカード番号を入力してください');
        return;
    }

    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        alert('有効期限を正しい形式（MM/YY）で入力してください');
        return;
    }

    if (!cardCvv || cardCvv.length < 3 || cardCvv.length > 4) {
        alert('セキュリティコードを入力してください');
        return;
    }

    if (!cardName) {
        alert('カード名義人を入力してください');
        return;
    }

    const saveBtn = document.querySelector('#creditCardForm .save-button');
    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    try {
        // セキュリティのため、CVVは保存しない（実際の実装では、決済サービスに送信するのみ）
        const creditCardData = {
            cardNumber: cardNumber, // 実際の実装では暗号化が必要
            expiry: cardExpiry,
            name: cardName,
            last4: cardNumber.slice(-4),
            // CVVは保存しない（セキュリティ上）
            updatedAt: new Date().toISOString()
        };

        paymentMethods.creditCard = creditCardData;

        // Firestoreに保存
        if (db && typeof firebase !== 'undefined' && firebase.firestore) {
            await db.collection('users').doc(currentUserId).update({
                paymentMethods: paymentMethods,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Firestoreに支払方法を保存しました');
        }

        // localStorageにも保存（フォールバック）
        localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));

        alert('クレジットカード情報を保存しました');
        updatePaymentMethodDisplay();
        togglePaymentForm('creditCard');

        saveBtn.disabled = false;
        saveBtn.textContent = 'クレジットカードを保存';
    } catch (error) {
        console.error('クレジットカード情報の保存エラー:', error);
        alert('クレジットカード情報の保存に失敗しました: ' + error.message);
        saveBtn.disabled = false;
        saveBtn.textContent = 'クレジットカードを保存';
    }
}

/**
 * PayPay情報を保存
 */
async function savePayPay() {
    const paypayAccount = document.getElementById('paypayAccount').value.trim();

    if (!paypayAccount) {
        alert('PayPayアカウントを入力してください');
        return;
    }

    // 電話番号またはメールアドレスの形式チェック
    const phoneRegex = /^[\d-]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!phoneRegex.test(paypayAccount.replace(/-/g, '')) && !emailRegex.test(paypayAccount)) {
        alert('有効な電話番号またはメールアドレスを入力してください');
        return;
    }

    const saveBtn = document.querySelector('#paypayForm .save-button');
    saveBtn.disabled = true;
    saveBtn.textContent = '連携中...';

    try {
        // 実際の実装では、PayPay APIを使用して認証を行う
        // ここでは簡易的な実装
        const paypayData = {
            account: paypayAccount,
            // 実際の実装では、PayPay APIから取得した認証トークンなどを保存
            linkedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        paymentMethods.paypay = paypayData;

        // Firestoreに保存
        if (db && typeof firebase !== 'undefined' && firebase.firestore) {
            await db.collection('users').doc(currentUserId).update({
                paymentMethods: paymentMethods,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('FirestoreにPayPay情報を保存しました');
        }

        // localStorageにも保存（フォールバック）
        localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));

        alert('PayPayアカウントを連携しました');
        updatePaymentMethodDisplay();
        togglePaymentForm('paypay');

        saveBtn.disabled = false;
        saveBtn.textContent = 'PayPayを連携';
    } catch (error) {
        console.error('PayPay情報の保存エラー:', error);
        alert('PayPayアカウントの連携に失敗しました: ' + error.message);
        saveBtn.disabled = false;
        saveBtn.textContent = 'PayPayを連携';
    }
}

/**
 * PayPay認証用QRコードを生成（簡易版）
 * 実際の実装では、PayPay APIを使用してQRコードを生成
 */
function generatePayPayQRCode() {
    const qrCodeDiv = document.getElementById('paypayQrCode');
    
    // 実際の実装では、PayPay APIからQRコードを取得
    // ここではプレースホルダーを表示
    qrCodeDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">📱</div>
            <div>PayPayアプリで<br>QRコードをスキャン</div>
            <div style="font-size: 12px; margin-top: 10px; color: #999;">
                （実際の実装では、PayPay APIから<br>QRコードを取得します）
            </div>
        </div>
    `;
    
    // 実際の実装例（コメント）:
    /*
    // PayPay APIを使用してQRコードを生成
    const paypayApiUrl = 'https://api.paypay.ne.jp/v2/codes';
    const response = await fetch(paypayApiUrl, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            merchantPaymentId: generatePaymentId(),
            amount: { amount: 0, currency: 'JPY' },
            codeType: 'ORDER_QR'
        })
    });
    const qrData = await response.json();
    // QRコード画像を表示
    qrCodeDiv.innerHTML = `<img src="${qrData.data.qrCodeUrl}" alt="PayPay QR Code">`;
    */
}

// グローバルスコープに公開
window.togglePaymentForm = togglePaymentForm;
window.saveCreditCard = saveCreditCard;
window.savePayPay = savePayPay;

