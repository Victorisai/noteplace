const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  updateAvatar,
} = require('../services/auth.service');

async function register(req, res) {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const data = await registerUser({ name, username, email, password });
    return res.status(201).json({ message: 'Usuario registrado correctamente', ...data });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al registrar usuario' });
  }
}

async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const data = await loginUser({ emailOrUsername, password });
    return res.status(200).json({ message: 'Inicio de sesión correcto', ...data });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Error al iniciar sesión' });
  }
}

async function me(req, res) {
  try {
    const user = await getCurrentUser(req.user.id);
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(404).json({ message: error.message || 'No se pudo obtener el usuario' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, username, bio = '' } = req.body;
    const user = await updateUserProfile(req.user.id, { name, username, bio });
    return res.status(200).json({ message: 'Perfil actualizado correctamente', user });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al actualizar perfil' });
  }
}

async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Debes seleccionar un archivo de imagen' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await updateAvatar(req.user.id, avatarUrl);

    return res.status(200).json({
      message: 'Avatar actualizado correctamente',
      user,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al subir avatar' });
  }
}

module.exports = { register, login, me, updateProfile, uploadAvatar };
