const express = require('express');
const { getAllUsers, getUserById, updateUser, toggleUserActiveStatus, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect, authorize(['admin']));

router.route('/')
    .get(getAllUsers); // Get all users

router.route('/:id')
    .get(getUserById)       // Get single user
    .put(updateUser)        // Update user (admin can update any, user can update self - logic in controller)
    .delete(deleteUser);    // Delete user

router.patch('/:id/toggle-active', toggleUserActiveStatus); // Activate/Deactivate user

module.exports = router;