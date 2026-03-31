import { AREAS, MOCK_WEATHER, MOCK_SPOTS, MOCK_PATTERNS, MOCK_ANALYTICS } from './data.js';

export function renderHome(selectedAreaId) {
  const currentArea = AREAS.find(a => a.id === selectedAreaId) || AREAS[0];
  const weather = MOCK_WEATHER[selectedAreaId] || MOCK_WEATHER.default;
  const spot = MOCK_SPOTS[selectedAreaId] || MOCK_SPOTS.default || MOCK_SPOTS.biwako;
  const patterns = MOCK_PATTERNS[selectedAreaId] || MOCK_PATTERNS.default;

  const areaOptions = AREAS.map(a => 
    `<option value="${a.id}" ${a.id === selectedAreaId ? 'selected' : ''}>${a.name}</option>`
  ).join('');

  const patternsHtml = patterns.map(p => `
    <div class="pattern-card">
      <div class="pattern-rank rank-${p.rank}">${p.rank}</div>
      <div class="pattern-content">
        <h3 class="pattern-title">${p.title}</h3>
        <p class="pattern-desc">${p.desc}</p>
        <div class="pattern-tags">
          ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="view-home">
      <!-- Area Selection -->
      <div class="section-title">
        <i data-lucide="map-pin"></i> 釣行ポイント
      </div>
      <div class="select-wrapper">
        <select id="area-select" class="area-select">
          ${areaOptions}
        </select>
        <i data-lucide="chevron-down" class="select-icon"></i>
      </div>

      <!-- Weather Banner -->
      <div class="section-title">
        <i data-lucide="cloud"></i> 現在の気象条件
      </div>
      <div class="weather-banner">
        <div class="weather-main">
          <div class="temp">${weather.temp}°</div>
          <div class="weather-desc">${weather.desc}</div>
        </div>
        <div class="weather-details">
          <div class="weather-detail-item">
             <i data-lucide="wind" style="width: 14px; height: 14px;"></i>
             ${weather.wind}
          </div>
          <div class="weather-detail-item">
             <i data-lucide="droplets" style="width: 14px; height: 14px;"></i>
             水温: ${weather.waterTemp}°
          </div>
        </div>
      </div>

      <!-- Recommended Spot -->
      <div class="section-title">
        <i data-lucide="map"></i> おすすめスポット
      </div>
      <div class="spot-card">
        <h3 class="spot-name">${spot.name}</h3>
        <p class="spot-reason">${spot.reason}</p>
      </div>

      <!-- Patterns -->
      <div class="section-title">
        <i data-lucide="crosshairs"></i> 本日のAI提案 3パターン
      </div>
      <div class="pattern-list">
        ${patternsHtml}
      </div>
    </div>
  `;
}

export function renderImport() {
  return `
    <div class="view-import" style="padding-top: 20px;">
      <h2 style="font-size: 20px; font-weight: 700; color: var(--primary-dark); margin-bottom: 8px;">過去釣果の取り込み</h2>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;">
        アングラーズアプリなどの釣果画面のスクリーンショットをアップロードすると、AIが情報を自動抽出し、ルアーをカテゴリー別に分類して保存します。
      </p>

      <div class="card">
        <div class="section-title">
          <i data-lucide="image"></i> スクリーンショット選択
        </div>
        
        <input type="file" id="upload-input" accept="image/*" style="display: none;">
        
        <!-- Upload Area -->
        <div class="upload-box" id="upload-trigger">
          <i data-lucide="upload-cloud" class="upload-icon"></i>
          <div class="upload-text">タップしてアップロード</div>
          <div class="upload-subtext">JPEG, PNG（最大5MB）</div>
        </div>

        <!-- Loader Area -->
        <div class="loader-container" id="ai-loader">
          <div class="spinner"></div>
          <div style="font-weight: 600; color: var(--primary-dark);">AIが画像を解析中...</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">天候、ルアー、サイズを抽出・分類しています</div>
        </div>
        
        <!-- Result Area -->
        <div id="ai-result" style="display: none; margin-top: 24px;">
          <div style="background: rgba(140, 154, 109, 0.1); border-left: 4px solid var(--primary-color); padding: 12px; border-radius: 4px; margin-bottom: 16px;">
             <strong>解析完了！</strong> 以下のデータを抽出し保存しました。
          </div>
          
          <div class="result-item">
            <span class="result-label">画像から抽出したルアー</span>
            <span class="result-value">TN60 (JACKALL)</span>
          </div>
          <div class="result-item" style="background: rgba(140, 154, 109, 0.05); padding: 8px -12px; border-radius: 8px;">
            <span class="result-label"><strong>AI自動分類</strong></span>
            <span class="result-value" style="color: var(--primary-color);">バイブレーション</span>
          </div>
          <div class="result-item">
            <span class="result-label">天候抽出</span>
            <span class="result-value">晴れ・微風</span>
          </div>
          <div class="result-item">
            <span class="result-label">サイズ</span>
            <span class="result-value">42cm</span>
          </div>
          
          <button style="width: 100%; padding: 14px; background: var(--primary-color); color: white; border: none; border-radius: 12px; font-weight: bold; font-size: 16px; margin-top: 24px; cursor: pointer;">
            続けてアップロード
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderAnalytics() {
  const chartHtml = MOCK_ANALYTICS.map(item => {
    const percent = Math.round((item.value / item.max) * 100);
    return `
      <div class="bar-row">
        <div class="bar-label">${item.label}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${percent}%;"></div>
        </div>
        <div class="bar-value">${item.value}匹</div>
      </div>
    `;
  }).join('');

  return `
    <div class="view-analytics" style="padding-top: 20px;">
       <h2 style="font-size: 20px; font-weight: 700; color: var(--primary-dark); margin-bottom: 8px;">過去釣果の分析</h2>
       <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;">
        AI分類に基づいて、あなたの過去のヒットルアー傾向から、どのような釣り方が最も実績があるかを確認できます。
      </p>

      <div class="card">
        <div class="section-title">
          <i data-lucide="bar-chart"></i> ルアーカテゴリー別 釣果実績
        </div>
        <div class="bar-chart">
          ${chartHtml}
        </div>
      </div>
      
      <div class="card">
         <div class="section-title">
          <i data-lucide="award"></i> AI 分析サマリー
        </div>
        <p style="font-size: 14px; color: var(--text-dark); line-height: 1.6;">
          あなたは<strong>クランクベイト</strong>など、横の動きによるリアクションの釣りに非常に高い実績を持っています。一方で「ノーシンカー」の実績が少ないため、タフな状況下でのフィネスアプローチを取り入れると、さらなる釣果アップが期待できます。
        </p>
      </div>

    </div>
  `;
}
