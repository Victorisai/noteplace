const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateToken } = require('../utils/jwt');

async function registerUser({ name, username, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();
  const trimmedName = name.trim();

  const existingUser = await pool.query(
    `SELECT id, email, username FROM users WHERE email = $1 OR username = $2`,
    [normalizedEmail, normalizedUsername]
  );

  if (existingUser.rows.length > 0) {
    const matched = existingUser.rows[0];
    if (matched.email === normalizedEmail) throw new Error('El correo ya está registrado');
    if (matched.username === normalizedUsername) throw new Error('El username ya está en uso');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, username, email, password)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, username, email, bio, avatar_url, created_at`,
    [trimmedName, normalizedUsername, normalizedEmail, hashedPassword]
  );

  const user = result.rows[0];
  const token = generateToken({ id: user.id, username: user.username, email: user.email });
  return { user, token };
}

async function loginUser({ emailOrUsername, password }) {
  const value = emailOrUsername.trim().toLowerCase();
  const result = await pool.query(
    `SELECT id, name, username, email, password, bio, avatar_url, created_at
     FROM users WHERE email = $1 OR username = $1 LIMIT 1`,
    [value]
  );

  if (!result.rows.length) throw new Error('Credenciales inválidas');
  const user = result.rows[0];

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Credenciales inválidas');

  const token = generateToken({ id: user.id, username: user.username, email: user.email });
  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    },
    token,
  };
}

async function getCurrentUser(userId) {
  const result = await pool.query(
    `SELECT id, name, username, email, bio, avatar_url, created_at
     FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  if (!result.rows.length) throw new Error('Usuario no encontrado');
  return result.rows[0];
}

async function updateUserProfile(userId, { name, username, bio }) {
  const trimmedName = name.trim();
  const normalizedUsername = username.trim().toLowerCase();
  const trimmedBio = bio.trim();

  if (!trimmedName || !normalizedUsername) throw new Error('Nombre y username son obligatorios');

  const existingUser = await pool.query(
    `SELECT id FROM users WHERE username = $1 AND id != $2 LIMIT 1`,
    [normalizedUsername, userId]
  );
  if (existingUser.rows.length > 0) throw new Error('El username ya está en uso');

  const result = await pool.query(
    `UPDATE users SET name = $1, username = $2, bio = $3
     WHERE id = $4
     RETURNING id, name, username, email, bio, avatar_url, created_at`,
    [trimmedName, normalizedUsername, trimmedBio, userId]
  );

  if (!result.rows.length) throw new Error('Usuario no encontrado');
  return result.rows[0];
}

async function updateAvatar(userId, avatarUrl) {
  const result = await pool.query(
    `UPDATE users SET avatar_url = $1 WHERE id = $2
     RETURNING id, name, username, email, bio, avatar_url, created_at`,
    [avatarUrl, userId]
  );

  if (!result.rows.length) throw new Error('Usuario no encontrado');
  return result.rows[0];
}

module.exports = { registerUser, loginUser, getCurrentUser, updateUserProfile, updateAvatar };
