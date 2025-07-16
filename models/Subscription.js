const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: { // Calculated based on plan duration
        type: Date
    },
    priceAtSubscription: { // Store price to handle plan price changes
        type: Number,
        required: true
    },
    isActive: { // Set to false if plan is changed or customer deactivated
        type: Boolean,
        default: true
    },
}, { timestamps: true });

// Pre-save hook to calculate endDate
SubscriptionSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('plan')) {
        const plan = await mongoose.model('Plan').findById(this.plan);
        if (plan) {
            const startDate = this.startDate || new Date();
            this.endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000); // Add duration days
            this.priceAtSubscription = plan.price; // Store current plan price
        }
    }
    next();
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);