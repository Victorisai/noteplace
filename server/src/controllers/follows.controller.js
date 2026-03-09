const { toggleFollow } = require('../services/follows.service');

async function toggle(req, res) {
  try {
    const data = await toggleFollow({
      followerId: req.user.id,
      followingId: Number(req.params.userId),
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al seguir usuario' });
  }
}

module.exports = { toggle };
