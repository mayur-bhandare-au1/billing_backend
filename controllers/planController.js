const Plan = require('../models/Plan');

// @desc    Create a new plan
exports.createPlan = async (req, res, next) => {
    const { name, description, price, duration } = req.body;

    if (!name || !price || !duration) {
        return res.status(400).json({ message: 'Please enter plan name, price, and duration' });
    }
    if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ message: 'Price must be a non-negative number' });
    }
    if (typeof duration !== 'number' || duration < 1) {
        return res.status(400).json({ message: 'Duration must be a positive number of days' });
    }

    try {
        const planExists = await Plan.findOne({ name });
        if (planExists) {
            return res.status(400).json({ message: 'Plan with this name already exists' });
        }

        const plan = await Plan.create({
            name,
            description,
            price,
            duration,
        });

        res.status(201).json({
            message: 'Plan created successfully',
            plan
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all plans
exports.getAllPlans = async (req, res, next) => {
    try {
        const query = {};
        if (req.query.isActive) {
            query.isActive = req.query.isActive === 'true';
        }
        const plans = await Plan.find(query);
        res.status(200).json(plans);
    } catch (error) {
        next(error);
    }
};

// @desc    Get plan by ID
exports.getPlanById = async (req, res, next) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.status(200).json(plan);
    } catch (error) {
        next(error);
    }
};
// @desc    Update plan details
exports.updatePlan = async (req, res, next) => {
    const { name, description, price, duration, isActive } = req.body;
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Check if name is being changed to an existing one
        if (name && name !== plan.name) {
            const existingPlan = await Plan.findOne({ name });
            if (existingPlan) {
                return res.status(400).json({ message: 'Plan with this name already exists' });
            }
        }

        if (price !== undefined && (typeof price !== 'number' || price < 0)) {
            return res.status(400).json({ message: 'Price must be a non-negative number' });
        }
        if (duration !== undefined && (typeof duration !== 'number' || duration < 1)) {
            return res.status(400).json({ message: 'Duration must be a positive number of days' });
        }
        if (isActive !== undefined && typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be a boolean' });
        }

        Object.assign(plan, { name, description, price, duration, isActive });
        await plan.save();

        res.status(200).json({
            message: 'Plan updated successfully',
            plan
        });
    } catch (error) {
        next(error);
    }
};


exports.togglePlanActiveStatus = async (req, res, next) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    try {
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        plan.isActive = isActive;
        await plan.save();

        res.status(200).json({
            message: `Plan status set to ${isActive ? 'Active' : 'Deactivated'}`,
            plan: {
                _id: plan._id,
                name: plan.name,
                isActive: plan.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete plan
exports.deletePlan = async (req, res, next) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Check if there are active subscriptions for this plan
        const activeSubscriptions = await Subscription.countDocuments({ plan: req.params.id, isActive: true });
        if (activeSubscriptions > 0) {
            return res.status(400).json({ message: 'Cannot delete plan with active subscriptions. Deactivate it instead.' });
        }

        await plan.deleteOne();
        res.status(200).json({ message: 'Plan removed successfully' });
    } catch (error) {
        next(error);
    }
};