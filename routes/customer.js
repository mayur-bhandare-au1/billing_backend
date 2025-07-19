const express = require('express');
const {
    createCustomer,
    uploadCustomerDocument,
    verifyCustomerDocument,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    toggleStbStatus,
    deleteCustomer
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Multer/Cloudinary upload middleware
const router = express.Router();

// Routes for creating and listing customers (Admin, Collection Agent)
router.route('/')
    .post(protect, authorize(['admin', 'collection_agent']), createCustomer)
    .get(protect, authorize(['admin', 'collection_agent']), getAllCustomers);

// Routes for specific customer operations
router.route('/:id')
    .get(protect, authorize(['admin', 'collection_agent']), getCustomerById)
    .put(protect, authorize(['admin', 'collection_agent']), updateCustomer)
    .delete(protect, authorize(['admin']), deleteCustomer); // Only Admin can delete

// Document upload
router.post('/:id/upload-document', protect, authorize(['admin', 'collection_agent']), upload.single('document'), uploadCustomerDocument);

// Document verification (Admin only)
router.put('/:id/verify-document', protect, authorize(['admin']), verifyCustomerDocument);

// Toggle STB status (Admin only)
router.patch('/:id/toggle-stb', protect, authorize(['admin']), toggleStbStatus);

module.exports = router;