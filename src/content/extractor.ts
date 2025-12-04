/**
 * Content script for extracting Excalidraw data
 * Runs in the context of excalidraw.com
 */

import type { DrawingData } from '../types/drawing';

const CURRENT_DRAWING_KEY = 'excalisave:currentId';

/**
 * Extract drawing data from Excalidraw's localStorage
 */
function extractDrawingData(): DrawingData | null {
  try {
    const elements = localStorage.getItem('excalidraw');
    const appState = localStorage.getItem('excalidraw-state');
    
    if (!elements) return null;
    
    return {
      elements,
      appState: appState || '{}',
    };
  } catch (error) {
    console.error('[ExcaliSave] Error extracting data:', error);
    return null;
  }
}

/**
 * Load drawing data into Excalidraw
 */
function loadDrawingData(data: DrawingData): void {
  try {
    localStorage.setItem('excalidraw', data.elements);
    localStorage.setItem('excalidraw-state', data.appState);
  } catch (error) {
    console.error('[ExcaliSave] Error loading data:', error);
  }
}

/**
 * Take screenshot of current drawing
 */
async function takeScreenshot(): Promise<string | null> {
  try {
    // Try to use Excalidraw's export function if available
    if (window.ExcalidrawLib?.exportToBlob) {
      const elements = JSON.parse(localStorage.getItem('excalidraw') || '[]');
      const appState = JSON.parse(localStorage.getItem('excalidraw-state') || '{}');
      
      const blob = await window.ExcalidrawLib.exportToBlob({
        elements,
        appState,
        getDimensions: (width: number, height: number) => ({
          width: Math.min(width, 300),
          height: Math.min(height, 200),
          scale: 1,
        }),
      });
      
      return await blobToBase64(blob);
    }
  } catch (error) {
    console.warn('[ExcaliSave] Screenshot failed:', error);
  }
  return null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get current drawing ID stored in page
 */
function getCurrentId(): string | null {
  return localStorage.getItem(CURRENT_DRAWING_KEY);
}

/**
 * Set current drawing ID
 */
function setCurrentId(id: string | null): void {
  if (id) {
    localStorage.setItem(CURRENT_DRAWING_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_DRAWING_KEY);
  }
}

/**
 * Check if there are unsaved changes
 */
function hasContent(): boolean {
  const elements = localStorage.getItem('excalidraw');
  if (!elements) return false;
  const parsed = JSON.parse(elements);
  return Array.isArray(parsed) && parsed.length > 0;
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'EXTRACT_DATA':
        const data = extractDrawingData();
        const preview = await takeScreenshot();
        sendResponse({ data, preview, currentId: getCurrentId() });
        break;
        
      case 'LOAD_DATA':
        loadDrawingData(message.data);
        setCurrentId(message.id);
        // Reload to apply changes
        window.location.reload();
        sendResponse({ success: true });
        break;
        
      case 'SET_CURRENT_ID':
        setCurrentId(message.id);
        sendResponse({ success: true });
        break;
        
      case 'GET_CURRENT_ID':
        sendResponse({ id: getCurrentId() });
        break;
        
      case 'HAS_CONTENT':
        sendResponse({ hasContent: hasContent() });
        break;
        
      case 'NEW_DRAWING':
        localStorage.removeItem('excalidraw');
        localStorage.removeItem('excalidraw-state');
        setCurrentId(null);
        window.location.reload();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  })();
  
  return true; // Keep channel open for async response
});

// Declare ExcalidrawLib on window
declare global {
  interface Window {
    ExcalidrawLib?: {
      exportToBlob: (options: any) => Promise<Blob>;
    };
  }
}

console.log('[ExcaliSave] Content script loaded');
