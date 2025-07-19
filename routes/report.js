const express = require('express');
const { getCustomerSummary, getCollectionSummary } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// All report routes require admin role
router.use(protect, authorize(['admin']));

router.get('/customer-summary', getCustomerSummary);
router.get('/collection-summary', getCollectionSummary);

module.exports = router;