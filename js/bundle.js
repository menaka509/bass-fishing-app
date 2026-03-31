// --- Constants & Data ---
const AREAS = {
  biwako: { name: '琵琶湖', lat: 35.15, lon: 135.98 },
  kasumigaura: { name: '霞ヶ浦', lat: 35.95, lon: 140.35 },
  yodogawa: { name: '淀川', lat: 34.75, lon: 135.53 },
  fujigoko: { name: '富士五湖', lat: 35.48, lon: 138.75 },
  takayama: { name: '高山ダム', lat: 34.77, lon: 136.03 },
  awaji: { name: '淡路島野池群', lat: 34.40, lon: 134.80 },
  fuchuko: { name: '府中湖', lat: 34.25, lon: 133.94 }
};

const CATEGORIES = [
  'クランクベイト', 'スピナーベイト', 'ミノー・シャッド',
  'バイブレーション', 'トップウォーター', 'テキサスリグ',
  'ラバージグ', 'ダウンショット', 'ネコリグ', 'ノーシンカー', 'その他'
];

const TACKLE_LIST = [
  { id: 'mkz60', name: 'MKZ60', category: 'クランクベイト' },
  { id: 'legworm', name: 'レッグワーム2.5', category: 'ダウンショット' },
  { id: 'zarivibe', name: 'ザリバイブ Jr.', category: 'バイブレーション' },
  { id: 'tn60', name: 'TN60', category: 'バイブレーション' },
  { id: 'deracoup', name: 'デラクー', category: 'スピナーベイト' },
  { id: 'wildhunch', name: 'ワイルドハンチ', category: 'クランクベイト' },
  { id: 'bellowsgill', name: 'ベローズギル2.8', category: 'テキサスリグ' },
  { id: 'dbuma', name: 'DB UMA FREE 3.8', category: 'ネコリグ' },
  { id: 'kdtricker', name: 'KDトリッカー', category: 'その他' }
];

// --- State ---
let CATCH_HISTORY = [];
let USER_TACKLE_BOX = JSON.parse(localStorage.getItem('user_tackle')) || [];

let state = {
  view: 'home',
  area: 'kasumigaura',
  weather: null,
  mapInstance: null
};

// --- Utilities & API ---
function getMoonPhase() {
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

async function fetchRealWeather(lat, lon) {
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
    console.warn("Weather API failed, using fallback", e);
    return { temp: 15, weather: '晴れ', windSpd: 2, windDir: '北西', moon: getMoonPhase() };
  }
}

// --- Recommend Engine ---
function getHistoryRecommendation(areaId, weatherData) {
  const areaHistory = CATCH_HISTORY.filter(c => c.area === areaId);
  if (areaHistory.length === 0) return null;
  
  // Scoring
  let scores = {};
  CATEGORIES.forEach(c => scores[c] = 0);
  
  areaHistory.forEach(catchData => {
    let score = 1;
    if (catchData.weather === weatherData.weather) score += 2;
    if (Math.abs(catchData.temp - weatherData.temp) <= 3) score += 2;
    if (catchData.windDir === weatherData.windDir) score += 2;
    if (['クランクベイト', 'スピナーベイト', 'バイブレーション'].includes(catchData.category)) score += 1;
    scores[catchData.category] = (scores[catchData.category] || 0) + score;
  });
  
  let bestCategory = null;
  let bestScore = -1;
  CATEGORIES.forEach(c => {
    if (scores[c] > bestScore) {
      bestScore = scores[c];
      bestCategory = c;
    }
  });
  
  if (bestScore === 0) bestCategory = 'ダウンショット';
  
  // Check against Tackle Box
  let recommendedLures = TACKLE_LIST.filter(t => t.category === bestCategory);
  let ownedRecommendations = recommendedLures.filter(t => USER_TACKLE_BOX.includes(t.id));
  
  let message = "";
  if (ownedRecommendations.length > 0) {
    message = `過去データと現在の${weatherData.windDir}風の相性により【${bestCategory}】が最適です！\nあなたのタックルに登録されている『${ownedRecommendations[0].name}』を今のうちに結んでキャストしましょう！\n（本日は${weatherData.moon}のタイミングです）`;
  } else {
    message = `現在【${bestCategory}】が一番実績がありますが、タックルボックスに未登録のようです。もし類似ルアーがあれば投げましょう！\n（本日は${weatherData.moon}のタイミングです）`;
  }
  
  return { category: bestCategory, score: bestScore, message: message, hasOwned: ownedRecommendations.length > 0 };
}

function getSpotRecommendation(areaId, weatherData) {
  const spots = {
    kasumigaura: { '北': '西の州水門周辺 (風裏になるアシ際)', '北東': '古渡エリア (風裏)', '東': '土浦新川 (水温安定)', '南東': '大山エリア (ウィンディーサイド)', '南': '大山エリア (ウィンディーサイド)', '南西': '古渡エリア (ウィンディーサイド)', '西': '西の州水門周辺 (ウィンディーサイド)', '北西': '土浦新川 (風裏)' },
    biwako: { '北': '木浜エリア (風裏ディープ)', '南西': '下物エリア (インサイド風裏)', '東': '南湖西岸', '北西': '南湖東岸シャロー' }
  };
  let areaSpots = spots[areaId] || {};
  return areaSpots[weatherData.windDir] || '定番の実績ポイント';
}

function getTheoreticalRecommendation(weatherData) {
  let lure = "スピナーベイト";
  let reason = "風が吹いたらスピナーベイト。広範囲に風が当たっている状況をテンポよく探りましょう。";
  let tags = ['風', 'サーチ'];
  
  if (weatherData.weather === '晴れ' && weatherData.windSpd < 3) {
    lure = "ダウンショット";
    reason = "無風の晴れはストラクチャーにタイトに付くため、軽量リグでのスローなアプローチがセオリーです。";
    tags = ['無風', 'フィネス'];
  } else if (weatherData.weather === '雨') {
    lure = "トップウォーター";
    reason = "雨による水面へのプレッシャー減で、バスの意識が上を向いています。";
    tags = ['ローライト', '表層'];
  } else if (weatherData.temp < 12) {
    lure = "バイブレーション";
    reason = "低水温期特有のリアクションバイトを誘うため、リフト＆フォールが有効です。";
    tags = ['低水温', 'リアクション'];
  }
  
  return { category: lure, message: reason, tags: tags };
}

// --- View Rendering ---
const appContent = document.getElementById('app-content');

async function renderHome() {
  appContent.innerHTML = `<div class="loader-container" style="display:flex;"><div class="spinner"></div><p>気象APIとリンク中...</p></div>`;
  
  const areaObj = AREAS[state.area];
  state.weather = await fetchRealWeather(areaObj.lat, areaObj.lon);
  
  let rec = getHistoryRecommendation(state.area, state.weather);
  let theoretical = getTheoreticalRecommendation(state.weather);
  let spot = getSpotRecommendation(state.area, state.weather);
  
  let html = `
    <div class="select-wrapper">
      <select class="area-select" id="areaSelect">
        ${Object.keys(AREAS).map(k => `<option value="${k}" ${state.area === k ? 'selected' : ''}>${AREAS[k].name}</option>`).join('')}
      </select>
      <i data-lucide="chevron-down" class="select-icon"></i>
    </div>
    
    <div class="weather-banner">
      <div class="weather-main">
        <div class="temp">${state.weather.temp}°C</div>
        <div class="weather-desc">${state.weather.weather} / 月齢: ${state.weather.moon}</div>
      </div>
      <div class="weather-details">
        <div class="weather-detail-item"><i data-lucide="wind"></i> ${state.weather.windDir} ${state.weather.windSpd}m/s</div>
        <div class="weather-detail-item"><i data-lucide="droplet"></i> 予測水温 ${Math.round(state.weather.temp - 1)}°C</div>
      </div>
    </div>
  `;
  
  if (rec) {
    html += `
      <div class="spot-card">
        <div class="spot-name">🔥 ${rec.category} (実績データ提案)</div>
        <div class="spot-reason">${rec.message}</div>
      </div>
      
      <div class="spot-card" style="border-left-color: var(--secondary-color); background: rgba(160,122,94,0.1);">
        <div class="spot-name"><i data-lucide="map-pin" style="width:16px;height:16px;margin-right:4px;"></i>おすすめポイント</div>
        <div class="spot-reason">現在エリアの「${state.weather.windDir}風」を考慮し、<strong>${spot}</strong> が有望です。</div>
      </div>
    `;
  } else {
    html += `<div class="spot-card"><div class="spot-name">データ収集中...</div><div class="spot-reason">このエリアの釣果データを追加してAIの精度を上げましょう。</div></div>`;
  }
  
  html += `<div class="section-title"><i data-lucide="target"></i> AI マッチング確率</div><div class="pattern-list">`;
  if (rec) {
    html += `
      <div class="pattern-card">
        <div class="pattern-rank rank-1">1</div>
        <div class="pattern-content">
          <div class="pattern-title">${rec.category} <span style="font-size:12px;color:var(--text-muted);font-weight:normal;">- 過去実績ルアー</span></div>
          <div class="pattern-desc">過去の類似状況において最も釣果が集中しています。</div>
          <div class="pattern-tags">
            <span class="tag">風向きマッチ</span>
            <span class="tag">${rec.hasOwned ? "タックルあり" : "タックル未持参"}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  // Add Theoretical Pattern as Rank 2
  html += `
    <div class="pattern-card">
      <div class="pattern-rank rank-2">2</div>
      <div class="pattern-content">
        <div class="pattern-title">${theoretical.category} <span style="font-size:12px;color:var(--text-muted);font-weight:normal;">- ボックスセオリー</span></div>
        <div class="pattern-desc">${theoretical.message}</div>
        <div class="pattern-tags">
          ${theoretical.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
  
  appContent.innerHTML = html;
  
  document.getElementById('areaSelect').addEventListener('change', (e) => {
    state.area = e.target.value;
    renderHome();
  });
  
  lucide.createIcons();
}

function renderImport() {
  appContent.innerHTML = `
    <div class="view-import" style="padding-top: 10px;">
      <div class="card">
        <div class="section-title">
          <i data-lucide="image"></i> スクリーンショット選択
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
          アングラーズアプリなどの釣果画面のスクリーンショットをアップロードすると、AIが情報を自動抽出し、ルアーをカテゴリー別に分類して保存します。
        </p>
        
        <input type="file" id="upload-input" accept="image/*" multiple style="display: none;">
        
        <!-- Upload Area -->
        <div class="upload-box" id="upload-trigger">
          <i data-lucide="upload-cloud" class="upload-icon"></i>
          <div class="upload-text">タップしてアップロード</div>
          <div class="upload-subtext">JPEG, PNG（一括処理可能）</div>
        </div>

        <!-- Loader Area -->
        <div class="loader-container" id="ai-loader" style="display: none; padding: 30px 0;">
          <div class="spinner"></div>
          <div style="font-weight: 600; color: var(--primary-dark); margin-top: 15px;">AIが画像を解析中...</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">天候、ルアー、サイズを抽出・分類しています</div>
        </div>
        
        <!-- Result Area -->
        <div id="ai-result" style="display: none; margin-top: 24px;">
          <div style="background: rgba(140, 154, 109, 0.1); border-left: 4px solid var(--primary-color); padding: 12px; border-radius: 4px; margin-bottom: 16px;">
             <strong>解析完了！</strong> 以下のデータを抽出し保存しました。
          </div>
          
          <div class="result-item">
            <span class="result-label">抽出したルアー</span>
            <span class="result-value">ワイルドハンチ</span>
          </div>
          <div class="result-item" style="background: rgba(140, 154, 109, 0.05); padding: 8px 12px; border-radius: 8px; margin: 8px 0;">
            <span class="result-label" style="font-weight: bold;">AI自動分類</span>
            <span class="result-value" style="color: var(--primary-color); font-weight: bold;">クランクベイト</span>
          </div>
          <div class="result-item">
            <span class="result-label">サイズ</span>
            <span class="result-value">46cm</span>
          </div>
          <div class="result-item">
            <span class="result-label">天候抽出</span>
            <span class="result-value">曇り・北西風</span>
          </div>
          
          <button id="reset-upload" style="width: 100%; padding: 14px; background: var(--primary-color); color: white; border: none; border-radius: 12px; font-weight: bold; font-size: 16px; margin-top: 24px; cursor: pointer;">
            続けてアップロード
          </button>
        </div>
      </div>
    </div>
    
    <div class="card" id="recent-catches-card">
      <div class="section-title"><i data-lucide="database"></i> 最近の登録データ</div>
      <div class="result-list">
        ${CATCH_HISTORY.slice(0, 5).map(c => `
          <div class="result-item">
            <span class="result-label">${c.date}</span>
            <span class="result-value">${c.lureName} (${c.size}cm)</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // mock interaction
  const uploadTrigger = document.getElementById('upload-trigger');
  const fileInput = document.getElementById('upload-input');
  const loader = document.getElementById('ai-loader');
  const resultObj = document.getElementById('ai-result');
  const resetBtn = document.getElementById('reset-upload');
  const recentCard = document.getElementById('recent-catches-card');
  
  if (uploadTrigger && fileInput) {
    uploadTrigger.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        // Fake upload and AI processing
        uploadTrigger.style.display = 'none';
        recentCard.style.display = 'none'; // 集中させるために非表示
        loader.style.display = 'flex';
        
        setTimeout(() => {
          loader.style.display = 'none';
          resultObj.style.display = 'block';
        }, 2500);
      }
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      fileInput.value = '';
      resultObj.style.display = 'none';
      uploadTrigger.style.display = 'flex';
      recentCard.style.display = 'block';
    });
  }
  
  lucide.createIcons();
}

function getDetailedAnalyticsHtml() {
  if (CATCH_HISTORY.length === 0) return `<p>データがありません。</p>`;
  
  function generateDynamicCommentary(cat, count, avgTemp, avgWat, bestWeather, bestWind) {
    let comment = `${count}匹のデータ分析から、<strong>${cat}</strong>は`;
    
    // 天候に関する分析
    if (bestWeather !== '-') {
      comment += `主に<strong>「${bestWeather}」</strong>の日に実績が集中しています。`;
    }
    
    // 風に関する分析
    if (bestWind !== '-' && bestWind !== '無風') {
      comment += `特に<strong>「${bestWind}風」</strong>が当たるタイミングでバスの捕食スイッチが入りやすい特徴が出ています。`;
    } else if (bestWind === '無風') {
      comment += `風波が立たない<strong>「無風」</strong>状態でのアプローチでルアーの力が最大限発揮されています。`;
    }
    
    // 水温に関する分析
    if (avgWat !== '-') {
      let tempDesc = "";
      if (avgWat >= 22) tempDesc = "バスの適水温〜高水温期";
      else if (avgWat <= 13) tempDesc = "タフな低水温期";
      else tempDesc = "水温が安定している状況";
      
      comment += `また、平均水温<strong>${avgWat}°C</strong>（${tempDesc}）での使用が最も効果的だという傾向が読み取れます。`;
    }
    return comment;
  }

  let stats = {};
  CATCH_HISTORY.forEach(c => {
    if (!stats[c.category]) {
      stats[c.category] = { count: 0, temps: [], waterTemps: [], weather: {}, wind: {} };
    }
    stats[c.category].count++;
    if (c.temp) stats[c.category].temps.push(c.temp);
    if (c.waterTemp) stats[c.category].waterTemps.push(c.waterTemp);
    
    if (c.weather) stats[c.category].weather[c.weather] = (stats[c.category].weather[c.weather] || 0) + 1;
    if (c.windDir) stats[c.category].wind[c.windDir] = (stats[c.category].wind[c.windDir] || 0) + 1;
  });
  
  let sortedCats = Object.keys(stats).sort((a, b) => stats[b].count - stats[a].count);
  
  let html = `<div class="pattern-list">`;
  
  sortedCats.forEach(cat => {
    let s = stats[cat];
    let avgTemp = s.temps.length ? (s.temps.reduce((a, b) => a + b, 0) / s.temps.length).toFixed(1) : '-';
    let avgWat = s.waterTemps.length ? (s.waterTemps.reduce((a, b) => a + b, 0) / s.waterTemps.length).toFixed(1) : '-';
    
    let bestWeather = Object.keys(s.weather).length ? Object.keys(s.weather).reduce((a, b) => s.weather[a] > s.weather[b] ? a : b) : '-';
    let bestWind = Object.keys(s.wind).length ? Object.keys(s.wind).reduce((a, b) => s.wind[a] > s.wind[b] ? a : b) : '-';
    
    let commentary = generateDynamicCommentary(cat, s.count, avgTemp, avgWat, bestWeather, bestWind);
    
    html += `
      <div class="pattern-card">
        <div class="pattern-content">
          <div class="pattern-title">${cat} <span style="font-size:12px; font-weight:normal; color:var(--text-muted)">(${s.count}匹)</span></div>
          <div class="pattern-desc" style="font-size: 13px; color: var(--text-dark); margin-bottom: 8px; line-height: 1.5;">
            ${commentary}
          </div>
          <div class="pattern-tags">
            <span class="tag">平均気温 ${avgTemp}°C</span>
            <span class="tag">平均水温 ${avgWat}°C</span>
            <span class="tag">${bestWeather}に強い</span>
            <span class="tag">${bestWind}風に強い</span>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

function renderAnalytics() {
  let html = `
    <div class="card">
      <div class="section-title"><i data-lucide="map-pin"></i> 釣果GPSヒートマップ</div>
      <div id="analytics-map"></div>
    </div>
    
    <div class="card">
      <div class="section-title"><i data-lucide="pie-chart"></i> カテゴリー別 実績</div>
      <div class="bar-chart">
  `;
  
  let catCounts = {};
  CATCH_HISTORY.forEach(c => {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1;
  });
  
  let sortedCats = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);
  let maxCount = sortedCats.length > 0 ? catCounts[sortedCats[0]] : 1;
  
  sortedCats.forEach(c => {
    let pct = (catCounts[c] / maxCount) * 100;
    html += `
      <div class="bar-row">
        <div class="bar-label">${c}</div>
        <div class="bar-track"><div class="bar-fill" style="width: ${pct}%"></div></div>
        <div class="bar-value">${catCounts[c]}件</div>
      </div>
    `;
  });
  
  html += `</div></div>`;
  
  html += `
    <div class="card">
      <div class="section-title"><i data-lucide="list"></i> ルアーカテゴリー別 詳細プロファイル</div>
      ${getDetailedAnalyticsHtml()}
    </div>
  `;
  
  appContent.innerHTML = html;
  
  lucide.createIcons();
  
  // Render Map
  setTimeout(() => {
    if (state.mapInstance) {
        state.mapInstance.remove();
    }
    const bounds = AREAS[state.area] || AREAS['kasumigaura'];
    state.mapInstance = L.map('analytics-map').setView([bounds.lat, bounds.lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(state.mapInstance);
    
    // Draw catches
    CATCH_HISTORY.forEach(c => {
      if (c.lat && c.lng && c.area === state.area) { // Only show for current area
        L.circleMarker([c.lat, c.lng], {
          radius: 12,
          fillColor: '#d17a41',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(state.mapInstance).bindPopup(`<b>${c.lureName}</b><br>${c.category} - ${c.size}cm<br>${c.date}`);
      } else if (c.lat && c.lng) {
          // Add others as gray standard markers
        L.circleMarker([c.lat, c.lng], {
          radius: 6,
          fillColor: '#8c9a6d',
          color: '#ffffff',
          weight: 1,
          opacity: 0.5,
          fillOpacity: 0.6
        }).addTo(state.mapInstance).bindPopup(`<b>${c.lureName}</b><br>${c.category} - ${c.size}cm`);
      }
    });
  }, 100);
}

function renderTackle() {
  let html = `
    <div class="card">
      <div class="section-title"><i data-lucide="briefcase"></i> マイ・タックルボックス</div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">現在手持ちのルアーを登録すると、AIが「今投げるべきルアー」を直接指示します。</p>
      
      <div class="tackle-grid">
  `;
  
  TACKLE_LIST.forEach(t => {
    const isOwned = USER_TACKLE_BOX.includes(t.id);
    html += `
      <div class="tackle-item ${isOwned ? 'owned' : ''}" data-id="${t.id}">
        <div class="tackle-name">${t.name}</div>
        <div class="tackle-cat">${t.category}</div>
        <div class="tackle-toggle"><i data-lucide="check"></i></div>
      </div>
    `;
  });
  
  html += `</div></div>`;
  appContent.innerHTML = html;
  
  // Attach events
  document.querySelectorAll('.tackle-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (USER_TACKLE_BOX.includes(id)) {
        USER_TACKLE_BOX = USER_TACKLE_BOX.filter(i => i !== id);
      } else {
        USER_TACKLE_BOX.push(id);
      }
      localStorage.setItem('user_tackle', JSON.stringify(USER_TACKLE_BOX));
      renderTackle(); // re-render
    });
  });
  
  lucide.createIcons();
}

// --- Init & Nav ---
async function init() {
  try {
    const res = await fetch('catch_history_1200.json');
    if (!res.ok) throw new Error("Failed to load fetch_history");
    const jsonStr = await res.text();
    CATCH_HISTORY = JSON.parse(jsonStr);
  } catch (err) {
    console.error(err);
    CATCH_HISTORY = [];
  }
  
  updateView();
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      state.view = targetBtn.dataset.view;
      updateView();
    });
  });
}

function updateView() {
  if (state.mapInstance) {
      state.mapInstance.remove();
      state.mapInstance = null;
  }
  
  if (state.view === 'home') renderHome();
  else if (state.view === 'import') renderImport();
  else if (state.view === 'analytics') renderAnalytics();
  else if (state.view === 'tackle') renderTackle();
}

// Start
init();
