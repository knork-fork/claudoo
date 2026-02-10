# Simple Kanban Board

A simple kanban board application with drag-and-drop functionality.

## Quick Start

```bash
./start_kanban.sh
```

This starts the backend server (port 4000) and frontend React app (port 3000).

## Project Structure

```
/home/luka/Documents/Projects/claudoo/
├── kanban.json                           # Data storage (task/column state)
├── start_kanban.sh                       # Startup script (runs server + client)
└── copilot-agent-playground/
    ├── server.js                         # Backend API server (port 4000)
    └── client/
        ├── public/
        │   └── index.html               # React app entry point
        └── src/
            ├── App.js                   # MAIN APPLICATION FILE ⭐
            ├── App.css                  # Styling
            └── index.js                 # React root

```

## Key Files

### [copilot-agent-playground/client/src/App.js](copilot-agent-playground/client/src/App.js)
**THE MOST IMPORTANT FILE** - Contains all application logic:
- React components for kanban board, columns, tasks, and modal
- Drag-and-drop functionality (react-beautiful-dnd)
- Card editing modal with title and description fields
- State management and API calls to backend

### [kanban.json](kanban.json)
- Persistent data storage for all columns and tasks
- Backend reads/writes to this file
- Structure: `{ columns: [{ id, title, tasks: [{ id, content, description }] }] }`

### [copilot-agent-playground/server.js](copilot-agent-playground/server.js)
- Express.js backend API (port 4000)
- Endpoints: GET/POST `/api/kanban`, POST `/api/kanban/reset`

## Technology Stack

- **Frontend**: React, react-beautiful-dnd, axios
- **Backend**: Node.js, Express
- **Styling**: CSS (App.css)
- **Data**: JSON file storage

## Recent Features

### Card Editing Modal (lines 311-417 in App.js)
- Click-to-edit title and description fields
- **Markdown support** in card descriptions - full markdown rendering including headers, lists, links, etc.
- **Code blocks with copy button** - syntax-highlighted code blocks with one-click copy functionality
- **Image attachments** - upload and attach images to cards
- **Image preview lightbox** - click images to view full-size preview
- **Ctrl+Enter keyboard shortcut** saves and closes modal (lines 313-318)
- **Auto-focus on description** when opening cards with no description (line 64)
- Modal component defined at lines 10-20

### Column Customization
- **Emoji picker** - add emojis to column titles for visual organization
- Column customization modal with emoji selection

### Toast Notifications
- Visual feedback for actions (copy to clipboard, etc.)
- Non-intrusive notifications for user actions

### Key Functions in App.js
- `openTaskModal` (lines 58-66): Opens card for editing
- `saveModalEdit` (lines 68-86): Saves changes to card
- `handleDeleteTask` (lines 95-104): Deletes a task
- `handleDeleteColumn` (lines 89-94): Deletes a column
- `onDragEnd` (lines 144-175): Handles drag-and-drop

## Development Notes

- Backend runs on port 4000
- Frontend React dev server runs on port 3000
- All state changes are immediately persisted to kanban.json
- No database - uses simple JSON file storage
- Drag-and-drop works for both tasks and columns

## UI/UX Features

- Drag tasks between columns
- Drag columns to reorder
- Click card to open editing modal
- Click title/description to edit in modal
- **Ctrl+Enter** in modal to save and close
- Empty descriptions auto-focus for immediate typing
- **Markdown rendering** in card descriptions (bold, italic, lists, code, links, etc.)
- **Code blocks** with syntax highlighting and copy button
- **Image attachments** - upload and display images on cards
- **Image lightbox** - click images for full-size preview
- **Emoji picker** for column customization
- **Copy link to clipboard** button on cards - links can be pasted directly into Claude Code editor extension
- **Toast notifications** for user feedback
- Delete buttons (×) on cards and columns
- Task counter badge on each column
- **Clear all cards** button - removes all cards while keeping columns
- **RESET button** - clears entire board (columns and cards)
