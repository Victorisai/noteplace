const pool = require('../config/db');

const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
};

async function createNotification({ recipientId, actorId, type, noteId = null, commentId = null }) {
  if (!recipientId || !actorId || recipientId === actorId) {
    return null;
  }

  const result = await pool.query(
    `INSERT INTO notifications (recipient_id, actor_id, type, note_id, comment_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, recipient_id, actor_id, type, note_id, comment_id, is_read, created_at`,
    [recipientId, actorId, type, noteId, commentId]
  );

  return result.rows[0];
}

async function getNotificationsByUserId(userId) {
  const result = await pool.query(
    `SELECT
      n.id,
      n.type,
      n.note_id,
      n.comment_id,
      n.is_read,
      n.created_at,
      a.id AS actor_id,
      a.name AS actor_name,
      a.username AS actor_username,
      a.avatar_url AS actor_avatar_url
     FROM notifications n
     INNER JOIN users a ON a.id = n.actor_id
     WHERE n.recipient_id = $1
     ORDER BY n.created_at DESC
     LIMIT 100`,
    [userId]
  );

  const unreadResult = await pool.query(
    `SELECT COUNT(*) AS total
     FROM notifications
     WHERE recipient_id = $1 AND is_read = false`,
    [userId]
  );

  return {
    notifications: result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      note_id: row.note_id,
      comment_id: row.comment_id,
      is_read: row.is_read,
      created_at: row.created_at,
      actor: {
        id: row.actor_id,
        name: row.actor_name,
        username: row.actor_username,
        avatar_url: row.actor_avatar_url,
      },
    })),
    unread_count: Number(unreadResult.rows[0].total),
  };
}

async function markNotificationsAsRead(userId) {
  await pool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE recipient_id = $1 AND is_read = false`,
    [userId]
  );

  return { message: 'Notificaciones marcadas como leídas' };
}

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  getNotificationsByUserId,
  markNotificationsAsRead,
};
