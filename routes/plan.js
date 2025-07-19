const express = require('express');
const {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    togglePlanActiveStatus,
    deletePlan
} = require('../controllers/planController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, authorize(['admin']), createPlan)
    .get(protect, authorize(['admin', 'collection_agent']), getAllPlans); 

router.route('/:id')
    .get(protect, authorize(['admin', 'collection_agent']), getPlanById)
    .put(protect, authorize(['admin']), updatePlan)
    .delete(protect, authorize(['admin']), deletePlan);

router.patch('/:id/toggle-active', protect, authorize(['admin']), togglePlanActiveStatus);

module.exports = router;