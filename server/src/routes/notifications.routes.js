const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { list, markRead } = require('../controllers/notifications.controller');

const router = express.Router();

router.get('/', protect, list);
router.post('/mark-read', protect, markRead);

module.exports = router;
