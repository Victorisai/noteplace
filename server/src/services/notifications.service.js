const pool = require('../config/db');

const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
};

let notificationsSchemaCache = null;

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

async function getNotificationsSchema() {
  if (notificationsSchemaCache) return notificationsSchemaCache;

  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'notifications'`
  );

  const columns = new Set(result.rows.map((row) => row.column_name));
  const schema = {
    recipientColumn: columns.has('recipient_id') ? 'recipient_id' : (columns.has('user_id') ? 'user_id' : null),
    actorColumn: columns.has('actor_id') ? 'actor_id' : (columns.has('from_user_id') ? 'from_user_id' : null),
    typeColumn: columns.has('type') ? 'type' : (columns.has('notification_type') ? 'notification_type' : null),
    noteColumn: columns.has('note_id') ? 'note_id' : null,
    messageColumn: columns.has('message') ? 'message' : null,
    isReadColumn: columns.has('is_read') ? 'is_read' : (columns.has('read') ? 'read' : null),
    createdAtColumn: columns.has('created_at') ? 'created_at' : (columns.has('createdAt') ? 'createdAt' : null),
  };

  notificationsSchemaCache = schema;
  return schema;
}

function buildNotificationMessage(type) {
  if (type === NOTIFICATION_TYPES.FOLLOW) return 'comenzo a seguirte';
  if (type === NOTIFICATION_TYPES.LIKE) return 'dio like a tu nota';
  if (type === NOTIFICATION_TYPES.COMMENT) return 'comento tu nota';
  return 'tienes una nueva notificacion';
}

async function createNotification({ recipientId, actorId, type, noteId = null, message = null }) {
  if (!recipientId || !actorId || recipientId === actorId) {
    return null;
  }

  const schema = await getNotificationsSchema();
  if (!schema.recipientColumn || !schema.actorColumn || !schema.typeColumn) {
    return null;
  }

  const columns = [schema.recipientColumn, schema.actorColumn, schema.typeColumn];
  const values = [recipientId, actorId, type];
  if (schema.noteColumn) {
    columns.push(schema.noteColumn);
    values.push(noteId);
  }
  if (schema.messageColumn) {
    columns.push(schema.messageColumn);
    values.push(message || buildNotificationMessage(type));
  }

  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  const returningColumns = ['id', schema.typeColumn];
  if (schema.noteColumn) returningColumns.push(schema.noteColumn);
  if (schema.messageColumn) returningColumns.push(schema.messageColumn);
  if (schema.isReadColumn) returningColumns.push(schema.isReadColumn);
  if (schema.createdAtColumn) returningColumns.push(schema.createdAtColumn);

  const result = await pool.query(
    `INSERT INTO notifications (${columns.map(quoteIdentifier).join(', ')})
     VALUES (${placeholders})
     RETURNING ${returningColumns.map(quoteIdentifier).join(', ')}`,
    values
  );

  return result.rows[0];
}

async function getNotificationsByUserId(userId) {
  const schema = await getNotificationsSchema();
  if (!schema.recipientColumn || !schema.typeColumn) {
    return { notifications: [], unread_count: 0 };
  }

  const hasActor = Boolean(schema.actorColumn);
  const hasNote = Boolean(schema.noteColumn);
  const hasMessage = Boolean(schema.messageColumn);
  const hasRead = Boolean(schema.isReadColumn);
  const hasCreatedAt = Boolean(schema.createdAtColumn);

  const result = await pool.query(
    `SELECT
      n.id AS id,
      n.${quoteIdentifier(schema.typeColumn)} AS type,
      ${hasNote ? `n.${quoteIdentifier(schema.noteColumn)}` : 'NULL'} AS note_id,
      ${hasMessage ? `n.${quoteIdentifier(schema.messageColumn)}` : 'NULL'} AS message,
      ${hasRead ? `n.${quoteIdentifier(schema.isReadColumn)}` : 'false'} AS is_read,
      ${hasCreatedAt ? `n.${quoteIdentifier(schema.createdAtColumn)}` : 'CURRENT_TIMESTAMP'} AS created_at,
      ${hasActor ? 'a.id' : 'NULL'} AS actor_id,
      ${hasActor ? 'a.name' : 'NULL'} AS actor_name,
      ${hasActor ? 'a.username' : 'NULL'} AS actor_username,
     ${hasActor ? 'a.avatar_url' : 'NULL'} AS actor_avatar_url
     FROM notifications n
     ${hasActor ? `LEFT JOIN users a ON a.id = n.${quoteIdentifier(schema.actorColumn)}` : ''}
     WHERE n.${quoteIdentifier(schema.recipientColumn)} = $1
     ${hasRead ? `AND n.${quoteIdentifier(schema.isReadColumn)} = false` : ''}
     ORDER BY ${hasCreatedAt ? `n.${quoteIdentifier(schema.createdAtColumn)} DESC` : 'n.id DESC'}
     LIMIT 100`,
    [userId]
  );

  let unreadCount = 0;
  if (hasRead) {
    const unreadResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM notifications
       WHERE ${quoteIdentifier(schema.recipientColumn)} = $1 AND ${quoteIdentifier(schema.isReadColumn)} = false`,
      [userId]
    );
    unreadCount = Number(unreadResult.rows[0]?.total || 0);
  }

  return {
    notifications: result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      note_id: row.note_id,
      message: row.message,
      is_read: row.is_read,
      created_at: row.created_at,
      actor: {
        id: row.actor_id,
        name: row.actor_name,
        username: row.actor_username,
        avatar_url: row.actor_avatar_url,
      },
    })),
    unread_count: unreadCount,
  };
}

async function markNotificationsAsRead(userId) {
  const schema = await getNotificationsSchema();
  if (!schema.recipientColumn) {
    return { message: 'Notificaciones marcadas como leídas', deleted_count: 0 };
  }

  if (schema.isReadColumn) {
    await pool.query(
      `UPDATE notifications
       SET ${quoteIdentifier(schema.isReadColumn)} = true
       WHERE ${quoteIdentifier(schema.recipientColumn)} = $1
         AND ${quoteIdentifier(schema.isReadColumn)} = false`,
      [userId]
    );
  }

  const deleteResult = await pool.query(
    `DELETE FROM notifications
     WHERE ${quoteIdentifier(schema.recipientColumn)} = $1
     ${schema.isReadColumn ? `AND ${quoteIdentifier(schema.isReadColumn)} = true` : ''}
     RETURNING id`,
    [userId]
  );

  return { message: 'Notificaciones marcadas como leídas', deleted_count: deleteResult.rowCount || 0 };
}

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  getNotificationsByUserId,
  markNotificationsAsRead,
};
