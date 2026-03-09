const pool = require('../config/db');
const { createNotification, NOTIFICATION_TYPES } = require('./notifications.service');

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
    is_bookmarked: Boolean(row.is_bookmarked),
    images: row.images || [],
    user: {
      id: row.user_id_ref,
      name: row.name,
      username: row.username,
      avatar_url: row.avatar_url,
    },
  };
}

const NOTE_SELECT = `
  SELECT
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
    CASE WHEN $2::INTEGER IS NULL THEN false ELSE COALESCE(BOOL_OR(nl.user_id = $2), false) END AS is_liked,
    CASE WHEN $2::INTEGER IS NULL THEN false ELSE COALESCE(BOOL_OR(b.user_id = $2), false) END AS is_bookmarked,
    COALESCE(
      JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', ni.id, 'image_url', ni.image_url)) FILTER (WHERE ni.id IS NOT NULL),
      '[]'::json
    ) AS images
  FROM notes n
  INNER JOIN users u ON n.user_id = u.id
  LEFT JOIN note_likes nl ON nl.note_id = n.id
  LEFT JOIN note_comments nc ON nc.note_id = n.id
  LEFT JOIN bookmarks b ON b.note_id = n.id
  LEFT JOIN note_images ni ON ni.note_id = n.id
`;

async function createNote({ content, userId, imageUrls = [] }) {
  const trimmedContent = content.trim();
  if (!trimmedContent) throw new Error('La nota no puede estar vacía');
  if (trimmedContent.length > 280) throw new Error('La nota no puede superar 280 caracteres');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertResult = await client.query(
      `INSERT INTO notes (content, user_id) VALUES ($1, $2) RETURNING id`,
      [trimmedContent, userId]
    );
    const noteId = insertResult.rows[0].id;

    if (imageUrls.length) {
      const values = imageUrls.map((url, idx) => `($1, $${idx + 2})`).join(',');
      await client.query(`INSERT INTO note_images (note_id, image_url) VALUES ${values}`, [noteId, ...imageUrls]);
    }

    await client.query('COMMIT');

    const noteResult = await pool.query(
      `${NOTE_SELECT}
       WHERE n.id = $1
       GROUP BY n.id, u.id`,
      [noteId, userId]
    );

    return mapNoteRow(noteResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getFeedNotes({ cursor = null, limit = 10, userId = null, query = '' }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
  const search = `%${query.trim().toLowerCase()}%`;

  const result = await pool.query(
    `${NOTE_SELECT}
     WHERE (
       $1 = '%%' OR LOWER(n.content) LIKE $1 OR LOWER(u.username) LIKE $1 OR LOWER(u.name) LIKE $1
     )
     AND ($3::INTEGER IS NULL OR n.id < $3)
     GROUP BY n.id, u.id
     ORDER BY n.id DESC
     LIMIT $4`,
    [search, userId, cursor ? Number(cursor) : null, safeLimit + 1]
  );

  const hasMore = result.rows.length > safeLimit;
  const rows = hasMore ? result.rows.slice(0, safeLimit) : result.rows;
  const notes = rows.map(mapNoteRow);

  return {
    notes,
    nextCursor: hasMore ? notes[notes.length - 1].id : null,
    hasMore,
  };
}

async function getProfileByUsername(username, viewerUserId = null) {
  const normalizedUsername = username.trim().toLowerCase();
  const profileResult = await pool.query(
    `SELECT id, name, username, avatar_url, bio FROM users WHERE username = $1 LIMIT 1`,
    [normalizedUsername]
  );
  if (!profileResult.rows.length) throw new Error('Usuario no encontrado');

  const profile = profileResult.rows[0];
  const statsResult = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM notes WHERE user_id = $1) AS notes_count,
      (SELECT COUNT(*) FROM follows WHERE following_id = $1) AS followers_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id = $1) AS following_count,
      CASE WHEN $2::INTEGER IS NULL THEN false ELSE EXISTS(
        SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = $1
      ) END AS is_following
    `,
    [profile.id, viewerUserId]
  );

  return {
    ...profile,
    notes_count: Number(statsResult.rows[0].notes_count),
    followers_count: Number(statsResult.rows[0].followers_count),
    following_count: Number(statsResult.rows[0].following_count),
    is_following: statsResult.rows[0].is_following,
  };
}

async function getNotesByUsername(username, viewerUserId = null) {
  const normalizedUsername = username.trim().toLowerCase();
  const profile = await getProfileByUsername(normalizedUsername, viewerUserId);

  const notesResult = await pool.query(
    `${NOTE_SELECT}
     WHERE u.username = $1
     GROUP BY n.id, u.id
     ORDER BY n.created_at DESC`,
    [normalizedUsername, viewerUserId]
  );

  return { profile, notes: notesResult.rows.map(mapNoteRow) };
}

async function getUserReplies(username) {
  const normalizedUsername = username.trim().toLowerCase();
  const result = await pool.query(
    `SELECT nc.id, nc.content, nc.created_at, nc.note_id,
            u.id AS user_id, u.username, u.name, u.avatar_url
     FROM note_comments nc
     INNER JOIN users u ON u.id = nc.user_id
     WHERE u.username = $1
     ORDER BY nc.created_at DESC`,
    [normalizedUsername]
  );
  return result.rows;
}

async function getUserLikedNotes(username, viewerUserId = null) {
  const normalizedUsername = username.trim().toLowerCase();
  const likedResult = await pool.query(
    `${NOTE_SELECT}
     INNER JOIN note_likes l2 ON l2.note_id = n.id
     INNER JOIN users lu ON lu.id = l2.user_id
     WHERE lu.username = $1
     GROUP BY n.id, u.id
     ORDER BY n.created_at DESC`,
    [normalizedUsername, viewerUserId]
  );

  return likedResult.rows.map(mapNoteRow);
}

async function getUserBookmarkedNotes(username, viewerUserId = null) {
  const normalizedUsername = username.trim().toLowerCase();
  const bookmarkedResult = await pool.query(
    `${NOTE_SELECT}
     INNER JOIN bookmarks b2 ON b2.note_id = n.id
     INNER JOIN users bu ON bu.id = b2.user_id
     WHERE bu.username = $1
     GROUP BY n.id, u.id
     ORDER BY n.created_at DESC`,
    [normalizedUsername, viewerUserId]
  );

  return bookmarkedResult.rows.map(mapNoteRow);
}

async function updateNote({ noteId, userId, content }) {
  const trimmedContent = content.trim();
  if (!trimmedContent) throw new Error('La nota no puede estar vacía');
  if (trimmedContent.length > 280) throw new Error('La nota no puede superar 280 caracteres');

  const existing = await pool.query(`SELECT id, user_id FROM notes WHERE id = $1 LIMIT 1`, [noteId]);
  if (!existing.rows.length) throw new Error('La nota no existe');
  if (existing.rows[0].user_id !== userId) throw new Error('No puedes editar una nota de otro usuario');

  await pool.query(
    `UPDATE notes SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [trimmedContent, noteId]
  );

  const result = await pool.query(`${NOTE_SELECT} WHERE n.id = $1 GROUP BY n.id, u.id`, [noteId, userId]);
  return mapNoteRow(result.rows[0]);
}

async function deleteNote({ noteId, userId }) {
  const result = await pool.query(`SELECT id, user_id FROM notes WHERE id = $1 LIMIT 1`, [noteId]);
  if (!result.rows.length) throw new Error('La nota no existe');
  if (result.rows[0].user_id !== userId) throw new Error('No puedes eliminar una nota de otro usuario');
  await pool.query(`DELETE FROM notes WHERE id = $1`, [noteId]);
  return { message: 'Nota eliminada correctamente' };
}

async function toggleLike({ noteId, userId }) {
  const noteResult = await pool.query(`SELECT id, user_id FROM notes WHERE id = $1 LIMIT 1`, [noteId]);
  if (!noteResult.rows.length) throw new Error('La nota no existe');
  const noteOwnerId = noteResult.rows[0].user_id;

  const existing = await pool.query(`SELECT id FROM note_likes WHERE note_id = $1 AND user_id = $2 LIMIT 1`, [noteId, userId]);
  let liked = false;
  if (existing.rows.length) {
    await pool.query(`DELETE FROM note_likes WHERE note_id = $1 AND user_id = $2`, [noteId, userId]);
  } else {
    await pool.query(`INSERT INTO note_likes (note_id, user_id) VALUES ($1, $2)`, [noteId, userId]);
    liked = true;
    try {
      await createNotification({ recipientId: noteOwnerId, actorId: userId, type: NOTIFICATION_TYPES.LIKE, noteId });
    } catch (error) {
      // Notification failures should not break a successful like action.
      console.error('Failed to create like notification:', error);
    }
  }

  const countResult = await pool.query(`SELECT COUNT(*) AS total FROM note_likes WHERE note_id = $1`, [noteId]);
  return { liked, likes_count: Number(countResult.rows[0].total) };
}

async function toggleBookmark({ noteId, userId }) {
  const { toggleBookmark: toggle } = require('./bookmarks.service');
  return toggle({ noteId, userId });
}

async function getCommentsByNoteId(noteId) {
  const noteCheck = await pool.query(`SELECT id FROM notes WHERE id = $1 LIMIT 1`, [noteId]);
  if (!noteCheck.rows.length) throw new Error('La nota no existe');

  const result = await pool.query(
    `SELECT nc.id, nc.content, nc.created_at, nc.updated_at, nc.note_id, nc.user_id,
            u.name, u.username, u.avatar_url
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
    user: { id: row.user_id, name: row.name, username: row.username, avatar_url: row.avatar_url },
  }));
}

async function createComment({ noteId, userId, content }) {
  const trimmedContent = content.trim();
  if (!trimmedContent) throw new Error('El comentario no puede estar vacío');
  if (trimmedContent.length > 280) throw new Error('El comentario no puede superar 280 caracteres');

  const noteCheck = await pool.query(`SELECT id, user_id FROM notes WHERE id = $1 LIMIT 1`, [noteId]);
  if (!noteCheck.rows.length) throw new Error('La nota no existe');

  const result = await pool.query(
    `INSERT INTO note_comments (content, note_id, user_id)
     VALUES ($1, $2, $3)
     RETURNING id, content, created_at, updated_at, note_id, user_id`,
    [trimmedContent, noteId, userId]
  );
  const comment = result.rows[0];
  const userResult = await pool.query(`SELECT id, name, username, avatar_url FROM users WHERE id = $1 LIMIT 1`, [userId]);

  try {
    await createNotification({
      recipientId: noteCheck.rows[0].user_id,
      actorId: userId,
      type: NOTIFICATION_TYPES.COMMENT,
      noteId,
      commentId: comment.id,
    });
  } catch (error) {
    // Notification failures should not break a successful comment action.
    console.error('Failed to create comment notification:', error);
  }

  return { ...comment, user: userResult.rows[0] };
}

module.exports = {
  createNote,
  getFeedNotes,
  getNotesByUsername,
  getProfileByUsername,
  getUserReplies,
  getUserLikedNotes,
  getUserBookmarkedNotes,
  updateNote,
  deleteNote,
  toggleLike,
  toggleBookmark,
  getCommentsByNoteId,
  createComment,
};
