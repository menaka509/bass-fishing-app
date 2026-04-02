import { 
  AREAS, 
  CATCH_HISTORY, 
  getHistoryRecommendation, 
  getSpotRecommendation,
  getGenreSituations,
  getMakimonoChance 
} from './data.js';

export function renderHome(state) {
  const weather = state.weather;
  const areaName = state.currentCoords ? "現在地 (GPS)" : AREAS[state.area].name;
  
  if (!weather) {
    return `<div class="loader-container" style="display:flex;"><div class="spinner"></div><p>気象データを取得中...</p></div>`;
  }

  const recommendations = getHistoryRecommendation(state.area, weather);
  const spot = getSpotRecommendation(state.area, weather);
  const makimonoChance = getMakimonoChance(weather);

  const lat = state.currentCoords ? state.currentCoords.lat : AREAS[state.area].lat;
  const lon = state.currentCoords ? state.currentCoords.lon : AREAS[state.area].lon;
  const gMapsBase = `https://www.google.com/maps/search/?api=1&query_place_id=${lat},${lon}&query=`;
  const tackleLink = `${gMapsBase}${encodeURIComponent('釣具店')}`;
  const foodLink = `${gMapsBase}${encodeURIComponent('飲食店')}`;

  const top1 = recommendations[0];
  const others = recommendations.slice(1, 4); 

  return `
    <div class="view-home">
      <div class="section-title">
        <i data-lucide="map-pin"></i> 釣行エリア
      </div>
      <div class="area-header" style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
        <div class="select-wrapper" style="flex: 1; margin-bottom: 0;">
          <select class="area-select" id="area-select">
            ${Object.keys(AREAS).map(k => `<option value="${k}" ${state.area === k ? 'selected' : ''}>${AREAS[k].name}</option>`).join('')}
          </select>
          <i data-lucide="chevron-down" class="select-icon"></i>
        </div>
      </div>

      <!-- IMPROVED REFRESH BUTTON -->
      <button id="gps-refresh-v2" class="refresh-btn-premium">
        <i data-lucide="navigation"></i>
        <span>現在地の天候を取得</span>
      </button>

      <!-- MAKIMONO CHANCE FORECAST -->
      <div class="section-title"><i data-lucide="wind"></i> 巻物チャンス予報</div>
      <div class="card" style="padding: 24px; background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); margin-bottom: 24px; position: relative; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
          <div style="font-size: 14px; font-weight: 800; color: var(--primary-dark);">ハードルアー期待値</div>
          <div style="font-size: 32px; font-weight: 950; color: ${makimonoChance > 60 ? '#d35400' : 'var(--primary-color)'}; line-height: 1;">${makimonoChance}%</div>
        </div>
        <div style="width: 100%; height: 12px; background: rgba(0,0,0,0.06); border-radius: 10px; overflow: hidden;">
          <div style="width: ${makimonoChance}%; height: 100%; background: linear-gradient(90deg, #3498db, #2980b9); border-radius: 10px; transition: width 1.5s cubic-bezier(0.23, 1, 0.32, 1);"></div>
        </div>
        <p style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-top: 10px; display: flex; align-items: center; gap: 4px;">
          <i data-lucide="info" style="width:12px;"></i> ${makimonoChance > 60 ? '巻物日和です！ハードルアーを積極的に投げましょう。' : 'フィネスへの切り替えも視野に入れてください。'}
        </p>
      </div>
      
      <div class="section-title"><i data-lucide="zap"></i> 的中率重視：推奨ルアーTOP3</div>
      
      ${top1 ? `
        <!-- RANK 1 -->
        <div class="card definitive-card" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: white; padding: 28px; border-radius: 24px; box-shadow: 0 15px 35px rgba(90, 104, 75, 0.3); border: none; margin-bottom: 16px;">
          <div style="text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 2px; opacity: 0.8; margin-bottom: 8px;">Rank 1</div>
          <div style="font-size: 28px; font-weight: 950; margin-bottom: 16px; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">${top1.category}</div>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: rgba(255,255,255,0.12); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.2);">
              <div style="font-size: 11px; font-weight: 800; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; color: #fff; opacity: 0.9;">
                <i data-lucide="play-circle" style="width: 14px;"></i> 推奨アクション
              </div>
              <div style="font-size: 14px; font-weight: 700;">${top1.action}</div>
            </div>
            <div style="background: rgba(255,255,255,0.08); padding: 16px; border-radius: 16px; border: 1px dashed rgba(255,255,255,0.3);">
              <div style="font-size: 11px; font-weight: 800; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; color: #fff; opacity: 0.9;">
                <i data-lucide="help-circle" style="width: 14px;"></i> 使い方のコツ
              </div>
              <div style="font-size: 13px; font-weight: 600; line-height: 1.5; color: rgba(255,255,255,0.95);">${top1.usage}</div>
            </div>
          </div>
        </div>

        <!-- RANK 2 & 3 -->
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
          ${others.map(rec => `
            <div class="card" style="margin-bottom:0; padding:18px; border-left: 6px solid var(--primary-light);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-size:11px; text-transform:uppercase; font-weight:800; color:var(--text-muted);">Rank ${rec.rank}</div>
                <div style="font-size:16px; font-weight:900; color:var(--primary-dark);">${rec.category}</div>
              </div>
              <p style="font-size:12px; font-weight:700; color:var(--text-dark); background: rgba(0,0,0,0.03); padding: 8px 12px; border-radius: 8px; margin-bottom: 8px;">
                <strong>アクション:</strong> ${rec.action}
              </p>
              <p style="font-size:11px; font-weight:600; color:var(--text-muted); line-height: 1.4;">
                ${rec.usage}
              </p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="section-title">
        <i data-lucide="cloud"></i> ${areaName} の気象
      </div>
      <div class="weather-banner" style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);">
        <div class="weather-main">
          <div class="temp">${weather.temp}°C</div>
          <div class="weather-desc">${weather.weather} / ${weather.moon}</div>
        </div>
        <div class="weather-details">
          <div class="weather-detail-item"><i data-lucide="wind" style="width:14px;"></i> ${weather.windDir} ${weather.windSpd}m/s</div>
          <div class="weather-detail-item"><i data-lucide="droplets" style="width:14px;"></i> 水温予測 ${Math.round(weather.temp - 0.8)}°C</div>
        </div>
      </div>

      <div class="section-title"><i data-lucide="external-link"></i> 周辺情報を調べる</div>
      <div class="shortcut-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <a href="${tackleLink}" target="_blank" class="card" style="margin-bottom:0; display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; padding: 16px;">
          <i data-lucide="shopping-cart" style="color: var(--accent-color);"></i>
          <span style="font-weight: 700; color: var(--text-dark); font-size: 14px;">釣具店</span>
        </a>
        <a href="${foodLink}" target="_blank" class="card" style="margin-bottom:0; display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; padding: 16px;">
          <i data-lucide="utensils" style="color: #e67e22;"></i>
          <span style="font-weight: 700; color: var(--text-dark); font-size: 14px;">飲食店</span>
        </a>
      </div>

      ${spot ? `
        <div class="section-title"><i data-lucide="award"></i> AI推奨スポット</div>
        <div class="spot-card">
          <div class="spot-name"><i data-lucide="navigation" style="width:16px;height:16px;margin-right:4px;"></i> ${spot}</div>
          <p class="spot-reason">現在の「${weather.windDir}風」において最も実績ポイントに近接しています。</p>
        </div>
      ` : ''}
    </div>
  `;
}

export function renderImport() {
  return `
    <div class="view-import" style="padding-top: 10px;">
      <div class="card">
        <h2 style="font-size: 18px; font-weight: 800; color: var(--primary-dark); margin-bottom: 8px;">過去釣果の取り込み</h2>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">スクリーンショットから釣果データを自動抽出・学習します。</p>
        
        <input type="file" id="upload-input" accept="image/*" style="display: none;">
        <div class="upload-box" id="upload-trigger">
          <i data-lucide="upload-cloud" class="upload-icon"></i>
          <div class="upload-text">画像をアップロード</div>
        </div>

        <div class="loader-container" id="ai-loader" style="display: none; padding: 30px 0;">
          <div class="spinner"></div>
          <div style="font-weight: 600; color: var(--primary-dark); margin-top: 15px;">AI解析中...</div>
        </div>
        
        <div id="ai-result" style="display: none; margin-top: 24px;">
          <div style="background: rgba(140, 154, 109, 0.1); border-left: 4px solid var(--primary-color); padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 13px;">
             <strong>解析完了！</strong> カテゴリー：クランクベイトとして保存しました。
          </div>
          <button id="reset-upload" style="width: 100%; padding: 14px; background: var(--primary-color); color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">
            続けてアップロード
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderAnalytics(state) {
  const weather = state.weather;
  const genreStats = getGenreSituations(state.area);
  
  if (!genreStats) {
    return `<div class="card" style="text-align: center; padding: 40px;"><p>分析可能なデータがありません。</p></div>`;
  }

  const sortedStats = Object.keys(genreStats).sort((a, b) => genreStats[b].count - genreStats[a].count);

  return `
    <div class="view-analytics">
      <div class="section-title"><i data-lucide="bar-chart-2"></i> ジャンル別・実績シチュエーション分析</div>
      
      <div class="stats-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
        ${sortedStats.map(cat => {
          const s = genreStats[cat];
          return `
            <div class="card" style="margin-bottom:0; padding:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-size:16px; font-weight:900; color:var(--primary-dark);">${cat}</div>
                <div style="font-size:11px; font-weight:800; background:rgba(0,0,0,0.05); padding:4px 10px; border-radius:20px;">実績 ${s.count}件</div>
              </div>
              <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
                <div style="text-align:center;">
                  <div style="font-size:10px; font-weight:800; color:var(--text-muted); margin-bottom:4px;">最適天気</div>
                  <div style="font-size:13px; font-weight:800; color:var(--primary-color);">${s.bestWeather}</div>
                </div>
                <div style="text-align:center;">
                  <div style="font-size:10px; font-weight:800; color:var(--text-muted); margin-bottom:4px;">黄金風向き</div>
                  <div style="font-size:13px; font-weight:800; color:var(--primary-color);">${s.bestWind}風</div>
                </div>
                <div style="text-align:center;">
                  <div style="font-size:10px; font-weight:800; color:var(--text-muted); margin-bottom:4px;">平均ヒット温</div>
                  <div style="font-size:13px; font-weight:800; color:var(--primary-color);">${s.avgTemp}℃</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="card" style="margin-top: 24px;">
        <div class="section-title" style="margin-top: 0;"><i data-lucide="map"></i> 実績ヒートマップ</div>
        <div id="analytics-map" style="height: 350px; border-radius: 16px; margin-top: 12px; z-index: 1;"></div>
      </div>
    </div>
  `;
}
