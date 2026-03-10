const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  toggle,
  listFollowers,
  listFollowing,
  removeFollowerController,
} = require('../controllers/follows.controller');

const router = express.Router();

router.get('/user/:username/followers', listFollowers);
router.get('/user/:username/following', listFollowing);
router.post('/:userId/toggle', protect, toggle);
router.delete('/:userId/follower', protect, removeFollowerController);

module.exports = router;
