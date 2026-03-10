const { toggleFollow, getFollowersByUsername, getFollowingByUsername } = require('../services/follows.service');

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

async function listFollowers(req, res) {
  try {
    const users = await getFollowersByUsername(req.params.username);
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al obtener seguidores' });
  }
}

async function listFollowing(req, res) {
  try {
    const users = await getFollowingByUsername(req.params.username);
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Error al obtener seguidos' });
  }
}

module.exports = { toggle, listFollowers, listFollowing };
