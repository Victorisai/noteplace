const express = require('express');
const {
  register,
  login,
  me,
  updateProfile,
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/me', protect, updateProfile);

module.exports = router;