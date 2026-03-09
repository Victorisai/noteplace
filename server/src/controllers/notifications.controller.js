const {
  getNotificationsByUserId,
  markNotificationsAsRead,
} = require('../services/notifications.service');

async function list(req, res) {
  try {
    const data = await getNotificationsByUserId(req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error al obtener notificaciones' });
  }
}

async function markRead(req, res) {
  try {
    const data = await markNotificationsAsRead(req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error al marcar notificaciones' });
  }
}

module.exports = { list, markRead };
