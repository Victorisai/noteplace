const pool = require('../config/db');

async function searchAll(query) {
  const search = `%${query.trim().toLowerCase()}%`;

  const usersResult = await pool.query(
    `SELECT
      id,
      name,
      username,
      avatar_url,
      bio
     FROM users
     WHERE
      LOWER(name) LIKE $1
      OR LOWER(username) LIKE $1
     ORDER BY created_at DESC
     LIMIT 8`,
    [search]
  );

  const notesResult = await pool.query(
    `SELECT
      n.id,
      n.content,
      n.created_at,
      u.id AS user_id,
      u.name,
      u.username,
      u.avatar_url
     FROM notes n
     INNER JOIN users u ON u.id = n.user_id
     WHERE
      LOWER(n.content) LIKE $1
      OR LOWER(u.username) LIKE $1
      OR LOWER(u.name) LIKE $1
     ORDER BY n.created_at DESC
     LIMIT 8`,
    [search]
  );

  return {
    users: usersResult.rows,
    notes: notesResult.rows.map((row) => ({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        name: row.name,
        username: row.username,
        avatar_url: row.avatar_url,
      },
    })),
  };
}

module.exports = {
  searchAll,
};