const express = require('express');
const {
    assignPlanToCustomer,
    getCustomerSubscriptions,
    getAllSubscriptions,
    updateSubscription,
    deleteSubscription
} = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, authorize(['admin', 'collection_agent']), assignPlanToCustomer)
    .get(protect, authorize(['admin']), getAllSubscriptions); // Only admin can get all subscriptions

router.route('/customer/:customerId')
    .get(protect, authorize(['admin', 'collection_agent']), getCustomerSubscriptions);

router.route('/:id')
    .put(protect, authorize(['admin']), updateSubscription)
    .delete(protect, authorize(['admin']), deleteSubscription);

module.exports = router;