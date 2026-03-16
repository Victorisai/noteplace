const pool = require('../config/db');

let schemaReady = false;

function mapMessageRow(row) {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    content: row.content,
    image_url: row.image_url,
    is_read: row.is_read,
    created_at: row.created_at,
    sender: {
      id: row.sender_id,
      name: row.sender_name,
      username: row.sender_username,
      avatar_url: row.sender_avatar_url,
    },
  };
}

function mapConversationRow(row) {
  return {
    id: row.id,
    updated_at: row.updated_at,
    is_pinned: Boolean(row.is_pinned),
    unread_count: Number(row.unread_count || 0),
    other_user: {
      id: row.other_user_id,
      name: row.other_name,
      username: row.other_username,
      avatar_url: row.other_avatar_url,
    },
    last_message: row.last_message_id ? {
      id: row.last_message_id,
      sender_id: row.last_sender_id,
      content: row.last_content,
      image_url: row.last_image_url,
      created_at: row.last_created_at,
    } : null,
  };
}

function normalizeConversationPair(userId, otherUserId) {
  const normalizedUserId = Number(userId);
  const normalizedOtherId = Number(otherUserId);
  if (!normalizedUserId || !normalizedOtherId) throw new Error('Datos inválidos');
  if (normalizedUserId === normalizedOtherId) throw new Error('No puedes abrir chat contigo');

  return {
    userA: Math.min(normalizedUserId, normalizedOtherId),
    userB: Math.max(normalizedUserId, normalizedOtherId),
  };
}

async function ensureMessagesSchema() {
  if (schemaReady) return;

  await pool.query(
    `CREATE TABLE IF NOT EXISTS direct_conversations (
      id SERIAL PRIMARY KEY,
      user_a_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_b_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT direct_conversations_unique_pair UNIQUE (user_a_id, user_b_id),
      CONSTRAINT direct_conversations_order CHECK (user_a_id < user_b_id)
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS direct_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      image_url TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT direct_messages_content_or_image_check CHECK (
        (content IS NOT NULL AND LENGTH(BTRIM(content)) > 0) OR image_url IS NOT NULL
      )
    )`
  );

  await pool.query(
    `ALTER TABLE direct_messages
     ADD COLUMN IF NOT EXISTS image_url TEXT`
  );

  await pool.query(
    `ALTER TABLE direct_messages
     ALTER COLUMN content DROP NOT NULL`
  );

  await pool.query(
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1
         FROM pg_constraint
         WHERE conname = 'direct_messages_content_or_image_check'
       ) THEN
         ALTER TABLE direct_messages
         ADD CONSTRAINT direct_messages_content_or_image_check CHECK (
           (content IS NOT NULL AND LENGTH(BTRIM(content)) > 0) OR image_url IS NOT NULL
         );
       END IF;
     END $$`
  );

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_direct_conversations_user_a ON direct_conversations(user_a_id)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_direct_conversations_user_b ON direct_conversations(user_b_id)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id, id DESC)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(conversation_id, is_read)`
  );
  await pool.query(
    `CREATE TABLE IF NOT EXISTS direct_conversation_pins (
      conversation_id INTEGER NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (conversation_id, user_id)
    )`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_direct_conversation_pins_user ON direct_conversation_pins(user_id, created_at DESC)`
  );

  schemaReady = true;
}

async function getConversationByIdForUser({ conversationId, userId }) {
  await ensureMessagesSchema();

  const result = await pool.query(
    `SELECT
      c.id,
      c.updated_at,
      u.id AS other_user_id,
      u.name AS other_name,
      u.username AS other_username,
      u.avatar_url AS other_avatar_url,
      lm.id AS last_message_id,
      lm.sender_id AS last_sender_id,
      lm.content AS last_content,
      lm.image_url AS last_image_url,
      lm.created_at AS last_created_at,
      (p.conversation_id IS NOT NULL) AS is_pinned,
      COALESCE(unread.total, 0) AS unread_count
     FROM direct_conversations c
     INNER JOIN users u ON u.id = CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END
     LEFT JOIN LATERAL (
       SELECT m.id, m.sender_id, m.content, m.image_url, m.created_at
       FROM direct_messages m
       WHERE m.conversation_id = c.id
       ORDER BY m.id DESC
       LIMIT 1
     ) lm ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS total
       FROM direct_messages m2
       WHERE m2.conversation_id = c.id
         AND m2.sender_id <> $1
         AND m2.is_read = false
     ) unread ON true
     LEFT JOIN direct_conversation_pins p
       ON p.conversation_id = c.id
      AND p.user_id = $1
     WHERE c.id = $2
       AND (c.user_a_id = $1 OR c.user_b_id = $1)
     LIMIT 1`,
    [userId, conversationId]
  );

  if (!result.rows.length) throw new Error('Conversación no encontrada');
  return mapConversationRow(result.rows[0]);
}

async function listConversationsByUserId(userId) {
  await ensureMessagesSchema();

  const result = await pool.query(
    `SELECT
      c.id,
      c.updated_at,
      u.id AS other_user_id,
      u.name AS other_name,
      u.username AS other_username,
      u.avatar_url AS other_avatar_url,
      lm.id AS last_message_id,
      lm.sender_id AS last_sender_id,
      lm.content AS last_content,
      lm.image_url AS last_image_url,
      lm.created_at AS last_created_at,
      (p.conversation_id IS NOT NULL) AS is_pinned,
      COALESCE(unread.total, 0) AS unread_count
     FROM direct_conversations c
     INNER JOIN users u ON u.id = CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END
     LEFT JOIN LATERAL (
       SELECT m.id, m.sender_id, m.content, m.image_url, m.created_at
       FROM direct_messages m
       WHERE m.conversation_id = c.id
       ORDER BY m.id DESC
       LIMIT 1
     ) lm ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS total
       FROM direct_messages m2
       WHERE m2.conversation_id = c.id
         AND m2.sender_id <> $1
         AND m2.is_read = false
     ) unread ON true
     LEFT JOIN direct_conversation_pins p
       ON p.conversation_id = c.id
      AND p.user_id = $1
     WHERE c.user_a_id = $1 OR c.user_b_id = $1
     ORDER BY (p.conversation_id IS NOT NULL) DESC, COALESCE(lm.created_at, c.updated_at) DESC`,
    [userId]
  );

  return result.rows.map(mapConversationRow);
}

async function getOrCreateConversation({ userId, otherUserId }) {
  await ensureMessagesSchema();
  const { userA, userB } = normalizeConversationPair(userId, otherUserId);

  const existing = await pool.query(
    `SELECT id
     FROM direct_conversations
     WHERE user_a_id = $1 AND user_b_id = $2
     LIMIT 1`,
    [userA, userB]
  );

  if (existing.rows.length) {
    return getConversationByIdForUser({ conversationId: existing.rows[0].id, userId });
  }

  const canStartChat = await pool.query(
    `SELECT 1
     FROM follows
     WHERE follower_id = $1 AND following_id = $2
     LIMIT 1`,
    [userId, otherUserId]
  );

  if (!canStartChat.rows.length) {
    throw new Error('Solo puedes enviar mensajes a usuarios que sigues');
  }

  const created = await pool.query(
    `INSERT INTO direct_conversations (user_a_id, user_b_id)
     VALUES ($1, $2)
     RETURNING id`,
    [userA, userB]
  );

  return getConversationByIdForUser({ conversationId: created.rows[0].id, userId });
}

async function searchFollowingForMessages({ userId, query = '' }) {
  await ensureMessagesSchema();
  const search = `%${query.trim().toLowerCase()}%`;

  const result = await pool.query(
    `SELECT
      u.id,
      u.name,
      u.username,
      u.avatar_url,
      c.id AS conversation_id
     FROM follows f
     INNER JOIN users u ON u.id = f.following_id
     LEFT JOIN direct_conversations c
       ON c.user_a_id = LEAST($1, u.id)
      AND c.user_b_id = GREATEST($1, u.id)
     WHERE f.follower_id = $1
       AND ($2 = '%%' OR LOWER(u.name) LIKE $2 OR LOWER(u.username) LIKE $2)
     ORDER BY u.name ASC
     LIMIT 20`,
    [userId, search]
  );

  return result.rows;
}

async function listMessagesByConversation({ conversationId, userId, beforeId = null, limit = 40 }) {
  await ensureMessagesSchema();
  const normalizedConversationId = Number(conversationId);
  const normalizedBeforeId = beforeId ? Number(beforeId) : null;
  const safeLimit = Math.min(Math.max(Number(limit) || 40, 1), 80);

  const conversationCheck = await pool.query(
    `SELECT id
     FROM direct_conversations
     WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)
     LIMIT 1`,
    [normalizedConversationId, userId]
  );

  if (!conversationCheck.rows.length) throw new Error('Conversación no encontrada');

  const result = await pool.query(
    `SELECT
      m.id,
      m.conversation_id,
      m.sender_id,
      m.content,
      m.image_url,
      m.is_read,
      m.created_at,
      u.name AS sender_name,
      u.username AS sender_username,
      u.avatar_url AS sender_avatar_url
     FROM direct_messages m
     INNER JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = $1
       AND ($2::INTEGER IS NULL OR m.id < $2)
     ORDER BY m.id DESC
     LIMIT $3`,
    [normalizedConversationId, normalizedBeforeId, safeLimit + 1]
  );

  const hasMore = result.rows.length > safeLimit;
  const rows = hasMore ? result.rows.slice(0, safeLimit) : result.rows;
  const messages = rows.reverse().map(mapMessageRow);
  const nextCursor = hasMore && messages.length ? messages[0].id : null;

  await pool.query(
    `UPDATE direct_messages
     SET is_read = true
     WHERE conversation_id = $1
       AND sender_id <> $2
       AND is_read = false`,
    [normalizedConversationId, userId]
  );

  return { messages, hasMore, nextCursor };
}

async function sendMessageToConversation({ conversationId, senderId, content, imageUrl = null }) {
  await ensureMessagesSchema();
  const normalizedConversationId = Number(conversationId);
  const trimmedContent = String(content || '').trim();
  const normalizedImageUrl = imageUrl ? String(imageUrl).trim() : null;

  if (!trimmedContent && !normalizedImageUrl) {
    throw new Error('Debes enviar un texto o una imagen');
  }
  if (trimmedContent.length > 1200) throw new Error('El mensaje es demasiado largo');

  const conversationResult = await pool.query(
    `SELECT id, user_a_id, user_b_id
     FROM direct_conversations
     WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)
     LIMIT 1`,
    [normalizedConversationId, senderId]
  );

  if (!conversationResult.rows.length) throw new Error('Conversación no encontrada');

  const conversation = conversationResult.rows[0];
  const recipientId = conversation.user_a_id === senderId ? conversation.user_b_id : conversation.user_a_id;

  const messageResult = await pool.query(
    `INSERT INTO direct_messages (conversation_id, sender_id, content, image_url)
     VALUES ($1, $2, $3, $4)
     RETURNING id, conversation_id, sender_id, content, image_url, is_read, created_at`,
    [normalizedConversationId, senderId, trimmedContent || null, normalizedImageUrl]
  );

  await pool.query(
    `UPDATE direct_conversations
     SET updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [normalizedConversationId]
  );

  const senderResult = await pool.query(
    `SELECT id, name, username, avatar_url
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [senderId]
  );

  const row = messageResult.rows[0];
  const sender = senderResult.rows[0];

  return {
    message: {
      ...row,
      sender: {
        id: sender.id,
        name: sender.name,
        username: sender.username,
        avatar_url: sender.avatar_url,
      },
    },
    recipientId,
  };
}

async function setConversationPinnedByUser({ conversationId, userId, pinned }) {
  await ensureMessagesSchema();
  const normalizedConversationId = Number(conversationId);
  const shouldPin = Boolean(pinned);

  const accessCheck = await pool.query(
    `SELECT id
     FROM direct_conversations
     WHERE id = $1
       AND (user_a_id = $2 OR user_b_id = $2)
     LIMIT 1`,
    [normalizedConversationId, userId]
  );

  if (!accessCheck.rows.length) throw new Error('Conversación no encontrada');

  if (shouldPin) {
    await pool.query(
      `INSERT INTO direct_conversation_pins (conversation_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [normalizedConversationId, userId]
    );
  } else {
    await pool.query(
      `DELETE FROM direct_conversation_pins
       WHERE conversation_id = $1
         AND user_id = $2`,
      [normalizedConversationId, userId]
    );
  }

  return getConversationByIdForUser({
    conversationId: normalizedConversationId,
    userId,
  });
}

async function deleteConversationByIdForUser({ conversationId, userId }) {
  await ensureMessagesSchema();
  const normalizedConversationId = Number(conversationId);

  const deleted = await pool.query(
    `DELETE FROM direct_conversations
     WHERE id = $1
       AND (user_a_id = $2 OR user_b_id = $2)
     RETURNING id`,
    [normalizedConversationId, userId]
  );

  if (!deleted.rows.length) throw new Error('Conversación no encontrada');
}

module.exports = {
  ensureMessagesSchema,
  getOrCreateConversation,
  getConversationByIdForUser,
  listConversationsByUserId,
  listMessagesByConversation,
  searchFollowingForMessages,
  sendMessageToConversation,
  setConversationPinnedByUser,
  deleteConversationByIdForUser,
};
