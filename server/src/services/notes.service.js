const pool = require('../config/db');

function mapNoteRow(row) {
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user_id: row.user_id,
    likes_count: Number(row.likes_count || 0),
    comments_count: Number(row.comments_count || 0),
    is_liked: Boolean(row.is_liked),
    user: {
      id: row.user_id_ref,
      name: row.name,
      username: row.username,
      avatar_url: row.avatar_url,
    },
  };
}

async function createNote({ content, userId }) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error('La nota no puede estar vacía');
  }

  if (trimmedContent.length > 280) {
    throw new Error('La nota no puede superar 280 caracteres');
  }

  const insertResult = await pool.query(
    `INSERT INTO notes (content, user_id)
     VALUES ($1, $2)
     RETURNING id`,
    [trimmedContent, userId]
  );

  const noteId = insertResult.rows[0].id;

  const noteResult = await pool.query(
    `SELECT
      n.id,
      n.content,
      n.created_at,
      n.updated_at,
      n.user_id,
      u.id AS user_id_ref,
      u.name,
      u.username,
      u.avatar_url,
      0 AS likes_count,
      0 AS comments_count,
      false AS is_liked
     FROM notes n
     INNER JOIN users u ON n.user_id = u.id
     WHERE n.id = $1`,
    [noteId]
  );

  return mapNoteRow(noteResult.rows[0]);
}

async function getFeedNotes({ page = 1, limit = 10, userId = null, query = '' }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
  const offset = (safePage - 1) * safeLimit;
  const search = `%${query.trim().toLowerCase()}%`;

  const countResult = await pool.query(
    `SELECT COUNT(*) AS total
     FROM notes n
     INNER JOIN users u ON n.user_id = u.id
     WHERE (
       $1 = '%%'
       OR LOWER(n.content) LIKE $1
       OR LOWER(u.username) LIKE $1
       OR LOWER(u.name) LIKE $1
     )`,
    [search]
  );

  const result = await pool.query(
    `SELECT
      n.id,
      n.content,
      n.created_at,
      n.updated_at,
      n.user_id,
      u.id AS user_id_ref,
      u.name,
      u.username,
      u.avatar_url,
      COUNT(DISTINCT nl.id) AS likes_count,
      COUNT(DISTINCT nc.id) AS comments_count,
      CASE
        WHEN $2::INTEGER IS NULL THEN false
        ELSE COALESCE(BOOL_OR(nl.user_id = $2), false)
      END AS is_liked
     FROM notes n
     INNER JOIN users u ON n.user_id = u.id
     LEFT JOIN note_likes nl ON nl.note_id = n.id
     LEFT JOIN note_comments nc ON nc.note_id = n.id
     WHERE (
       $1 = '%%'
       OR LOWER(n.content) LIKE $1
       OR LOWER(u.username) LIKE $1
       OR LOWER(u.name) LIKE $1
     )
     GROUP BY n.id, u.id
     ORDER BY n.created_at DESC
     LIMIT $3 OFFSET $4`,
    [search, userId, safeLimit, offset]
  );

  return {
    notes: result.rows.map(mapNoteRow),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: Number(countResult.rows[0].total),
      totalPages: Math.ceil(Number(countResult.rows[0].total) / safeLimit),
    },
  };
}

async function getNotesByUsername(username, viewerUserId = null) {
  const normalizedUsername = username.trim().toLowerCase();

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

  const profile = userCheck.rows[0];

  const notesResult = await pool.query(
    `SELECT
      n.id,
      n.content,
      n.created_at,
      n.updated_at,
      n.user_id,
      u.id AS user_id_ref,
      u.name,
      u.username,
      u.avatar_url,
      COUNT(DISTINCT nl.id) AS likes_count,
      COUNT(DISTINCT nc.id) AS comments_count,
      CASE
        WHEN $2::INTEGER IS NULL THEN false
        ELSE COALESCE(BOOL_OR(nl.user_id = $2), false)
      END AS is_liked
     FROM notes n
     INNER JOIN users u ON n.user_id = u.id
     LEFT JOIN note_likes nl ON nl.note_id = n.id
     LEFT JOIN note_comments nc ON nc.note_id = n.id
     WHERE u.username = $1
     GROUP BY n.id, u.id
     ORDER BY n.created_at DESC`,
    [normalizedUsername, viewerUserId]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) AS total
     FROM notes
     WHERE user_id = $1`,
    [profile.id]
  );

  return {
    profile: {
      ...profile,
      notes_count: Number(countResult.rows[0].total),
    },
    notes: notesResult.rows.map(mapNoteRow),
  };
}

async function updateNote({ noteId, userId, content }) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error('La nota no puede estar vacía');
  }

  if (trimmedContent.length > 280) {
    throw new Error('La nota no puede superar 280 caracteres');
  }

  const existing = await pool.query(
    `SELECT id, user_id
     FROM notes
     WHERE id = $1
     LIMIT 1`,
    [noteId]
  );

  if (existing.rows.length === 0) {
    throw new Error('La nota no existe');
  }

  if (existing.rows[0].user_id !== userId) {
    throw new Error('No puedes editar una nota de otro usuario');
  }

  await pool.query(
    `UPDATE notes
     SET content = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [trimmedContent, noteId]
  );

  const result = await pool.query(
    `SELECT
      n.id,
      n.content,
      n.created_at,
      n.updated_at,
      n.user_id,
      u.id AS user_id_ref,
      u.name,
      u.username,
      u.avatar_url,
      COUNT(DISTINCT nl.id) AS likes_count,
      COUNT(DISTINCT nc.id) AS comments_count,
      COALESCE(BOOL_OR(nl.user_id = $2), false) AS is_liked
     FROM notes n
     INNER JOIN users u ON n.user_id = u.id
     LEFT JOIN note_likes nl ON nl.note_id = n.id
     LEFT JOIN note_comments nc ON nc.note_id = n.id
     WHERE n.id = $1
     GROUP BY n.id, u.id`,
    [noteId, userId]
  );

  return mapNoteRow(result.rows[0]);
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

  if (result.rows[0].user_id !== userId) {
    throw new Error('No puedes eliminar una nota de otro usuario');
  }

  await pool.query(`DELETE FROM notes WHERE id = $1`, [noteId]);

  return { message: 'Nota eliminada correctamente' };
}

async function toggleLike({ noteId, userId }) {
  const noteResult = await pool.query(
    `SELECT id FROM notes WHERE id = $1 LIMIT 1`,
    [noteId]
  );

  if (noteResult.rows.length === 0) {
    throw new Error('La nota no existe');
  }

  const existing = await pool.query(
    `SELECT id
     FROM note_likes
     WHERE note_id = $1 AND user_id = $2
     LIMIT 1`,
    [noteId, userId]
  );

  let liked = false;

  if (existing.rows.length > 0) {
    await pool.query(
      `DELETE FROM note_likes
       WHERE note_id = $1 AND user_id = $2`,
      [noteId, userId]
    );
    liked = false;
  } else {
    await pool.query(
      `INSERT INTO note_likes (note_id, user_id)
       VALUES ($1, $2)`,
      [noteId, userId]
    );
    liked = true;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) AS total
     FROM note_likes
     WHERE note_id = $1`,
    [noteId]
  );

  return {
    liked,
    likes_count: Number(countResult.rows[0].total),
  };
}

async function getCommentsByNoteId(noteId) {
  const noteCheck = await pool.query(
    `SELECT id FROM notes WHERE id = $1 LIMIT 1`,
    [noteId]
  );

  if (noteCheck.rows.length === 0) {
    throw new Error('La nota no existe');
  }

  const result = await pool.query(
    `SELECT
      nc.id,
      nc.content,
      nc.created_at,
      nc.updated_at,
      nc.note_id,
      nc.user_id,
      u.name,
      u.username,
      u.avatar_url
     FROM note_comments nc
     INNER JOIN users u ON u.id = nc.user_id
     WHERE nc.note_id = $1
     ORDER BY nc.created_at ASC`,
    [noteId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    note_id: row.note_id,
    user_id: row.user_id,
    user: {
      id: row.user_id,
      name: row.name,
      username: row.username,
      avatar_url: row.avatar_url,
    },
  }));
}

async function createComment({ noteId, userId, content }) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error('El comentario no puede estar vacío');
  }

  if (trimmedContent.length > 280) {
    throw new Error('El comentario no puede superar 280 caracteres');
  }

  const noteCheck = await pool.query(
    `SELECT id FROM notes WHERE id = $1 LIMIT 1`,
    [noteId]
  );

  if (noteCheck.rows.length === 0) {
    throw new Error('La nota no existe');
  }

  const result = await pool.query(
    `INSERT INTO note_comments (content, note_id, user_id)
     VALUES ($1, $2, $3)
     RETURNING id, content, created_at, updated_at, note_id, user_id`,
    [trimmedContent, noteId, userId]
  );

  const comment = result.rows[0];

  const userResult = await pool.query(
    `SELECT id, name, username, avatar_url
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  return {
    ...comment,
    user: userResult.rows[0],
  };
}

module.exports = {
  createNote,
  getFeedNotes,
  getNotesByUsername,
  updateNote,
  deleteNote,
  toggleLike,
  getCommentsByNoteId,
  createComment,
};