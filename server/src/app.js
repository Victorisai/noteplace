const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const notesRoutes = require('./routes/notes.routes');
const searchRoutes = require('./routes/search.routes');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'NotePlace API running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/search', searchRoutes);

module.exports = app;