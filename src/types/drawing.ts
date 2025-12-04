/**
 * Drawing data structure
 */
export interface Drawing {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  preview?: string;
  data: DrawingData;
}

export interface DrawingData {
  elements: string;
  appState: string;
}

/**
 * Backup structure
 */
export interface Backup {
  id: string;
  drawingId: string;
  timestamp: string;
  data: DrawingData;
}

/**
 * Message types for communication
 */
export enum MessageType {
  SAVE = 'SAVE',
  SAVE_AS = 'SAVE_AS',
  LOAD = 'LOAD',
  DELETE = 'DELETE',
  GET_DRAWINGS = 'GET_DRAWINGS',
  GET_CURRENT = 'GET_CURRENT',
  EXPORT = 'EXPORT',
}

export interface SaveMessage {
  type: MessageType.SAVE;
  payload?: {
    name?: string;
  };
}

export interface SaveAsMessage {
  type: MessageType.SAVE_AS;
  payload: {
    name: string;
  };
}

export interface LoadMessage {
  type: MessageType.LOAD;
  payload: {
    id: string;
  };
}

export interface DeleteMessage {
  type: MessageType.DELETE;
  payload: {
    id: string;
  };
}

export type ExtensionMessage = SaveMessage | SaveAsMessage | LoadMessage | DeleteMessage;
