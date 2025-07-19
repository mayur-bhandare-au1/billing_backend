const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();
//, protect, authorize(['admin'])
router.post('/register', protect, authorize(['admin']), registerUser); // Only admin can register new users
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;