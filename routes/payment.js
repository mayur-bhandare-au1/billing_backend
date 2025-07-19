const express = require('express');
const { recordPayment, getAllPayments } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, authorize(['admin', 'collection_agent']), recordPayment)
    .get(protect, authorize(['admin']), getAllPayments); // Only admin can view all payments

module.exports = router;