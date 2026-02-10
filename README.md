# Claudoo

##### 🚀🚀🚀 Claude + To-Do 🚀🚀🚀

A simple drag-and-drop kanban board for organizing your daily workload with built-in integration for coding agents.

<img width="2251" height="1582" alt="Image" src="https://github.com/user-attachments/assets/3540a2a5-6032-444f-a7bb-13e94a78c68d" />

## Quick Start

The easiest way to run the application is using the startup script from the project root:

```bash
./start_kanban.sh
```

This automatically starts both the backend server and frontend application.

## Features

- **Drag and drop** tasks between columns and reorder columns
- **Markdown support** in card descriptions with syntax-highlighted code blocks
- **Image attachments** with full-size preview
- **Claude Code and Copilot Agent integration**: Copy card links that can be pasted directly into agent editor extensions - Claude and Copilot will read the card description and open any attached images (local environment only)
- **Keyboard shortcut**: `Ctrl+Enter` to save and close cards
- **Persistent storage**: All changes automatically saved to `kanban.json`

## Manual Setup

If you prefer to run the services separately:

### Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Backend
```bash
node server.js
```

### Frontend
```bash
cd client
npm start
```

The frontend will be available at **http://localhost:3000** and the backend at **http://localhost:4000**.

## Project Structure

- `server.js` - Express backend API
- `client/` - React frontend application
- `kanban.json` - Data storage file (in project root)
- `start_kanban.sh` - Convenient startup script