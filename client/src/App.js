


import React, { useEffect, useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';
// ...existing code...

// Simple Modal component
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button
          className="modal-close-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

// Toast notification component
function Toast({ message, show }) {
  if (!show) return null;
  return (
    <div className="toast-notification">
      <span className="toast-icon">✓</span>
      {message}
    </div>
  );
}

// Emoji picker component
function EmojiPicker({ open, onClose, onSelectEmoji }) {
  const emojis = [
    { emoji: '💡', label: 'Ideas / Brainstorming' },
    { emoji: '📝', label: 'To-Do / Planning' },
    { emoji: '🔨', label: 'In Progress / Building' },
    { emoji: '⚙️', label: 'In Progress / Working' },
    { emoji: '🔧', label: 'Fixing / Maintenance' },
    { emoji: '⏳', label: 'Waiting / On Hold' },
    { emoji: '👀', label: 'Review / Testing' },
    { emoji: '✅', label: 'Done / Completed' },
    { emoji: '✓', label: 'Done / Finished' },
    { emoji: '📌', label: 'Pinned / Important' },
    { emoji: '⚠️', label: 'Issues / Warning' },
    { emoji: '🚫', label: 'Blocked / Rejected' },
    { emoji: '🗑️', label: 'Archived / Removed' },
    { emoji: '🧠', label: 'Research / Learning' },
    { emoji: '🚀', label: 'Launch / Deploy' },
    { emoji: '🎯', label: 'Goals / Targets' },
  ];

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content emoji-picker-modal" onClick={e => e.stopPropagation()}>
        <button
          className="modal-close-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        <h3 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center', color: '#22223b' }}>
          Choose an emoji for your column
        </h3>
        <div className="emoji-grid">
          {emojis.map(({ emoji, label }) => (
            <button
              key={emoji}
              className="emoji-option"
              onClick={() => onSelectEmoji(emoji)}
              title={label}
            >
              <span className="emoji-icon">{emoji}</span>
              <span className="emoji-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Custom code block component with copy button
function CodeBlock({ inline, className, children, onCopy, node, ...props }) {
  const [copied, setCopied] = React.useState(false);
  const codeRef = useRef(null);

  const handleCopy = (e) => {
    e.stopPropagation();
    const code = codeRef.current?.textContent || '';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) onCopy();
    });
  };

  // Check if this is inline code (single backtick) or code block (triple backtick)
  // Inline code doesn't have a language class and inline prop is true
  const isInline = inline !== false && !className?.startsWith('language-');

  // For inline code, return a simple code element
  if (isInline) {
    return <code className={className} {...props}>{children}</code>;
  }

  // For code blocks, add copy button
  return (
    <div className="code-block-wrapper">
      <pre>
        <code ref={codeRef} className={className} {...props}>
          {children}
        </code>
      </pre>
      <button
        className="copy-code-btn"
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
        title={copied ? "Copied!" : "Copy code"}
      >
        {copied ? '✓' : '📋'}
      </button>
    </div>
  );
}


const api = axios.create({ baseURL: 'http://localhost:4000/api' });

// Utility to ensure all column and task ids are strings
function sanitizeColumns(columns) {
  return (columns || []).map(col => ({
    ...col,
    id: String(col.id),
    tasks: (col.tasks || []).map(task => ({
      ...task,
      id: String(task.id)
    }))
  }));
}


function App() {
  // All refs
  const descTextareaRef = useRef(null);
  const descDisplayRef = useRef(null);
  const visibleDescRef = useRef(null);
  const modalContentRef = useRef(null);
  const lastBlurTimeRef = useRef(0);

  // All state
  const [descEditHeight, setDescEditHeight] = useState(60);
  const [descMinWidth, setDescMinWidth] = useState(0);
  const [modalWidth, setModalWidth] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTask, setModalTask] = useState(null);
  const [modalColId, setModalColId] = useState(null);
  const [modalEditTitle, setModalEditTitle] = useState('');
  const [modalEditDesc, setModalEditDesc] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [pendingColumnTitle, setPendingColumnTitle] = useState('');
  const [modalImageAttachments, setModalImageAttachments] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [kanbanFilePath, setKanbanFilePath] = useState('');

  useEffect(() => {
    api.get('/kanban/filepath').then(res => {
      setKanbanFilePath(res.data.filepath || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (editingDesc && descDisplayRef.current) {
      const h = Math.max(60, Math.min(descDisplayRef.current.offsetHeight, 500));
      setDescEditHeight(h);
    }
  }, [modalEditDesc, editingDesc]);

  // Handle code copy with toast notification
  const handleCodeCopy = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Copy card link to clipboard
  const handleCopyCardLink = () => {
    if (!modalTask || !kanbanFilePath) return;
    const link = `${kanbanFilePath}::task-id=${modalTask.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  };

  // Upload image to backend
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await axios.post('http://localhost:4000/api/upload', formData);
    return res.data.filename;
  };

  // Handle paste in description textarea
  const handleDescPaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        try {
          const filename = await uploadImage(file);
          setModalImageAttachments(prev => [...prev, filename]);
        } catch (err) {
          console.error('Failed to upload image:', err);
        }
        return;
      }
    }
  };

  // Remove an image attachment
  const removeImageAttachment = async (filename) => {
    try {
      await axios.delete(`http://localhost:4000/api/files/${filename}`);
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
    setModalImageAttachments(prev => prev.filter(f => f !== filename));
  };

        // Open modal for a card
        const openTaskModal = (colId, task) => {
          setModalColId(colId);
          setModalTask(task);
          setModalEditTitle(task.content || '');
          setModalEditDesc(task.description || '');
          setEditingTitle(false);
          setEditingDesc(!task.description);
          setModalWidth(null);
          setDescMinWidth(0);
          setModalImageAttachments(task.image_attachments || []);
          setModalOpen(true);
        };

        // Save modal edit
        const saveModalEdit = () => {
          if (!modalTask || !modalColId) return;
          const newCols = columns.map(col =>
            col.id === modalColId
              ? {
                  ...col,
                  tasks: col.tasks.map(t =>
                    t.id === modalTask.id
                      ? { ...t, content: modalEditTitle, description: modalEditDesc, image_attachments: modalImageAttachments }
                      : t
                  )
                }
              : col
          );
          setColumnsSanitized(newCols);
          saveState(newCols);
          setModalOpen(false);
        };
      // Delete a column
      const handleDeleteColumn = (colId) => {
        const newCols = columns.filter(col => col.id !== colId);
        setColumnsSanitized(newCols);
        saveState(newCols);
      };
    // Delete a task from a column
    const handleDeleteTask = (colId, taskId) => {
      const newCols = columns.map(col =>
        col.id === colId
          ? { ...col, tasks: col.tasks.filter(task => task.id !== taskId) }
          : col
      );
      setColumnsSanitized(newCols);
      saveState(newCols);
    };
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newTask, setNewTask] = useState({});

  // Debug: log ids before rendering
  useEffect(() => {
    columns.forEach(col => {
    });
  }, [columns]);




  useEffect(() => {
    let mounted = true;
    api.get('/kanban').then(res => {
      if (mounted) {
        const sanitized = sanitizeColumns(res.data.columns);
        setColumns(sanitized);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);



  // Save to backend, but do not reload from backend after save
  const saveState = (cols) => {
    api.post('/kanban', { columns: cols });
  };

  // Always sanitize columns before setting state from backend or external source
  const setColumnsSanitized = (cols) => {
    setColumns(sanitizeColumns(cols));
  };


  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;
    let newColumns = columns.map(col => ({
      ...col,
      tasks: [...col.tasks]
    }));

    if (type === 'COLUMN') {
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);
    } else {
      const srcColIdx = newColumns.findIndex(c => c.id === source.droppableId);
      const destColIdx = newColumns.findIndex(c => c.id === destination.droppableId);
      const srcTasks = [...newColumns[srcColIdx].tasks];
      const destTasks = source.droppableId === destination.droppableId ? srcTasks : [...newColumns[destColIdx].tasks];
      const [removed] = srcTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);
      newColumns[srcColIdx] = {
        ...newColumns[srcColIdx],
        tasks: srcColIdx === destColIdx ? destTasks : srcTasks
      };
      if (srcColIdx !== destColIdx) {
        newColumns[destColIdx] = {
          ...newColumns[destColIdx],
          tasks: destTasks
        };
      }
    }
    setColumnsSanitized(newColumns);
    saveState(newColumns);
  };

  const addColumn = () => {
    if (!newColumnTitle.trim()) return;
    setPendingColumnTitle(newColumnTitle);
    setEmojiPickerOpen(true);
  };

  const handleEmojiSelect = (emoji) => {
    const titleWithEmoji = `${emoji} ${pendingColumnTitle}`;
    const id = pendingColumnTitle.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const newCols = [...columns, { id, title: titleWithEmoji, tasks: [] }];
    setColumnsSanitized(newCols);
    setNewColumnTitle('');
    setPendingColumnTitle('');
    setEmojiPickerOpen(false);
    saveState(newCols);
  };

  const addTask = (colId) => {
    if (!newTask[colId] || !newTask[colId].trim()) return;
    const newCols = columns.map(col =>
      col.id === colId
        ? { ...col, tasks: [...col.tasks, { id: Date.now() + '', content: newTask[colId] }] }
        : col
    );
    setColumnsSanitized(newCols);
    setNewTask({ ...newTask, [colId]: '' });
    saveState(newCols);
  };

  const handleClearCards = () => {
    if (window.confirm('Are you sure you want to clear all cards? Columns will be kept.')) {
      api.post('/kanban/clear-cards').then(res => {
        setColumnsSanitized(res.data.columns || columns.map(col => ({ ...col, tasks: [] })));
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the board? This will delete all columns and cards.')) {
      api.post('/kanban/reset').then(() => {
        setColumnsSanitized([]);
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="App">
      <Toast message="Copied to clipboard!" show={showToast} />
      <h1>Kanban Board</h1>
      <div className="add-column">
        <input
          value={newColumnTitle}
          onChange={e => setNewColumnTitle(e.target.value)}
          placeholder="New column title"
        />
        <button onClick={addColumn}>Add Column</button>
        <button className="clear-cards-btn" onClick={handleClearCards}>CLEAR CARDS</button>
        <button className="reset-btn" onClick={handleReset}>RESET</button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
          {(boardProvided) => (
            <div className="board" ref={boardProvided.innerRef} {...boardProvided.droppableProps}>
              {/* Only Draggable columns and placeholder as direct children */}
              {columns.map((col, colIdx) => (
                <Draggable draggableId={col.id} index={colIdx} key={col.id}>
                  {(columnProvided) => (
                    <div
                      className="column"
                      ref={columnProvided.innerRef}
                      {...columnProvided.draggableProps}
                      {...columnProvided.dragHandleProps}
                    >
                      <div className="column-title-bar">
                        <span className="card-counter">{col.tasks.length}</span>
                        <h2>{col.title}</h2>
                        <button
                          className="delete-column-btn"
                          onClick={() => handleDeleteColumn(col.id)}
                          aria-label="Delete column"
                        >
                          ×
                        </button>
                      </div>
                      <Droppable droppableId={col.id} type="TASK">
                        {(taskListProvided, taskListSnapshot) => (
                          <div
                            className={`task-list${taskListSnapshot.isDraggingOver ? ' dragging-over' : ''}`}
                            ref={taskListProvided.innerRef}
                            {...taskListProvided.droppableProps}
                          >
                            {col.tasks.map((task, idx) => (
                              <Draggable draggableId={task.id} index={idx} key={task.id}>
                                {(taskProvided) => (
                                  <div
                                    className="task"
                                    ref={taskProvided.innerRef}
                                    {...taskProvided.draggableProps}
                                    {...taskProvided.dragHandleProps}
                                    style={{ position: 'relative', ...taskProvided.draggableProps.style }}
                                    onClick={() => openTaskModal(col.id, task)}
                                  >
                                    <div className="task-content">
                                      <div className="task-title">{task.content}</div>
                                      {task.description && (
                                        <div className="task-description-preview">
                                          <ReactMarkdown>
                                            {task.description.length > 50
                                              ? task.description.substring(0, 50) + '...'
                                              : task.description}
                                          </ReactMarkdown>
                                        </div>
                                      )}
                                      {task.image_attachments && task.image_attachments.length > 0 && (
                                        <div className="task-image-indicator">
                                          {task.image_attachments.length} image{task.image_attachments.length > 1 ? 's' : ''}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      className="delete-task-btn"
                                      onClick={e => { e.stopPropagation(); handleDeleteTask(col.id, task.id); }}
                                      aria-label="Delete task"
                                    >
                                      ×
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {taskListProvided.placeholder}
                          </div>
                        )}
                      </Droppable>
                      <div className="add-task">
                        <input
                          value={newTask[col.id] || ''}
                          onChange={e => setNewTask({ ...newTask, [col.id]: e.target.value })}
                          placeholder="New task"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              addTask(col.id);
                            }
                          }}
                        />
                        <button onClick={() => addTask(col.id)}>Add</button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {boardProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>


      {/* Emoji picker modal */}
      <EmojiPicker
        open={emojiPickerOpen}
        onClose={() => { setEmojiPickerOpen(false); setPendingColumnTitle(''); }}
        onSelectEmoji={handleEmojiSelect}
      />

      {/* Modal for editing card */}
      <Modal open={modalOpen} onClose={() => {
        // If a blur event just happened (within 100ms), don't close the modal
        // This means we just exited edit mode, so keep the card open
        const timeSinceBlur = Date.now() - lastBlurTimeRef.current;
        if (timeSinceBlur < 100) {
          // Just exited edit mode, don't close modal
          return;
        }

        // Otherwise, close the modal normally
        setModalOpen(false);
        setModalWidth(null);
        setDescMinWidth(0);
      }}>
        <div
          ref={modalContentRef}
          style={modalWidth ? { minWidth: modalWidth, maxWidth: '75vw' } : { maxWidth: '75vw' }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              saveModalEdit();
            }
          }}
        >
          <button
            className="modal-copy-link-btn"
            onClick={handleCopyCardLink}
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Copy card link"
            title="copy for agent"
          >
            🤖
          </button>
          <div style={{ marginBottom: 18 }}>
          {editingTitle ? (
            <input
              value={modalEditTitle}
              autoFocus
              onBlur={() => {
                lastBlurTimeRef.current = Date.now();
                setEditingTitle(false);
              }}
              onChange={e => setModalEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
              style={{
                width: '100%',
                fontSize: '1.18rem',
                fontWeight: 700,
                marginBottom: 6,
                padding: 6,
                border: '1.5px solid #bfc9d1',
                borderRadius: 6
              }}
            />
          ) : (
            <div
              style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: 6, cursor: 'pointer' }}
              onClick={() => setEditingTitle(true)}
              title="Click to edit title"
            >
              {modalEditTitle || <span style={{ color: '#bfc9d1' }}>Untitled</span>}
            </div>
          )}
          </div>
          <div style={{ marginBottom: 18, position: 'relative', minWidth: editingDesc ? descMinWidth : 0 }}>
          {/* Hidden div for measuring height */}
          <div
            ref={descDisplayRef}
            style={{
              minHeight: 60,
              maxHeight: 500,
              fontSize: '1rem',
              padding: 8,
              borderRadius: 6,
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              zIndex: -1,
              visibility: 'hidden',
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
              boxSizing: 'border-box',
              border: '1.5px solid #e0eafc',
              background: '#f8fafc',
              overflowY: 'auto',
            }}
          >
            {modalEditDesc ? modalEditDesc : 'Click to add description...'}
          </div>
          {editingDesc ? (
            <textarea
              ref={descTextareaRef}
              value={modalEditDesc}
              autoFocus
              onBlur={() => {
                lastBlurTimeRef.current = Date.now();
                setEditingDesc(false);
                setModalWidth(null);
                setDescMinWidth(0);
              }}
              onChange={e => setModalEditDesc(e.target.value)}
              onPaste={handleDescPaste}
              style={{
                width: '100%',
                fontSize: '1rem',
                padding: 8,
                border: '1.5px solid #bfc9d1',
                borderRadius: 6,
                resize: 'none',
                minHeight: 60,
                maxHeight: 500,
                height: descEditHeight,
                overflowY: 'auto',
                boxSizing: 'border-box',
                background: '#f8fafc',
              }}
            />
          ) : (
            <div
              ref={visibleDescRef}
              style={{
                width: '100%',
                minHeight: 60,
                maxHeight: 500,
                color: modalEditDesc ? '#222' : '#bfc9d1',
                fontSize: '1rem',
                padding: 8,
                borderRadius: 6,
                background: '#fff',
                cursor: 'pointer',
                border: '1.5px solid #e0eafc',
                whiteSpace: 'normal',
                overflowY: 'auto',
                wordBreak: 'break-word',
                boxSizing: 'border-box',
              }}
              onClick={() => {
                if (visibleDescRef.current) {
                  setDescMinWidth(visibleDescRef.current.offsetWidth);
                }
                if (modalContentRef.current) {
                  setModalWidth(modalContentRef.current.offsetWidth);
                }
                setEditingDesc(true);
              }}
              title="Click to edit description"
            >
              {modalEditDesc ? (
                <ReactMarkdown
                  components={{
                    code: (props) => <CodeBlock {...props} onCopy={handleCodeCopy} />,
                    p: ({node, ...props}) => <p style={{whiteSpace: 'pre-line'}} {...props} />
                  }}
                >
                  {modalEditDesc}
                </ReactMarkdown>
              ) : (
                'Click to add description...'
              )}
            </div>
          )}
          </div>

          {/* Image attachments */}
          {modalImageAttachments.length > 0 && (
            <div className="image-attachments" style={{ marginBottom: 18 }}>
              {modalImageAttachments.map((filename) => (
                <div key={filename} className="image-attachment-item">
                  <img
                    src={`http://localhost:4000/files/${filename}`}
                    alt="attachment"
                    onClick={() => setPreviewImage(filename)}
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    className="remove-image-btn"
                    onClick={() => removeImageAttachment(filename)}
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setModalOpen(false)}
          >
            Cancel
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={saveModalEdit}
            style={{ fontWeight: 600, background: '#5e60ce', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px' }}
          >
            Save
          </button>
          </div>
        </div>
      </Modal>

      {/* Image preview lightbox */}
      {previewImage && (
        <div className="image-preview-backdrop" onClick={() => setPreviewImage(null)}>
          <img
            src={`http://localhost:4000/files/${previewImage}`}
            alt="preview"
            className="image-preview-img"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default App;
