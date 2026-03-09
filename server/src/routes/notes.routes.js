const express = require('express');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');
const { createUploader } = require('../middlewares/upload.middleware');
const {
  create,
  getFeed,
  getByUsername,
  getProfile,
  getUserRepliesController,
  getUserLikesController,
  edit,
  remove,
  like,
  bookmark,
  getComments,
  comment,
} = require('../controllers/notes.controller');

const router = express.Router();
const noteUpload = createUploader('notes', 4);

router.get('/', optionalAuth, getFeed);
router.get('/user/:username/profile', optionalAuth, getProfile);
router.get('/user/:username', optionalAuth, getByUsername);
router.get('/user/:username/replies', getUserRepliesController);
router.get('/user/:username/likes', optionalAuth, getUserLikesController);
router.get('/:id/comments', getComments);

router.post('/', protect, noteUpload.array('images', 4), create);
router.post('/:id/like', protect, like);
router.post('/:id/bookmark', protect, bookmark);
router.post('/:id/comments', protect, comment);

router.put('/:id', protect, edit);
router.delete('/:id', protect, remove);

module.exports = router;
