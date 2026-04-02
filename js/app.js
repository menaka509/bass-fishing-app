import { 
  AREAS, 
  CATCH_HISTORY, 
  loadCatchHistory, 
  fetchRealWeather 
} from './data.js';

import { 
  renderHome, 
  renderImport, 
  renderAnalytics 
} from './views.js';

class App {
  constructor() {
    // Hashed Passcode
    this.passcodeHash = "e4f066af71b27cc8ff3ce5f9e868a3ac33b2a318cbc40e792650c41eeda7f57e";
    
    this.state = {
      authenticated: localStorage.getItem('tsurerun_auth_v2') === 'true',
      view: 'home',
      area: localStorage.getItem('last_area') || 'kasumigaura',
      weather: null,
      currentCoords: null,
      mapInstance: null
    };
    
    this.gateEl = document.getElementById('security-gate');
    this.appRootEl = document.getElementById('app-root');
    this.passcodeInput = document.getElementById('gate-passcode');
    this.passcodeBtn = document.getElementById('gate-submit');
    this.errorEl = document.getElementById('gate-error');
    
    this.contentEl = document.getElementById('app-content');
    this.navBtns = document.querySelectorAll('.nav-btn');
    
    this.setupSecurity();
  }
  
  // SHA-256 Hashing helper
  async sha256(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  setupSecurity() {
    if (this.state.authenticated) {
      this.unlock();
    } else {
      this.passcodeBtn.addEventListener('click', () => this.checkPasscode());
      this.passcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.checkPasscode();
      });
    }
  }

  async checkPasscode() {
    const input = this.passcodeInput.value;
    const inputHash = await this.sha256(input);
    
    if (inputHash === this.passcodeHash) {
      this.state.authenticated = true;
      localStorage.setItem('tsurerun_auth_v2', 'true');
      this.unlock();
    } else {
      this.errorEl.style.display = 'block';
      this.passcodeInput.value = "";
      this.passcodeInput.focus();
    }
  }

  unlock() {
    if (this.gateEl) this.gateEl.style.display = 'none';
    if (this.appRootEl) this.appRootEl.style.display = 'flex';
    this.init();
  }

  async init() {
    await loadCatchHistory();
    this.navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });
    this.navBtns.forEach(b => {
      if (b.dataset.view === this.state.view) b.classList.add('active');
    });
    this.getLocationAndWeather();
    this.render();
  }
  
  async getLocationAndWeather() {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) this.updateAreaWeather();
    }, 5000);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        resolved = true;
        clearTimeout(timeout);
        const { latitude, longitude } = position.coords;
        this.state.currentCoords = { lat: latitude, lon: longitude };
        this.state.weather = await fetchRealWeather(latitude, longitude);
        this.render();
      }, (err) => {
        resolved = true;
        clearTimeout(timeout);
        this.updateAreaWeather();
      });
    } else {
      resolved = true;
      clearTimeout(timeout);
      this.updateAreaWeather();
    }
  }

  async updateAreaWeather() {
    const areaObj = AREAS[this.state.area];
    this.state.weather = await fetchRealWeather(areaObj.lat, areaObj.lon);
    this.render();
  }
  
  async switchView(view) {
    this.state.view = view;
    this.navBtns.forEach(b => {
      b.classList.remove('active');
      if (b.dataset.view === view) b.classList.add('active');
    });
    this.render();
  }
  
  async render() {
    if (this.state.mapInstance) {
      this.state.mapInstance.remove();
      this.state.mapInstance = null;
    }
    if (!this.state.weather) {
      this.contentEl.innerHTML = `<div class="loader-container" style="display:flex;"><div class="spinner"></div><p>気象データを取得中...</p></div>`;
    }
    let html = '';
    switch(this.state.view) {
      case 'home': html = renderHome(this.state); break;
      case 'import': html = renderImport(this.state); break;
      case 'analytics': html = renderAnalytics(this.state); break;
    }
    this.contentEl.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
    this.bindViewEvents();
    if (this.state.view === 'analytics') this.initMap();
  }
  
  bindViewEvents() {
    if (this.state.view === 'home') {
      const areaSelect = document.getElementById('area-select');
      if (areaSelect) {
        areaSelect.addEventListener('change', async (e) => {
          this.state.area = e.target.value;
          this.state.weather = null;
          this.state.currentCoords = null; 
          localStorage.setItem('last_area', this.state.area);
          this.updateAreaWeather();
        });
      }
      const gpsBtn = document.getElementById('gps-refresh-v2');
      if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
          this.state.weather = null;
          this.render();
          this.getLocationAndWeather();
        });
      }
    }
    if (this.state.view === 'import') {
      const uploadTrigger = document.getElementById('upload-trigger');
      const fileInput = document.getElementById('upload-input');
      const loader = document.getElementById('ai-loader');
      const resultObj = document.getElementById('ai-result');
      const resetBtn = document.getElementById('reset-upload');
      if (uploadTrigger && fileInput) {
        uploadTrigger.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
          if (fileInput.files.length > 0) {
            uploadTrigger.style.display = 'none';
            if (loader) loader.style.display = 'flex';
            setTimeout(() => {
              if (loader) loader.style.display = 'none';
              if (resultObj) resultObj.style.display = 'block';
            }, 2500);
          }
        });
      }
      if (resetBtn) resetBtn.addEventListener('click', () => this.render());
    }
  }
  
  initMap() {
    const mapEl = document.getElementById('analytics-map');
    if (!mapEl || !window.L) return;
    const center = this.state.currentCoords ? 
                  [this.state.currentCoords.lat, this.state.currentCoords.lon] : 
                  [AREAS[this.state.area].lat, AREAS[this.state.area].lon];
    const map = window.L.map('analytics-map').setView(center, 12);
    this.state.mapInstance = map;
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    CATCH_HISTORY.forEach(c => {
      if (c.lat && c.lng) {
        const color = c.area === this.state.area ? '#d17a41' : '#8c9a6d';
        window.L.circleMarker([c.lat, c.lng], {
          radius: 10,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.8
        }).addTo(map).bindPopup(`<b>${c.lureName}</b><br>${c.category}<br>${c.size}cm`);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
