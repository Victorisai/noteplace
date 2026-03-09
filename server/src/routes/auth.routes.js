const express = require('express');
const { register, login, me, updateProfile, uploadAvatar } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { createUploader } = require('../middlewares/upload.middleware');

const router = express.Router();
const avatarUpload = createUploader('avatars', 1);

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/me', protect, updateProfile);
router.post('/me/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);

module.exports = router;
