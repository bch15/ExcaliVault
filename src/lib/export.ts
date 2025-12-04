import type { DrawingData } from '../types/drawing';

/**
 * Export drawing as .excalidraw file
 */
export function exportAsExcalidraw(name: string, data: DrawingData): void {
  const content = {
    type: 'excalidraw',
    version: 2,
    source: 'excalisave',
    elements: JSON.parse(data.elements),
    appState: JSON.parse(data.appState),
  };
  
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: 'application/json',
  });
  
  downloadFile(blob, `${name}.excalidraw`);
}

/**
 * Export drawing as PNG (requires canvas rendering)
 */
export async function exportAsPNG(name: string, preview?: string): Promise<void> {
  if (!preview) {
    console.warn('No preview available for PNG export');
    return;
  }
  
  // Convert base64 to blob
  const response = await fetch(preview);
  const blob = await response.blob();
  
  downloadFile(blob, `${name}.png`);
}

/**
 * Download file helper
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
