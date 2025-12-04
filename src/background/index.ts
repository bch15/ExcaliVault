/**
 * Background service worker
 * Handles auto-save, keyboard shortcuts, and message routing
 */

import {
  getAllDrawings,
  getDrawing,
  saveNewDrawing,
  updateDrawing,
  deleteDrawing,
  getCurrentDrawingId,
  setCurrentDrawingId,
  getBackups,
  restoreFromBackup,
} from '../lib/storage';

const AUTO_SAVE_INTERVAL = 20000; // 20 seconds in milliseconds

/**
 * Setup auto-save interval (every 20 seconds)
 */
setInterval(performAutoSave, AUTO_SAVE_INTERVAL);

/**
 * Perform auto-save
 */
async function performAutoSave(): Promise<void> {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith('https://excalidraw.com')) {
      return;
    }

    // Get current drawing ID
    const currentId = await getCurrentDrawingId();
    if (!currentId) {
      return; // No current drawing to save
    }

    // Extract data from page
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_DATA' });
    if (!response?.data) {
      return;
    }

    // Update drawing
    await updateDrawing(currentId, response.data, response.preview);
    
    // Notify content script about auto-save
    await chrome.tabs.sendMessage(tab.id, { type: 'AUTO_SAVE_COMPLETE' });
    
    // Update badge to show save happened
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 2000);
    
    console.log('[ExcaliSave] Auto-saved:', currentId);
  } catch (error) {
    console.error('[ExcaliSave] Auto-save failed:', error);
  }
}

/**
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith('https://excalidraw.com')) {
    return;
  }

  switch (command) {
    case 'save':
      await handleSave(tab.id);
      break;
    case 'save-as':
      // Open popup for save-as dialog
      chrome.action.openPopup();
      break;
  }
});

/**
 * Handle save command
 */
async function handleSave(tabId: number): Promise<void> {
  try {
    const currentId = await getCurrentDrawingId();
    const response = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_DATA' });
    
    if (!response?.data) {
      console.warn('[ExcaliSave] No data to save');
      return;
    }

    if (currentId) {
      // Update existing
      await updateDrawing(currentId, response.data, response.preview);
      showSaveNotification('Saved!');
    } else {
      // Need to show save dialog - open popup
      chrome.action.openPopup();
    }
  } catch (error) {
    console.error('[ExcaliSave] Save failed:', error);
  }
}

/**
 * Show save notification via badge
 */
function showSaveNotification(text: string): void {
  chrome.action.setBadgeText({ text: '✓' });
  chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 2000);
}

/**
 * Handle messages from popup
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'GET_ALL_DRAWINGS':
          const drawings = await getAllDrawings();
          sendResponse({ success: true, drawings });
          break;

        case 'GET_DRAWING':
          const drawing = await getDrawing(message.id);
          sendResponse({ success: true, drawing });
          break;

        case 'SAVE_NEW':
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab?.id) {
            sendResponse({ success: false, error: 'No active tab' });
            return;
          }
          const extractResponse = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_DATA' });
          if (!extractResponse?.data) {
            sendResponse({ success: false, error: 'No data to save' });
            return;
          }
          const newDrawing = await saveNewDrawing(
            message.name,
            extractResponse.data,
            extractResponse.preview
          );
          // Update content script with new ID
          await chrome.tabs.sendMessage(tab.id, { type: 'SET_CURRENT_ID', id: newDrawing.id });
          sendResponse({ success: true, drawing: newDrawing });
          break;

        case 'UPDATE_DRAWING':
          const [updateTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!updateTab?.id) {
            sendResponse({ success: false, error: 'No active tab' });
            return;
          }
          const updateResponse = await chrome.tabs.sendMessage(updateTab.id, { type: 'EXTRACT_DATA' });
          if (!updateResponse?.data) {
            sendResponse({ success: false, error: 'No data to save' });
            return;
          }
          const updated = await updateDrawing(message.id, updateResponse.data, updateResponse.preview);
          sendResponse({ success: true, drawing: updated });
          break;

        case 'LOAD_DRAWING':
          const loadDrawing = await getDrawing(message.id);
          if (!loadDrawing) {
            sendResponse({ success: false, error: 'Drawing not found' });
            return;
          }
          const [loadTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!loadTab?.id) {
            sendResponse({ success: false, error: 'No active tab' });
            return;
          }
          await chrome.tabs.sendMessage(loadTab.id, {
            type: 'LOAD_DATA',
            data: loadDrawing.data,
            id: loadDrawing.id,
          });
          await setCurrentDrawingId(loadDrawing.id);
          sendResponse({ success: true });
          break;

        case 'DELETE_DRAWING':
          await deleteDrawing(message.id);
          sendResponse({ success: true });
          break;

        case 'GET_CURRENT_ID':
          const currentId = await getCurrentDrawingId();
          sendResponse({ success: true, id: currentId });
          break;

        case 'NEW_DRAWING':
          const [newTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (newTab?.id) {
            await chrome.tabs.sendMessage(newTab.id, { type: 'NEW_DRAWING' });
            await setCurrentDrawingId(null);
          }
          sendResponse({ success: true });
          break;

        case 'GET_BACKUPS':
          const backups = await getBackups(message.drawingId);
          sendResponse({ success: true, backups });
          break;

        case 'RESTORE_BACKUP':
          const restored = await restoreFromBackup(message.backupId);
          sendResponse({ success: !!restored, drawing: restored });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[ExcaliSave] Message handler error:', error);
      sendResponse({ success: false, error: String(error) });
    }
  })();

  return true; // Keep channel open for async
});

console.log('[ExcaliSave] Background script loaded');
