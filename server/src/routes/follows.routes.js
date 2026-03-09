const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { toggle } = require('../controllers/follows.controller');

const router = express.Router();

router.post('/:userId/toggle', protect, toggle);

module.exports = router;
