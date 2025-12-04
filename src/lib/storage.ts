import type { Drawing, DrawingData, Backup } from '../types/drawing';

const DRAWINGS_KEY = 'excalisave:drawings';
const CURRENT_KEY = 'excalisave:current';
const BACKUPS_KEY = 'excalisave:backups';
const MAX_BACKUPS = 5;

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all drawings from storage
 */
export async function getAllDrawings(): Promise<Drawing[]> {
  const result = await chrome.storage.local.get(DRAWINGS_KEY);
  return (result[DRAWINGS_KEY] as Drawing[] | undefined) || [];
}

/**
 * Get a single drawing by ID
 */
export async function getDrawing(id: string): Promise<Drawing | null> {
  const drawings = await getAllDrawings();
  return drawings.find(d => d.id === id) || null;
}

/**
 * Save a new drawing
 */
export async function saveNewDrawing(name: string, data: DrawingData, preview?: string): Promise<Drawing> {
  const drawings = await getAllDrawings();
  const now = new Date().toISOString();
  
  const drawing: Drawing = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    preview,
    data,
  };
  
  drawings.push(drawing);
  await chrome.storage.local.set({ [DRAWINGS_KEY]: drawings });
  await setCurrentDrawingId(drawing.id);
  await createBackup(drawing.id, data);
  
  return drawing;
}

/**
 * Update existing drawing
 */
export async function updateDrawing(id: string, data: DrawingData, preview?: string): Promise<Drawing | null> {
  const drawings = await getAllDrawings();
  const index = drawings.findIndex(d => d.id === id);
  
  if (index === -1) return null;
  
  drawings[index] = {
    ...drawings[index],
    updatedAt: new Date().toISOString(),
    data,
    preview: preview || drawings[index].preview,
  };
  
  await chrome.storage.local.set({ [DRAWINGS_KEY]: drawings });
  await createBackup(id, data);
  
  return drawings[index];
}

/**
 * Delete a drawing
 */
export async function deleteDrawing(id: string): Promise<void> {
  const drawings = await getAllDrawings();
  const filtered = drawings.filter(d => d.id !== id);
  await chrome.storage.local.set({ [DRAWINGS_KEY]: filtered });
  
  // Clear current if deleted
  const currentId = await getCurrentDrawingId();
  if (currentId === id) {
    await setCurrentDrawingId(null);
  }
  
  // Delete backups
  await deleteBackupsForDrawing(id);
}

/**
 * Get current drawing ID
 */
export async function getCurrentDrawingId(): Promise<string | null> {
  const result = await chrome.storage.local.get(CURRENT_KEY);
  return (result[CURRENT_KEY] as string | undefined) || null;
}

/**
 * Set current drawing ID
 */
export async function setCurrentDrawingId(id: string | null): Promise<void> {
  if (id) {
    await chrome.storage.local.set({ [CURRENT_KEY]: id });
  } else {
    await chrome.storage.local.remove(CURRENT_KEY);
  }
}

/**
 * Create a backup
 */
async function createBackup(drawingId: string, data: DrawingData): Promise<void> {
  const result = await chrome.storage.local.get(BACKUPS_KEY);
  const allBackups: Backup[] = (result[BACKUPS_KEY] as Backup[] | undefined) || [];
  
  // Get backups for this drawing
  const drawingBackups = allBackups.filter(b => b.drawingId === drawingId);
  const otherBackups = allBackups.filter(b => b.drawingId !== drawingId);
  
  // Add new backup
  const newBackup: Backup = {
    id: `backup_${Date.now()}`,
    drawingId,
    timestamp: new Date().toISOString(),
    data,
  };
  
  // Keep only last MAX_BACKUPS
  const updatedDrawingBackups = [...drawingBackups, newBackup].slice(-MAX_BACKUPS);
  
  await chrome.storage.local.set({
    [BACKUPS_KEY]: [...otherBackups, ...updatedDrawingBackups]
  });
}

/**
 * Get backups for a drawing
 */
export async function getBackups(drawingId: string): Promise<Backup[]> {
  const result = await chrome.storage.local.get(BACKUPS_KEY);
  const allBackups: Backup[] = (result[BACKUPS_KEY] as Backup[] | undefined) || [];
  return allBackups.filter(b => b.drawingId === drawingId);
}

/**
 * Restore from backup
 */
export async function restoreFromBackup(backupId: string): Promise<Drawing | null> {
  const result = await chrome.storage.local.get(BACKUPS_KEY);
  const allBackups: Backup[] = (result[BACKUPS_KEY] as Backup[] | undefined) || [];
  const backup = allBackups.find(b => b.id === backupId);
  
  if (!backup) return null;
  
  return updateDrawing(backup.drawingId, backup.data);
}

/**
 * Delete backups for a drawing
 */
async function deleteBackupsForDrawing(drawingId: string): Promise<void> {
  const result = await chrome.storage.local.get(BACKUPS_KEY);
  const allBackups: Backup[] = (result[BACKUPS_KEY] as Backup[] | undefined) || [];
  const filtered = allBackups.filter(b => b.drawingId !== drawingId);
  await chrome.storage.local.set({ [BACKUPS_KEY]: filtered });
}
