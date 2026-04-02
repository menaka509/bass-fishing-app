export const AREAS = {
  biwako: { name: '琵琶湖', lat: 35.15, lon: 135.98 },
  kasumigaura: { name: '霞ヶ浦', lat: 35.95, lon: 140.35 },
  yodogawa: { name: '淀川', lat: 34.75, lon: 135.53 },
  fujigoko: { name: '富士五湖', lat: 35.48, lon: 138.75 },
  takayama: { name: '高山ダム', lat: 34.77, lon: 136.03 },
  awaji: { name: '淡路島野池群', lat: 34.40, lon: 134.80 },
  fuchuko: { name: '府中湖', lat: 34.25, lon: 133.94 }
};

export const CATEGORIES = [
  'クランクベイト', 'スピナーベイト', 'ミノー・シャッド',
  'バイブレーション', 'トップウォーター', 'テキサスリグ',
  'ラバージグ', 'ダウンショット', 'ネコリグ', 'ノーシンカー', 'その他'
];

// Lure Metadata: Action and Usage (How to Use)
const LURE_METADATA = {
  'クランクベイト': {
    action: 'ミディアム・ファストリトリーブ',
    usage: 'リップをボトムや障害物に当て、跳ね返った直後の浮上で食わせの間を作ります。'
  },
  'スピナーベイト': {
    action: 'スロー〜ミディアムリトリーブ',
    usage: '障害物の周りを舐めるように通します。風で波立っている時、濁りがある時に特に有効です。'
  },
  'ミノー・シャッド': {
    action: 'トゥイッチ＆ポーズ',
    usage: '鋭く2回弾き、1〜2秒止める。追ってきても食わないバスにリアクションで口を使わせます。'
  },
  'バイブレーション': {
    action: 'リフト＆フォール / 速巻き',
    usage: '広範囲を素早く探ります。冬〜春はボトム付近でのリフト＆フォールが特に実績大。'
  },
  'トップウォーター': {
    action: 'ドッグウォーク / ポーズ',
    usage: '朝夕や曇天・雨天時に。アクション後のポーズを長めに取り、水面まで誘い出してください。'
  },
  'テキサスリグ': {
    action: 'ボトムバンプ / ズル引き',
    usage: 'カバー（障害物）の中に直接投げ込み、細かく揺すって誘います。ラインの動きでアタリを取ります。'
  },
  'ラバージグ': {
    action: 'ボトムバンプ / シェイキング',
    usage: 'テキサスより存在感が強いため、濁りが強い時やデカバス狙いのカバー撃ちに最適です。'
  },
  'ダウンショット': {
    action: '一点シェイク / ズル引き',
    usage: 'シンカーをボトムに付けたまま、ワームだけを細かく震わせます。食い渋った時の最終兵器です。'
  },
  'ネコリグ': {
    action: 'シェイキング / ボトムコンタクト',
    usage: 'ボトムに突き刺すような垂直のアクション。複雑なカバーをタイトに攻めるのに向いています。'
  },
  'ノーシンカー': {
    action: 'フォール / トゥイッチ',
    usage: '最も自然なフォール。見えバスがいる時や、プレッシャーが高いエリアで威力を発揮します。'
  },
  'その他': {
    action: '状況に合わせた調整',
    usage: '特殊なリグや最新のルアー。状況を冷静に分析し、最も反応が良い動かし方を探してください。'
  }
};

export let CATCH_HISTORY = [];

export async function loadCatchHistory() {
  try {
    const res = await fetch('catch_history_1200.json');
    if (!res.ok) throw new Error("Failed to load catch history");
    const rawData = await res.json();
    
    // Categorization Logic Refinement: Auto-mapping based on lureName keywords
    CATCH_HISTORY = rawData.map(item => {
      const name = item.lureName || "";
      const isCrankKeyword = /プロト|自作|クランク|handmade|proto/i.test(name);
      
      if (isCrankKeyword) {
        return { ...item, category: 'クランクベイト' };
      }
      return item;
    });
    
    return CATCH_HISTORY;
  } catch (err) {
    console.error(err);
    CATCH_HISTORY = [];
    return [];
  }
}

export function getMoonPhase() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  let c = year - 2000;
  let e = 11 * (c % 19);
  let age = (e + month + day) % 30;
  
  if (age < 2 || age > 28) return '大潮 (新月)';
  if (age > 13 && age < 17) return '大潮 (満月)';
  if (age > 6 && age < 9) return '小潮 (半月)';
  if (age > 21 && age < 24) return '小潮 (半月)';
  return '中潮・若潮';
}

function wmoToWeather(code) {
  if (code <= 3) return '晴れ';
  if (code <= 48) return '曇り';
  return '雨';
}

function windDegreesToDir(deg) {
  const dirs = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
  return dirs[Math.round(deg / 45) % 8];
}

export async function fetchRealWeather(lat, lon) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m`);
    const data = await res.json();
    const current = data.current;
    return {
      temp: current.temperature_2m,
      weather: wmoToWeather(current.weather_code),
      windSpd: current.wind_speed_10m,
      windDir: windDegreesToDir(current.wind_direction_10m),
      moon: getMoonPhase()
    };
  } catch(e) {
    console.warn("Weather API failed", e);
    return { temp: 18, weather: '晴れ', windSpd: 2, windDir: '北西', moon: getMoonPhase() };
  }
}

// Makimono (Moving Bait) Forecast Logic
export function getMakimonoChance(weatherData) {
  let chance = 20; 
  if (weatherData.windSpd > 3) chance += 20;
  if (weatherData.windSpd > 6) chance += 20;
  if (weatherData.weather === '曇り') chance += 20;
  if (weatherData.weather === '雨') chance += 30;
  if (weatherData.moon.includes('大潮')) chance += 10;
  
  return Math.min(chance, 100);
}

// Improved Recommendation - Normalize by situational success rate
export function getHistoryRecommendation(areaId, weatherData) {
  const areaHistory = CATCH_HISTORY.filter(c => c.area === areaId);
  if (areaHistory.length === 0) return [];
  
  let scoreSums = {};
  let catCounts = {};
  CATEGORIES.forEach(c => { scoreSums[c] = 0; catCounts[c] = 0; });
  
  areaHistory.forEach(catchData => {
    let similarity = 1; 
    if (catchData.weather === weatherData.weather) similarity += 3;
    if (Math.abs(catchData.temp - weatherData.temp) <= 4) similarity += 2;
    if (catchData.windDir === weatherData.windDir) similarity += 3;
    
    scoreSums[catchData.category] += similarity;
    catCounts[catchData.category]++;
  });
  
  const results = CATEGORIES
    .filter(cat => catCounts[cat] > 0)
    .map(cat => {
      const matchRate = scoreSums[cat] / (catCounts[cat] * 9); 
      const confidence = Math.log10(catCounts[cat] + 1) * 0.2;
      let makimonoBoost = 0;
      if (['クランクベイト', 'スピナーベイト', 'バイブレーション', 'ミノー・シャッド'].includes(cat)) {
        const mc = getMakimonoChance(weatherData);
        makimonoBoost = (mc / 100) * 0.4; 
      }
      
      const finalScore = matchRate + confidence + makimonoBoost;
      
      return {
        category: cat,
        score: finalScore,
        count: catCounts[cat]
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return results.map((res, index) => {
    const meta = LURE_METADATA[res.category] || LURE_METADATA['その他'];
    return {
      ...res,
      rank: index + 1,
      action: meta.action,
      usage: meta.usage,
      message: `的中率・状況適正ともに良好です。${meta.action}で攻めてください。`
    };
  });
}

// Fixed Situational Analysis - Always show all genres based on global stats if local is missing
export function getGenreSituations(areaId) {
  const areaHistory = CATCH_HISTORY.filter(c => c.area === areaId);
  const stats = {};
  
  CATEGORIES.forEach(cat => {
    let catData = areaHistory.filter(c => c.category === cat);
    let areaCount = catData.length;
    
    if (catData.length < 3) {
      catData = CATCH_HISTORY.filter(c => c.category === cat);
    }
    
    if (catData.length === 0) {
      stats[cat] = {
        count: 0,
        bestWeather: '曇り',
        bestWind: '北',
        avgTemp: 18
      };
      return;
    }
    
    const weathers = {};
    const winds = {};
    let totalTemp = 0;
    
    catData.forEach(c => {
      weathers[c.weather] = (weathers[c.weather] || 0) + 1;
      winds[c.windDir] = (winds[c.windDir] || 0) + 1;
      totalTemp += c.temp;
    });

    const bestWeather = Object.keys(weathers).sort((a, b) => weathers[b] - weathers[a])[0];
    const bestWind = Object.keys(winds).sort((a, b) => winds[b] - winds[a])[0];
    
    stats[cat] = {
      count: areaCount, 
      bestWeather,
      bestWind,
      avgTemp: Math.round(totalTemp / catData.length)
    };
  });
  return stats;
}

export function getSpotRecommendation(areaId, weatherData) {
  const spots = {
    kasumigaura: { '北': '西の州水門周辺 (風裏アシ際)', '南東': '大山エリア (ウィンディーサイド)', '北西': '土浦新川 (風裏)' },
    biwako: { '北': '木浜エリア (風裏ディープ)', '南西': '下物エリア (インサイド風裏)', '北西': '南湖東岸シャロー' }
  };
  let areaSpots = spots[areaId] || {};
  return areaSpots[weatherData.windDir] || 'カレントの当たるストラクチャー周辺';
}
