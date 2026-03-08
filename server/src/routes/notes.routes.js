const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  create,
  getFeed,
  getByUsername,
  edit,
  remove,
  like,
  getComments,
  comment,
} = require('../controllers/notes.controller');

const router = express.Router();

router.get('/', getFeed);
router.get('/user/:username', getByUsername);
router.get('/:id/comments', getComments);

router.post('/', protect, create);
router.post('/:id/like', protect, like);
router.post('/:id/comments', protect, comment);

router.put('/:id', protect, edit);
router.delete('/:id', protect, remove);

module.exports = router;