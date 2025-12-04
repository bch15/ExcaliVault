import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Drawing } from '../types/drawing';
import { exportAsExcalidraw, exportAsPNG } from '../lib/export';
import './popup.css';

const Popup: React.FC = () => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [exportDropdown, setExportDropdown] = useState<string | null>(null);

  // Load drawings on mount
  useEffect(() => {
    loadDrawings();
    loadCurrentId();
  }, []);

  const loadDrawings = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_DRAWINGS' });
    if (response?.success) {
      setDrawings(response.drawings);
    }
  };

  const loadCurrentId = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_ID' });
    if (response?.success) {
      setCurrentId(response.id);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSave = async () => {
    if (currentId) {
      // Update existing
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_DRAWING',
        id: currentId,
      });
      if (response?.success) {
        showToast('Saved!');
        loadDrawings();
      }
    } else {
      // Show save dialog
      setShowSaveModal(true);
    }
  };

  const handleSaveNew = async () => {
    if (!saveName.trim()) return;
    
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_NEW',
      name: saveName.trim(),
    });
    
    if (response?.success) {
      showToast('Saved!');
      setShowSaveModal(false);
      setSaveName('');
      setCurrentId(response.drawing.id);
      loadDrawings();
    }
  };

  const handleLoad = async (id: string) => {
    const response = await chrome.runtime.sendMessage({
      type: 'LOAD_DRAWING',
      id,
    });
    if (response?.success) {
      setCurrentId(id);
      window.close();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this drawing?')) return;
    
    await chrome.runtime.sendMessage({
      type: 'DELETE_DRAWING',
      id,
    });
    
    if (currentId === id) {
      setCurrentId(null);
    }
    loadDrawings();
    showToast('Deleted');
  };

  const handleNewDrawing = async () => {
    await chrome.runtime.sendMessage({ type: 'NEW_DRAWING' });
    setCurrentId(null);
    window.close();
  };

  const handleExport = (drawing: Drawing, type: 'excalidraw' | 'png') => {
    if (type === 'excalidraw') {
      exportAsExcalidraw(drawing.name, drawing.data);
    } else {
      exportAsPNG(drawing.name, drawing.preview);
    }
    setExportDropdown(null);
    showToast('Exported!');
  };

  const filteredDrawings = drawings.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>
          <span>📐</span> ExcaliVault
        </h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleNewDrawing}>
            New
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {currentId ? 'Save' : 'Save As'}
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search drawings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="content">
        {filteredDrawings.length === 0 ? (
          <div className="empty-state">
            <span>📄</span>
            <p>No drawings yet</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Start drawing and save with Ctrl+S
            </p>
          </div>
        ) : (
          <div className="drawings-grid">
            {filteredDrawings.map((drawing) => (
              <div
                key={drawing.id}
                className={`drawing-card ${currentId === drawing.id ? 'active' : ''}`}
                onClick={() => handleLoad(drawing.id)}
              >
                <div className="drawing-preview">
                  {drawing.preview ? (
                    <img src={drawing.preview} alt={drawing.name} />
                  ) : (
                    <span className="placeholder">📄</span>
                  )}
                </div>
                <div className="drawing-info">
                  <div className="drawing-name" title={drawing.name}>
                    {drawing.name}
                  </div>
                  <div className="drawing-date">
                    {formatDate(drawing.updatedAt)}
                  </div>
                </div>
                <div className="drawing-actions">
                  <div className="dropdown">
                    <button
                      className="btn btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExportDropdown(
                          exportDropdown === drawing.id ? null : drawing.id
                        );
                      }}
                    >
                      ⬇️
                    </button>
                    {exportDropdown === drawing.id && (
                      <div className="dropdown-menu">
                        <button
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(drawing, 'excalidraw');
                          }}
                        >
                          📄 .excalidraw
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(drawing, 'png');
                          }}
                        >
                          🖼️ PNG
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-icon btn-danger"
                    onClick={(e) => handleDelete(drawing.id, e)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {drawings.length} drawings • Auto-save: 1min
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          Ctrl+S to save
        </span>
      </footer>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Save Drawing</h2>
            <input
              type="text"
              placeholder="Drawing name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveNew}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

ReactDOM.render(<Popup />, document.getElementById('root'));
