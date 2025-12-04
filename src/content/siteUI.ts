/**
 * Site UI Injection - Adds floating save button to excalidraw.com
 * Developer: Behzad Chaharbaghi
 */

// Track if there are unsaved changes
let hasUnsavedChanges = false;
let lastSavedData = '';

/**
 * Convert Gregorian date to Persian/Shamsi date
 */
function toPersianDate(date: Date): string {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy = date.getFullYear();
  const gm = date.getMonth();
  const gd = date.getDate();
  
  let gy2 = (gm > 1) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) 
             + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm];
  
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  
  // Format: 14030914 (compact, no dashes)
  return `${jy}${String(jm).padStart(2, '0')}${String(jd).padStart(2, '0')}`;
}

/**
 * Get current drawing data from Excalidraw localStorage
 */
function getCurrentDrawingData(): string {
  return localStorage.getItem('excalidraw') || '';
}

/**
 * Check if drawing has changed since last save
 */
function checkForChanges(): void {
  const currentData = getCurrentDrawingData();
  if (currentData && currentData !== lastSavedData) {
    hasUnsavedChanges = true;
  }
}

/**
 * Check for pending file load from sessionStorage
 */
function checkPendingLoad(): void {
  const pendingElements = sessionStorage.getItem('excalisave:pending:elements');
  const pendingState = sessionStorage.getItem('excalisave:pending:state');
  const pendingName = sessionStorage.getItem('excalisave:pending:name');
  
  if (pendingElements) {
    // Clear pending data first
    sessionStorage.removeItem('excalisave:pending:elements');
    sessionStorage.removeItem('excalisave:pending:state');
    sessionStorage.removeItem('excalisave:pending:name');
    
    // Apply to localStorage
    localStorage.setItem('excalidraw', pendingElements);
    if (pendingState) {
      localStorage.setItem('excalidraw-state', pendingState);
    }
    
    // Store loaded filename
    if (pendingName) {
      localStorage.setItem('excalisave:loadedFile', pendingName);
    }
    
    // Force page reload to apply
    location.reload();
  }
}

// Inject floating toolbar
function injectToolbar(): void {
  // Check if already injected
  if (document.getElementById('excalisave-toolbar')) return;

  // Find the Excalidraw top-left menu
  const excalidrawMenu = document.querySelector('.App-menu_top__left');

  const toolbar = document.createElement('div');
  toolbar.id = 'excalisave-toolbar';
  toolbar.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap');
      
      #excalisave-toolbar,
      #excalisave-toolbar *,
      .excalisave-toast,
      .excalisave-autosave-toast,
      .excalisave-indicator,
      #excalisave-drawer,
      #excalisave-drawer * {
        font-family: 'Vazirmatn', 'Segoe UI', Tahoma, sans-serif !important;
      }
      
      #excalisave-toolbar {
        top: 19px !important;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: 10px;
        direction: rtl;
      }
      
      .excalisave-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 6px 10px;
        border: none;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(8px);
      }
      
      .excalisave-btn:hover {
        transform: translateY(-1px) scale(1.02);
      }
      
      .excalisave-btn:active {
        transform: scale(0.98);
      }
      
      /* Save - Purple */
      .excalisave-btn-save {
        background: rgba(139, 92, 246, 0.9);
        color: white;
        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
      }
      .excalisave-btn-save:hover {
        background: rgba(139, 92, 246, 1);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
      }
      
      /* Load - Green */
      .excalisave-btn-load {
        background: rgba(16, 185, 129, 0.9);
        color: white;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }
      .excalisave-btn-load:hover {
        background: rgba(16, 185, 129, 1);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      }
      
      /* Library - Blue */
      .excalisave-btn-library {
        background: rgba(59, 130, 246, 0.9);
        color: white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }
      .excalisave-btn-library:hover {
        background: rgba(59, 130, 246, 1);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }
      
      /* New - Gray/Neutral */
      .excalisave-btn-new {
        background: rgba(75, 85, 99, 0.9);
        color: white;
        box-shadow: 0 2px 8px rgba(75, 85, 99, 0.3);
      }
      .excalisave-btn-new:hover {
        background: rgba(75, 85, 99, 1);
        box-shadow: 0 4px 12px rgba(75, 85, 99, 0.4);
      }
      
      .excalisave-toast {
        position: fixed;
        top: 120px;
        left: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        z-index: 100000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        direction: rtl;
      }
      
      .excalisave-autosave-toast {
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 100000;
        animation: fadeInOut 2s ease;
        direction: ltr;
      }
      
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-10px); }
        15% { opacity: 1; transform: translateX(0); }
        85% { opacity: 1; }
        100% { opacity: 0; }
      }
      
      .excalisave-indicator {
        display: flex;
        align-items: center;
        gap: 4px;
        top: 19px !important;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 11px;
        margin-right: 29px;
        direction: ltr;
      }
      
      .excalisave-indicator.active {
        display: block;
      }
      
      .excalisave-indicator.unsaved::after {
        content: ' •';
        color: #ef4444;
      }
      
      .excalisave-indicator.hidden {
        display: none;
      }
      
      .excalisave-btn svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
      }
    </style>
    
    <button class="excalisave-btn excalisave-btn-save" id="excalisave-save" title="ذخیره (Ctrl+S)">
      <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      ذخیره
    </button>
    <button class="excalisave-btn excalisave-btn-load" id="excalisave-load" title="بارگذاری فایل">
      <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      بارگذاری
    </button>
    <button class="excalisave-btn excalisave-btn-library" id="excalisave-open" title="کتابخانه (Ctrl+Shift+O)">
      <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      کتابخانه
    </button>
    <button class="excalisave-btn excalisave-btn-new" id="excalisave-new" title="صفحه جدید">
      <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      جدید
    </button>
  `;

  // Insert toolbar after Excalidraw menu or fallback to body
  if (excalidrawMenu) {
    excalidrawMenu.insertAdjacentElement('afterend', toolbar);
  } else {
    // Fallback: fixed position if menu not found
    toolbar.style.cssText = 'position: fixed; top: 12px; left: 60px; z-index: 99999;';
    document.body.appendChild(toolbar);
  }
  
  // Create and insert indicator next to top-right buttons (Share button)
  const indicator = document.createElement('div');
  indicator.className = 'excalisave-indicator hidden';
  indicator.id = 'excalisave-indicator';
  indicator.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> <span id="excalisave-name">بدون نام</span>';
  
  const topRight = document.querySelector('.excalidraw-ui-top-right');
  if (topRight) {
    topRight.insertAdjacentElement('beforebegin', indicator);
  } else {
    // Fallback: fixed position
    indicator.style.cssText = 'position: fixed; top: 12px; right: 200px; z-index: 99999;';
    indicator.classList.remove('hidden');
    document.body.appendChild(indicator);
  }

  // Event listeners
  document.getElementById('excalisave-save')?.addEventListener('click', handleSave);
  document.getElementById('excalisave-open')?.addEventListener('click', handleOpen);
  document.getElementById('excalisave-load')?.addEventListener('click', handleLoad);
  document.getElementById('excalisave-new')?.addEventListener('click', handleNew);

  // Update indicator with current drawing name
  updateIndicator();
  
  // Store initial data
  lastSavedData = getCurrentDrawingData();
  
  // Check for changes periodically
  setInterval(checkForChanges, 2000);
}

/**
 * Handle new button - Opens a blank canvas
 */
function handleNew(): void {
  // Clear all stored references
  localStorage.removeItem('excalisave:currentId');
  localStorage.removeItem('excalisave:loadedFile');
  
  // Clear sessionStorage pending data
  sessionStorage.removeItem('excalisave:pending:elements');
  sessionStorage.removeItem('excalisave:pending:state');
  sessionStorage.removeItem('excalisave:pending:name');
  
  // Clear Excalidraw data
  localStorage.removeItem('excalidraw');
  localStorage.removeItem('excalidraw-state');
  
  showToast('✨ صفحه جدید...');
  
  // Reload to apply
  setTimeout(() => {
    location.assign(location.origin);
  }, 100);
}

/**
 * Handle load button - Opens file picker to load .excalidraw file
 */
function handleLoad(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.excalidraw,.json';
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Get filename without extension
      const fileName = file.name.replace(/\.(excalidraw|json)$/i, '');
      
      // Store pending data in sessionStorage
      sessionStorage.setItem('excalisave:pending:elements', 
        data.elements ? JSON.stringify(data.elements) : '[]');
      sessionStorage.setItem('excalisave:pending:state', 
        data.appState ? JSON.stringify(data.appState) : '{}');
      sessionStorage.setItem('excalisave:pending:name', fileName);
      
      showToast('✅ در حال بارگذاری...');
      
      // Navigate to origin URL (fresh load)
      setTimeout(() => {
        location.assign(location.origin);
      }, 100);
      
    } catch (error) {
      showToast('❌ خطا در بارگذاری فایل!');
    }
  };
  
  input.click();
}

/**
 * Handle save button click - Downloads .excalidraw file
 */
async function handleSave(): Promise<void> {
  try {
    // Get drawing data from localStorage
    const elements = localStorage.getItem('excalidraw');
    const appState = localStorage.getItem('excalidraw-state');
    
    if (!elements || JSON.parse(elements).length === 0) {
      showToast('❌ هیچ طرحی برای ذخیره وجود ندارد!');
      return;
    }
    
    // Get Persian date
    const persianDate = toPersianDate(new Date());
    
    // Prompt for name
    const userInput = prompt('نام طرح را وارد کنید:', 'MyDrawing');
    if (!userInput) return;
    
    // Create .excalidraw file content
    const fileContent = {
      type: 'excalidraw',
      version: 2,
      source: 'https://excalidraw.com',
      elements: JSON.parse(elements),
      appState: {
        ...JSON.parse(appState || '{}'),
        collaborators: [],
      },
      files: {},
    };
    
    // Create blob and download
    const blob = new Blob([JSON.stringify(fileContent, null, 2)], {
      type: 'application/json',
    });
    
    const filename = `${persianDate}_${userInput}.excalidraw`;
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also save to extension storage
    const response = await chrome.runtime.sendMessage({ 
      type: 'SAVE_NEW', 
      name: `${persianDate}_${userInput}` 
    });
    
    if (response?.success) {
      localStorage.setItem('excalisave:currentId', response.drawing.id);
      hasUnsavedChanges = false;
      lastSavedData = getCurrentDrawingData();
    }
    
    showToast(`✅ ذخیره شد: ${filename}`);
    updateIndicator();
    
  } catch (error) {
    showToast('❌ ذخیره ناموفق بود!');
  }
}

/**
 * Handle open button click - Shows inline library drawer
 */
async function handleOpen(): Promise<void> {
  // Check if drawer already exists
  let drawer = document.getElementById('excalisave-drawer');
  
  if (drawer) {
    // Toggle visibility
    drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
    return;
  }
  
  // Create drawer
  drawer = document.createElement('div');
  drawer.id = 'excalisave-drawer';
  drawer.innerHTML = `
    <style>
      #excalisave-drawer {
        position: fixed;
        top: 0;
        right: 0;
        width: 320px;
        height: 100vh;
        background: #1a1a2e;
        color: #eaeaea;
        z-index: 99999;
        box-shadow: -4px 0 20px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow-y: auto;
      }
      
      .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #2d3748;
        background: #16213e;
      }
      
      .drawer-header h2 {
        margin: 0;
        font-size: 16px;
      }
      
      .drawer-close {
        background: none;
        border: none;
        color: #eaeaea;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
      }
      
      .drawer-content {
        padding: 16px;
      }
      
      .drawing-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #0f3460;
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .drawing-item:hover {
        background: #1a4a7a;
      }
      
      .drawing-thumb {
        width: 50px;
        height: 40px;
        background: #fff;
        border-radius: 4px;
        object-fit: cover;
      }
      
      .drawing-info {
        flex: 1;
        overflow: hidden;
      }
      
      .drawing-name {
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .drawing-date {
        font-size: 11px;
        color: #a0a0a0;
      }
      
      .drawing-delete {
        background: none;
        border: none;
        color: #ef4444;
        font-size: 16px;
        cursor: pointer;
        padding: 4px 8px;
        opacity: 0.7;
      }
      
      .drawing-delete:hover {
        opacity: 1;
      }
      
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #a0a0a0;
      }
    </style>
    
    <div class="drawer-header">
      <h2>📚 کتابخانه طرح‌ها</h2>
      <button class="drawer-close" id="drawer-close">✕</button>
    </div>
    <div class="drawer-content" id="drawer-list">
      <div class="empty-state">در حال بارگذاری...</div>
    </div>
  `;
  
  document.body.appendChild(drawer);
  
  // Close button
  document.getElementById('drawer-close')?.addEventListener('click', () => {
    drawer!.style.display = 'none';
  });
  
  // Load drawings
  await loadDrawerContent();
}

/**
 * Load drawer content with saved drawings
 */
async function loadDrawerContent(): Promise<void> {
  const listEl = document.getElementById('drawer-list');
  if (!listEl) return;
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_DRAWINGS' });
    
    if (!response?.success || !response.drawings?.length) {
      listEl.innerHTML = '<div class="empty-state">📄 هیچ طرح ذخیره شده‌ای وجود ندارد<br><small>برای ذخیره Ctrl+S را فشار دهید</small></div>';
      return;
    }
    
    listEl.innerHTML = response.drawings.map((d: any) => `
      <div class="drawing-item" data-id="${d.id}">
        ${d.preview ? `<img class="drawing-thumb" src="${d.preview}" alt="">` : '<div class="drawing-thumb" style="display:flex;align-items:center;justify-content:center;color:#666;">📄</div>'}
        <div class="drawing-info">
          <div class="drawing-name">${d.name}</div>
          <div class="drawing-date">${new Date(d.updatedAt).toLocaleDateString('fa-IR')}</div>
        </div>
        <button class="drawing-delete" data-id="${d.id}" title="حذف">🗑️</button>
      </div>
    `).join('');
    
    // Add click handlers
    listEl.querySelectorAll('.drawing-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('drawing-delete')) return;
        
        const id = item.getAttribute('data-id');
        if (id) {
          await loadDrawing(id);
        }
      });
    });
    
    // Delete handlers
    listEl.querySelectorAll('.drawing-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id && confirm('آیا از حذف این طرح مطمئن هستید؟')) {
          await chrome.runtime.sendMessage({ type: 'DELETE_DRAWING', id });
          await loadDrawerContent();
          showToast('🗑️ حذف شد');
        }
      });
    });
    
  } catch (error) {
    listEl.innerHTML = '<div class="empty-state">❌ خطا در بارگذاری طرح‌ها</div>';
  }
}

/**
 * Load a drawing from storage
 */
async function loadDrawing(id: string): Promise<void> {
  try {
    // First get the drawing details
    const getResponse = await chrome.runtime.sendMessage({ type: 'GET_DRAWING', id });
    if (getResponse?.success && getResponse.drawing) {
      // Store the name for indicator
      localStorage.setItem('excalisave:loadedFile', getResponse.drawing.name);
      localStorage.setItem('excalisave:currentId', id);
    }
    
    const response = await chrome.runtime.sendMessage({ type: 'LOAD_DRAWING', id });
    if (response?.success) {
      // Hide drawer and update indicator
      document.getElementById('excalisave-drawer')!.style.display = 'none';
      updateIndicator();
      showToast('📄 در حال بارگذاری...');
    }
  } catch (error) {
    showToast('❌ خطا در بارگذاری!');
  }
}

/**
 * Update the indicator with current drawing name
 */
async function updateIndicator(): Promise<void> {
  const currentId = localStorage.getItem('excalisave:currentId');
  const loadedFile = localStorage.getItem('excalisave:loadedFile');
  const indicator = document.getElementById('excalisave-indicator');
  const nameEl = document.getElementById('excalisave-name');
  
  if (!indicator || !nameEl) return;
  
  // Check for loaded file first
  if (loadedFile) {
    nameEl.textContent = loadedFile;
    indicator.classList.remove('hidden');
    return;
  }
  
  if (currentId) {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_DRAWING', id: currentId });
      if (response?.success && response.drawing) {
        nameEl.textContent = response.drawing.name;
        indicator.classList.remove('hidden');
        
        // Show unsaved indicator
        if (hasUnsavedChanges) {
          indicator.classList.add('unsaved');
        } else {
          indicator.classList.remove('unsaved');
        }
      }
    } catch (error) {
      indicator.classList.add('hidden');
    }
  } else {
    indicator.classList.add('hidden');
  }
}

/**
 * Show toast notification
 */
function showToast(message: string): void {
  // Remove existing toast
  document.getElementById('excalisave-toast')?.remove();
  
  const toast = document.createElement('div');
  toast.id = 'excalisave-toast';
  toast.className = 'excalisave-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 2500);
}

/**
 * Show auto-save notification (top-left, subtle)
 */
function showAutoSaveToast(): void {
  // Remove existing
  document.getElementById('excalisave-autosave-toast')?.remove();
  
  const toast = document.createElement('div');
  toast.id = 'excalisave-autosave-toast';
  toast.className = 'excalisave-autosave-toast';
  toast.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" style="margin-left:4px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> ذخیره خودکار';
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 2000);
}

// Check for pending load first (before page is fully loaded)
checkPendingLoad();

// Inject after page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectToolbar);
} else {
  injectToolbar();
}

// Listen for keyboard shortcuts - use CAPTURE phase to intercept before Excalidraw
// Use keyCode to work with any keyboard language (Persian, Arabic, etc.)
document.addEventListener('keydown', (e) => {
  // keyCode 83 = 'S' key (works regardless of keyboard language)
  if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) {
    e.preventDefault();
    e.stopImmediatePropagation(); // Stop Excalidraw from handling it
    handleSave();
  }
}, true); // true = capture phase

// Warn before closing if unsaved changes
window.addEventListener('beforeunload', (e) => {
  const currentId = localStorage.getItem('excalisave:currentId');
  const currentData = getCurrentDrawingData();
  
  // Check if there's content and no save yet, OR unsaved changes
  const hasContent = currentData && JSON.parse(currentData).length > 0;
  
  if ((!currentId && hasContent) || hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = 'تغییرات ذخیره نشده دارید. آیا مطمئن هستید که می‌خواهید خارج شوید؟';
    return e.returnValue;
  }
});

// Listen for auto-save notifications from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'AUTO_SAVE_COMPLETE') {
    showAutoSaveToast();
    hasUnsavedChanges = false;
    lastSavedData = getCurrentDrawingData();
    updateIndicator();
  }
});

console.log('[ExcaliSave] Site UI injected');
