const pool = require('../config/db');

async function toggleBookmark({ userId, noteId }) {
  const noteCheck = await pool.query('SELECT id FROM notes WHERE id = $1 LIMIT 1', [noteId]);

  if (noteCheck.rows.length === 0) {
    throw new Error('La nota no existe');
  }

  const existing = await pool.query(
    `SELECT id FROM bookmarks
     WHERE user_id = $1 AND note_id = $2
     LIMIT 1`,
    [userId, noteId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `DELETE FROM bookmarks
       WHERE user_id = $1 AND note_id = $2`,
      [userId, noteId]
    );
    return { bookmarked: false };
  }

  await pool.query(
    `INSERT INTO bookmarks (user_id, note_id)
     VALUES ($1, $2)`,
    [userId, noteId]
  );

  return { bookmarked: true };
}

module.exports = { toggleBookmark };
