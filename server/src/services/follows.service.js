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

module.exports = { toggleFollow };
