const pool = require('../config/db');

async function createNote({ content, userId }) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error('La nota no puede estar vacía');
  }

  if (trimmedContent.length > 280) {
    throw new Error('La nota no puede superar 280 caracteres');
  }

  const result = await pool.query(
    `INSERT INTO notes (content, user_id)
     VALUES ($1, $2)
     RETURNING id, content, user_id, created_at`,
    [trimmedContent, userId]
  );

  const note = result.rows[0];

  const userResult = await pool.query(
    `SELECT id, name, username, avatar_url
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  return {
    ...note,
    user: userResult.rows[0],
  };
}

async function getFeedNotes() {
  const result = await pool.query(
    `SELECT
      n.id,
      n.content,
      n.created_at,
      n.user_id,
      u.id AS user_id_ref,
      u.name,
      u.username,
      u.avatar_url
     FROM notes n
     INNER JOIN users u ON n.user_id = u.id
     ORDER BY n.created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    user_id: row.user_id,
    user: {
      id: row.user_id_ref,
      name: row.name,
      username: row.username,
      avatar_url: row.avatar_url,
    },
  }));
}

async function getNotesByUsername(username) {
  const normalizedUsername = username.trim().toLowerCase();

  const result = await pool.query(
    `SELECT
      n.id,
      n.content,
      n.created_at,
      n.user_id,
      u.id AS user_id_ref,
      u.name,
      u.username,
      u.avatar_url,
      u.bio
     FROM notes n
     INNER JOIN users u ON n.user_id = u.id
     WHERE u.username = $1
     ORDER BY n.created_at DESC`,
    [normalizedUsername]
  );

  if (result.rows.length === 0) {
    const userCheck = await pool.query(
      `SELECT id, name, username, avatar_url, bio
       FROM users
       WHERE username = $1
       LIMIT 1`,
      [normalizedUsername]
    );

    if (userCheck.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    return {
      profile: userCheck.rows[0],
      notes: [],
    };
  }

  const firstRow = result.rows[0];

  return {
    profile: {
      id: firstRow.user_id_ref,
      name: firstRow.name,
      username: firstRow.username,
      avatar_url: firstRow.avatar_url,
      bio: firstRow.bio,
    },
    notes: result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      user_id: row.user_id,
      user: {
        id: row.user_id_ref,
        name: row.name,
        username: row.username,
        avatar_url: row.avatar_url,
      },
    })),
  };
}

async function deleteNote({ noteId, userId }) {
  const result = await pool.query(
    `SELECT id, user_id
     FROM notes
     WHERE id = $1
     LIMIT 1`,
    [noteId]
  );

  if (result.rows.length === 0) {
    throw new Error('La nota no existe');
  }

  const note = result.rows[0];

  if (note.user_id !== userId) {
    throw new Error('No puedes eliminar una nota de otro usuario');
  }

  await pool.query(
    `DELETE FROM notes
     WHERE id = $1`,
    [noteId]
  );

  return {
    message: 'Nota eliminada correctamente',
  };
}

module.exports = {
  createNote,
  getFeedNotes,
  getNotesByUsername,
  deleteNote,
};