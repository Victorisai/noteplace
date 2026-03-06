const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  create,
  getFeed,
  getByUsername,
  remove,
} = require('../controllers/notes.controller');

const router = express.Router();

router.get('/', getFeed);
router.get('/user/:username', getByUsername);
router.post('/', protect, create);
router.delete('/:id', protect, remove);

module.exports = router;