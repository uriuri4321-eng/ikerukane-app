/**
 * 時間帯と天気に応じてグラデーション背景の色を変更する機能
 * 
 * 将来の拡張:
 * - 天気予報API（OpenWeatherMap、WeatherAPI等）を統合
 * - 日照時間の計算（緯度・経度から日出・日没時刻を計算）
 * - 天気と時間帯の組み合わせによる背景色の決定
 */

// 時間帯の定義
const TIME_PERIODS = {
    MORNING: { start: 5, end: 9, name: 'morning' },      // 朝: 5-9時
    DAY: { start: 9, end: 17, name: 'day' },             // 昼: 9-17時
    EVENING: { start: 17, end: 19, name: 'evening' },    // 夕方: 17-19時
    NIGHT: { start: 19, end: 5, name: 'night' }          // 夜: 19-5時
};

// 天気の種類（OpenWeatherMapのweather condition codesを参考）
const WEATHER_CONDITIONS = {
    CLEAR: 'clear',           // 晴れ
    CLOUDS: 'clouds',         // 曇り
    RAIN: 'rain',             // 雨
    DRIZZLE: 'drizzle',       // 霧雨
    THUNDERSTORM: 'thunderstorm', // 雷
    SNOW: 'snow',             // 雪
    MIST: 'mist',             // 霧
    FOG: 'fog',               // 濃霧
    HAZE: 'haze'              // 靄
};

// 各時間帯のグラデーション色（晴れの場合）
const GRADIENT_COLORS_BY_TIME = {
    morning: {
        start: '#FF6B6B',  // 朝日の赤/オレンジ
        end: '#FFD93D'     // 明るい黄色
    },
    day: {
        start: '#4ECDC4',  // 明るい青緑
        end: '#44A3C4'     // 空の青
    },
    evening: {
        start: '#FF8C42',  // 夕日のオレンジ
        end: '#FF6B6B'     // 夕焼けの赤
    },
    night: {
        start: '#2C3E50',  // 暗い青
        end: '#1A1A2E'     // 深い紫
    }
};

// 天気に応じたグラデーション色の調整（時間帯の色をベースに調整）
const WEATHER_COLOR_MODIFIERS = {
    clear: {
        // 晴れ: 時間帯の色をそのまま使用
        brightness: 1.0,
        saturation: 1.0
    },
    clouds: {
        // 曇り: グレー系に調整
        override: {
            morning: { start: '#B8B8B8', end: '#D3D3D3' },
            day: { start: '#A8A8A8', end: '#C8C8C8' },
            evening: { start: '#8B8B8B', end: '#A8A8A8' },
            night: { start: '#4A4A4A', end: '#2C2C2C' }
        }
    },
    rain: {
        // 雨: 暗めの青系
        override: {
            morning: { start: '#5C7A9A', end: '#7A9AB8' },
            day: { start: '#4A6B8A', end: '#6B8A9A' },
            evening: { start: '#3A5A7A', end: '#5A7A9A' },
            night: { start: '#2A3A5A', end: '#1A2A3A' }
        }
    },
    drizzle: {
        // 霧雨: 雨より少し明るめ
        override: {
            morning: { start: '#6B8A9A', end: '#8AA8B8' },
            day: { start: '#5A7A9A', end: '#7A9AAA' },
            evening: { start: '#4A6A8A', end: '#6A8A9A' },
            night: { start: '#3A4A6A', end: '#2A3A4A' }
        }
    },
    thunderstorm: {
        // 雷: 暗い紫系
        override: {
            morning: { start: '#4A3A5A', end: '#6A4A7A' },
            day: { start: '#3A2A5A', end: '#5A3A7A' },
            evening: { start: '#2A1A4A', end: '#4A2A6A' },
            night: { start: '#1A0A2A', end: '#2A1A3A' }
        }
    },
    snow: {
        // 雪: 白/青白系
        override: {
            morning: { start: '#E8E8F0', end: '#F0F0F8' },
            day: { start: '#D8D8E8', end: '#E8E8F0' },
            evening: { start: '#C8C8D8', end: '#D8D8E8' },
            night: { start: '#6A6A7A', end: '#4A4A5A' }
        }
    },
    mist: {
        // 霧: 白っぽいグレー
        override: {
            morning: { start: '#C8C8D0', end: '#D8D8E0' },
            day: { start: '#B8B8C8', end: '#C8C8D0' },
            evening: { start: '#A8A8B8', end: '#B8B8C8' },
            night: { start: '#5A5A6A', end: '#3A3A4A' }
        }
    },
    fog: {
        // 濃霧: 霧より濃い
        override: {
            morning: { start: '#B8B8C0', end: '#C8C8D0' },
            day: { start: '#A8A8B8', end: '#B8B8C8' },
            evening: { start: '#9898A8', end: '#A8A8B8' },
            night: { start: '#4A4A5A', end: '#2A2A3A' }
        }
    },
    haze: {
        // 靄: 薄いオレンジ/黄色系
        override: {
            morning: { start: '#F0D8A8', end: '#F8E8B8' },
            day: { start: '#E8D0A0', end: '#F0E0B0' },
            evening: { start: '#D8C890', end: '#E8D8A0' },
            night: { start: '#6A5A4A', end: '#4A3A2A' }
        }
    }
};

/**
 * 現在時刻から時間帯を判定
 * @returns {string} 時間帯名 ('morning', 'day', 'evening', 'night')
 */
function getTimePeriod() {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= TIME_PERIODS.MORNING.start && hour < TIME_PERIODS.MORNING.end) {
        return TIME_PERIODS.MORNING.name;
    } else if (hour >= TIME_PERIODS.DAY.start && hour < TIME_PERIODS.DAY.end) {
        return TIME_PERIODS.DAY.name;
    } else if (hour >= TIME_PERIODS.EVENING.start && hour < TIME_PERIODS.EVENING.end) {
        return TIME_PERIODS.EVENING.name;
    } else {
        return TIME_PERIODS.NIGHT.name; // 19時以降または5時前
    }
}

/**
 * 時間帯と天気からグラデーション色を決定
 * @param {string} timePeriod - 時間帯名 ('morning', 'day', 'evening', 'night')
 * @param {string} weatherCondition - 天気の種類 (オプション、デフォルトは 'clear')
 * @returns {Object} グラデーション色オブジェクト {start: string, end: string}
 */
function getGradientColors(timePeriod, weatherCondition = 'clear') {
    // 天気による色の調整があるかチェック
    const weatherModifier = WEATHER_COLOR_MODIFIERS[weatherCondition];
    
    if (weatherModifier && weatherModifier.override && weatherModifier.override[timePeriod]) {
        // 天気による色の上書きがある場合
        return weatherModifier.override[timePeriod];
    }
    
    // 時間帯の基本色を使用
    const baseColors = GRADIENT_COLORS_BY_TIME[timePeriod];
    if (!baseColors) {
        console.warn('Unknown time period:', timePeriod);
        return GRADIENT_COLORS_BY_TIME.day; // デフォルト
    }
    
    // 将来的にbrightnessやsaturationの調整を実装可能
    if (weatherModifier && weatherModifier.brightness !== undefined) {
        // 色の明度調整（将来的な実装）
        // 現在はそのまま返す
    }
    
    return baseColors;
}

/**
 * グラデーション背景を更新
 * @param {string} timePeriod - 時間帯名
 * @param {string} weatherCondition - 天気の種類 (オプション)
 */
function updateBackgroundGradient(timePeriod, weatherCondition = 'clear') {
    const colors = getGradientColors(timePeriod, weatherCondition);
    if (!colors) {
        console.warn('Failed to get gradient colors for:', timePeriod, weatherCondition);
        return;
    }
    
    // CSS変数を更新（:rootに設定）
    const root = document.documentElement;
    root.style.setProperty('--bg-gradient-start', colors.start);
    root.style.setProperty('--bg-gradient-end', colors.end);
    
    // html要素の背景も直接更新（!importantで確実に適用）
    const htmlElement = document.documentElement;
    const gradientValue = `linear-gradient(135deg, ${colors.start} 0%, ${colors.end} 100%)`;
    
    // インラインスタイルで直接設定（最優先）
    htmlElement.style.cssText += `background: ${gradientValue} !important; background-attachment: fixed !important;`;
    
    // 動的にスタイルタグを追加して確実に適用
    let dynamicStyle = document.getElementById('dynamic-time-background');
    if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.id = 'dynamic-time-background';
        document.head.appendChild(dynamicStyle);
    }
    dynamicStyle.textContent = `
        html {
            background: ${gradientValue} !important;
            background-attachment: fixed !important;
        }
        :root {
            --bg-gradient-start: ${colors.start} !important;
            --bg-gradient-end: ${colors.end} !important;
        }
    `;
}

/**
 * 天気予報APIから天気情報を取得（将来的な実装）
 * 
 * 使用可能なAPI例:
 * - OpenWeatherMap: https://openweathermap.org/api
 * - WeatherAPI: https://www.weatherapi.com/
 * - Weather.gov (US only): https://www.weather.gov/documentation/services-web-api
 * 
 * @param {number} lat - 緯度
 * @param {number} lon - 経度
 * @returns {Promise<string>} 天気の種類 (WEATHER_CONDITIONSの値)
 */
async function getWeatherFromAPI(lat, lon) {
    // TODO: 天気予報APIを実装
    // 例: OpenWeatherMap API
    /*
    const API_KEY = 'YOUR_API_KEY_HERE'; // 環境変数や設定ファイルから取得
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=ja`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        const weatherMain = data.weather[0].main.toLowerCase();
        
        // OpenWeatherMapのweather mainをWEATHER_CONDITIONSにマッピング
        const weatherMap = {
            'clear': WEATHER_CONDITIONS.CLEAR,
            'clouds': WEATHER_CONDITIONS.CLOUDS,
            'rain': WEATHER_CONDITIONS.RAIN,
            'drizzle': WEATHER_CONDITIONS.DRIZZLE,
            'thunderstorm': WEATHER_CONDITIONS.THUNDERSTORM,
            'snow': WEATHER_CONDITIONS.SNOW,
            'mist': WEATHER_CONDITIONS.MIST,
            'fog': WEATHER_CONDITIONS.FOG,
            'haze': WEATHER_CONDITIONS.HAZE
        };
        
        return weatherMap[weatherMain] || WEATHER_CONDITIONS.CLEAR;
    } catch (error) {
        console.error('天気予報APIの取得に失敗しました:', error);
        return WEATHER_CONDITIONS.CLEAR; // デフォルトは晴れ
    }
    */
    
    // 現在はデフォルトで晴れを返す
    return WEATHER_CONDITIONS.CLEAR;
}

/**
 * 緯度・経度から日出・日没時刻を計算（将来的な実装）
 * 
 * @param {number} lat - 緯度
 * @param {number} lon - 経度
 * @param {Date} date - 日付（デフォルトは今日）
 * @returns {Object} {sunrise: Date, sunset: Date}
 */
function calculateSunriseSunset(lat, lon, date = new Date()) {
    // TODO: 日出・日没時刻の計算を実装
    // 参考: https://en.wikipedia.org/wiki/Sunrise_equation
    // または: https://github.com/mourner/suncalc などのライブラリを使用
    
    // 現在は簡易的な実装（緯度に基づく概算）
    // 実際の実装では、より正確な計算が必要
    
    return {
        sunrise: new Date(date.setHours(6, 0, 0, 0)), // 仮の値
        sunset: new Date(date.setHours(18, 0, 0, 0))  // 仮の値
    };
}

/**
 * 位置情報を取得して天気と日照時間を考慮した背景を更新
 */
function getLocationAndUpdateBackground() {
    if (!navigator.geolocation) {
        console.log('位置情報が利用できません。デフォルトの時刻を使用します。');
        applyTimeBasedBackground();
        return;
    }
    
    // 位置情報の取得を試みる（ユーザーが既に許可している場合）
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log('位置情報を取得しました:', lat, lon);
            
            // 天気情報を取得（将来的な実装）
            const weatherCondition = await getWeatherFromAPI(lat, lon);
            console.log('天気:', weatherCondition);
            
            // 日照時間を計算（将来的な実装）
            // const { sunrise, sunset } = calculateSunriseSunset(lat, lon);
            // 現在は時刻ベースの判定を使用
            
            // 時間帯を取得
            const timePeriod = getTimePeriod();
            
            // 天気と時間帯を考慮して背景を更新
            updateBackgroundGradient(timePeriod, weatherCondition);
        },
        (error) => {
            console.log('位置情報の取得に失敗しました。デフォルトの時刻を使用します。', error);
            // 位置情報が取得できなくても、時刻ベースで背景を更新
            applyTimeBasedBackground();
        },
        {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000 // 5分間キャッシュを使用
        }
    );
}

/**
 * 時刻ベースで背景を適用（天気情報なし）
 */
function applyTimeBasedBackground() {
    const period = getTimePeriod();
    console.log('時間帯:', period);
    // 天気情報がない場合は晴れとして扱う
    updateBackgroundGradient(period, WEATHER_CONDITIONS.CLEAR);
}

/**
 * 初期化
 */
function initTimeBasedBackground() {
    // ページ読み込み時に背景を更新
    applyTimeBasedBackground();
    
    // 1分ごとに背景を更新（時間帯が変わったときに自動的に更新される）
    setInterval(() => {
        applyTimeBasedBackground();
    }, 60000); // 60秒 = 1分
}

// DOMContentLoaded時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 位置情報の取得を試みる（非同期）
        setTimeout(() => {
            getLocationAndUpdateBackground();
        }, 500); // 少し遅延させて、他のスクリプトが位置情報の許可を処理する時間を与える
    });
} else {
    // 既に読み込み済みの場合
    setTimeout(() => {
        getLocationAndUpdateBackground();
    }, 500);
}

