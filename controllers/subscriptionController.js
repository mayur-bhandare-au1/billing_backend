const Subscription = require('../models/Subscription');
const Customer = require('../models/Customer');
const Plan = require('../models/Plan');

// @desc    Assign a plan to a customer
exports.assignPlanToCustomer = async (req, res, next) => {
    const { customerId, planId, startDate } = req.body;

    if (!customerId || !planId) {
        return res.status(400).json({ message: 'Customer ID and Plan ID are required' });
    }

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        if (!customer.isActive) {
            return res.status(400).json({ message: 'Cannot assign plan to a deactivated customer.' });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        if (!plan.isActive) {
            return res.status(400).json({ message: 'Cannot assign an inactive plan.' });
        }

        // Deactivate any existing active subscriptions for this customer
        await Subscription.updateMany(
            { customer: customerId, isActive: true }, { $set: { isActive: false } }
        );

        const newStartDate = startDate ? new Date(startDate) : new Date();
        const newSubscription = new Subscription({
            customer: customerId,
            plan: planId,
            startDate: newStartDate,
            
        });

        await newSubscription.save();
        res.status(201).json({
            message: 'Plan assigned successfully',
            subscription: newSubscription
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get subscriptions for a specific customer
exports.getCustomerSubscriptions = async (req, res, next) => {
    try {
        const subscriptions = await Subscription.find({ customer: req.params.customerId })
            .populate('plan')
            .populate('customer');
        res.status(200).json(subscriptions);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all subscriptions
exports.getAllSubscriptions = async (req, res, next) => {
    try {
        const subscriptions = await Subscription.find({})
            .populate('customer', 'name phone area isActive') // Only populate specific customer fields
            .populate('plan', 'name price duration'); // Only populate specific plan fields
        res.status(200).json(subscriptions);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a subscription
exports.updateSubscription = async (req, res, next) => {
    const { planId, startDate, endDate, isActive } = req.body;
    try {
        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        if (planId && planId.toString() !== subscription.plan.toString()) {
            const newPlan = await Plan.findById(planId);
            if (!newPlan) {
                return res.status(404).json({ message: 'New plan not found' });
            }
            if (!newPlan.isActive) {
                return res.status(400).json({ message: 'Cannot change to an inactive plan.' });
            }
            subscription.plan = newPlan._id;
            subscription.priceAtSubscription = newPlan.price; // Update price
         
            subscription.endDate = new Date(subscription.startDate.getTime() + newPlan.duration * 24 * 60 * 60 * 1000);
        }

        if (startDate) subscription.startDate = new Date(startDate);
        if (endDate) subscription.endDate = new Date(endDate);
        if (typeof isActive === 'boolean') subscription.isActive = isActive;

        await subscription.save();
        res.status(200).json({
            message: 'Subscription updated successfully',
            subscription
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a subscription
exports.deleteSubscription = async (req, res, next) => {
    try {
        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        await subscription.deleteOne();
        res.status(200).json({ message: 'Subscription removed successfully' });
    } catch (error) {
        next(error);
    }
};