import { renderHome, renderImport, renderAnalytics } from './views.js';

class App {
  constructor() {
    this.currentView = 'home';
    this.selectedAreaId = 'biwako'; // default
    this.contentEl = document.getElementById('app-content');
    
    this.views = {
      home: () => renderHome(this.selectedAreaId),
      import: () => renderImport(),
      analytics: () => renderAnalytics()
    };
    
    this.init();
  }
  
  init() {
    this.bindNav();
    this.render();
  }
  
  bindNav() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.currentView = view;
        
        // Update active class
        navBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        this.render();
      });
    });
  }
  
  render() {
    // Generate HTML for current view
    const viewHtml = this.views[this.currentView]();
    this.contentEl.innerHTML = viewHtml;
    
    // Initialize icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
    
    // Re-bind view-specific events
    this.bindViewEvents();
  }
  
  bindViewEvents() {
    if (this.currentView === 'home') {
      const areaSelect = document.getElementById('area-select');
      if (areaSelect) {
        areaSelect.addEventListener('change', (e) => {
          this.selectedAreaId = e.target.value;
          this.render(); // Re-render home with new area data
        });
      }
    }
    
    if (this.currentView === 'import') {
      const uploadTrigger = document.getElementById('upload-trigger');
      const fileInput = document.getElementById('upload-input');
      const loader = document.getElementById('ai-loader');
      const resultObj = document.getElementById('ai-result');
      
      if (uploadTrigger && fileInput) {
        uploadTrigger.addEventListener('click', () => {
          fileInput.click();
        });
        
        fileInput.addEventListener('change', () => {
          if (fileInput.files.length > 0) {
            // Fake upload and AI processing
            uploadTrigger.style.display = 'none';
            loader.style.display = 'flex';
            
            setTimeout(() => {
              loader.style.display = 'none';
              resultObj.style.display = 'block';
            }, 2500);
          }
        });
      }
    }
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
