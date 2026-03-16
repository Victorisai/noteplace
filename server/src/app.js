const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const authRoutes = require('./routes/auth.routes');
const notesRoutes = require('./routes/notes.routes');
const searchRoutes = require('./routes/search.routes');
const followsRoutes = require('./routes/follows.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const messagesRoutes = require('./routes/messages.routes');

const app = express();

app.use(
  cors({

  })
);

//    origin: process.env.CLIENT_URL,
//    credentials: true,

app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'NotePlace API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/follows', followsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError || error.message?.includes('archivo')) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;
