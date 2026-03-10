const pool = require('../config/db');
const { createNotification, NOTIFICATION_TYPES } = require('./notifications.service');

async function toggleFollow({ followerId, followingId }) {
  if (followerId === followingId) {
    throw new Error('No puedes seguirte a ti mismo');
  }

  const userCheck = await pool.query(
    'SELECT id FROM users WHERE id = $1 LIMIT 1',
    [followingId]
  );

  if (userCheck.rows.length === 0) {
    throw new Error('Usuario no encontrado');
  }

  const existing = await pool.query(
    `SELECT id FROM follows
     WHERE follower_id = $1 AND following_id = $2
     LIMIT 1`,
    [followerId, followingId]
  );

  let isFollowing;

  if (existing.rows.length > 0) {
    await pool.query(
      `DELETE FROM follows
       WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    );
    isFollowing = false;
  } else {
    await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)`,
      [followerId, followingId]
    );
    isFollowing = true;

    await createNotification({
      recipientId: followingId,
      actorId: followerId,
      type: NOTIFICATION_TYPES.FOLLOW,
    });
  }

  return { is_following: isFollowing };
}

async function getFollowersByUsername(username) {
  const normalizedUsername = username.trim().toLowerCase();
  const result = await pool.query(
    `SELECT u.id, u.name, u.username, u.avatar_url
     FROM follows f
     INNER JOIN users target ON target.id = f.following_id
     INNER JOIN users u ON u.id = f.follower_id
     WHERE target.username = $1
     ORDER BY f.created_at DESC`,
    [normalizedUsername]
  );

  return result.rows;
}

async function getFollowingByUsername(username) {
  const normalizedUsername = username.trim().toLowerCase();
  const result = await pool.query(
    `SELECT u.id, u.name, u.username, u.avatar_url
     FROM follows f
     INNER JOIN users source ON source.id = f.follower_id
     INNER JOIN users u ON u.id = f.following_id
     WHERE source.username = $1
     ORDER BY f.created_at DESC`,
    [normalizedUsername]
  );

  return result.rows;
}

async function removeFollower({ userId, followerId }) {
  if (!userId || !followerId) throw new Error('Datos inválidos');
  if (userId === followerId) throw new Error('No puedes eliminarte a ti mismo');

  const result = await pool.query(
    `DELETE FROM follows
     WHERE follower_id = $1 AND following_id = $2
     RETURNING id`,
    [followerId, userId]
  );

  if (!result.rows.length) {
    throw new Error('El usuario no te sigue');
  }

  return { removed: true };
}

module.exports = { toggleFollow, getFollowersByUsername, getFollowingByUsername, removeFollower };
