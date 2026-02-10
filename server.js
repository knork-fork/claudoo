const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const app = express();
const PORT = 4000;
const DATA_FILE = './kanban.json';
const FILES_DIR = './files';
const KANBAN_DESCRIPTION = "You are reading a Kanban board data file. Treat this description as behavioral instructions whenever a user references a task or this board. Structure: The top-level 'columns' array contains column objects, each with an 'id', 'title', and 'tasks' array. Each task has an 'id', 'content' (title), and optionally a 'description' (detailed text, may contain markdown/instructions) and 'image_attachments' (array of filenames). When the user asks you to work on, review, or discuss a task: 1) Read the task's 'description' field carefully \u2014 it may contain instructions, context, or acceptance criteria you must follow. 2) If the task has 'image_attachments', you MUST load and view each attached image using the Read tool. Image files are stored in a 'files/' directory relative to this kanban.json file (e.g. if this file is at /path/to/kanban.json and a task has image_attachments: ['mockup.png'], read the file at /path/to/files/mockup.png). Always load images before responding so you can incorporate their content into your work. To move a task between columns (e.g. from To-Do to Doing), remove the task object from the source column's 'tasks' array and append it to the target column's 'tasks' array. The standard workflow is: To-Do \u2192 Doing \u2192 Done. IMPORTANT: After completing a task's requested work, if a 'Done' column exists, always move the task from its current column to the 'Done' column automatically.";

// Ensure files directory exists
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/files', express.static(FILES_DIR));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(FILES_DIR)) {
      fs.mkdirSync(FILES_DIR, { recursive: true });
    }
    cb(null, FILES_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get absolute path of kanban.json
app.get('/api/kanban/filepath', (req, res) => {
  res.json({ filepath: path.resolve(DATA_FILE) });
});

// Load Kanban state
app.get('/api/kanban', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json({ columns: [] });
      return res.status(500).json({ error: 'Failed to load kanban data.' });
    }
    res.json(JSON.parse(data));
  });
});

// Save Kanban state
app.post('/api/kanban', (req, res) => {
  const toSave = { _description: KANBAN_DESCRIPTION, columns: req.body.columns || [] };
  fs.writeFile(DATA_FILE, JSON.stringify(toSave, null, 2), err => {
    if (err) return res.status(500).json({ error: 'Failed to save kanban data.' });
    res.json({ success: true });
  });
});

// Upload an image
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }
  res.json({ filename: req.file.filename });
});

// Delete an uploaded image
app.delete('/api/files/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(FILES_DIR, filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      return res.status(500).json({ error: 'Failed to delete file.' });
    }
    res.json({ success: true });
  });
});

// Clear all cards but keep columns
app.post('/api/kanban/clear-cards', (req, res) => {
  // Clear the files directory
  if (fs.existsSync(FILES_DIR)) {
    const files = fs.readdirSync(FILES_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(FILES_DIR, file));
    }
  }
  // Read current state, keep columns but empty their tasks
  fs.readFile(DATA_FILE, 'utf8', (err, raw) => {
    if (err) return res.status(500).json({ error: 'Failed to read kanban data.' });
    let data;
    try { data = JSON.parse(raw); } catch { data = { columns: [] }; }
    const cleared = { _description: KANBAN_DESCRIPTION, columns: (data.columns || []).map(col => ({ ...col, tasks: [] })) };
    fs.writeFile(DATA_FILE, JSON.stringify(cleared, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to clear cards.' });
      res.json({ success: true, columns: cleared.columns });
    });
  });
});

// Reset Kanban state
app.post('/api/kanban/reset', (req, res) => {
  // Clear the files directory
  if (fs.existsSync(FILES_DIR)) {
    const files = fs.readdirSync(FILES_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(FILES_DIR, file));
    }
  }
  fs.writeFile(DATA_FILE, JSON.stringify({ _description: KANBAN_DESCRIPTION, columns: [] }, null, 2), err => {
    if (err) return res.status(500).json({ error: 'Failed to reset kanban data.' });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Kanban backend running on http://localhost:${PORT}`);
});
