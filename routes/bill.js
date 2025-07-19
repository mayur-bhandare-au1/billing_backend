const express = require('express');
const {
    getCustomerBills,
    getBillById,
    sendInvoice,
    generateInvoicePdf,
    getAllBills
} = require('../controllers/billController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .get(protect, authorize(['admin']), getAllBills); // Admin can view all bills

router.route('/customer/:customerId')
    .get(protect, authorize(['admin', 'collection_agent']), getCustomerBills);

router.route('/:id')
    .get(protect, authorize(['admin', 'collection_agent']), getBillById);

router.post('/:id/send-invoice', protect, authorize(['admin', 'collection_agent']), sendInvoice);
router.get('/:id/generate-pdf', protect, authorize(['admin', 'collection_agent']), generateInvoicePdf);

module.exports = router;